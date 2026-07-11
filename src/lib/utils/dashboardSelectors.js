import { addDays, daysBetween, toDateKey } from "./date";

const titleOf = (item) => item.title || item.name || item.project || item.service || "Untitled";
const compact = (item, type, date, meta = {}) => ({ ...item, type, date, displayTitle: titleOf(item), ...meta });
const isImportant = (item) => item?.important || item?.isImportant || item?.priority === "high";
const monthlyRecurringDate = (item, baseDate) => {
  if (!item.dayOfMonth) return "";
  const date = new Date(`${baseDate.slice(0, 8)}01T00:00:00`);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return `${baseDate.slice(0, 8)}${String(Math.min(Number(item.dayOfMonth), last)).padStart(2, "0")}`;
};

export function getIncompleteTodos(data) {
  return [...(data.todos || [])]
    .filter((todo) => !todo.completed)
    .sort((a, b) => {
      const priority = { high: 0, medium: 1, normal: 1, low: 2 };
      return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") || (priority[a.priority] ?? 1) - (priority[b.priority] ?? 1);
    });
}

export function getTodayTodos(data, today = toDateKey()) {
  return getIncompleteTodos(data).filter((todo) => !todo.dueDate || todo.dueDate <= today);
}

export function getOverdueTodos(data, today = toDateKey()) {
  return getIncompleteTodos(data).filter((todo) => todo.dueDate && todo.dueDate < today);
}

export function getTodayItems(data, today = toDateKey()) {
  const items = [];
  (data.events || []).filter((item) => item.date === today).forEach((item) => items.push(compact(item, "event", item.date, { tone: "green", label: "Event" })));
  (data.todos || []).filter((item) => !item.completed && item.dueDate === today).forEach((item) => items.push(compact(item, "todo", item.dueDate, { tone: "red", label: "Todo" })));
  (data.contentPlans || []).filter((item) => item.publishDate === today).forEach((item) => items.push(compact(item, "content", item.publishDate, { tone: "blue", label: "Content" })));
  (data.payments || []).filter((item) => item.expectedDate === today).forEach((item) => items.push(compact(item, "payment", item.expectedDate, { tone: "red", label: "Payment" })));
  (data.expenses || []).filter((item) => item.date === today).forEach((item) => items.push(compact(item, "expense", item.date, { tone: "red", label: "Expense" })));
  (data.subscriptions || []).forEach((item) => {
    const billingDate = item.billingDay ? `${today.slice(0, 8)}${String(item.billingDay).padStart(2, "0")}` : "";
    if (billingDate === today) items.push(compact(item, "subscription", billingDate, { tone: "red", label: "Sub" }));
  });
  (data.recurringEvents || []).forEach((item) => {
    const date = monthlyRecurringDate(item, today);
    if (date === today) items.push(compact(item, "recurring", date, { tone: "blue", label: item.kind || "Repeat" }));
  });
  (data.campaigns || []).forEach((item) => {
    if (item.applyDueDate === today) items.push(compact(item, "campaign", item.applyDueDate, { tone: "mint", label: "Apply" }));
    if (item.uploadDueDate === today) items.push(compact(item, "campaign", item.uploadDueDate, { tone: "mint", label: "Upload" }));
  });
  return items.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
}

