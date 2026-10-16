import test from 'node:test';
import assert from 'node:assert/strict';

const { mergeSnapshots } = await import('../src/lib/storage/snapshotMerge.js').catch(() => ({}));
const { createSyncEngine } = await import('../src/lib/storage/syncEngine.js').catch(() => ({}));
const copy = value => structuredClone(value);

test('merge retains independent device additions and offline deletions', () => {
  assert.equal(typeof mergeSnapshots, 'function');
  const result = mergeSnapshots({todos:[{id:'old',title:'old'}]},
    {todos:[{id:'pc',title:'PC'}]}, {todos:[{id:'old',title:'old'},{id:'mobile',title:'Mobile'}]});
  assert.deepEqual(result.data.todos.map(x=>x.id).sort(), ['mobile','pc']);
});
test('merge combines different fields and archives conflicting values', () => {
  assert.equal(typeof mergeSnapshots, 'function');
  const base={todos:[{id:'a',title:'old',done:false}]};
  const result=mergeSnapshots(base,{todos:[{id:'a',title:'PC',done:false}]},{todos:[{id:'a',title:'Phone',done:true}]});
  assert.deepEqual(result.data.todos,[{id:'a',title:'PC',done:true}]);
  assert.equal(result.conflicts.length,1);
  assert.equal(result.conflicts[0].remote.value,'Phone');
});

function device(server, initial={}, baseline=null) {
  let local=copy(initial); let state={baseline:copy(baseline),pending:true}; let active=true; let failures=0;
  const engine=createSyncEngine({
    readLocal:()=>copy(local), applyRemote:data=>{local=copy(data);},
    readState:()=>copy(state), writeState:patch=>{state={...state,...copy(patch)};},
    pull:async()=>{if(failures-->0)throw Error('offline');return copy(server.row);},
    commit:async(data,revision)=>{if(server.failCommit){server.failCommit=false;throw Error('offline');}if(server.beforeCommit)await server.beforeCommit();if((server.row?.revision||0)!==revision)return null;
      server.row={data:copy(data),revision:revision+1,updated_at:'2026-10-16T00:00:00Z'};return copy(server.row);},
    isActive:()=>active, archiveConflicts:items=>{state.conflicts=[...(state.conflicts||[]),...copy(items)];}
  });
  return {engine,edit:data=>{local=copy(data);state.pending=true;},read:()=>copy(local),state:()=>copy(state),offline:()=>{failures=1;},stop:()=>{active=false;}};
}
test('delayed pull keeps edits made while awaiting the server',async()=>{
  assert.equal(typeof createSyncEngine,'function');
  const server={row:{data:{todos:[]},revision:1}};const d=device(server,{todos:[]},{todos:[]});
  const syncing=d.engine.sync();d.edit({todos:[{id:'today',title:'Today'}]});await syncing;
  assert.equal(d.read().todos[0].id,'today');assert.equal(server.row.data.todos[0].id,'today');
});
test('simultaneous device writes use revision checks and converge',async()=>{
  assert.equal(typeof createSyncEngine,'function');
  const server={row:{data:{todos:[]},revision:1}};
  const pc=device(server,{todos:[{id:'pc'}]},{todos:[]});const phone=device(server,{todos:[{id:'phone'}]},{todos:[]});
  await Promise.all([pc.engine.sync(),phone.engine.sync()]);await pc.engine.sync();await phone.engine.sync();
  assert.deepEqual(server.row.data.todos.map(x=>x.id).sort(),['pc','phone']);
  assert.deepEqual(pc.read(),phone.read());
});
test('failed uploads remain pending and succeed on the next sync',async()=>{
  assert.equal(typeof createSyncEngine,'function');
  const server={row:{data:{todos:[]},revision:1}};const d=device(server,{todos:[{id:'offline'}]},{todos:[]});
  server.failCommit=true;await d.engine.sync();assert.equal(d.state().pending,true);assert.equal(d.state().lastSyncStatus,'error');
  await d.engine.sync();assert.equal(server.row.data.todos[0].id,'offline');assert.equal(d.state().pending,false);
});
test('a device returning after a remote deletion does not resurrect the deleted record',async()=>{
  const old={todos:[{id:'deleted'},{id:'keep'}]};const server={row:{data:{todos:[{id:'keep'}]},revision:2}};
  const d=device(server,old,old);await d.engine.sync();
  assert.deepEqual(d.read().todos,[{id:'keep'}]);assert.equal(d.state().pending,false);
});
test('edits during an upload are not acknowledged before being uploaded',async()=>{
  assert.equal(typeof createSyncEngine,'function');
  let resume;const server={row:{data:{todos:[]},revision:1},beforeCommit:()=>new Promise(r=>{resume=r;})};
  const d=device(server,{todos:[{id:'a',title:'first'}]},{todos:[]});const p=d.engine.sync();
  await new Promise(r=>setImmediate(r));d.edit({todos:[{id:'a',title:'second'}]});server.beforeCommit=null;resume();await p;
  assert.equal(d.read().todos[0].title,'second');
  if(d.state().pending)await d.engine.sync();
  assert.equal(server.row.data.todos[0].title,'second');assert.equal(d.state().pending,false);
});
test('logout cancels an in-flight pull without applying data to another account',async()=>{
  assert.equal(typeof createSyncEngine,'function');
  const d=device({row:{data:{todos:[{id:'private'}]},revision:1}},{todos:[]});const p=d.engine.sync();d.stop();await p;
  assert.deepEqual(d.read(),{todos:[]});
});
