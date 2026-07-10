import { initialData, collections } from "./initialData";
import { STORAGE_KEYS } from "./storageKeys";

const clone = (value) => JSON.parse(JSON.stringify(value));
const today = () => new Date().toISOString().slice(0, 10);
const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalize = (data) => {
  const next = { ...clone(initialData), ...(data || {}) };
  collections.forEach((key) => {
    if (!Array.isArray(next[key])) next[key] = [];
  });
  next.activeSession = data && Object.prototype.hasOwnProperty.call(data, "activeSession") ? data.activeSession : null;
  next.weeklyGoalHours = Number(data?.weeklyGoalHours ?? initialData.weeklyGoalHours ?? 40);
  next.todos = next.todos.map((todo, index) => ({
    isPriority: false,
    priorityOrder: index,
    ...todo
  }));
  next.workCategories = next.workCategories.length ? next.workCategories : clone(initialData.workCategories);
  next.habits = next.habits.map((habit) => ({
    id: habit.id,
    name: habit.name || habit.title || "New habit",
    icon: habit.icon || "CL",
    color: habit.color || "#8DDFA8",
    frequencyType: habit.frequencyType || (habit.cycle === "매주" ? "weekly_count" : "daily"),
    targetCount: Number(habit.targetCount || 7),
    customDays: Array.isArray(habit.customDays) ? habit.customDays : [],
    reminderTime: habit.reminderTime || "",
    memo: habit.memo || "",
    status: habit.status || "active",
    createdAt: habit.createdAt || today(),
    updatedAt: habit.updatedAt || today()
  }));
  next.habitLogs = next.habitLogs
    .filter((log) => log && log.habitId && log.date)
    .map((log) => ({
      id: log.id,
      habitId: log.habitId,
      date: log.date,
      completed: Boolean(log.completed),
      createdAt: log.createdAt || today(),
      updatedAt: log.updatedAt || today()
    }));
  return next;
};

export function getAllData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.appData);
    if (!raw) {
      saveAllData(initialData);
      return clone(initialData);
    }
    return normalize(JSON.parse(raw));
  } catch {
    return clone(initialData);
  }
}

export function saveAllData(data) {
  localStorage.setItem(STORAGE_KEYS.appData, JSON.stringify(normalize(data)));
  window.dispatchEvent(new Event("clover-data-change"));
}

export function resetAllData() {
  saveAllData(initialData);
}

function list(collection) {
  return getAllData()[collection] || [];
}

function create(collection, payload) {
  const data = getAllData();
  const date = today();
  const item = { id: makeId(collection), createdAt: date, updatedAt: date, ...payload };
  data[collection] = [item, ...(data[collection] || [])];
  saveAllData(data);
  return item;
}

function update(collection, id, updates) {
  const data = getAllData();
  data[collection] = (data[collection] || []).map((item) =>
    item.id === id ? { ...item, ...updates, updatedAt: today() } : item
  );
  saveAllData(data);
}

function remove(collection, id) {
  const data = getAllData();
  data[collection] = (data[collection] || []).filter((item) => item.id !== id);
  saveAllData(data);
}

const api = { getAllData, saveAllData, resetAllData };

const names = {
  todos: "Todo", top3: "Top3", delayedTasks: "DelayedTask", habits: "Habit",
  events: "Event", timelineEntries: "TimelineEntry", chores: "Chore",
  shoppingItems: "ShoppingItem", payments: "Payment", campaigns: "Campaign",
  campaignParticipants: "CampaignParticipant", contentPlans: "ContentPlan",
  importantFiles: "ImportantFile", goals: "Goal", gratitudeEntries: "GratitudeEntry",
  questionPrompts: "QuestionPrompt", questionAnswers: "QuestionAnswer",
  timeSessions: "TimeSession", recurringEvents: "RecurringEvent", beautyItems: "BeautyItem",
  digitalCareLogs: "DigitalCareLog", moodEntries: "MoodEntry",
  workSessions: "WorkSession", workCategories: "WorkCategory"
};

Object.entries(names).forEach(([collection, name]) => {
  api[`get${name}s`] = () => list(collection);
  if (name === "Top3") api.getTop3 = () => list(collection);
  api[`create${name}`] = (payload) => create(collection, payload);
  api[`update${name}`] = (id, updates) => update(collection, id, updates);
  api[`delete${name}`] = (id) => remove(collection, id);
});

// ── Active timer session (진행 중인 업무) ──
// activeSession: { id, taskId, title, category, startTime, pauseSec, pauses: [{start, end?}], memos: [{id, text, at, phase}] }
api.getActiveSession = () => getAllData().activeSession;

api.startActiveSession = ({ title, category, taskId = null }) => {
  const data = getAllData();
  data.activeSession = {
    id: makeId("session"),
    taskId,
    title: title || "제목 없는 업무",
    category: category || (data.workCategories[0]?.name ?? "개인작업"),
    startTime: Date.now(),
    pauseSec: 0,
    pauses: [],
    memos: []
  };
  saveAllData(data);
  return data.activeSession;
};

api.pauseActiveSession = () => {
  const data = getAllData();
  if (!data.activeSession || data.activeSession.pauses.some((p) => !p.end)) return;
  data.activeSession.pauses.push({ start: Date.now() });
  saveAllData(data);
};

api.resumeActiveSession = () => {
  const data = getAllData();
  if (!data.activeSession) return;
  const openPause = data.activeSession.pauses.find((p) => !p.end);
  if (!openPause) return;
  openPause.end = Date.now();
  data.activeSession.pauseSec += Math.round((openPause.end - openPause.start) / 1000);
  saveAllData(data);
};

