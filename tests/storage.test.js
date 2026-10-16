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
 vm.runInContext(source+'\nglobalThis.adapter={getAllData,saveAllData,getSyncState,normalizeSnapshot:typeof normalizeSnapshot === "function"?normalizeSnapshot:null,importLegacyData,buildFullBackup,setStorageUser,getRecoverySnapshots,startActiveSession,getActiveSession,pauseActiveSession,resumeActiveSession,endActiveSession,getTaskCategories,undoDataChange:typeof undoDataChange === "function" ? undoDataChange : null,redoDataChange:typeof redoDataChange === "function" ? redoDataChange : null,handleDataHistoryKeydown:typeof handleDataHistoryKeydown === "function" ? handleDataHistoryKeydown : null};',context);
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

test('blank-title focus timer starts using the selected category',()=>{
 const {api}=loadAdapter();
 api.startActiveSession({title:'   ',category:'PPT'});
 assert.equal(api.getActiveSession().title,'PPT 집중');
 assert.ok(api.getActiveSession().startTime>0);
 api.pauseActiveSession(); assert.equal(api.getActiveSession().pauses.length,1);
 api.resumeActiveSession(); assert.ok(api.getActiveSession().pauses[0].end);
 api.endActiveSession(); assert.equal(api.getActiveSession(),null);
 assert.equal(api.getAllData().workSessions.length,1);
});

test('previous default timer categories become the six requested categories without losing records',()=>{
 const {api}=loadAdapter();
 api.saveAllData({taskCategories:['PPT','위스티아','갭이어','공부','신사업','유튜브','자기개발','기타'],todos:[{id:'old',category:'갭이어'}]});
 assert.deepEqual(Array.from(api.getTaskCategories(),c=>c.name),['PPT','프모아','공부','유튜브','자기개발','기타']);
 assert.equal(api.getAllData().todos[0].category,'갭이어');
});

test('undo and redo preserve independent remote additions and queue cloud saving',()=>{
 const {api,events}=loadAdapter();
 assert.equal(typeof api.undoDataChange,'function');
 api.setStorageUser('alice');
 api.saveAllData({todos:[{id:'a',title:'before'}]});
 const edit=api.getAllData();edit.todos[0].title='after';api.saveAllData(edit);
 const remote=api.getAllData();remote.todos.push({id:'b',title:'remote'});api.saveAllData(remote,{skipRemote:true});
 assert.equal(api.undoDataChange(),true);
 assert.equal(api.getAllData().todos.find(t=>t.id==='a').title,'before');
 assert.equal(api.getAllData().todos.find(t=>t.id==='b').title,'remote');
 assert.equal(api.getSyncState().pending,true);
 assert.equal(api.redoDataChange(),true);
 assert.equal(api.getAllData().todos.find(t=>t.id==='a').title,'after');
 assert.ok(events.includes('clover-local-write'));
 api.undoDataChange();const newer=api.getAllData();newer.todos[0].title='new branch';api.saveAllData(newer);
 assert.equal(api.redoDataChange(),false);
 api.setStorageUser('bob');assert.equal(api.undoDataChange(),false);
});

test('history shortcuts leave native text undo alone and undo saved changes outside editors',()=>{
 const {api}=loadAdapter();assert.equal(typeof api.handleDataHistoryKeydown,'function');
 api.saveAllData({todos:[{id:'a'}]});
 let prevented=false;
 const event={key:'z',ctrlKey:true,preventDefault(){prevented=true;},target:{closest(){return {};}}};
 api.handleDataHistoryKeydown(event);assert.equal(prevented,false);assert.equal(api.getAllData().todos.length,1);
 event.target.closest=()=>null;api.handleDataHistoryKeydown(event);assert.equal(prevented,true);assert.equal(api.getAllData().todos.length,0);
 api.handleDataHistoryKeydown({...event,shiftKey:true});assert.equal(api.getAllData().todos.length,1);
});

test('undo never overwrites a newer remote edit or resurrects a remotely deleted item',()=>{
 for (const removed of [false,true]) {
  const {api}=loadAdapter();api.setStorageUser('alice');
  api.saveAllData({todos:[{id:'a',title:'before'}]});
  const edit=api.getAllData();edit.todos[0].title='local';api.saveAllData(edit);
  const cloud=api.getAllData();cloud.todos=removed?[]:[{id:'a',title:'newer remote'}];api.saveAllData(cloud,{skipRemote:true});
  api.undoDataChange();
  assert.equal(api.getAllData().todos.length,removed?0:1);
  if(!removed)assert.equal(api.getAllData().todos[0].title,'newer remote');
  api.redoDataChange();
  assert.equal(api.getAllData().todos.length,removed?0:1);
  if(!removed)assert.equal(api.getAllData().todos[0].title,'newer remote');
 }
});
