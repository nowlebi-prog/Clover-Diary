// Loopback-only fake service for testing the real Auth SDK, UI, and coordinator.
// No production endpoints or credentials are used.
import http from 'node:http';
const id='00000000-0000-0000-0000-000000000001';
let row={data:{todos:[],habits:[],habitLogs:[],deletedItems:[]},revision:1,updated_at:new Date().toISOString()};
let offline=false;
const user={id,email:'test@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-10-16T00:00:00Z'};
const token=()=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'test-signature'].join('.');
http.createServer(async(req,res)=>{
  console.log(req.method,req.url,req.headers['access-control-request-headers']||'');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers',req.headers['access-control-request-headers']||'authorization,apikey,content-type,x-client-info,x-supabase-api-version,prefer,accept');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Content-Type','application/json');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  let text='';for await(const chunk of req)text+=chunk;
  const body=text?JSON.parse(text):{};
  if(req.url==='/__test/offline'){offline=Boolean(body.offline);res.end(JSON.stringify({offline}));return;}
  if(offline){res.writeHead(503);res.end(JSON.stringify({message:'Test connection unavailable'}));return;}
  if(req.url.startsWith('/auth/v1/token')){
    if(body.grant_type!=='refresh_token' && body.email && (body.email!=='test@example.invalid'||body.password!=='test-only-password')){res.writeHead(400);res.end(JSON.stringify({message:'Invalid login credentials'}));return;}
    res.end(JSON.stringify({access_token:token(),token_type:'bearer',expires_in:3600,refresh_token:'test-refresh',user}));return;
  }
  if(req.url.startsWith('/auth/v1/user')){res.end(JSON.stringify(user));return;}
  if(req.url.startsWith('/auth/v1/logout')){res.end('{}');return;}
  if(req.url.startsWith('/rest/v1/app_data')){res.end(JSON.stringify(req.headers.accept?.includes('vnd.pgrst.object')?row:[row]));return;}
  if(req.url==='/rest/v1/rpc/save_app_data'){
    if(body.p_expected_revision!==row.revision){res.end('[]');return;}
    row={data:body.p_data,revision:row.revision+1,updated_at:new Date().toISOString()};
    res.end(JSON.stringify([{revision:row.revision,updated_at:row.updated_at}]));return;
  }
  res.writeHead(404);res.end(JSON.stringify({message:'Unknown test endpoint'}));
}).listen(54329,'127.0.0.1',()=>console.log('Test Supabase ready on http://127.0.0.1:54329'));
