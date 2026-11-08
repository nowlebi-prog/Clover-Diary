import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';

const primary = 'clover-desk:data:v1:user:alice';
const baseline = 'clover-desk:sync-meta:v1:user:alice';
const fakeLegacy = (entries) => ({ length:entries.length, key:i=>entries[i]?.[0], getItem:k=>entries.find(([key])=>key===k)?.[1]??null });
const make = async (indexedDB, entries=[]) => {
 const { createDiaryStorage } = await import('../src/lib/storage/diaryStorage.js');
 const store=createDiaryStorage({indexedDB,legacy:fakeLegacy(entries)});
 await store.open(); return store;
};

test('migrates all large diary keys without changing legacy and reopens a >5 MiB write',async()=>{
 const db=new IDBFactory(), original='{"todos":[{"id":"before"}]}';
 const entries=[[primary,original],[baseline,'{"revision":3}'],['clover-desk:data:v1:user:bob','private'],['unrelated','leave alone']];
 const a=await make(db,entries);assert.equal(a.getItem(primary),original);assert.equal(a.getItem(baseline),'{"revision":3}');assert.equal(a.getItem('unrelated'),null);
 const large=JSON.stringify({image:'x'.repeat(6*1024*1024)});
 a.setItem(primary,large);a.setItem(baseline,'{"revision":4}');assert.equal(a.status().pending,true);await a.flush();
 const b=await make(db,entries);assert.equal(b.getItem(primary),large);assert.equal(b.getItem(baseline),'{"revision":4}');assert.equal(entries[0][1],original);assert.equal(b.getItem(entries[2][0]),'private');
});

test('a stale tab cannot overwrite committed records or partially commit related metadata',async()=>{
 const db=new IDBFactory();const a=await make(db,[[primary,'original']]);const b=await make(db);
 a.setItem(primary,'newer');await a.flush();
 b.setItem(primary,'stale draft');b.setItem(baseline,'stale baseline');
 await assert.rejects(b.flush(),{name:'DiaryWriteConflict'});
 assert.equal(b.getItem(primary),'stale draft');assert.ok(b.status().error);
 const fresh=await make(db);assert.equal(fresh.getItem(primary),'newer');assert.equal(fresh.getItem(baseline),null);
});

test('clean tabs refresh committed data without loading legacy over it',async()=>{
 const db=new IDBFactory();const a=await make(db,[[primary,'legacy']]);const b=await make(db);
 a.setItem(primary,'current');await a.flush();assert.equal(await b.refresh(),true);assert.equal(b.getItem(primary),'current');
});

test('a local edit can mark pending without replacing a newer acknowledged baseline',async()=>{
 const db=new IDBFactory();const a=await make(db,[[primary,'original'],[baseline,'{"revision":3,"pending":false}']]);const b=await make(db);
 a.setItem(baseline,'{"revision":4,"pending":false}');await a.flush();
 b.setItem(primary,'new edit');b.setItem(baseline,'{"revision":3,"pending":true}',{pending:true});await b.flush();
 const fresh=await make(db);assert.equal(fresh.getItem(primary),'new edit');assert.deepEqual(JSON.parse(fresh.getItem(baseline)),{revision:4,pending:true});
});

test('a stale standalone acknowledgement does not block the next local edit',async()=>{
 const db=new IDBFactory();const a=await make(db,[[primary,'original'],[baseline,'{"revision":3}']]);const b=await make(db);
 a.setItem(baseline,'{"revision":5}');await a.flush();
 b.setItem(baseline,'{"revision":4}',undefined,true);await b.flush();
 assert.deepEqual(JSON.parse(b.getItem(baseline)),{revision:5});
 b.setItem(primary,'new local edit');b.setItem(baseline,'{"revision":5,"pending":true}',{pending:true});await b.flush();
 assert.equal((await make(db)).getItem(primary),'new local edit');
});
