import { config,connect } from '../../../packages/backend/src/http.js';
import { run } from '../../../packages/backend/src/run.js';
import { createContent } from './app.js';
const cfg=config('content'),sql=connect(cfg);
run(createContent(cfg,sql),sql,'content');
