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

test('a 20-minute card ends before the next card and truly overlapping cards keep separate lanes',()=>{
 const source=fs.readFileSync(new URL('../src/features/schedule/SchedulePage.jsx',import.meta.url),'utf8');
 const helpers=source.slice(source.indexOf('const timeMinutes ='),source.indexOf('const addDays ='));
 const {timelineMetrics,layoutTimelineItems}=vm.runInNewContext(`${helpers}\n;({timelineMetrics,layoutTimelineItems})`);
 const items=layoutTimelineItems([
  {startTime:'05:00',endTime:'05:20'}, {startTime:'05:20',endTime:'07:00'},
  {startTime:'08:00',endTime:'08:15'}, {startTime:'08:00',endTime:'09:00'}
 ].map(item=>({...item,metrics:timelineMetrics(item)})));
 assert.ok(items[0].metrics.top+items[0].metrics.height<=items[1].metrics.top);
 assert.equal(items[0].laneCount,1);
 assert.notEqual(items[2].lane,items[3].lane);
});

test('completed entries stay in the schedule and can be marked incomplete again',()=>{
 const source=fs.readFileSync(new URL('../src/features/schedule/SchedulePage.jsx',import.meta.url),'utf8');
 const helpers=source.slice(source.indexOf('const fromCollection ='),source.indexOf('const getScheduleItems ='));
 const {fromCollection,toggleScheduleCompletion}=vm.runInNewContext(`${helpers}\n;({fromCollection,toggleScheduleCompletion:typeof toggleScheduleCompletion==='function'?toggleScheduleCompletion:null})`,{
  normalizeEndDate:(start,end)=>end||start,titleOf:item=>item.title,normalizeCategory:()=> 'PPT'
 });
 const entry={id:'event-1',title:'Meeting',date:'2026-11-09',completed:true,completedAt:'2026-11-09'};
 const shown=fromCollection([entry],'events','date','PPT');
 assert.equal(shown.length,1);assert.equal(shown[0].completed,true);
 const reopened=toggleScheduleCompletion(entry,'2026-11-09','2026-11-10');
 assert.equal(reopened.completed,false);assert.equal(reopened.completedAt,'');assert.equal(reopened.date,entry.date);
 assert.equal(toggleScheduleCompletion(reopened,'2026-11-09','2026-11-10').completedAt,'2026-11-09');
});
