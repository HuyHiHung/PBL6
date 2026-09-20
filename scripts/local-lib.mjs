import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';

export const cli = resolve('node_modules/supabase/dist/supabase.js');
export function localStatus() {
  const raw = execFileSync(process.execPath,[cli,'status','--output','json'],{
    encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,DO_NOT_TRACK:'1'},maxBuffer:4*1024*1024
  });
  const status = JSON.parse(raw.trim());
  const db = new URL(status.DB_URL);
  const api = new URL(status.API_URL);
  if (db.hostname!=='127.0.0.1' || db.port!=='54322' || api.hostname!=='127.0.0.1' || api.port!=='54321') {
    throw new Error('Local-only command: expected PBL6 ports 54321/54322 on 127.0.0.1');
  }
  const config = readFileSync('supabase/config.toml','utf8');
  if (!/^project_id\s*=\s*"pbl6"/m.test(config)) throw new Error('Expected Supabase project_id pbl6');
  return status;
}
export function database(url) { return postgres(url,{max:4,onnotice:()=>{},connect_timeout:10,idle_timeout:10}); }
export function readLocal(name) { return existsSync(`.local/${name}`) ? JSON.parse(readFileSync(`.local/${name}`,'utf8')) : {}; }
export function writeLocal(name,data) {
  mkdirSync('.local',{recursive:true});
  writeFileSync(`.local/${name}`,JSON.stringify(data,null,2)+'\n',{mode:0o600});
}
export async function apiRequest(status,path,{method='GET',body,bytes,headers={}}={}) {
  const response = await fetch(status.API_URL+path,{
    method,headers:{apikey:status.SERVICE_ROLE_KEY,Authorization:`Bearer ${status.SERVICE_ROLE_KEY}`,
      ...(body ? {'Content-Type':'application/json'} : {}),...headers},
    body:bytes ?? (body ? JSON.stringify(body) : undefined)
  });
  if (!response.ok) {
    const error = new Error(`Local API ${method} ${path.split('?')[0]} failed (${response.status})`);
    error.status=response.status; throw error;
  }
  return response;
}