export function getUpcomingDeadlines(data, today = toDateKey()) {
  const items = [];
  getIncompleteTodos(data).forEach((item) => item.dueDate && items.push(compact(item, "todo", item.dueDate, { label: "Todo" })));
  (data.events || []).forEach((item) => item.date && items.push(compact(item, "event", item.date, { label: "Event" })));
  (data.contentPlans || []).forEach((item) => item.publishDate && items.push(compact(item, "content", item.publishDate, { label: "Content" })));
  (data.payments || []).filter((item) => item.status !== "입금 완료").forEach((item) => item.expectedDate && items.push(compact(item, "payment", item.expectedDate, { label: "Payment" })));
  (data.campaigns || []).forEach((item) => {
    if (item.applyDueDate) items.push(compact(item, "campaign", item.applyDueDate, { label: "Apply" }));
    if (item.uploadDueDate) items.push(compact(item, "campaign", item.uploadDueDate, { label: "Upload" }));
  });
  (data.subscriptions || []).forEach((item) => item.billingDay && items.push(compact(item, "subscription", `${today.slice(0, 8)}${String(item.billingDay).padStart(2, "0")}`, { label: "Sub" })));
  (data.recurringEvents || []).forEach((item) => {
    const date = monthlyRecurringDate(item, today);
    if (date) items.push(compact(item, "recurring", date, { label: item.kind || "Repeat" }));
  });
  return items
    .filter((item) => item.date >= addDays(today, -30))
    .map((item) => ({ ...item, dday: daysBetween(today, item.date) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12);
}

export function getMonthCalendarItems(data, year, month) {
  const map = {};
  const push = (date, item) => {
    if (!date) return;
    map[date] = [...(map[date] || []), item];
  };
  (data.events || []).forEach((item) => push(item.date, compact(item, "event", item.date, { badge: "E", tone: "green", isImportant: isImportant(item) })));
  (data.todos || []).filter((item) => !item.completed).forEach((item) => push(item.dueDate, compact(item, "todo", item.dueDate, { badge: "T", tone: "red", isImportant: isImportant(item) })));
  (data.contentPlans || []).forEach((item) => push(item.publishDate, compact(item, "content", item.publishDate, { badge: "C", tone: "blue", isImportant: isImportant(item) })));
  (data.payments || []).forEach((item) => push(item.expectedDate, compact(item, "payment", item.expectedDate, { badge: "P", tone: "red", isImportant: true })));
  (data.expenses || []).forEach((item) => push(item.date, compact(item, "expense", item.date, { badge: "E", tone: "red", isImportant: item.category === "특별 지출" })));
  (data.subscriptions || []).forEach((item) => {
    const date = item.billingDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(item.billingDay).padStart(2, "0")}` : "";
    push(date, compact(item, "subscription", date, { badge: "S", tone: "red", isImportant: item.status === "해지 고민" }));
  });
  (data.recurringEvents || []).forEach((item) => {
    if (item.frequency !== "monthly") return;
    const base = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const date = monthlyRecurringDate(item, base);
    push(date, compact(item, "recurring", date, { badge: "R", tone: "blue", isImportant: isImportant(item) }));
  });
  (data.campaigns || []).forEach((item) => {
    push(item.applyDueDate, compact(item, "campaign", item.applyDueDate, { badge: "A", tone: "mint", isImportant: isImportant(item) }));
    push(item.uploadDueDate, compact(item, "campaign", item.uploadDueDate, { badge: "U", tone: "mint", isImportant: isImportant(item) }));
  });
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  Object.keys(map).forEach((key) => {
    if (!key.startsWith(prefix)) delete map[key];
    else {
      map[key] = map[key].sort((a, b) => {
        if (a.isImportant !== b.isImportant) return a.isImportant ? -1 : 1;
        return (a.time || "99:99").localeCompare(b.time || "99:99") || a.displayTitle.localeCompare(b.displayTitle);
      });
    }
  });
  return map;
}

export function getUpcomingPayments(data, today = toDateKey()) {
  return (data.payments || [])
    .filter((item) => item.expectedDate >= today && item.status !== "입금 완료")
    .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
}

export function getWeeklyContentPlans(data, today = toDateKey()) {
  const end = addDays(today, 7);
  return (data.contentPlans || [])
    .filter((item) => item.publishDate >= today && item.publishDate <= end)
    .sort((a, b) => a.publishDate.localeCompare(b.publishDate));
}

// Home "오늘 꼭 해야 할 일 TOP 3" — Work(Tasks)의 todos 원본을 그대로 참조.
// priority:"high" 인 미완료 항목을 우선 노출하고, 3개가 안 채워지면 마감이 가까운 순으로 채운다.
export function getHomeTop3(data) {
  const incomplete = getIncompleteTodos(data);
  const high = incomplete.filter((todo) => todo.priority === "high");
  const rest = incomplete.filter((todo) => todo.priority !== "high");
  return [...high, ...rest].slice(0, 3);
}

const PROJECT_PROGRESS = { 모집중: 25, 진행중: 60, 검수중: 80, 완료: 100, 보류: 10 };

function projectFromCampaign(item, today) {
  const dates = [item.applyDueDate, item.uploadDueDate].filter(Boolean);
  const upcoming = dates.filter((date) => date >= today).sort();
  const dueDate = upcoming[0] || dates.sort().slice(-1)[0] || "";
  const nextAction = !upcoming.length
    ? "마감 지남"
    : upcoming[0] === item.applyDueDate
      ? "모집 마감 처리"
      : "업로드 확인";
  return {
    id: item.id,
    name: item.name,
    status: item.status || "진행중",
    progress: PROJECT_PROGRESS[item.status] ?? 50,
    dueDate,
    dday: dueDate ? daysBetween(today, dueDate) : null,
    nextAction
  };
}

// Home "마감임박 프로젝트" — campaigns(Projects) 중 마감이 가까운 순.
export function getDeadlineProjects(data, today = toDateKey(), limit = 3) {
  return (data.campaigns || [])
    .map((item) => projectFromCampaign(item, today))
    .filter((item) => item.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
}

// Home "프로젝트 진행률" — 진행 중인 프로젝트 3~4개.
export function getProjectsProgress(data, today = toDateKey(), limit = 4) {
  return (data.campaigns || [])
    .filter((item) => item.status !== "완료")
    .map((item) => projectFromCampaign(item, today))
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
    .slice(0, limit);
}

// Home "이번달 예산 요약" — expenses/payments 기반 이번 달 수입·지출 요약.
export function getBudgetSummary(data, today = toDateKey()) {
  const monthKey = today.slice(0, 7);
  const monthExpenses = (data.expenses || []).filter((item) => (item.date || "").startsWith(monthKey));
  const income = (data.payments || [])
    .filter((item) => item.status === "입금 완료" && ((item.paidDate || "").startsWith(monthKey) || (item.expectedDate || "").startsWith(monthKey)))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const byCategory = {};
  monthExpenses.forEach((item) => {
    const key = item.category || "기타";
    byCategory[key] = (byCategory[key] || 0) + Number(item.amount || 0);
  });
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const monthSalesInvoices = (data.taxRecords || []).filter((item) => item.type === "sales" && (item.date || "").startsWith(monthKey));
  const taxInvoiceIncome = monthSalesInvoices.reduce((sum, item) => sum + Number(item.supplyAmount || item.totalAmount || 0), 0);
  const taxReserve = Math.round((taxInvoiceIncome || income) * 0.1);
  return {
    income,
    expense,
    remaining: income - expense,
    usageRate: income > 0 ? Math.min(Math.round((expense / income) * 100), 999) : null,
    topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
    taxInvoiceIncome,
    taxReserve
  };
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function isHabitDueToday(habit, weekday) {
  if (habit.status && habit.status !== "active") return false;
  if (habit.frequencyType === "weekdays") return weekday >= 1 && weekday <= 5;
  if (habit.frequencyType === "custom" && habit.customDays?.length) return habit.customDays.includes(DAY_KEYS[weekday]);
  return true; // daily / weekly_count 등은 매일 노출
}

function habitStreak(habitId, logs, today) {
  let streak = 0;
  let cursor = today;
  const doneDates = new Set(logs.filter((log) => log.habitId === habitId && log.completed).map((log) => log.date));
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// Home "오늘 루틴" — habits/habitLogs 기반 오늘의 루틴 체크 리스트.
export function getTodayRoutines(data, today = toDateKey()) {
  const weekday = new Date(`${today}T00:00:00`).getDay();
  const logs = data.habitLogs || [];
  const items = (data.habits || [])
    .filter((habit) => isHabitDueToday(habit, weekday))
    .map((habit) => {
      const log = logs.find((entry) => entry.habitId === habit.id && entry.date === today);
      return {
        id: habit.id,
        name: habit.name,
        color: habit.color,
        completed: Boolean(log?.completed),
        streak: habitStreak(habit.id, logs, today)
      };
    });
  const doneCount = items.filter((item) => item.completed).length;
  return { items, doneCount, total: items.length, rate: items.length ? Math.round((doneCount / items.length) * 100) : 0 };
}

// Home Work 카드 요약 — 오늘 작업시간 / 진행 중인 업무.
export function getWorkSummary(data, today = toDateKey()) {
  const todaySec = (data.workSessions || [])
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.duration, 0);
  return { todaySec, active: data.activeSession || null };
}

export function getCampaignAlerts(data, today = toDateKey()) {
  return (data.campaigns || [])
    .filter((item) => [item.applyDueDate, item.uploadDueDate].some((date) => date && date >= addDays(today, -1) && date <= addDays(today, 7)))
    .sort((a, b) => (a.applyDueDate || a.uploadDueDate || "").localeCompare(b.applyDueDate || b.uploadDueDate || ""));
}
