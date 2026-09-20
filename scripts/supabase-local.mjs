import { execFileSync } from 'node:child_process';
import { cli,localStatus } from './local-lib.mjs';
const action=process.argv[2];
if (!['start','status'].includes(action)) throw new Error('Expected start or status');
if (action==='start') {
  try {
    // Keep local keys out of routine startup output. Docker download progress is on stderr.
    execFileSync(process.execPath,[cli,'start'],{stdio:['inherit','pipe','inherit'],env:{...process.env,DO_NOT_TRACK:'1'},maxBuffer:32*1024*1024});
  } catch (error) {
    console.error('Supabase start failed. Check Docker Desktop and the diagnostics above.');
    process.exit(1);
  }
}
const status=localStatus();
console.log(JSON.stringify({project:'pbl6',api:status.API_URL,studio:status.STUDIO_URL,mail:status.MAILPIT_URL ?? status.INBUCKET_URL,postgres:'127.0.0.1:54322'},null,2));
