import { useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const MONEY_PASSWORD = import.meta.env.VITE_MONEY_PASSWORD || "986454";
const sum = (items, field = "amount") => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const money = (value) => `${Number(value || 0).toLocaleString()}원`;

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

export default function MoneyPage() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem("clover-money-unlocked") === "true");
  const [data, setData] = useState(getAllData());
  const [editor, setEditor] = useState(null);
  const [importMessage, setImportMessage] = useState("");

  if (!unlocked) return <MoneyGate onUnlock={() => setUnlocked(true)} />;

  const today = toDateKey(new Date());
  const monthKey = today.slice(0, 7);
  const expenses = data.expenses || [];
  const payments = data.payments || [];
  const subscriptions = data.subscriptions || [];
  const shoppingItems = data.shoppingItems || [];
  const monthExpenses = expenses.filter((item) => (item.date || "").startsWith(monthKey));
  const incomeItems = payments.filter((item) => (item.expectedDate || item.paidDate || "").startsWith(monthKey));
  const invoiceIncome = incomeItems.filter((item) => item.status === "세금계산서 발행" || item.source === "hometax-sales");
  const income = sum(incomeItems);
  const spending = sum(monthExpenses);
  const taxReserve = Math.round(sum(invoiceIncome.length ? invoiceIncome : incomeItems) * 0.1);
  const saving = Math.max(0, income - spending - taxReserve);

  const calendarDays = useMemo(() => {
    const start = new Date(`${monthKey}-01T00:00:00`);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    return Array.from({ length: end }, (_, index) => `${monthKey}-${String(index + 1).padStart(2, "0")}`);
  }, [monthKey]);

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
    next[collection] = (next[collection] || []).filter((item) => item.id !== id);
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
    setUnlocked(false);
  };

  return (
    <>
      <PageHeader eyebrow="Money" title="돈관리 현황">
        <AppButton variant="soft" onClick={lock}>잠그기</AppButton>
      </PageHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <MoneyStat label="수입" value={income} tone="emerald" />
        <MoneyStat label="지출" value={spending} tone="rose" />
        <MoneyStat label="저축 가능" value={saving} tone="sky" />
        <MoneyStat label="세금 저축 10%" value={taxReserve} tone="amber" note="세금계산서 발행 수입 기준" />
      </div>

      <GlassCard className="mb-4">
        <SectionTitle>CSV 업로드</SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          <CsvButton label="매출 CSV" onFile={(file) => importCsv(file, "income")} />
          <CsvButton label="매입 CSV" onFile={(file) => importCsv(file, "expense")} />
          <CsvButton label="세금계산서 CSV" onFile={(file) => importCsv(file, "tax")} />
        </div>
        {importMessage && <p className="mt-3 rounded-2xl bg-white/55 p-3 text-sm font-bold text-clover-deep">{importMessage}</p>}
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          <MoneySection title="수입 관리" action="+ 수입" onAction={() => setEditor({ type: "payment", item: { category: "자유소득", status: "입금 예정", expectedDate: today } })}>
            {payments.slice(0, 8).map((item) => (
              <button key={item.id} onClick={() => setEditor({ type: "payment", item })} className="rounded-2xl bg-white/55 px-4 py-3 text-left text-sm font-bold">
                <div className="flex justify-between gap-3">
                  <span className="truncate">{item.project || item.client || "수입"}</span>
                  <span className="text-emerald-700">{money(item.amount)}</span>
                </div>
                <p className="mt-1 text-xs text-clover-sub">{item.client || "거래처 미입력"} · {item.category || "기타"} · {item.status || "상태 미정"}</p>
              </button>
            ))}
          </MoneySection>

          <MoneySection title="지출 관리" action="+ 지출" onAction={() => setEditor({ type: "expense", item: { date: today, category: "생활비" } })}>
            {expenses.slice(0, 8).map((item) => (
              <button key={item.id} onClick={() => setEditor({ type: "expense", item })} className="rounded-2xl bg-white/55 px-4 py-3 text-left text-sm font-bold">
                <div className="flex justify-between gap-3">
                  <span className="truncate">{item.title}</span>
                  <span className="text-rose-700">{money(item.amount)}</span>
                </div>
                <p className="mt-1 text-xs text-clover-sub">{item.date} · {item.category || "기타"}</p>
              </button>
            ))}
          </MoneySection>

          <GlassCard>
            <SectionTitle>지출 캘린더</SectionTitle>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((date) => {
                const incomeOfDay = payments.filter((item) => (item.expectedDate || item.paidDate) === date);
                const expenseOfDay = expenses.filter((item) => item.date === date);
                const value = sum(incomeOfDay) - sum(expenseOfDay);
                return (
                  <div key={date} className={`min-h-16 rounded-2xl p-2 text-xs font-bold ${value > 0 ? "bg-emerald-50 text-emerald-700" : value < 0 ? "bg-rose-50 text-rose-700" : "bg-white/45 text-clover-sub"}`}>
                    <p>{Number(date.slice(-2))}</p>
                    {value !== 0 && <p className="mt-2 truncate">{money(Math.abs(value))}</p>}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        <div className="grid content-start gap-4">
          <MoneySection title="구독 관리" action="+ 구독" onAction={() => setEditor({ type: "subscription", item: { active: true, billingDay: "1", status: "유지" } })}>
            {subscriptions.slice(0, 8).map((item) => (
              <button key={item.id} onClick={() => setEditor({ type: "subscription", item })} className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-left text-sm font-bold">
                <span>{item.title}</span>
                <span className="text-clover-deep">{money(item.amount)} · {item.billingDay}일</span>
              </button>
            ))}
          </MoneySection>

          <MoneySection title="구매 필요 항목" action="+ 구매 항목" onAction={() => setEditor({ type: "shopping", item: { importance: 3, category: "생활" } })}>
            {shoppingItems.filter((item) => !item.completed).slice(0, 8).map((item) => (
              <button key={item.id} onClick={() => setEditor({ type: "shopping", item })} className="rounded-2xl bg-white/55 px-4 py-3 text-left text-sm font-bold">
                <div className="flex justify-between gap-3">
                  <span>{item.title}</span>
                  <span className="text-amber-600">중요 {item.importance || 3}</span>
                </div>
                <p className="mt-1 text-xs text-clover-sub">{item.category || "기타"} · {money(item.amount)}</p>
              </button>
            ))}
          </MoneySection>
        </div>
      </div>

      {editor && <MoneyEditor editor={editor} onClose={() => setEditor(null)} onSave={upsert} onDelete={remove} />}
    </>
  );
}

function CsvButton({ label, onFile }) {
  return (
    <label className="cursor-pointer rounded-2xl bg-white/55 px-4 py-3 text-center text-sm font-black text-clover-deep hover:bg-white/80">
      {label}
      <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
    </label>
  );
}

function MoneyStat({ label, value, tone, note }) {
  const colors = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
    sky: "bg-sky-50 border-sky-100 text-sky-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700"
  };
  return (
    <section className={`glass rounded-[22px] border p-4 ${colors[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-2 text-2xl font-black">{money(value)}</p>
      {note && <p className="mt-1 text-[11px] font-bold opacity-75">{note}</p>}
    </section>
  );
}

function MoneySection({ title, action, onAction, children }) {
  return (
    <GlassCard>
      <SectionTitle action={<button className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep" onClick={onAction}>{action}</button>}>{title}</SectionTitle>
      <div className="grid gap-2">{children}</div>
    </GlassCard>
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
              <AppSelect value={form.category || "생활비"} onChange={(e) => set("category", e.target.value)}><option>생활비</option><option>교통비</option><option>업무비</option><option>반복 지출</option><option>월별 지출</option><option>개별 지출</option><option>기타</option></AppSelect>
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
              <AppSelect value={form.importance || 3} onChange={(e) => set("importance", e.target.value)}><option value="1">중요도 1</option><option value="2">중요도 2</option><option value="3">중요도 3</option><option value="4">중요도 4</option><option value="5">중요도 5</option></AppSelect>
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
