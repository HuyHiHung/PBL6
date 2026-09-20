import { randomBytes } from 'node:crypto';
import { localStatus,database,readLocal,writeLocal } from './local-lib.mjs';
const status=localStatus();
const sql=database(status.DB_URL);
const saved=readLocal('runtime.json');
try {
  for (const schema of ['identity','content','learning']) {
    const role=`app_${schema}_runtime`;
    const password=saved[schema]?.password ?? randomBytes(32).toString('hex');
    // Literal is generated locally, never accepted from an untrusted SQL identifier/string.
    if (!/^[a-f0-9]{64}$/.test(password)) throw new Error('Invalid generated runtime credential');
    await sql.unsafe(`ALTER ROLE ${role} LOGIN PASSWORD '${password}'`);
    const url=new URL(status.DB_URL); url.username=role; url.password=password;
    saved[schema]={role,password,databaseUrl:url.toString()};
  }
  writeLocal('runtime.json',saved);
  console.log('Provisioned 3 local runtime roles. Credentials: .local/runtime.json (gitignored).');
} finally { await sql.end(); }
