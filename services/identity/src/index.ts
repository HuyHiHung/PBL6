import { config,connect } from '../../../packages/backend/src/http.js';
import { run } from '../../../packages/backend/src/run.js';
import { createIdentity } from './app.js';
const cfg=config('identity'),sql=connect(cfg);
run(createIdentity(cfg,sql),sql,'identity');