api.updateActiveSession = (updates) => {
  const data = getAllData();
  if (!data.activeSession) return;
  data.activeSession = { ...data.activeSession, ...updates };
  saveAllData(data);
};

api.addActiveSessionMemo = (text, phase = "working") => {
  const data = getAllData();
  if (!data.activeSession || !text?.trim()) return;
  data.activeSession.memos.push({ id: makeId("memo"), text: text.trim(), at: Date.now(), phase });
  saveAllData(data);
};

api.endActiveSession = () => {
  const data = getAllData();
  const active = data.activeSession;
  if (!active) return null;
  const endTime = Date.now();
  const openPause = active.pauses.find((p) => !p.end);
  let pauseSec = active.pauseSec;
  if (openPause) {
    openPause.end = endTime;
    pauseSec += Math.round((openPause.end - openPause.start) / 1000);
  }
  const totalSec = Math.round((endTime - active.startTime) / 1000);
  const duration = Math.max(totalSec - pauseSec, 0);
  const session = {
    id: active.id,
    taskId: active.taskId,
    title: active.title,
    category: active.category,
    startTime: active.startTime,
    endTime,
    duration,
    pauseSec,
    pauses: active.pauses,
    memos: active.memos,
    date: today(),
    createdAt: today(),
    updatedAt: today()
  };
  data.workSessions = [session, ...data.workSessions];
  data.activeSession = null;
  saveAllData(data);
  return session;
};

api.discardActiveSession = () => {
  const data = getAllData();
  data.activeSession = null;
  saveAllData(data);
};

// ── 우선 업무(Priority Todo) 정렬 ──
api.setTodoPriority = (id, isPriority) => {
  const data = getAllData();
  const maxOrder = Math.max(-1, ...data.todos.filter((t) => t.isPriority).map((t) => t.priorityOrder ?? 0));
  data.todos = data.todos.map((todo) =>
    todo.id === id ? { ...todo, isPriority, priorityOrder: isPriority ? maxOrder + 1 : todo.priorityOrder, updatedAt: today() } : todo
  );
  saveAllData(data);
};

api.reorderPriorityTodos = (orderedIds) => {
  const data = getAllData();
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  data.todos = data.todos.map((todo) =>
    orderMap.has(todo.id) ? { ...todo, priorityOrder: orderMap.get(todo.id), updatedAt: today() } : todo
  );
  saveAllData(data);
};

api.getHabitLogs = () => list("habitLogs");
api.createHabitLog = (payload) => create("habitLogs", payload);
api.updateHabitLog = (id, updates) => update("habitLogs", id, updates);
api.deleteHabitLog = (id) => remove("habitLogs", id);
api.toggleHabitLog = (habitId, date) => {
  const data = getAllData();
  const existing = data.habitLogs.find((log) => log.habitId === habitId && log.date === date);
  if (existing) {
    data.habitLogs = data.habitLogs.filter((log) => log.id !== existing.id);
  } else {
    const now = today();
    data.habitLogs = [
      { id: makeId("habitLogs"), habitId, date, completed: true, createdAt: now, updatedAt: now },
      ...data.habitLogs
    ];
  }
  saveAllData(data);
};

export const storage = api;
export const {
  getTodos, createTodo, updateTodo, deleteTodo,
  getTop3, createTop3, updateTop3, deleteTop3,
  getDelayedTasks, createDelayedTask, updateDelayedTask, deleteDelayedTask,
  getHabits, createHabit, updateHabit, deleteHabit,
  getHabitLogs, createHabitLog, updateHabitLog, deleteHabitLog, toggleHabitLog,
  getEvents, createEvent, updateEvent, deleteEvent,
  getTimelineEntries, createTimelineEntry, updateTimelineEntry, deleteTimelineEntry,
  getChores, createChore, updateChore, deleteChore,
  getShoppingItems, createShoppingItem, updateShoppingItem, deleteShoppingItem,
  getPayments, createPayment, updatePayment, deletePayment,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getCampaignParticipants, createCampaignParticipant, updateCampaignParticipant, deleteCampaignParticipant,
  getContentPlans, createContentPlan, updateContentPlan, deleteContentPlan,
  getImportantFiles, createImportantFile, updateImportantFile, deleteImportantFile,
  getGoals, createGoal, updateGoal, deleteGoal,
  getGratitudeEntrys, createGratitudeEntry, updateGratitudeEntry, deleteGratitudeEntry,
  getQuestionPrompts, createQuestionPrompt, updateQuestionPrompt, deleteQuestionPrompt,
  getQuestionAnswers, createQuestionAnswer, updateQuestionAnswer, deleteQuestionAnswer,
  getTimeSessions, createTimeSession, updateTimeSession, deleteTimeSession,
  getRecurringEvents, createRecurringEvent, updateRecurringEvent, deleteRecurringEvent,
  getBeautyItems, createBeautyItem, updateBeautyItem, deleteBeautyItem,
  getDigitalCareLogs, createDigitalCareLog, updateDigitalCareLog, deleteDigitalCareLog,
  getMoodEntrys, createMoodEntry, updateMoodEntry, deleteMoodEntry,
  getWorkSessions, createWorkSession, updateWorkSession, deleteWorkSession,
  getWorkCategorys, createWorkCategory, updateWorkCategory, deleteWorkCategory,
  getActiveSession, startActiveSession, pauseActiveSession, resumeActiveSession,
  updateActiveSession, addActiveSessionMemo, endActiveSession, discardActiveSession,
  setTodoPriority, reorderPriorityTodos
} = api;
