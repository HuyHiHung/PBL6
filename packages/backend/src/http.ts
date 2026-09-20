import { randomUUID,timingSafeEqual } from 'node:crypto';
import { Hono,type Context,type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import postgres from 'postgres';

export type Principal={user_id:string;session_id:string;display_name:string|null;email:string;role:'learner'|'editor'|'admin';permissions:string[];row_version:string};
export type Env={Variables:{principal:Principal;requestId:string}};
export type App=Hono<Env>;
export type DB=postgres.Sql;
export type Query=postgres.Sql|postgres.TransactionSql;
export type Service='identity'|'content'|'learning';
export type Config={service:Service;databaseUrl:string;supabaseUrl:string;supabaseKey:string;serviceKey:string;identityUrl:string;contentUrl:string;identityToken:string;contentToken:string;origins:string[]};
export class ApiError extends Error {
  constructor(public status:400|401|403|404|409|413|422|500|502|503,public code:string) {super(code);}
}
export const uuid=z.string().uuid();
export const version=z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const text=z.string().trim().min(1).max(10000);
export function config(service:Service):Config {
  const required=(key:string)=>{const v=process.env[key];if(!v) throw new Error(`Missing ${key} for ${service}`);return v;};
  const databaseUrl=required('DATABASE_URL');
  if(new URL(databaseUrl).username.split('.')[0]!==`app_${service}_runtime`) throw new Error('Use the service-specific runtime database role');
  return {service,databaseUrl,supabaseUrl:required('SUPABASE_URL'),supabaseKey:required('SUPABASE_ANON_KEY'),
    serviceKey:service==='learning'?'':required('SUPABASE_SERVICE_ROLE_KEY'),
    identityUrl:required('IDENTITY_URL'),contentUrl:required('CONTENT_URL'),identityToken:required('IDENTITY_INTERNAL_TOKEN'),
    contentToken:service==='identity'?'':required('CONTENT_INTERNAL_TOKEN'),origins:(process.env.CORS_ORIGINS??'http://localhost:5173,http://localhost:5174').split(',')};
}
export function connect(cfg:Config) {return postgres(cfg.databaseUrl,{max:5,prepare:false,connect_timeout:10,idle_timeout:20,onnotice:()=>{}});}
export function baseApp(cfg:Config,sql:DB):App {
  const app=new Hono<Env>();
  app.use('*',secureHeaders());
  app.use('*',cors({origin:cfg.origins,allowMethods:['GET','POST','PATCH','PUT','DELETE','OPTIONS'],allowHeaders:['Authorization','Content-Type','Idempotency-Key'],exposeHeaders:['X-Request-Id'],maxAge:600}));
  app.use('*',bodyLimit({maxSize:11*1024*1024,onError:c=>c.json({error:{code:'BODY_TOO_LARGE'}},413)}));
  app.use('*',async(c,next)=>{c.set('requestId',randomUUID());c.header('X-Request-Id',c.get('requestId'));c.header('Cache-Control','no-store');await next();});
  app.get('/health',async c=>{await sql`SELECT 1`;return c.json({service:cfg.service,status:'ok'});});
  app.notFound(c=>c.json({error:{code:'NOT_FOUND',requestId:c.get('requestId')}},404));
  app.onError((error,c)=>{
    if(error instanceof ApiError) return c.json({error:{code:error.code,requestId:c.get('requestId')}},error.status);
    if(error instanceof z.ZodError) return c.json({error:{code:'VALIDATION_ERROR',issues:error.issues.map(i=>({path:i.path,message:i.message})),requestId:c.get('requestId')}},400);
    if(error instanceof SyntaxError) return c.json({error:{code:'INVALID_JSON',requestId:c.get('requestId')}},400);
    const pg=error as Error & {code?:string};
    if(pg.code==='40001'||pg.code==='23505') return c.json({error:{code:pg.code==='40001'?'VERSION_CONFLICT':'CONFLICT',requestId:c.get('requestId')}},409);
    if(pg.code==='23514'||pg.code==='23503'||pg.code==='23502') return c.json({error:{code:/^[a-z_]+$/.test(pg.message)?pg.message.toUpperCase():'INVALID_STATE',requestId:c.get('requestId')}},409);
    if(pg.code==='42501') return c.json({error:{code:'FORBIDDEN',requestId:c.get('requestId')}},403);
    // No token, payload, SQL query, database URL, or upstream response in logs.
    console.error(JSON.stringify({service:cfg.service,requestId:c.get('requestId'),errorType:error.name,code:pg.code??'INTERNAL_ERROR'}));
    return c.json({error:{code:'INTERNAL_ERROR',requestId:c.get('requestId')}},500);
  });
  return app;
}
export async function json<T extends z.ZodType>(c:Context<Env>,schema:T):Promise<z.infer<T>> {return schema.parse(await c.req.json());}
export function id(c:Context<Env>,name='id') {return uuid.parse(c.req.param(name));}
export function key(c:Context<Env>) {return uuid.parse(c.req.header('Idempotency-Key'));}
export function page(c:Context<Env>) {return z.coerce.number().int().min(1).max(10000).parse(c.req.query('page')??1);}
export function permission(p:Principal,code:string) {if(p.role!=='admin'&&(p.role!=='editor'||!p.permissions.includes(code))) throw new ApiError(403,'FORBIDDEN');}
export function internal(token:string):MiddlewareHandler<Env> {return async(c,next)=>{
  const value=c.req.header('X-Service-Token')??'';
  if(!token||Buffer.byteLength(token)!==Buffer.byteLength(value)||!timingSafeEqual(Buffer.from(token),Buffer.from(value))) throw new ApiError(403,'INTERNAL_ONLY');
  await next();
};}
export async function upstream(url:string,options:RequestInit={}) {
  let response:Response;
  try {response=await fetch(url,{...options,signal:AbortSignal.timeout(10000)});} catch {throw new ApiError(503,'UPSTREAM_UNAVAILABLE');}
  if(!response.ok) {
    if([400,401,403,404,409].includes(response.status)) {
      const payload=await response.json().catch(()=>({})) as {error?:{code?:string}};
      throw new ApiError(response.status as 400|401|403|404|409,payload.error?.code??'UPSTREAM_REJECTED');
    }
    throw new ApiError(503,'UPSTREAM_UNAVAILABLE');
  }
  return response;
}
export async function principal(cfg:Config,c:Context<Env>):Promise<Principal> {
  const token=c.req.header('Authorization');if(!token?.startsWith('Bearer ')) throw new ApiError(401,'AUTH_REQUIRED');
  const r=await upstream(`${cfg.identityUrl}/internal/verify`,{method:'POST',headers:{Authorization:token,'X-Service-Token':cfg.identityToken}});
  return await r.json() as Principal;
}
export function protect(cfg:Config,allowOnboarding=false):MiddlewareHandler<Env> {return async(c,next)=>{
  const p=await principal(cfg,c);if(!allowOnboarding&&!p.display_name) throw new ApiError(403,'PROFILE_REQUIRED');c.set('principal',p);await next();
};}
export async function contentCall<T>(cfg:Config,path:string,body?:unknown):Promise<T> {
  const r=await upstream(`${cfg.contentUrl}/internal${path}`,{method:body===undefined?'GET':'POST',headers:{'X-Service-Token':cfg.contentToken,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  return await r.json() as T;
}
export function numberVersion(v:unknown) {return Number(v);}
export function jsonValue(v:unknown):postgres.JSONValue {return JSON.parse(JSON.stringify(v)) as postgres.JSONValue;}
