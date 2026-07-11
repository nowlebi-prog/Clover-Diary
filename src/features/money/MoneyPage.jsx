import { useMemo, useState } from "react";
import {
  Wallet, ArrowDownCircle, PiggyBank, Coins, Home as HomeIcon, Smartphone,
  ShieldCheck, Building2, Receipt, Sparkles, CreditCard, Download, ChevronRight
} from "lucide-react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import PageHeader from "../../components/layout/PageHeader";
import HometaxImportCard from "../../components/money/HometaxImportCard";
import HometaxStatusCard from "../../components/money/HometaxStatusCard";
import RecentTaxRecordsList from "../../components/money/RecentTaxRecordsList";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { getBudgetSummary } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const sum = (items, field = "amount") => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const money = (value) => `${Number(value || 0).toLocaleString()}원`;

const BILL_ICONS = [
  { match: /월세|집세/, icon: HomeIcon },
  { match: /핸드폰|통신/, icon: Smartphone },
  { match: /보험/, icon: ShieldCheck },
  { match: /관리비/, icon: Building2 },
  { match: /세금/, icon: Receipt },
  { match: /집안일|생활/, icon: Sparkles }
];
const billIcon = (title = "") => (BILL_ICONS.find((b) => b.match.test(title))?.icon) || CreditCard;

