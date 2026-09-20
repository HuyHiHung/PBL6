import { serve } from '@hono/node-server';
import type { App,DB,Service } from './http.js';
export function run(app:App,sql:DB,service:Service) {
  const defaults={identity:4001,content:4002,learning:4003};
  const port=Number(process.env.PORT??defaults[service]);
  const server=serve({fetch:app.fetch,hostname:process.env.HOST??'127.0.0.1',port},()=>console.log(JSON.stringify({service,port,status:'listening'})));
  const shutdown=()=>{server.close(()=>{void sql.end({timeout:5}).then(()=>process.exit(0));});setTimeout(()=>process.exit(1),10000).unref();};
  process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
}
