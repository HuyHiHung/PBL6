import { handle } from 'hono/aws-lambda';
import { config,connect } from '../../../packages/backend/src/http.js';
import { createContent } from './app.js';
const cfg=config('content');
export const handler=handle(createContent(cfg,connect(cfg)));