function downloadCsv(rows, filename) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MoneyPage() {
  const [data, setData] = useState(getAllData());
  const [editor, setEditor] = useState(null);
  const [mode, setMode] = useState("manual"); // manual | csv
  const today = toDateKey(new Date());
  const monthKey = today.slice(0, 7);
  const monthLabel = `${monthKey.slice(0, 4)}년 ${Number(monthKey.slice(5, 7))}월`;
  const expenses = data.expenses || [];
  const payments = data.payments || [];
  const subscriptions = data.subscriptions || [];
  const shoppingItems = data.shoppingItems || [];
  const taxRecords = data.taxRecords || [];

  const monthExpenses = useMemo(() => expenses.filter((item) => (item.date || "").startsWith(monthKey)), [expenses, monthKey]);
  const incomeItems = useMemo(() => payments.filter((item) => (item.expectedDate || item.paidDate || "").startsWith(monthKey)), [payments, monthKey]);
  const upcomingExpenses = useMemo(
    () => monthExpenses.filter((item) => item.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    [monthExpenses, today]
  );

  const budgetSummary = getBudgetSummary(data, today);
  const income = sum(incomeItems);
  const spending = sum(monthExpenses);
  const taxReserve = budgetSummary.taxReserve;
  const saving = income - spending - taxReserve;
  const maxFlow = Math.max(income, spending, Math.abs(saving), taxReserve, 1);

  const refresh = () => setData(getAllData());

  const persist = (next) => {
    saveAllData(next);
    setData(getAllData());
  };

  const upsert = (collection, item) => {
    const next = getAllData();
    const current = next[collection] || [];
    const normalized = { ...item, id: item.id || makeId(collection), updatedAt: today, createdAt: item.createdAt || today };
    next[collection] = item.id ? current.map((entry) => (entry.id === item.id ? normalized : entry)) : [normalized, ...current];
    persist(next);
    setEditor(null);
  };

  const remove = (collection, id) => {
    const next = getAllData();
    next[collection] = (next[collection] || []).filter((item) => item.id !== id);
    persist(next);
    setEditor(null);
  };

  const downloadReport = () => {
    const rows = [["구분", "항목", "금액", "날짜", "분류"]];
    incomeItems.forEach((p) => rows.push(["수입", p.project || p.client || "수입", p.amount, p.expectedDate || p.paidDate, p.category || ""]));
    monthExpenses.forEach((e) => rows.push(["지출", e.title, e.amount, e.date, e.category || ""]));
    downloadCsv(rows, `clover-desk-money-${monthKey}.csv`);
  };

  return (
    <>
      <PageHeader eyebrow="MONEY" title="돈 관리 한눈에 🍀">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-clover-text">{monthLabel}</span>
          <AppButton variant="soft" onClick={downloadReport}>
            <span className="inline-flex items-center gap-1.5"><Download size={15} /> 리포트 다운로드</span>
          </AppButton>
        </div>
      </PageHeader>
      <p className="-mt-3 mb-4 text-sm font-bold text-clover-sub">이번 달 요약</p>

      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setMode("manual")} className={`rounded-full px-4 py-2 text-sm font-bold transition ${mode === "manual" ? "bg-clover-deep text-white" : "bg-white/60 text-clover-sub hover:bg-white"}`}>수동 입력</button>
        <button onClick={() => setMode("csv")} className={`rounded-full px-4 py-2 text-sm font-bold transition ${mode === "csv" ? "bg-clover-deep text-white" : "bg-white/60 text-clover-sub hover:bg-white"}`}>CSV 업로드</button>
        <button disabled className="cursor-not-allowed rounded-full bg-white/40 px-4 py-2 text-sm font-bold text-clover-sub/70">홈택스 연동 준비중</button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <StatCard icon={Wallet} tone="emerald" label="수입" value={income} note="이번 달 수입" />
        <StatCard icon={ArrowDownCircle} tone="rose" label="지출" value={spending} note="이번 달 지출" />
        <StatCard icon={PiggyBank} tone="sky" label="저축 가능" value={saving} note="수입 - 지출" />
        <StatCard icon={Coins} tone="amber" label="세금 저축 10%" value={taxReserve} note={budgetSummary.taxInvoiceIncome > 0 ? "세금계산서 발행 수입 기준" : "수입 기준 추정치"} />
      </div>

      {mode === "csv" && (
        <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <HometaxImportCard onImported={refresh} />
          <div className="grid content-start gap-4">
            <HometaxStatusCard syncStatus={data.hometaxSync} />
            <RecentTaxRecordsList records={taxRecords} />
          </div>
        </div>
      )}

      <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_420px]">
        <GlassCard className="p-5">
          <h2 className="mb-4 text-base font-black">이번 달 자금 흐름</h2>
          <div className="grid gap-4">
            <FlowBar label="수입" value={income} max={maxFlow} color="#3E8F63" />
            <FlowBar label="지출" value={spending} max={maxFlow} color="#F87171" />
            <FlowBar label="저축 가능" value={saving} max={maxFlow} color="#60A5FA" />
            <FlowBar label="세금 저축 (10%)" value={taxReserve} max={maxFlow} color="#F6A83D" />
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3">
            <p className="text-sm font-bold text-clover-deep">
              {saving >= 0 ? "✅ 계획적으로 관리하고 있어요!" : "⚠️ 이번 달은 지출이 수입보다 많아요"}
            </p>
            <a href="#expense-detail" className="inline-flex items-center gap-1 text-xs font-bold text-clover-sub hover:text-clover-deep">
              상세 분석 보기 <ChevronRight size={14} />
            </a>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black">결제 예정</h2>
            <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-clover-sub">예정 금액</span>
          </div>
          <div className="grid gap-1.5">
            {upcomingExpenses.slice(0, 6).map((item) => {
              const Icon = billIcon(item.title);
              return (
                <button key={item.id} onClick={() => setEditor({ type: "expense", item })} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-white/50">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70 text-clover-deep"><Icon size={16} /></span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{item.title}</span>
                  <span className="shrink-0 text-sm font-black text-rose-500">{money(item.amount)}</span>
                  <span className="w-24 shrink-0 text-right text-[11px] font-bold text-clover-sub">{item.date}</span>
                </button>
              );
            })}
            {!upcomingExpenses.length && <p className="rounded-2xl bg-white/45 p-3 text-sm text-clover-sub">이번 달 예정된 결제가 없어요.</p>}
          </div>
          {upcomingExpenses.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-white/60 pt-3">
              <span className="text-sm font-bold text-clover-sub">예정 결제 합계</span>
              <span className="text-base font-black">{money(sum(upcomingExpenses))}</span>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_360px]">
        <ListCard id="expense-detail" title="수입 내역" icon={Wallet} action="+ 수입 추가" onAction={() => setEditor({ type: "payment", item: { category: "유별난", status: "입금 예정", expectedDate: today } })}>
          {incomeItems.slice(0, 5).map((item) => (
            <button key={item.id} onClick={() => setEditor({ type: "payment", item })} className="w-full rounded-2xl bg-white/55 px-4 py-3 text-left text-sm font-bold">
              <div className="flex justify-between gap-3">
                <span className="truncate">{item.project || item.client || "외주 수입"}</span>
                <span className="text-emerald-700">{money(item.amount)}</span>
              </div>
              <p className="mt-1 text-xs font-normal text-clover-sub">{item.client || "클라이언트"} · {item.status || "상태 미정"} · {item.expectedDate || item.paidDate}</p>
            </button>
          ))}
          {!incomeItems.length && <EmptyRow text="이번 달 수입 내역이 없어요." />}
          <MoreLink count={payments.length} label="전체 수입 내역 보기" />
        </ListCard>

        <ListCard title="지출 내역" icon={ArrowDownCircle} action="+ 지출 추가" onAction={() => setEditor({ type: "expense", item: { date: today, category: "식비" } })}>
          {monthExpenses.slice(0, 5).map((item) => (
            <button key={item.id} onClick={() => setEditor({ type: "expense", item })} className="w-full rounded-2xl bg-white/55 px-4 py-3 text-left text-sm font-bold">
              <div className="flex justify-between gap-3">
                <span className="truncate">{item.title}</span>
                <span className="text-rose-600">{money(item.amount)}</span>
              </div>
              <p className="mt-1 text-xs font-normal text-clover-sub">{item.date} · {item.category || "기타"}</p>
            </button>
          ))}
          {!monthExpenses.length && <EmptyRow text="이번 달 지출 내역이 없어요." />}
          <MoreLink count={expenses.length} label="전체 지출 내역 보기" />
        </ListCard>

        <div className="grid content-start gap-4">
          <ListCard title="구독 관리" action="관리하기" onAction={() => setEditor({ type: "subscription", item: { active: true, billingDay: "1", status: "유지" } })}>
            {subscriptions.slice(0, 4).map((item) => (
              <button key={item.id} onClick={() => setEditor({ type: "subscription", item })} className="flex w-full items-center justify-between rounded-2xl bg-white/55 px-4 py-2.5 text-left text-sm font-bold">
                <span className="truncate">{item.title}</span>
                <span className="shrink-0 text-clover-deep">{money(item.amount)} · {item.billingDay}일</span>
              </button>
            ))}
            {!subscriptions.length && <EmptyRow text="등록된 구독이 없어요." />}
          </ListCard>

          <ListCard title="구매 필요 항목" action="관리하기" onAction={() => setEditor({ type: "shopping", item: { importance: 3, category: "생필품" } })}>
            {shoppingItems.filter((item) => !item.completed).slice(0, 4).map((item) => (
              <button key={item.id} onClick={() => setEditor({ type: "shopping", item })} className="w-full rounded-2xl bg-white/55 px-4 py-2.5 text-left text-sm font-bold">
                <div className="flex justify-between gap-3">
                  <span className="truncate">{item.title}</span>
                  <span className="shrink-0 text-amber-600">★ {item.importance || 3}</span>
                </div>
                <p className="mt-0.5 text-xs font-normal text-clover-sub">{item.category || "기타"}{item.amount ? ` · ${money(item.amount)}` : ""}</p>
              </button>
            ))}
            {!shoppingItems.filter((item) => !item.completed).length && <EmptyRow text="구매할 항목이 없어요." />}
          </ListCard>
        </div>
      </div>

      {editor && <MoneyEditor editor={editor} onClose={() => setEditor(null)} onSave={upsert} onDelete={remove} />}
    </>
  );
}

