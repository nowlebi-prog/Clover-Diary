import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

test('empty and populated timelines both show midnight through the last hour',()=>{
 const source=fs.readFileSync(new URL('../src/features/schedule/SchedulePage.jsx',import.meta.url),'utf8');
 const helpers=source.slice(source.indexOf('const timeMinutes ='),source.indexOf('const addDays ='));
 const api=vm.runInNewContext(`${helpers}\n;({timelineRange,timelineMetrics})`);
 for(const items of [[],[{startTime:'09:00',endTime:'10:00'}]]) {
  const range=api.timelineRange(items);
  assert.equal(range.startHour,0);assert.equal(range.endHour,24);
  assert.equal(api.timelineMetrics({startTime:'00:00',endTime:'01:00'},range.startHour,range.endHour).top,0);
  assert.equal(api.timelineMetrics({startTime:'23:00',endTime:'23:59'},range.startHour,range.endHour).top,1242);
 }
});
