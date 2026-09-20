import { handle } from 'hono/aws-lambda';
import { config,connect } from '../../../packages/backend/src/http.js';
import { createIdentity } from './app.js';
const cfg=config('identity');
export const handler=handle(createIdentity(cfg,connect(cfg)));
