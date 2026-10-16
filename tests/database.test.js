import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('Postgres migration retains data, enforces account isolation and rejects stale writes', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create role anon; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
      create table public.app_data(user_id uuid primary key references auth.users(id),data jsonb not null default '{}',updated_at timestamptz not null default now());
      insert into public.app_data(user_id,data) values('00000000-0000-0000-0000-000000000001','{"todos":[{"id":"existing"}]}');`);
    const sql=readFileSync(new URL('../supabase-sync-migration.sql',import.meta.url),'utf8');
    await db.exec(sql); await db.exec(sql); // Repeatable rollout without erasing existing rows.
    await db.exec(`set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';`);
    const first=await db.query('select data,revision from app_data');
    assert.equal(first.rows[0].data.todos[0].id,'existing');
    const saved=await db.query(`select * from save_app_data('00000000-0000-0000-0000-000000000001',$1::jsonb,1)`,[JSON.stringify({todos:[{id:'saved'}]})]);
    assert.equal(Number(saved.rows[0].revision),2);
    const stale=await db.query(`select * from save_app_data('00000000-0000-0000-0000-000000000001',$1::jsonb,1)`,[JSON.stringify({todos:[]})]);
    assert.equal(stale.rows.length,0);
    assert.equal((await db.query('select data from app_data')).rows[0].data.todos[0].id,'saved');
    await db.exec(`set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';`);
    assert.equal((await db.query('select * from app_data')).rows.length,0);
    await db.query(`select * from save_app_data('00000000-0000-0000-0000-000000000002','{"todos":[{"id":"bob"}]}',0)`);
    assert.equal((await db.query('select data from app_data')).rows[0].data.todos[0].id,'bob');
    await assert.rejects(db.query(`select * from save_app_data('00000000-0000-0000-0000-000000000001','{}',1)`));
    await assert.rejects(db.query(`update app_data set user_id='00000000-0000-0000-0000-000000000001'`));
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select * from app_data'));
    await assert.rejects(db.query(`select * from save_app_data('00000000-0000-0000-0000-000000000001','{}',0)`));
  } finally { await db.close(); }
});
