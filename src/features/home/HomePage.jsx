import { useEffect, useState } from "react";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, updateTodo, updateTop3 } from "../../lib/storage/localStorageAdapter";
import CustomCheckbox from "../../components/common/CustomCheckbox";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => Number(value || 0).toLocaleString("ko-KR");

export default function HomePage() {
  const [data, setData] = useState(getAllData());
  const load = () => setData(getAllData());
  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const todayKey = today();
  const todos = data.todos.filter((item) => !item.completed && (!item.dueDate || item.dueDate <= todayKey));
  const events = data.events.filter((item) => item.date === todayKey);
  const unpaid = data.payments.filter((item) => item.status?.includes("미입금"));
  const due = [...data.todos, ...data.events, ...data.campaigns].filter((item) => (item.dueDate || item.date || item.uploadDueDate || item.applyDueDate) <= todayKey).slice(0, 4);
  const paid = data.payments.filter((item) => item.status === "입금 완료").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const unpaidTotal = unpaid.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <>
      <PageHeader eyebrow={todayKey} title="오늘도 가볍게 정리해볼까요?" />
      <div className="grid gap-4 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2">
          <SectionTitle>오늘의 TOP 3</SectionTitle>
          <div className="grid gap-2">
            {data.top3.slice(0, 3).map((item) => (
              <CustomCheckbox key={item.id} checked={item.completed} label={item.title} onChange={(checked) => updateTop3(item.id, { completed: checked })} />
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <SectionTitle>입금/정산 요약</SectionTitle>
          <p className="text-2xl font-bold text-clover-deep">{money(paid)}원</p>
          <p className="text-sm text-clover-sub">입금 완료</p>
          <p className="mt-3 text-lg font-bold text-red-500">{money(unpaidTotal)}원 미입금</p>
        </GlassCard>
        <GlassCard>
          <SectionTitle>오늘 일정</SectionTitle>
          {events.map((event) => <p key={event.id} className="mb-2 rounded-2xl bg-white/50 p-3 text-sm"><b>{event.time}</b> {event.title}</p>)}
          {!events.length && <p className="text-sm text-clover-sub">오늘 등록된 일정이 없어요.</p>}
        </GlassCard>
        <GlassCard>
          <SectionTitle>미완료 Todo</SectionTitle>
          {todos.slice(0, 5).map((todo) => <CustomCheckbox key={todo.id} checked={todo.completed} label={todo.title} onChange={(checked) => updateTodo(todo.id, { completed: checked })} />)}
        </GlassCard>
        <GlassCard>
          <SectionTitle>마감 임박</SectionTitle>
          <div className="grid gap-2">
            {due.map((item) => <div key={item.id} className="rounded-2xl bg-white/50 p-3 text-sm"><StatusBadge tone="danger">확인</StatusBadge><p className="mt-2 font-bold">{item.title || item.name}</p></div>)}
          </div>
        </GlassCard>
        <GlassCard className="xl:col-span-2">
          <SectionTitle>빠른 메모 인박스</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.inboxMemos.map((memo) => <p key={memo.id} className="rounded-2xl bg-white/50 p-3 text-sm">{memo.body}</p>)}
          </div>
        </GlassCard>
        <GlassCard>
          <SectionTitle>콘텐츠 발행</SectionTitle>
          {data.contentPlans.slice(0, 4).map((item) => <p key={item.id} className="mb-2 text-sm"><b>{item.channel}</b> · {item.title}</p>)}
        </GlassCard>
      </div>
    </>
  );
}
