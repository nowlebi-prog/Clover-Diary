import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function nativeLogin({status=200, payload={user:{id:'a'}, access_token:'a', refresh_token:'r'}, email='person@example.com'}={}) {
 const alerts=[]; let sent;
 class NativeAlert {
  constructor(){alerts.push(this);}
  addTextField(){} addSecureTextField(){} addAction(){} addCancelAction(){}
  textFieldValue(i){return i ? 'test-password' : email;}
  async presentAlert(){return 0;}
 }
 class NativeRequest {
  set headers(value){this.savedHeaders={...value};}
  get headers(){return {...this.savedHeaders};}
  async loadString(){sent={headers:this.savedHeaders,body:this.body}; this.response={statusCode:status}; return JSON.stringify(payload);}
 }
 let source=await fs.readFile(new URL('../widgets/CloverWidget.js',import.meta.url),'utf8');
 source=source.replace('/*CLOVER_CONFIG*/ null',JSON.stringify({url:'https://example.supabase.co',key:'public-test-key'}));
 const store=new Map();
 const result=await vm.runInNewContext(`(async()=>{${source}\nreturn signIn(store);})()`,{Alert:NativeAlert,Request:NativeRequest,Date,store:{remove:k=>store.delete(k),set:(k,v)=>store.set(k,v)}});
 return {result,alerts,sent,store};
}

test('native login submits JSON with Content-Type assigned across native property boundary',async()=>{
 const result=await nativeLogin();
 assert.equal(result.result,true);
 assert.equal(result.sent.headers['Content-Type'],'application/json');
 assert.equal(result.store.get('session').userId,'a');
});

test('email confirmation failure is not reported as a wrong password and includes safe diagnostic code',async()=>{
 const result=await nativeLogin({status:400,payload:{error_code:'email_not_confirmed',msg:'Email not confirmed'}});
 assert.equal(result.result,false);
 assert.match(result.alerts.at(-1).message,/이메일 인증/);
 assert.match(result.alerts.at(-1).message,/email_not_confirmed/);
 assert.doesNotMatch(result.alerts.at(-1).message,/test-password/);
 assert.equal(result.store.size,0);
});

test('invalid project key is distinguished from account credentials',async()=>{
 const result=await nativeLogin({status:401,payload:{message:'Invalid API key'}});
 assert.equal(result.result,false);
 assert.match(result.alerts.at(-1).message,/설치 안내/);
 assert.doesNotMatch(result.alerts.at(-1).message,/비밀번호를 확인/);
});

test('non-email legacy username is rejected before making a password request',async()=>{
 const result=await nativeLogin({email:'eunbibi'});
 assert.equal(result.result,false);
 assert.equal(result.sent,undefined);
 assert.match(result.alerts.at(-1).message,/@/);
});
