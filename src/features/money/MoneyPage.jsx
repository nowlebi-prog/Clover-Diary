import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import CrudPanel from "../shared/CrudPanel";
import { createPayment, deletePayment, getAllData, getPayments, updatePayment } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const sum = (items, field = "amount") => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const cardClass = "glass rounded-[22px] bg-white/70 p-4";

export default function MoneyPage() {
  const data = getAllData();
  const today = toDateKey(new Date());
  const monthKey = today.slice(0, 7);
  const expenses = data.expenses || [];
  const todayExpenses = expenses.filter((item) => item.date === today);
  const weekExpenses = expenses.filter((item) => {
    const date = new Date(`${item.date || today}T00:00:00`);
    const now = new Date(`${today}T00:00:00`);
    const diff = Math.floor((now - date) / 86400000);
    return diff >= 0 && diff < 7;
  });
  const monthExpenses = expenses.filter((item) => (item.date || "").startsWith(monthKey));
  const subscriptions = data.subscriptions || [];
  const payments = data.payments || [];
  const shoppingItems = (data.shoppingItems || []).filter((item) => !item.completed);
  const expectedMonth = sum(monthExpenses) + sum(subscriptions);

  return (
    <>
      <PageHeader eyebrow="MONEY" title="돈 관리 현황판" />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <section className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-clover-deep">오늘 지출</p>
          <p className="mt-2 text-2xl font-black">{sum(todayExpenses).toLocaleString()}원</p>
        </section>
        <section className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-clover-deep">이번 주 지출</p>
          <p className="mt-2 text-2xl font-black">{sum(weekExpenses).toLocaleString()}원</p>
        </section>
        <section className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-clover-deep">이번 달 지출</p>
          <p className="mt-2 text-2xl font-black">{sum(monthExpenses).toLocaleString()}원</p>
        </section>
        <section className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-clover-deep">월말 예상</p>
          <p className="mt-2 text-2xl font-black">{expectedMonth.toLocaleString()}원</p>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <CrudPanel
            title="외주 입금 관리"
            description="클라이언트별 계약금, 잔금, 입금 상태를 한곳에서 확인해요."
            getItems={getPayments}
            createItem={createPayment}
            updateItem={updatePayment}
            deleteItem={deletePayment}
            fields={[
              { name: "project", label: "프로젝트명", primary: true },
              { name: "client", label: "클라이언트명" },
              { name: "amount", label: "총액", type: "number" },
              { name: "status", label: "입금 상태", type: "select", options: ["견적 전", "계약금 완료", "진행중", "잔금 미입금", "입금 완료", "보류"] },
              { name: "expectedDate", label: "입금 예정일", type: "date" },
              { name: "paidDate", label: "실제 입금일", type: "date" },
              { name: "memo", label: "메모", type: "textarea" }
            ]}
          />
        </div>

        <div className="grid content-start gap-4">
          <GlassCard>
            <SectionTitle>구독 관리</SectionTitle>
            <div className="grid gap-2">
              {subscriptions.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
                  <span>{item.title}</span>
                  <span className="text-clover-deep">{Number(item.amount || 0).toLocaleString()}원</span>
                </div>
              ))}
              {!subscriptions.length && <p className="text-sm text-clover-sub">등록된 구독이 없어요.</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>결제 예정</SectionTitle>
            <div className="grid gap-2">
              {payments.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
                  <p>{item.project || item.client}</p>
                  <p className="mt-1 text-xs text-clover-sub">{item.expectedDate || "일정 미정"} · {Number(item.amount || 0).toLocaleString()}원</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>구매 필요 항목</SectionTitle>
            <div className="grid gap-2">
              {shoppingItems.slice(0, 5).map((item) => (
                <p key={item.id} className="rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">{item.title}</p>
              ))}
              {!shoppingItems.length && <p className="text-sm text-clover-sub">지금 꼭 사야 할 항목은 없어요.</p>}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
