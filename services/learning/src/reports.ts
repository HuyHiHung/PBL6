import { z } from 'zod';
import { ApiError,permission,upstream,type App,type Config,type DB } from '../../../packages/backend/src/http.js';
export function reportRoutes(app:App,cfg:Config,sql:DB) {
  app.get('/v1/admin/reports',async c=>{
    permission(c.get('principal'),'reports.view');
    const from=z.iso.date().parse(c.req.query('from')),to=z.iso.date().parse(c.req.query('to'));
    if(from>to||Date.parse(to)-Date.parse(from)>366*86400000)throw new ApiError(400,'INVALID_DATE_RANGE');
    const response=await upstream(cfg.identityUrl+'/internal/learner-ids',{headers:{'X-Service-Token':cfg.identityToken}}),{ids}=await response.json() as {ids:string[]};
    if(!ids.length)return c.json({from,to,timezone:'Asia/Ho_Chi_Minh',attempts:[],active_users:0,daily_activity:[],popular_lessons:[]});
    const attempts=await sql`SELECT kind,count(*)::int AS attempt_count,round(avg(100.0*correct_count/total_count),1) AS average_score FROM learning.attempts WHERE status='submitted' AND kind IN ('quiz','topic_test') AND user_id IN ${sql(ids)} AND submitted_at>=(${from}::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') AND submitted_at<((${to}::date+1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') GROUP BY kind ORDER BY kind`;
    const activities=await sql`WITH events AS (
      SELECT user_id,submitted_at AS happened_at FROM learning.attempts WHERE status='submitted' AND kind IN ('quiz','topic_test')
      UNION ALL SELECT user_id,reviewed_at FROM learning.flashcard_session_items WHERE status='reviewed'
    ) SELECT user_id,(happened_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text AS day FROM events WHERE user_id IN ${sql(ids)} AND happened_at>=(${from}::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') AND happened_at<((${to}::date+1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')`;
    const days=new Map<string,Set<string>>();for(const row of activities){if(!days.has(row.day))days.set(row.day,new Set());days.get(row.day)!.add(row.user_id);}
    const popular=await sql`SELECT lesson_id,count(DISTINCT user_id)::int AS learners FROM learning.lesson_daily_views WHERE user_id IN ${sql(ids)} AND activity_date BETWEEN ${from}::date AND ${to}::date GROUP BY lesson_id ORDER BY learners DESC,lesson_id LIMIT 20`;
    return c.json({from,to,timezone:'Asia/Ho_Chi_Minh',attempts,active_users:new Set(activities.map(r=>r.user_id)).size,daily_activity:[...days].sort(([a],[b])=>a.localeCompare(b)).map(([day,users])=>({day,active_users:users.size})),popular_lessons:popular});
  });
}
