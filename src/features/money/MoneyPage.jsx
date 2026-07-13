import { useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StarRating from "../../components/common/StarRating";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, moveToTrash, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";
import { shoppingCategories } from "../../lib/utils/shoppingConstants";

const MONEY_PASSWORD = import.meta.env.VITE_MONEY_PASSWORD || "986454";
const sum = (items, field = "amount") => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const money = (value) => `${Number(value || 0).toLocaleString()}원`;
const weekdayLabel = (dateKey) => ["일", "월", "화", "수", "목", "금", "토"][new Date(`${dateKey}T00:00:00`).getDay()];

const PIE_COLORS = ["#FB7185", "#F6A845", "#FBCF4A", "#8DDFA8", "#6DCBD6", "#8FA6F0", "#C39BE8", "#F0A6C8"];

function MoneyGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (password === MONEY_PASSWORD) {
      sessionStorage.setItem("clover-money-unlocked", "true");
      onUnlock();
    } else {
      setError("비밀번호가 맞지 않아요.");
    }
  };
  return (
    <>
      <PageHeader eyebrow="Money" title="돈관리 잠금" />
      <GlassCard className="mx-auto max-w-md">
        <SectionTitle>비밀번호 입력</SectionTitle>
        <p className="mb-4 text-sm font-bold text-clover-sub">금액 정보는 한 번 더 확인한 뒤 열리게 했어요.</p>
        <div className="grid gap-3">
          <AppInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="비밀번호" autoFocus />
          {error && <p className="text-sm font-bold text-red-500">{error}</p>}
          <AppButton onClick={submit}>Money 열기</AppButton>
        </div>
      </GlassCard>
    </>
  );
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const [headerLine, ...rows] = lines;
  if (!headerLine) return [];
  const headers = headerLine.split(",").map((item) => item.trim());
  return rows.map((line) => {
    const values = line.split(",").map((item) => item.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function pick(row, keys) {
  const found = keys.find((key) => row[key] !== undefined && row[key] !== "");
  return found ? row[found] : "";
}

// ── Small presentational pieces ──

function CsvButton({ label, onFile }) {
  return (
    <label className="cursor-pointer rounded-full bg-white/70 px-3 py-1.5 text-xs font-black text-clover-deep hover:bg-white" title={`${label} 가져오기`}>
      {label}
      <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
    </label>
  );
}

function MoneySummaryCards({ income, spending, subscriptionTotal, variableTotal }) {
  const cards = [
    { label: "총 수입", value: income, tone: "emerald", icon: "↗", iconBg: "bg-emerald-500/15" },
    { label: "총 지출", value: spending, tone: "rose", icon: "↓", iconBg: "bg-rose-500/15" },
    { label: "정기지출", value: subscriptionTotal, tone: "blue", icon: "▣", iconBg: "bg-blue-500/15" },
    { label: "변동지출", value: variableTotal, tone: "amber", icon: "⌁", iconBg: "bg-amber-500/15" }
  ];
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50/55 text-emerald-700",
    rose: "border-rose-200 bg-rose-50/55 text-rose-600",
    blue: "border-blue-200 bg-blue-50/55 text-blue-700",
    amber: "border-amber-200 bg-amber-50/55 text-amber-700"
  };

  return (
    <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`flex items-center gap-4 rounded-[8px] border px-5 py-4 shadow-sm ${tones[card.tone]}`}>
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl font-black ${card.iconBg}`}>{card.icon}</span>
          <div>
            <p className="text-xs font-black text-clover-sub">{card.label}</p>
            <p className="mt-1 text-2xl font-black">{money(card.value)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaxSavingsBanner({ taxReserve, saving }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-4 rounded-[8px] border border-clover-line bg-white/70 p-4 shadow-sm">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-lg">▤</span>
        <div>
          <p className="text-sm font-black text-clover-sub">세금 저축 10%</p>
          <p className="mt-1 text-2xl font-black text-clover-deep">{money(taxReserve)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-[8px] border border-clover-line bg-white/70 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-lg">♣</span>
          <div>
            <p className="text-sm font-black text-clover-sub">저축 가능액</p>
            <p className="mt-1 text-2xl font-black text-clover-deep">{money(saving)}</p>
          </div>
        </div>
        <span className="text-xl text-clover-sub">›</span>
      </div>
    </div>
  );
}

function CategoryPie({ segments, total }) {
  if (!total) {
    return (
      <GlassCard className="rounded-[8px] border border-clover-line bg-white/70">
        <SectionTitle>카테고리별 지출</SectionTitle>
        <p className="rounded-2xl bg-white/45 p-6 text-center text-sm font-bold text-clover-sub">이번 달 지출 기록이 아직 없어요.</p>
      </GlassCard>
    );
  }

  const stops = segments.map((segment, index) => {
    const pct = (segment.value / total) * 100;
    return { ...segment, pct, color: PIE_COLORS[index % PIE_COLORS.length] };
  });

  return (
    <GlassCard className="rounded-[8px] border border-clover-line bg-white/70">
      <SectionTitle action={<button className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-clover-sub">전체 보기</button>}>카테고리별 지출</SectionTitle>
      <div className="grid gap-4">
        {stops.slice(0, 5).map((s) => (
          <div key={s.name} className="grid gap-2">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>{s.name}</span>
              <span className="text-clover-sub">{s.pct.toFixed(1)}% <b className="ml-3 text-clover-text">{money(s.value)}</b></span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-clover-deep" style={{ width: `${Math.max(3, s.pct)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function DailyLedger({ monthKey, onShiftMonth, expenses, incomeItems, income, spending, onOpenExpense, onOpenIncome }) {
  const byDate = useMemo(() => {
    const map = new Map();
    const push = (dateKey, entry) => {
      if (!dateKey) return;
      if (!map.has(dateKey)) map.set(dateKey, { date: dateKey, income: [], expense: [] });
      map.get(dateKey)[entry.kind].push(entry);
    };
    expenses.forEach((item) => push(item.date, { kind: "expense", ...item }));
    incomeItems.forEach((item) => push(item.expectedDate || item.paidDate, { kind: "income", ...item }));
    return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, incomeItems]);

  const [year, month] = monthKey.split("-");

  return (
    <GlassCard className="rounded-[8px] border border-clover-line bg-white/70">
      <div className="flex items-center justify-between gap-3">
        <button className="grid h-9 w-9 place-items-center rounded-[8px] border border-clover-line bg-white text-lg font-black text-clover-sub" onClick={() => onShiftMonth(-1)}>‹</button>
        <SectionTitle>{year}년 {Number(month)}월 가계부</SectionTitle>
        <button className="grid h-9 w-9 place-items-center rounded-[8px] border border-clover-line bg-white text-lg font-black text-clover-sub" onClick={() => onShiftMonth(1)}>›</button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 border-y border-clover-line bg-white/25 py-3 text-center">
        <div className="border-r border-clover-line">
          <p className="text-xs font-black text-clover-sub">수입</p>
          <p className="mt-1 font-black text-sky-600">{money(income)}</p>
        </div>
        <div className="border-r border-clover-line">
          <p className="text-xs font-black text-clover-sub">지출</p>
          <p className="mt-1 font-black text-rose-600">{money(spending)}</p>
        </div>
        <div>
          <p className="text-xs font-black text-clover-sub">합계</p>
          <p className={`mt-1 font-black ${income - spending >= 0 ? "text-clover-deep" : "text-rose-600"}`}>{money(income - spending)}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {byDate.map((day) => {
          const dayIncome = sum(day.income);
          const dayExpense = sum(day.expense);
          return (
            <div key={day.date} className="rounded-[8px] border border-clover-line bg-white/50 p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-black">
                  {Number(day.date.slice(-2))}
                  <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-clover-sub">{weekdayLabel(day.date)}요일</span>
                </p>
                <p className="text-sm font-black">
                  {!!dayIncome && <span className="text-sky-600">{money(dayIncome)}</span>}
                  {!!dayIncome && !!dayExpense && <span className="mx-1 text-clover-sub">·</span>}
                  {!!dayExpense && <span className="text-rose-600">{money(dayExpense)}</span>}
                </p>
              </div>
              <div className="mt-2 grid gap-1.5">
                {day.income.map((item) => (
                  <button key={item.id} onClick={() => onOpenIncome(item)} className="flex items-center justify-between gap-3 rounded-[6px] border-b border-clover-line/60 bg-white/70 px-3 py-2 text-left text-sm">
                    <span className="min-w-0 truncate"><span className="mr-2 rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{item.category || "수입"}</span>{item.project || item.client || "수입"}</span>
                    <span className="shrink-0 font-black text-sky-600">{money(item.amount)}</span>
                  </button>
                ))}
                {day.expense.map((item) => (
                  <button key={item.id} onClick={() => onOpenExpense(item)} className="flex items-center justify-between gap-3 rounded-[6px] border-b border-clover-line/60 bg-white/70 px-3 py-2 text-left text-sm">
                    <span className="min-w-0 truncate"><span className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-clover-sub">{item.category || "기타"}</span>{item.title}</span>
                    <span className="shrink-0 font-black text-rose-600">{money(item.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {!byDate.length && <p className="rounded-2xl bg-white/45 p-6 text-center text-sm font-bold text-clover-sub">이번 달 기록이 아직 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function MoneySection({ title, action, onAction, children }) {
  return (
    <GlassCard className="rounded-[8px] border border-clover-line bg-white/70">
      <SectionTitle action={<button className="rounded-[8px] border border-clover-line bg-white px-3 py-1.5 text-xs font-black text-clover-deep" onClick={onAction}>{action}</button>}>{title}</SectionTitle>
      <div className="grid gap-2">{children}</div>
    </GlassCard>
  );
}

function GapYearFloatingNotice({ expenses, onOpenExpense, onDismiss }) {
  const target = expenses.find((item) => item.gapYearUploadRequired && !item.gapYearRegistered);
  if (!target) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-40 w-[min(92vw,520px)] -translate-x-1/2 rounded-[8px] border border-clover-line bg-white/95 p-3 shadow-[0_16px_40px_rgba(34,50,42,0.16)] backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-clover-text">갭이어 예산 올리기</p>
          <p className="truncate text-xs font-bold text-clover-sub">{target.title} · 아직 완료되지 않았어요.</p>
        </div>
        <button type="button" onClick={() => onOpenExpense(target)} className="rounded-[8px] bg-clover-deep px-3 py-2 text-xs font-black text-white">이동</button>
        <button type="button" onClick={onDismiss} className="rounded-[8px] bg-slate-100 px-3 py-2 text-xs font-black text-clover-sub">나중에</button>
        <button type="button" onClick={onDismiss} className="grid h-8 w-8 place-items-center rounded-full text-lg font-black text-clover-sub">×</button>
      </div>
    </div>
  );
}

export default function MoneyPage() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem("clover-money-unlocked") === "true");
  if (!unlocked) return <MoneyGate onUnlock={() => setUnlocked(true)} />;
  return <MoneyPageContent onLock={() => setUnlocked(false)} />;
}

function MoneyPageContent({ onLock }) {
  const [data, setData] = useState(getAllData());
  const [editor, setEditor] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [hideGapYearNotice, setHideGapYearNotice] = useState(false);

  const today = toDateKey(new Date());
  const monthDate = new Date();
  monthDate.setMonth(monthDate.getMonth() + monthOffset);
  const monthKey = toDateKey(monthDate).slice(0, 7);

  const expenses = data.expenses || [];
  const payments = data.payments || [];
  const subscriptions = data.subscriptions || [];
  const shoppingItems = data.shoppingItems || [];
  const savings = data.savings || [];

  const monthExpenses = expenses.filter((item) => (item.date || "").startsWith(monthKey));
  const incomeItems = payments.filter((item) => (item.expectedDate || item.paidDate || "").startsWith(monthKey));
  const invoiceIncome = incomeItems.filter((item) => item.status === "세금계산서 발행" || item.source === "hometax-sales");
  const income = sum(incomeItems);
  const spending = sum(monthExpenses);
  const taxReserve = Math.round(sum(invoiceIncome.length ? invoiceIncome : incomeItems) * 0.1);
  const saving = Math.max(0, income - spending - taxReserve);
  const subscriptionTotal = sum(subscriptions.filter((item) => item.active !== false));
  const variableExpenses = monthExpenses.filter((item) => !subscriptions.some((sub) => sub.title === item.title));
  const variableTotal = sum(variableExpenses);

  const categorySegments = useMemo(() => {
    const totals = {};
    monthExpenses.forEach((item) => {
      const key = item.category || "기타";
      totals[key] = (totals[key] || 0) + Number(item.amount || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

  const persist = (next) => {
    saveAllData(next);
    setData(getAllData());
  };

  const upsert = (collection, item) => {
    const next = getAllData();
    const current = next[collection] || [];
    const normalized = { ...item, id: item.id || makeId(collection), updatedAt: today, createdAt: item.createdAt || today };
    next[collection] = item.id ? current.map((entry) => entry.id === item.id ? normalized : entry) : [normalized, ...current];
    persist(next);
    setEditor(null);
  };

  const remove = (collection, id) => {
    const next = getAllData();
    moveToTrash(next, collection, id);
    persist(next);
    setEditor(null);
  };

  const importCsv = (file, mode) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result || ""));
      const next = getAllData();
      const imported = rows.map((row) => {
        const date = pick(row, ["날짜", "작성일자", "거래일자", "date"]) || today;
        const vendor = pick(row, ["거래처", "상호", "공급자", "client", "vendor"]);
        const amount = Number(String(pick(row, ["합계금액", "총액", "금액", "amount"])).replace(/[^0-9.-]/g, "")) || 0;
        const invoiceId = pick(row, ["승인번호", "invoiceId", "id"]);
        return mode === "expense"
          ? { id: invoiceId || makeId("expense"), title: vendor || "CSV 지출", amount, date, category: "CSV 업로드", source: "csv", invoiceId, createdAt: today, updatedAt: today }
          : { id: invoiceId || makeId("payment"), project: vendor || "CSV 수입", client: vendor, amount, expectedDate: date, category: "CSV 업로드", status: mode === "tax" ? "세금계산서 발행" : "입금 예정", source: mode === "tax" ? "hometax-sales" : "csv", invoiceId, createdAt: today, updatedAt: today };
      });
      const collection = mode === "expense" ? "expenses" : "payments";
      const existingKeys = new Set((next[collection] || []).map((item) => item.invoiceId || `${item.date || item.expectedDate}-${item.client || item.title}-${item.amount}`));
      const fresh = imported.filter((item) => {
        const key = item.invoiceId || `${item.date || item.expectedDate}-${item.client || item.title}-${item.amount}`;
        return !existingKeys.has(key);
      });
      next[collection] = [...fresh, ...(next[collection] || [])];
      persist(next);
      setImportMessage(`${fresh.length}건을 가져왔어요. 중복으로 보이는 항목은 제외했어요.`);
    };
    reader.readAsText(file, "utf-8");
  };

  const lock = () => {
    sessionStorage.removeItem("clover-money-unlocked");
    onLock();
  };

  return (
    <>
      <PageHeader eyebrow="Money" title="돈관리 현황">
        <div className="flex flex-wrap items-center gap-2">
          <CsvButton label="매출 CSV" onFile={(file) => importCsv(file, "income")} />
          <CsvButton label="매입 CSV" onFile={(file) => importCsv(file, "expense")} />
          <CsvButton label="세금계산서 CSV" onFile={(file) => importCsv(file, "tax")} />
          <AppButton variant="soft" onClick={lock}>잠그기</AppButton>
        </div>
      </PageHeader>

      {importMessage && <p className="mb-4 rounded-2xl bg-white/70 p-3 text-sm font-bold text-clover-deep">{importMessage}</p>}

      <MoneySummaryCards income={income} spending={spending} subscriptionTotal={subscriptionTotal} variableTotal={variableTotal} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <DailyLedger
          monthKey={monthKey}
          onShiftMonth={(delta) => setMonthOffset((value) => value + delta)}
          expenses={monthExpenses}
          incomeItems={incomeItems}
          income={income}
          spending={spending}
          onOpenExpense={(item) => setEditor({ type: "expense", item })}
          onOpenIncome={(item) => setEditor({ type: "payment", item })}
        />

        <div className="grid content-start gap-4">
          <TaxSavingsBanner taxReserve={taxReserve} saving={saving} />

          <CategoryPie segments={categorySegments} total={spending} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <MoneySection title="구독·결제 관리" action="+ 구독" onAction={() => setEditor({ type: "subscription", item: { active: true, billingDay: "1", status: "유지" } })}>
          {subscriptions.slice(0, 3).map((item) => (
            <button key={item.id} onClick={() => setEditor({ type: "subscription", item })} className="flex items-center justify-between rounded-[8px] bg-white/55 px-4 py-3 text-left text-sm font-bold">
              <span className="min-w-0 truncate">{item.title}</span>
              <span className="shrink-0 text-clover-deep">{money(item.amount)} · {item.billingDay}일</span>
            </button>
          ))}
          {!subscriptions.length && <p className="rounded-[8px] bg-white/40 p-4 text-sm font-bold text-clover-sub">등록된 구독이 없어요.</p>}
        </MoneySection>

        <MoneySection title="구매 필요 항목" action="+ 구매 항목" onAction={() => setEditor({ type: "shopping", item: { importance: 3, category: shoppingCategories[0] } })}>
          {shoppingItems.filter((item) => !item.completed).slice(0, 3).map((item) => (
            <button key={item.id} onClick={() => setEditor({ type: "shopping", item })} className="rounded-[8px] bg-white/55 px-4 py-3 text-left text-sm font-bold">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate">{item.title}</span>
                {!!item.amount && <span className="shrink-0 text-clover-sub">{money(item.amount)}</span>}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{item.category || "기타"}</span>
                <StarRating value={item.importance || 0} onChange={() => {}} size="text-xs" />
              </div>
            </button>
          ))}
          {!shoppingItems.filter((item) => !item.completed).length && <p className="rounded-[8px] bg-white/40 p-4 text-sm font-bold text-clover-sub">구매할 항목을 추가해보세요.</p>}
        </MoneySection>

        <MoneySection title="저축" action="+ 저축" onAction={() => setEditor({ type: "saving", item: { date: today } })}>
          {savings.slice(0, 3).map((item) => (
            <button key={item.id} onClick={() => setEditor({ type: "saving", item })} className="flex items-center justify-between rounded-[8px] bg-white/55 px-4 py-3 text-left text-sm font-bold">
              <span className="min-w-0 truncate">{item.title || "저축"}</span>
              <span className="shrink-0 text-emerald-700">{money(item.amount)}</span>
            </button>
          ))}
          {!savings.length && <p className="rounded-[8px] bg-white/40 p-4 text-sm font-bold text-clover-sub">저축 기록을 추가해보세요.</p>}
          {!!savings.length && <p className="rounded-[8px] bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">누적 저축 {money(sum(savings))}</p>}
        </MoneySection>
      </div>

      {!hideGapYearNotice && (
        <GapYearFloatingNotice
          expenses={monthExpenses}
          onOpenExpense={(item) => setEditor({ type: "expense", item })}
          onDismiss={() => setHideGapYearNotice(true)}
        />
      )}

      {editor && <MoneyEditor editor={editor} onClose={() => setEditor(null)} onSave={upsert} onDelete={remove} />}
    </>
  );
}

function MoneyEditor({ editor, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(editor.item || {});
  const type = editor.type;
  const collection = type === "subscription" ? "subscriptions" : type === "shopping" ? "shoppingItems" : type === "saving" ? "savings" : type === "expense" ? "expenses" : "payments";
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-clover-ink/20 px-4 backdrop-blur-sm">
      <section className="glass w-full max-w-xl rounded-[28px] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black">{type === "shopping" ? "구매 항목 편집" : type === "subscription" ? "구독 편집" : type === "saving" ? "저축 편집" : type === "expense" ? "지출 편집" : "수입 편집"}</h3>
          <button className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" onClick={onClose}>닫기</button>
        </div>

        <div className="grid gap-3">
          {type === "payment" && (
            <>
              <AppInput value={form.client || ""} onChange={(e) => set("client", e.target.value)} placeholder="거래처명" />
              <AppInput value={form.project || ""} onChange={(e) => set("project", e.target.value)} placeholder="프로젝트명" />
              <AppSelect value={form.category || "자유소득"} onChange={(e) => set("category", e.target.value)}><option>자유소득</option><option>급여</option><option>기타</option></AppSelect>
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="총액" />
              <AppSelect value={form.status || "입금 예정"} onChange={(e) => set("status", e.target.value)}><option>입금 예정</option><option>계약금 완료</option><option>잔금 미입금</option><option>입금 완료</option><option>세금계산서 발행</option></AppSelect>
              <AppInput type="date" value={form.expectedDate || ""} onChange={(e) => set("expectedDate", e.target.value)} />
            </>
          )}
          {type === "expense" && (
            <>
              <AppInput value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="지출 항목" />
              <AppSelect value={form.category || "생활비"} onChange={(e) => set("category", e.target.value)}><option>생활비</option><option>교통비</option><option>업무비</option><option>식비</option><option>반복 지출</option><option>월별 지출</option><option>개별 지출</option><option>기타</option></AppSelect>
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput type="date" value={form.date || ""} onChange={(e) => set("date", e.target.value)} />
              <label className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3 text-sm font-bold text-rose-700">
                갭이어 업로드 필요
                <input
                  type="checkbox"
                  checked={Boolean(form.gapYearUploadRequired || form.gapYearRegistered)}
                  onChange={(e) => {
                    set("gapYearUploadRequired", e.target.checked);
                    if (!e.target.checked) set("gapYearRegistered", false);
                  }}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm font-bold text-emerald-700">
                갭이어 업로드 완료
                <input
                  type="checkbox"
                  checked={Boolean(form.gapYearRegistered)}
                  onChange={(e) => {
                    set("gapYearRegistered", e.target.checked);
                    if (e.target.checked) set("gapYearUploadRequired", true);
                  }}
                />
              </label>
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
              <AppSelect value={form.category || shoppingCategories[0]} onChange={(e) => set("category", e.target.value)}>{shoppingCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</AppSelect>
              <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2">
                <span className="text-xs font-bold text-clover-sub">중요도</span>
                <StarRating value={form.importance || 0} onChange={(value) => set("importance", value)} />
              </div>
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput value={form.link || ""} onChange={(e) => set("link", e.target.value)} placeholder="링크" />
              <AppTextarea value={form.memo || ""} onChange={(e) => set("memo", e.target.value)} placeholder="메모" />
              <label className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold">
                구매 완료
                <input type="checkbox" checked={Boolean(form.completed)} onChange={(e) => set("completed", e.target.checked)} />
              </label>
            </>
          )}
          {type === "saving" && (
            <>
              <AppInput value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="저축 이름 (예: 비상금, 여행자금)" />
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput type="date" value={form.date || ""} onChange={(e) => set("date", e.target.value)} />
              <AppTextarea value={form.memo || ""} onChange={(e) => set("memo", e.target.value)} placeholder="메모 (선택)" />
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
