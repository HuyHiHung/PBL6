import { handle } from 'hono/aws-lambda';
import { config,connect } from '../../../packages/backend/src/http.js';
import { createLearning } from './app.js';
const cfg=config('learning');
export const handler=handle(createLearning(cfg,connect(cfg)));
