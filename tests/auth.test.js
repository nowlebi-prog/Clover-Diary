import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const sourceUrl=process.env.CLOVER_BASELINE_ROOT
  ? new URL('src/lib/auth/supabaseAuthAdapter.js',pathToFileURL(process.env.CLOVER_BASELINE_ROOT+'/'))
  : new URL('../src/lib/auth/supabaseAuthAdapter.js',import.meta.url);
function adapter(auth) {
 const source=readFileSync(sourceUrl,'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
 const ctx=vm.createContext({supabase:{auth}});vm.runInContext(source+'\nglobalThis.api={login,getSession,logout};',ctx);return ctx.api;
}
test('cloud login authenticates the supplied email and returns its real session',async()=>{
 let received;const session={user:{id:'real-user'}};
 const api=adapter({signInWithPassword:async credentials=>{received=credentials;return {data:{session},error:null};}});
 const result=await api.login(' test@example.invalid ','password');
 assert.equal(result.ok,true);assert.equal(result.session.user.id,'real-user');assert.equal(received.email,'test@example.invalid');
});
test('rejected cloud credentials never fall back to a local session',async()=>{
 const api=adapter({signInWithPassword:async()=>({data:{session:null},error:{message:'Invalid credentials'}})});
 assert.equal((await api.login('wrong@example.invalid','wrong')).ok,false);
});
test('the persisted authenticated session is restored on reopening the app',async()=>{
 const api=adapter({getSession:async()=>({data:{session:{user:{id:'persisted'}}},error:null})});
 assert.equal((await api.getSession()).user.id,'persisted');
});
