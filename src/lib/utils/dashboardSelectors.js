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
  (data.events || []).filter((item) => item.date === today && !item.completed).forEach((item) => items.push(compact(item, "event", item.date, {
    tone: "green",
    label: "Event",
    time: item.allDay ? "" : (item.startTime || item.time || ""),
    startTime: item.allDay ? "" : (item.startTime || item.time || ""),
    endTime: item.allDay ? "" : (item.endTime || ""),
    allDay: Boolean(item.allDay),
    needMove: Boolean(item.needMove),
    priority: item.priority || "normal",
    todayMust: Boolean(item.todayMust)
  })));
  (data.todos || []).filter((item) => !item.completed && (item.dueDate === today || (item.endDate && item.dueDate <= today && today <= item.endDate))).forEach((item) => items.push(compact(item, "todo", item.dueDate, {
    tone: "red",
    label: "Todo",
    time: item.allDay ? "" : (item.dueDate === today ? (item.startTime || item.dueTime || "") : "00:00"),
    startTime: item.allDay ? "" : (item.dueDate === today ? (item.startTime || item.dueTime || "") : "00:00"),
    endTime: item.allDay ? "" : (item.endDate && item.endDate !== today ? "" : (item.endTime || "")),
    spansToNextDay: Boolean(item.endDate && item.endDate !== item.dueDate),
    allDay: Boolean(item.allDay),
    needMove: Boolean(item.needMove),
    priority: item.priority || "normal",
    todayMust: Boolean(item.todayMust)
  })));
  (data.contentPlans || []).filter((item) => item.publishDate === today && !item.completed).forEach((item) => items.push(compact(item, "content", item.publishDate, { tone: "blue", label: "Content" })));
  (data.payments || []).filter((item) => item.expectedDate === today && !item.completed).forEach((item) => items.push(compact(item, "payment", item.expectedDate, { tone: "red", label: "Payment" })));
  (data.expenses || []).filter((item) => item.date === today && !item.completed).forEach((item) => items.push(compact(item, "expense", item.date, { tone: "red", label: "Expense" })));
  (data.subscriptions || []).forEach((item) => {
    const billingDate = item.billingDay ? `${today.slice(0, 8)}${String(item.billingDay).padStart(2, "0")}` : "";
    if (billingDate === today && !item.completed) items.push(compact(item, "subscription", billingDate, { tone: "red", label: "Sub" }));
  });
  (data.recurringEvents || []).forEach((item) => {
    const date = monthlyRecurringDate(item, today);
    if (date === today) items.push(compact(item, "recurring", date, { tone: "blue", label: item.kind || "Repeat" }));
  });
  (data.campaigns || []).forEach((item) => {
    if (!item.completed && item.applyDueDate === today) items.push(compact(item, "campaign", item.applyDueDate, { tone: "mint", label: "Apply" }));
    if (!item.completed && item.uploadDueDate === today) items.push(compact(item, "campaign", item.uploadDueDate, { tone: "mint", label: "Upload" }));
  });
  return items.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
}

export function getUpcomingDeadlines(data, today = toDateKey()) {
  const items = [];
  getIncompleteTodos(data).forEach((item) => item.dueDate && items.push(compact(item, "todo", item.dueDate, { label: "Todo" })));
  (data.events || []).filter((item) => !item.completed).forEach((item) => item.date && items.push(compact(item, "event", item.date, { label: "Event" })));
  (data.contentPlans || []).filter((item) => !item.completed).forEach((item) => item.publishDate && items.push(compact(item, "content", item.publishDate, { label: "Content" })));
  (data.payments || []).filter((item) => !item.completed && item.status !== "입금 완료").forEach((item) => item.expectedDate && items.push(compact(item, "payment", item.expectedDate, { label: "Payment" })));
  (data.campaigns || []).filter((item) => !item.completed).forEach((item) => {
    if (item.applyDueDate) items.push(compact(item, "campaign", item.applyDueDate, { label: "Apply" }));
    if (item.uploadDueDate) items.push(compact(item, "campaign", item.uploadDueDate, { label: "Upload" }));
  });
  (data.subscriptions || []).filter((item) => !item.completed).forEach((item) => item.billingDay && items.push(compact(item, "subscription", `${today.slice(0, 8)}${String(item.billingDay).padStart(2, "0")}`, { label: "Sub" })));
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
  (data.events || []).filter((item) => !item.completed).forEach((item) => push(item.date, compact(item, "event", item.date, {
    badge: "E",
    tone: "green",
    isImportant: isImportant(item),
    time: item.allDay ? "" : (item.startTime || item.time || ""),
    allDay: Boolean(item.allDay),
    needMove: Boolean(item.needMove)
  })));
  (data.todos || []).filter((item) => !item.completed).forEach((item) => {
    push(item.dueDate, compact(item, "todo", item.dueDate, { badge: "T", tone: "red", isImportant: isImportant(item), allDay: Boolean(item.allDay), needMove: Boolean(item.needMove), time: item.allDay ? "" : (item.startTime || item.dueTime || "") }));
    if (item.endDate && item.endDate !== item.dueDate) {
      let cursor = addDays(item.dueDate, 1);
      while (cursor <= item.endDate) {
        push(cursor, compact(item, "todo", cursor, { badge: "T", tone: "red", isImportant: isImportant(item), allDay: Boolean(item.allDay), needMove: Boolean(item.needMove), time: cursor === item.endDate ? item.endTime || "" : "" }));
        cursor = addDays(cursor, 1);
      }
    }
  });
  (data.contentPlans || []).filter((item) => !item.completed).forEach((item) => push(item.publishDate, compact(item, "content", item.publishDate, { badge: "C", tone: "blue", isImportant: isImportant(item) })));
  (data.payments || []).filter((item) => !item.completed).forEach((item) => push(item.expectedDate, compact(item, "payment", item.expectedDate, { badge: "P", tone: "red", isImportant: true })));
  (data.expenses || []).filter((item) => !item.completed).forEach((item) => push(item.date, compact(item, "expense", item.date, { badge: "E", tone: "red", isImportant: item.category === "특별 지출" })));
  (data.subscriptions || []).filter((item) => !item.completed).forEach((item) => {
    const date = item.billingDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(item.billingDay).padStart(2, "0")}` : "";
    push(date, compact(item, "subscription", date, { badge: "S", tone: "red", isImportant: item.status === "해지 고민" }));
  });
  (data.recurringEvents || []).forEach((item) => {
    if (item.frequency !== "monthly") return;
    const base = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const date = monthlyRecurringDate(item, base);
    push(date, compact(item, "recurring", date, { badge: "R", tone: "blue", isImportant: isImportant(item) }));
  });
  (data.campaigns || []).filter((item) => !item.completed).forEach((item) => {
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

export function getCampaignAlerts(data, today = toDateKey()) {
  return (data.campaigns || [])
    .filter((item) => [item.applyDueDate, item.uploadDueDate].some((date) => date && date >= addDays(today, -1) && date <= addDays(today, 7)))
    .sort((a, b) => (a.applyDueDate || a.uploadDueDate || "").localeCompare(b.applyDueDate || b.uploadDueDate || ""));
}
