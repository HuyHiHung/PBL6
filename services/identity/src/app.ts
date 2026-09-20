import { z } from 'zod';
import { ApiError,baseApp,json,id,page,permission,internal,text,version,type Config,type DB,type Principal } from '../../../packages/backend/src/http.js';

type AuthUser={id:string;email:string;email_confirmed_at:string|null;user_metadata?:Record<string,unknown>};
export function createIdentity(cfg:Config,sql:DB) {
  const app=baseApp(cfg,sql);
  async function authenticate(header:string|undefined):Promise<Principal> {
    if(!header?.startsWith('Bearer ')) throw new ApiError(401,'AUTH_REQUIRED');
    const token=header.slice(7);
    let response:Response;
    try {response=await fetch(`${cfg.supabaseUrl}/auth/v1/user`,{headers:{apikey:cfg.supabaseKey,Authorization:header},signal:AbortSignal.timeout(10000)});} catch {throw new ApiError(503,'AUTH_UNAVAILABLE');}
    if(!response.ok) throw new ApiError(response.status>=500?503:401,'INVALID_SESSION');
    const user=await response.json() as AuthUser;
    if(!user.email_confirmed_at) throw new ApiError(403,'EMAIL_NOT_VERIFIED');
    // Decode only after Auth has verified the signature, issuer and token expiry.
    let claims:{sub:string;session_id:string};
    try {claims=JSON.parse(Buffer.from(token.split('.')[1]??'','base64url').toString());} catch {throw new ApiError(401,'INVALID_SESSION');}
    if(claims.sub!==user.id||!z.string().uuid().safeParse(claims.session_id).success) throw new ApiError(401,'INVALID_SESSION');
    const sessions=await sql`SELECT created_at FROM identity.session_state(${claims.session_id},${user.id})`;
    if(!sessions[0]) throw new ApiError(401,'SESSION_REVOKED');
    const suggested=typeof user.user_metadata?.full_name==='string'?user.user_metadata.full_name.trim():null;
    await sql`INSERT INTO identity.profiles(user_id,email_cached,display_name) VALUES(${user.id},${user.email},${suggested&&suggested.length>=2?suggested.slice(0,50):null}) ON CONFLICT(user_id) DO NOTHING`;
    const [p]=await sql`SELECT user_id,display_name,email_cached,role,status,sessions_revoked_before,row_version FROM identity.profiles WHERE user_id=${user.id}`;
    if(!p||p.status!=='active') throw new ApiError(403,'ACCOUNT_LOCKED');
    if(p.sessions_revoked_before&&new Date(sessions[0].created_at)<=new Date(p.sessions_revoked_before)) throw new ApiError(401,'SESSION_REVOKED');
    if((await sql`SELECT 1 FROM identity.revoked_sessions WHERE session_id=${claims.session_id} AND user_id=${user.id}`).length) throw new ApiError(401,'SESSION_REVOKED');
    const grants=await sql`SELECT permission_code FROM identity.editor_permissions WHERE user_id=${user.id}`;
    return {user_id:user.id,session_id:claims.session_id,display_name:p.display_name,email:user.email,role:p.role,permissions:grants.map(r=>r.permission_code),row_version:p.row_version};
  }
  app.use('/internal/*',internal(cfg.identityToken));
  app.post('/internal/verify',async c=>c.json(await authenticate(c.req.header('Authorization'))));
  app.get('/internal/learner-ids',async c=>c.json({ids:(await sql`SELECT user_id FROM identity.profiles WHERE role='learner'`).map(r=>r.user_id)}));
  app.use('/v1/*',async(c,next)=>{c.set('principal',await authenticate(c.req.header('Authorization')));await next();});
  app.get('/v1/me',c=>c.json(c.get('principal')));
  app.get('/v1/admin/summary',async c=>{
    permission(c.get('principal'),'reports.view');return c.json({accounts:await sql`SELECT role,status,count(*)::int AS count FROM identity.profiles GROUP BY role,status ORDER BY role,status`});
  });
  app.patch('/v1/me',async c=>{
    const b=await json(c,z.object({display_name:z.string().trim().min(2).max(50),expectedVersion:version}).strict());
    const rows=await sql`UPDATE identity.profiles SET display_name=${b.display_name} WHERE user_id=${c.get('principal').user_id} AND row_version=${b.expectedVersion} RETURNING user_id,display_name,row_version`;
    if(!rows[0]) throw new ApiError(409,'VERSION_CONFLICT');return c.json(rows[0]);
  });
  app.post('/v1/logout',async c=>{
    const p=c.get('principal');await sql`INSERT INTO identity.revoked_sessions(session_id,user_id,reason) VALUES(${p.session_id},${p.user_id},'logout') ON CONFLICT DO NOTHING`;
    await fetch(`${cfg.supabaseUrl}/auth/v1/logout?scope=local`,{method:'POST',headers:{apikey:cfg.supabaseKey,Authorization:c.req.header('Authorization')!},signal:AbortSignal.timeout(5000)}).catch(()=>null);
    return c.json({logged_out:true});
  });
  app.post('/v1/logout-all',async c=>{
    const p=c.get('principal');
    await sql`UPDATE identity.profiles SET sessions_revoked_before=clock_timestamp() WHERE user_id=${p.user_id}`;
    await fetch(`${cfg.supabaseUrl}/auth/v1/logout?scope=global`,{method:'POST',headers:{apikey:cfg.supabaseKey,Authorization:c.req.header('Authorization')!},signal:AbortSignal.timeout(5000)}).catch(()=>null);
    return c.json({logged_out:true});
  });
  app.get('/v1/admin/users',async c=>{
    const p=c.get('principal');permission(p,'learners.manage');const q=(c.req.query('q')??'').slice(0,100),offset=(page(c)-1)*20;
    const rows=await sql`SELECT user_id,display_name,email_cached,role,status,row_version,created_at FROM identity.profiles WHERE (${p.role==='admin'} OR role='learner') AND (display_name ILIKE ${'%'+q+'%'} OR email_cached ILIKE ${'%'+q+'%'}) ORDER BY created_at DESC,user_id LIMIT 20 OFFSET ${offset}`;
    return c.json({items:rows,page:page(c)});
  });
  app.patch('/v1/admin/users/:id',async c=>{
    const actor=c.get('principal');permission(actor,'learners.manage');const target=id(c);
    const b=await json(c,z.object({status:z.enum(['active','locked','disabled']),reason:text.optional(),expectedVersion:version}).strict());
    if(b.status!=='active'&&!b.reason) throw new ApiError(400,'REASON_REQUIRED');
    const result=await sql.begin(async tx=>{
      await tx`SELECT pg_advisory_xact_lock(19092026,2)`;
      const [old]=await tx`SELECT * FROM identity.profiles WHERE user_id=${target} FOR UPDATE`;
      if(!old) throw new ApiError(404,'USER_NOT_FOUND');
      if(actor.role!=='admin'&&old.role!=='learner') throw new ApiError(403,'FORBIDDEN');
      if(Number(old.row_version)!==b.expectedVersion) throw new ApiError(409,'VERSION_CONFLICT');
      const [row]=await tx`UPDATE identity.profiles SET status=${b.status},lock_reason=${b.reason??null},sessions_revoked_before=CASE WHEN ${b.status}<>'active' THEN clock_timestamp() ELSE sessions_revoked_before END WHERE user_id=${target} RETURNING user_id,status,row_version`;
      await tx`INSERT INTO identity.audit_events(actor_user_id,action,target_user_id,changes) VALUES(${actor.user_id},'account.status',${target},${tx.json({before:old.status,after:b.status,reason:b.reason??null})})`;
      return row;
    });return c.json(result!);
  });
  app.put('/v1/admin/users/:id/editor',async c=>{
    const actor=c.get('principal');if(actor.role!=='admin') throw new ApiError(403,'FORBIDDEN');const target=id(c);
    const b=await json(c,z.object({enabled:z.boolean(),permissions:z.array(z.enum(['content.write','content.publish','learners.manage','reports.view'])).max(4).default(['content.write']),expectedVersion:version}).strict());
    const result=await sql.begin(async tx=>{
      await tx`SELECT pg_advisory_xact_lock(19092026,2)`;
      const [old]=await tx`SELECT role,row_version FROM identity.profiles WHERE user_id=${target} FOR UPDATE`;
      if(!old) throw new ApiError(404,'USER_NOT_FOUND');if(old.role==='admin') throw new ApiError(403,'ADMIN_ROLE_IMMUTABLE');
      if(Number(old.row_version)!==b.expectedVersion) throw new ApiError(409,'VERSION_CONFLICT');
      await tx`DELETE FROM identity.editor_permissions WHERE user_id=${target}`;
      const [row]=await tx`UPDATE identity.profiles SET role=${b.enabled?'editor':'learner'} WHERE user_id=${target} RETURNING user_id,role,row_version`;
      if(b.enabled) for(const grant of new Set(b.permissions)) await tx`INSERT INTO identity.editor_permissions(user_id,permission_code,granted_by) VALUES(${target},${grant},${actor.user_id})`;
      await tx`INSERT INTO identity.audit_events(actor_user_id,action,target_user_id,changes) VALUES(${actor.user_id},'editor.permissions',${target},${tx.json({role:row!.role,permissions:b.enabled?b.permissions:[]})})`;
      return row;
    });return c.json(result!);
  });
  return app;
}
