import { config,connect } from '../../../packages/backend/src/http.js';
import { run } from '../../../packages/backend/src/run.js';
import { createLearning } from './app.js';
const cfg=config('learning'),sql=connect(cfg);
run(createLearning(cfg,sql),sql,'learning');
