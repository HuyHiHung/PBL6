import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { localStatus,readLocal,writeLocal } from './local-lib.mjs';
const status=localStatus(),roles=readLocal('runtime.json'),secrets=readLocal('backend.json');
secrets.identityToken??=randomBytes(32).toString('hex');secrets.contentToken??=randomBytes(32).toString('hex');writeLocal('backend.json',secrets);
const processes=[];
for(const [name,port] of [['identity',4001],['content',4002],['learning',4003]]) {
  if(!roles[name])throw new Error('Run db:provision first');
  const env={...process.env,DATABASE_URL:roles[name].databaseUrl,SUPABASE_URL:status.API_URL,SUPABASE_ANON_KEY:status.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY:name==='learning'?'':status.SERVICE_ROLE_KEY,IDENTITY_URL:'http://127.0.0.1:4001',CONTENT_URL:'http://127.0.0.1:4002',
    IDENTITY_INTERNAL_TOKEN:secrets.identityToken,CONTENT_INTERNAL_TOKEN:name==='identity'?'':secrets.contentToken,PORT:String(port),HOST:'127.0.0.1'};
  const child=spawn(process.execPath,[`dist/services/${name}/src/index.js`],{env,stdio:'inherit',windowsHide:true});
  processes.push(child);
  child.on('exit',code=>{if(code&&code!==0){console.error(`${name} stopped`);processes.forEach(p=>p.kill());process.exitCode=code;}});
}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>processes.forEach(p=>p.kill(signal)));
