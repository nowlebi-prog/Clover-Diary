import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { mergeSnapshots } from '../src/lib/storage/snapshotMerge.js';
import { normalizeMandalart } from '../src/lib/storage/mandalartData.js';

// External network and browser storage are controlled; the actual adapter is executed.
function loadAdapter({ limit = Infinity } = {}) {
 const source = readFileSync(new URL('../src/lib/storage/localStorageAdapter.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace(/^export \{[^;]+;\r?\n/gm, '').replace(/export /g, '');
 const memory = new Map(); const timers = new Map(); let id = 0; const events = [];
 let resolvePull;
 const context = vm.createContext({
  mergeSnapshots, normalizeMandalart, initialData: {todos:[], habits:[], habitLogs:[], deletedItems:[],taskCategories:['default'],activeWorkTimer:null}, collections:['todos','habits','habitLogs','deletedItems'], DEFAULT_WORK_CATEGORIES:[],
  STORAGE_KEYS: {appData:'data', appDataBackup:'backup', syncMeta:'meta', recovery:'recovery'},
  localStorage: {getItem:k=>memory.get(k)??null, setItem:(k,v)=>{const chars=[...memory].reduce((n,[name,value])=>n+(name===k?0:value.length),0)+v.length;if(chars>limit){const error=new Error('Storage full');error.name='QuotaExceededError';throw error;}memory.set(k,v);}, removeItem:k=>memory.delete(k)},
  window: {dispatchEvent:e=>events.push(e.type),clearTimeout:n=>timers.delete(n),setTimeout:fn=>{timers.set(++id,fn);return id;}},
  Event: class {constructor(type){this.type=type;}}, CustomEvent: class {constructor(type,opts){this.type=type;this.detail=opts?.detail;}},
  isCloudSyncEnabled:()=>true, pullRemoteSnapshot:()=>new Promise(r=>{resolvePull=r;}), pushRemoteSnapshot:async()=>{throw Error('offline');}, console
 });
 vm.runInContext(source+'\nglobalThis.adapter={getAllData,saveAllData,getSyncState,normalizeSnapshot:typeof normalizeSnapshot === "function"?normalizeSnapshot:null,importLegacyData,buildFullBackup,setStorageUser,getRecoverySnapshots};',context);
 return {api:context.adapter,memory,events,timers,resolvePull:value=>resolvePull(value)};
}

test('silent UI saves still notify cloud sync',()=>{
 const {api,events}=loadAdapter(); api.saveAllData({todos:[{id:'note',title:'saved'}]},{silent:true});
 assert.ok(events.includes('clover-local-write'));
});
test('first-device defaults do not overwrite remote categories or active timer',()=>{
 const {api}=loadAdapter();api.setStorageUser('alice');const local=api.getAllData();
 const remote={...local,taskCategories:['custom'],activeWorkTimer:{id:'running'}};
 const merged=mergeSnapshots(api.getSyncState().baseline,local,remote);
 assert.deepEqual(Array.from(merged.data.taskCategories),['custom']);assert.equal(merged.data.activeWorkTimer.id,'running');
});
test('editing one mandalart cell before the first pull preserves independent remote cells',()=>{
 const {api}=loadAdapter();api.setStorageUser('fresh');const edited=api.getAllData();
 edited.mandalart=normalizeMandalart();edited.mandalart.themes[0].tasks[0]='offline task';api.saveAllData(edited);
 const remotePlan=normalizeMandalart();remotePlan.mainGoal='remote main goal';remotePlan.themes[1].tasks[2]='remote task';
 const remote=api.normalizeSnapshot({mandalart:remotePlan});
 const merged=mergeSnapshots(api.getSyncState().baseline,api.getAllData(),remote);
 assert.equal(merged.data.mandalart.mainGoal,'remote main goal');
 assert.equal(merged.data.mandalart.themes[1].tasks[2],'remote task');
 assert.equal(merged.data.mandalart.themes[0].tasks[0],'offline task');
});
test('older acknowledgement baselines gain new default fields without becoming edits',()=>{
 const {api,memory}=loadAdapter();api.setStorageUser('alice');
 memory.set('meta:user:alice',JSON.stringify({baseline:{todos:[]}}));
 const remote=api.normalizeSnapshot({mandalart:{mainGoal:'existing remote goal'}});
 const merged=mergeSnapshots(api.getSyncState().baseline,api.getAllData(),remote);
 assert.equal(merged.data.mandalart.mainGoal,'existing remote goal');
});
test('saving a stale spread snapshot cannot delete records pulled since that screen opened',()=>{
 const {api}=loadAdapter();api.setStorageUser('alice');api.saveAllData({todos:[{id:'original'}]});const opened=api.getAllData();
 api.saveAllData({todos:[{id:'remote'},{id:'original'}]},{skipRemote:true});
 api.saveAllData({...opened,ideas:[{id:'new-project'}]});
 assert.deepEqual(Array.from(api.getAllData().todos,x=>x.id).sort(),['original','remote']);
});
test('an asynchronous save from a previous account is rejected',()=>{
 const {api}=loadAdapter();api.setStorageUser('alice');const old=api.getAllData();old.todos=[{id:'private'}];api.setStorageUser('bob');
 assert.throws(()=>api.saveAllData({...old}));assert.equal(api.getAllData().todos.length,0);
});
test('remote updates remain possible when recovery history approaches browser quota',()=>{
 const {api}=loadAdapter({limit:800000});api.setStorageUser('alice');
 api.saveAllData({todos:[{id:'local',body:'L'.repeat(100000)}]});
 for(let i=0;i<15;i++)api.saveAllData({todos:[{id:'remote-'+i,body:'R'.repeat(100000)}]},{skipRemote:true});
 assert.equal(api.getAllData().todos[0].id,'remote-14');
 assert.ok(api.getRecoverySnapshots().length>0);
});
test('legacy import retains the original and merges records with the authenticated cache',()=>{
 const {api,memory}=loadAdapter();api.saveAllData({todos:[{id:'old',title:'old'}]});const original=memory.get('data');
 api.setStorageUser('alice');api.saveAllData({todos:[{id:'cloud',title:'cloud'}]});api.importLegacyData();
 assert.deepEqual(Array.from(api.getAllData().todos,x=>x.id).sort(),['cloud','old']);
 assert.equal(memory.get('data'),original);
 api.setStorageUser('bob');assert.equal(api.getAllData().todos.length,0);
});
test('missing primary data recovers from backup and malformed originals are not overwritten',()=>{
 const {api,memory}=loadAdapter();memory.set('backup',JSON.stringify({data:{todos:[{id:'recover'}]}}));
 assert.equal(api.getAllData().todos[0].id,'recover');
 memory.set('data','broken-main');memory.set('backup','broken-backup');
 assert.throws(()=>api.getAllData());assert.equal(memory.get('data'),'broken-main');
});
test('different accounts cannot see or upload each other\'s cache',()=>{
 const {api}=loadAdapter(); assert.equal(typeof api.setStorageUser,'function');
 api.setStorageUser('alice');api.saveAllData({todos:[{id:'a',title:'private'}]});
 api.setStorageUser('bob');assert.equal(api.getAllData().todos.length,0);
 api.setStorageUser('alice');assert.equal(api.getAllData().todos[0].title,'private');
});
test('applying a remote snapshot keeps a separate recoverable pre-sync copy',()=>{
 const {api}=loadAdapter();api.saveAllData({todos:[{id:'today',title:'today'}]});
 api.saveAllData({todos:[]},{skipRemote:true});
 assert.equal(typeof api.getRecoverySnapshots,'function');
 assert.ok(api.getRecoverySnapshots().some(s=>s.data.todos.some(t=>t.id==='today')));
});