function StatCard({ icon: Icon, label, value, note, tone }) {
  const tones = {
    emerald: { bg: "bg-emerald-50/80 border-emerald-100", ring: "bg-emerald-100 text-emerald-700", value: "text-emerald-700" },
    rose: { bg: "bg-rose-50/80 border-rose-100", ring: "bg-rose-100 text-rose-600", value: "text-rose-600" },
    sky: { bg: "bg-sky-50/80 border-sky-100", ring: "bg-sky-100 text-sky-700", value: "text-sky-700" },
    amber: { bg: "bg-amber-50/80 border-amber-100", ring: "bg-amber-100 text-amber-700", value: "text-amber-700" }
  }[tone];
  return (
    <section className={`glass rounded-[24px] border p-4 ${tones.bg}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tones.ring}`}>
          <Icon size={20} />
        </span>
        <p className="text-sm font-black text-clover-text">{label}</p>
      </div>
      <p className={`mt-3 text-2xl font-black ${tones.value}`}>{money(value)}</p>
      {note && <p className="mt-1 text-[11px] font-bold text-clover-sub">{note}</p>}
    </section>
  );
}

function FlowBar({ label, value, max, color }) {
  const width = Math.max(Math.min((Math.abs(value) / max) * 100, 100), value !== 0 ? 3 : 0);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-bold text-clover-sub">{label}</span>
        <span className="font-black" style={{ color }}>{money(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/60">
        <div className="h-2 rounded-full transition-all" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

function ListCard({ id, title, action, onAction, children }) {
  return (
    <GlassCard id={id} className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-black">{title}</h2>
        {action && (
          <button className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-clover-deep hover:bg-white" onClick={onAction}>
            {action}
          </button>
        )}
      </div>
      <div className="grid gap-2">{children}</div>
    </GlassCard>
  );
}

function EmptyRow({ text }) {
  return <p className="rounded-2xl bg-white/45 p-3 text-sm text-clover-sub">{text}</p>;
}

function MoreLink({ count, label }) {
  if (!count) return null;
  return (
    <button className="mt-1 flex w-full items-center justify-center gap-1 rounded-2xl bg-white/40 py-2 text-xs font-bold text-clover-sub hover:bg-white/60">
      {label} <ChevronRight size={13} />
    </button>
  );
}

function MoneyEditor({ editor, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(editor.item || {});
  const type = editor.type;
  const collection = type === "subscription" ? "subscriptions" : type === "shopping" ? "shoppingItems" : type === "expense" ? "expenses" : "payments";
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-clover-ink/20 px-4 backdrop-blur-sm">
      <section className="glass w-full max-w-xl rounded-[28px] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black">{type === "shopping" ? "구매 항목 편집" : type === "subscription" ? "구독 편집" : type === "expense" ? "지출 편집" : "수입 편집"}</h3>
          <button className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" onClick={onClose}>닫기</button>
        </div>

        <div className="grid gap-3">
          {type === "payment" && (
            <>
              <AppInput value={form.client || ""} onChange={(e) => set("client", e.target.value)} placeholder="클라이언트명" />
              <AppInput value={form.project || ""} onChange={(e) => set("project", e.target.value)} placeholder="프로젝트명" />
              <AppSelect value={form.category || "유별난"} onChange={(e) => set("category", e.target.value)}><option>유별난</option><option>기타</option></AppSelect>
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="총액" />
              <AppSelect value={form.status || "입금 예정"} onChange={(e) => set("status", e.target.value)}><option>입금 예정</option><option>계약금 완료</option><option>잔금 미입금</option><option>입금 완료</option><option>세금계산서 발행</option></AppSelect>
              <AppInput type="date" value={form.expectedDate || ""} onChange={(e) => set("expectedDate", e.target.value)} />
            </>
          )}
          {type === "expense" && (
            <>
              <AppInput value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="지출 항목" />
              <AppSelect value={form.category || "식비"} onChange={(e) => set("category", e.target.value)}><option>식비</option><option>교통비</option><option>업무용</option><option>반복 지출</option><option>특별 지출</option><option>기타</option></AppSelect>
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput type="date" value={form.date || ""} onChange={(e) => set("date", e.target.value)} />
            </>
          )}
          {type === "subscription" && (
            <>
              <AppInput value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="서비스명" />
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput value={form.billingDay || ""} onChange={(e) => set("billingDay", e.target.value)} placeholder="결제일 예: 15" />
              <AppSelect value={form.status || "유지"} onChange={(e) => set("status", e.target.value)}><option>유지</option><option>해지 고민</option><option>해지 예정</option></AppSelect>
            </>
          )}
          {type === "shopping" && (
            <>
              <AppInput value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="항목 이름 *" />
              <AppSelect value={form.importance || 3} onChange={(e) => set("importance", e.target.value)}><option value="1">★ 1</option><option value="2">★ 2</option><option value="3">★ 3</option><option value="4">★ 4</option><option value="5">★ 5</option></AppSelect>
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput value={form.link || ""} onChange={(e) => set("link", e.target.value)} placeholder="링크" />
              <AppTextarea value={form.memo || ""} onChange={(e) => set("memo", e.target.value)} placeholder="메모" />
            </>
          )}
        </div>

        <div className="mt-5 flex justify-between gap-2">
          {form.id ? <button className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600" onClick={() => onDelete(collection, form.id)}>삭제</button> : <span />}
          <AppButton onClick={() => onSave(collection, form)}>저장</AppButton>
        </div>
      </section>
    </div>
  );
}
