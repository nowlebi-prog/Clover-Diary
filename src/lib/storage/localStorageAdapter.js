import { initialData, collections, DEFAULT_WORK_CATEGORIES } from "./initialData";
import { STORAGE_KEYS } from "./storageKeys";
import { isCloudSyncEnabled, pullRemoteSnapshot, pushRemoteSnapshot } from "./supabaseSnapshotAdapter";

const clone = (value) => JSON.parse(JSON.stringify(value));
const today = () => new Date().toISOString().slice(0, 10);
const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const DELETED_ITEM_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let pushTimer = null;
let syncTimer = null;
let syncingFromCloud = false;

const normalize = (data) => {
  const next = { ...clone(initialData), ...(data || {}) };
  collections.forEach((key) => {
    if (!Array.isArray(next[key])) next[key] = [];
  });
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
  const deletedCutoff = Date.now() - DELETED_ITEM_TTL_MS;
  next.deletedItems = (next.deletedItems || []).filter((item) => {
    const deletedAt = Date.parse(item.deletedAt || "");
    return Number.isFinite(deletedAt) && deletedAt >= deletedCutoff && item.collection && item.item;
  });
  return next;
};

export function getAllData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.appData);
    if (!raw) {
      return normalize(initialData);
    }
    return normalize(JSON.parse(raw));
  } catch {
    try {
      const backup = JSON.parse(localStorage.getItem(STORAGE_KEYS.appDataBackup) || "null");
      if (backup?.data) return normalize(backup.data);
    } catch {
      // Keep the app usable even if both the main data and backup are damaged.
    }
    return normalize(initialData);
  }
}

function getSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.syncMeta) || "{}");
  } catch {
    return {};
  }
}

function setSyncMeta(updates) {
  localStorage.setItem(STORAGE_KEYS.syncMeta, JSON.stringify({ ...getSyncMeta(), ...updates }));
}

function dispatchDataChange() {
  window.dispatchEvent(new Event("clover-data-change"));
}

function scheduleCloudPush(data) {
  if (!isCloudSyncEnabled() || syncingFromCloud) return;
  window.clearTimeout(pushTimer);
  const payload = clone(data);
  pushTimer = window.setTimeout(async () => {
    try {
      const remote = await pushRemoteSnapshot(payload);
      setSyncMeta({
        lastLocalWriteAt: new Date().toISOString(),
        lastRemoteUpdatedAt: remote?.updated_at || new Date().toISOString(),
        lastSyncStatus: "connected",
        lastSyncError: ""
      });
      dispatchDataChange();
    } catch (error) {
      setSyncMeta({
        lastSyncStatus: "error",
        lastSyncError: error?.message || "Supabase sync failed"
      });
    }
  }, 500);
}

export function saveAllData(data, options = {}) {
  const normalized = normalize(data);
  localStorage.setItem(STORAGE_KEYS.appData, JSON.stringify(normalized));
  try {
    localStorage.setItem(STORAGE_KEYS.appDataBackup, JSON.stringify({ savedAt: new Date().toISOString(), data: normalized }));
  } catch {
    // Backup is best-effort so a full browser storage quota does not block normal saves.
  }
  if (!options.silent) dispatchDataChange();
  if (!options.skipRemote) scheduleCloudPush(normalized);
}

export function resetAllData() {
  saveAllData(initialData);
}

export async function syncAllDataFromCloud() {
  if (!isCloudSyncEnabled()) return { enabled: false };
  try {
    const remote = await pullRemoteSnapshot();
    if (!remote?.data) {
      const pushed = await pushRemoteSnapshot(getAllData());
      setSyncMeta({
        lastRemoteUpdatedAt: pushed?.updated_at || new Date().toISOString(),
        lastSyncStatus: "connected",
        lastSyncError: ""
      });
      return { enabled: true, changed: false };
    }

    const meta = getSyncMeta();
    const remoteUpdatedAt = remote.updated_at || "";
    if (remoteUpdatedAt && remoteUpdatedAt !== meta.lastRemoteUpdatedAt) {
      window.clearTimeout(pushTimer);
      syncingFromCloud = true;
      saveAllData(remote.data, { skipRemote: true });
      syncingFromCloud = false;
      setSyncMeta({
        lastRemoteUpdatedAt: remoteUpdatedAt,
        lastSyncStatus: "connected",
        lastSyncError: ""
      });
      return { enabled: true, changed: true };
    }

    setSyncMeta({
      lastSyncStatus: "connected",
      lastSyncError: ""
    });
    return { enabled: true, changed: false };
  } catch (error) {
    syncingFromCloud = false;
    setSyncMeta({
      lastSyncStatus: "error",
      lastSyncError: error?.message || "Supabase sync failed"
    });
    return { enabled: true, changed: false, error };
  }
}

export function startCloudSync() {
  if (!isCloudSyncEnabled() || syncTimer) return;
  syncAllDataFromCloud();
  syncTimer = window.setInterval(syncAllDataFromCloud, 4000);
  window.addEventListener("focus", syncAllDataFromCloud);
}

export function getCloudSyncStatus() {
  return {
    enabled: isCloudSyncEnabled(),
    ...getSyncMeta()
  };
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
  const target = (data[collection] || []).find((item) => item.id === id);
  if (!target) return;
  data[collection] = (data[collection] || []).filter((item) => item.id !== id);
  data.deletedItems = [
    { id: makeId("deleted"), collection, item: target, deletedAt: new Date().toISOString() },
    ...(data.deletedItems || [])
  ];
  saveAllData(data);
}

export function moveToTrash(data, collection, itemOrId) {
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
  const target = typeof itemOrId === "string" ? (data[collection] || []).find((item) => item.id === id) : itemOrId;
  if (!target?.id) return data;
  data[collection] = (data[collection] || []).filter((item) => item.id !== target.id);
  data.deletedItems = [
    { id: makeId("deleted"), collection, item: target, deletedAt: new Date().toISOString() },
    ...(data.deletedItems || [])
  ];
  return data;
}

export function restoreDeletedItem(trashId) {
  const data = getAllData();
  const entry = (data.deletedItems || []).find((item) => item.id === trashId);
  if (!entry?.collection || !entry.item) return false;
  data[entry.collection] = [entry.item, ...(data[entry.collection] || []).filter((item) => item.id !== entry.item.id)];
  data.deletedItems = (data.deletedItems || []).filter((item) => item.id !== trashId);
  saveAllData(data);
  return true;
}

export function getDeletedItems() {
  return getAllData().deletedItems || [];
}

const api = { getAllData, saveAllData, resetAllData, moveToTrash, restoreDeletedItem, getDeletedItems };
const names = {
  todos: "Todo", top3: "Top3", delayedTasks: "DelayedTask", habits: "Habit",
  events: "Event", timelineEntries: "TimelineEntry", chores: "Chore",
  shoppingItems: "ShoppingItem", payments: "Payment", campaigns: "Campaign",
  campaignParticipants: "CampaignParticipant", contentPlans: "ContentPlan",
  importantFiles: "ImportantFile", goals: "Goal", gratitudeEntries: "GratitudeEntry",
  questionPrompts: "QuestionPrompt", questionAnswers: "QuestionAnswer",
  timeSessions: "TimeSession", recurringEvents: "RecurringEvent", beautyItems: "BeautyItem",
  digitalCareLogs: "DigitalCareLog", moodEntries: "MoodEntry", monthlyArchives: "MonthlyArchive",
  studyCaptures: "StudyCapture", studyCategories: "StudyCategory", studyNotes: "StudyNote", studyCards: "StudyCard",
  studyExperiments: "StudyExperiment", studyWorkflows: "StudyWorkflow",
  workSessions: "WorkSession"
};

Object.entries(names).forEach(([collection, name]) => {
  api[`get${name}s`] = () => list(collection);
  if (name === "Top3") api.getTop3 = () => list(collection);
  api[`create${name}`] = (payload) => create(collection, payload);
  api[`update${name}`] = (id, updates) => update(collection, id, updates);
  api[`delete${name}`] = (id) => remove(collection, id);
});

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
  getMonthlyArchives, createMonthlyArchive, updateMonthlyArchive, deleteMonthlyArchive,
  getStudyCaptures, createStudyCapture, updateStudyCapture, deleteStudyCapture,
  getStudyCategorys, createStudyCategory, updateStudyCategory, deleteStudyCategory,
  getStudyNotes, createStudyNote, updateStudyNote, deleteStudyNote,
  getStudyCards, createStudyCard, updateStudyCard, deleteStudyCard,
  getStudyExperiments, createStudyExperiment, updateStudyExperiment, deleteStudyExperiment,
  getStudyWorkflows, createStudyWorkflow, updateStudyWorkflow, deleteStudyWorkflow,
  getWorkSessions, createWorkSession, updateWorkSession, deleteWorkSession
} = api;

// ── Work timer / worklog helpers ──
// These live alongside the generic collection CRUD above but store
// non-array state (current running timer, category list, per-day notes),
// so they get small dedicated helpers instead of the generic list() pattern.

export function getTaskCategories() {
  const data = getAllData();
  return Array.isArray(data.taskCategories) && data.taskCategories.length ? data.taskCategories : [...DEFAULT_WORK_CATEGORIES];
}

export function saveTaskCategories(categories) {
  const data = getAllData();
  data.taskCategories = categories;
  saveAllData(data, { silent: true });
}

export function getWorkCategories() {
  return getTaskCategories().map((category, index) => {
    const colors = ["#8DDFA8", "#A9C9FF", "#F6C68D", "#F4B6D2", "#BDE7E7"];
    return typeof category === "string"
      ? { id: `work-category-${index}`, name: category, color: colors[index % colors.length] }
      : category;
  });
}

export function createWorkCategory(payload) {
  const categories = getWorkCategories();
  const item = {
    id: makeId("workCategory"),
    name: payload.name || "새 카테고리",
    color: payload.color || "#8DDFA8"
  };
  saveTaskCategories([...categories, item]);
  return item;
}

export function updateWorkCategory(id, updates) {
  saveTaskCategories(getWorkCategories().map((category) => category.id === id ? { ...category, ...updates } : category));
}

export function deleteWorkCategory(id) {
  saveTaskCategories(getWorkCategories().filter((category) => category.id !== id));
}

export function getActiveSession() {
  return getAllData().activeSession || null;
}

export function startActiveSession({ title, category, todoId = "" }) {
  const data = getAllData();
  const now = Date.now();
  data.activeSession = {
    id: makeId("activeWork"),
    title,
    category,
    todoId,
    date: today(),
    startTime: now,
    pauses: [],
    pauseSec: 0,
    memos: [],
    createdAt: today(),
    updatedAt: today()
  };
  saveAllData(data);
  return data.activeSession;
}

export function updateActiveSession(updates) {
  const data = getAllData();
  if (!data.activeSession) return null;
  data.activeSession = { ...data.activeSession, ...updates, updatedAt: today() };
  saveAllData(data);
  return data.activeSession;
}

export function pauseActiveSession() {
  const data = getAllData();
  if (!data.activeSession) return null;
  const open = (data.activeSession.pauses || []).some((pause) => !pause.end);
  if (!open) data.activeSession.pauses = [...(data.activeSession.pauses || []), { start: Date.now() }];
  saveAllData(data);
  return data.activeSession;
}

export function resumeActiveSession() {
  const data = getAllData();
  if (!data.activeSession) return null;
  const now = Date.now();
  data.activeSession.pauses = (data.activeSession.pauses || []).map((pause) => (!pause.end ? { ...pause, end: now } : pause));
  data.activeSession.pauseSec = (data.activeSession.pauses || []).reduce((sum, pause) => sum + Math.max(0, Math.round(((pause.end || now) - pause.start) / 1000)), 0);
  saveAllData(data);
  return data.activeSession;
}

export function addActiveSessionMemo(text, phase = "working") {
  const data = getAllData();
  if (!data.activeSession) return null;
  data.activeSession.memos = [...(data.activeSession.memos || []), { id: makeId("memo"), text, phase, time: Date.now() }];
  saveAllData(data);
  return data.activeSession;
}

export function endActiveSession() {
  const data = getAllData();
  const session = data.activeSession;
  if (!session) return null;
  const now = Date.now();
  const pauses = (session.pauses || []).map((pause) => (!pause.end ? { ...pause, end: now } : pause));
  const pauseSec = pauses.reduce((sum, pause) => sum + Math.max(0, Math.round((pause.end - pause.start) / 1000)), 0);
  const duration = Math.max(0, Math.round((now - session.startTime) / 1000) - pauseSec);
  const saved = { ...session, id: makeId("workSessions"), endTime: now, pauses, pauseSec, duration, updatedAt: today() };
  data.workSessions = [saved, ...(data.workSessions || [])];
  if (session.todoId) {
    data.todos = (data.todos || []).map((todo) => {
      if (todo.id !== session.todoId) return todo;
      return {
        ...todo,
        focusSeconds: Number(todo.focusSeconds || 0) + duration,
        workSessionIds: [saved.id, ...(todo.workSessionIds || [])],
        updatedAt: today()
      };
    });
  }
  data.activeSession = null;
  saveAllData(data);
  return saved;
}

export function discardActiveSession() {
  const data = getAllData();
  data.activeSession = null;
  saveAllData(data);
}

export function getActiveWorkTimer() {
  return getAllData().activeWorkTimer || null;
}

export function setActiveWorkTimer(timerState, options = {}) {
  const data = getAllData();
  data.activeWorkTimer = timerState;
  saveAllData(data, { silent: !!options.silent });
}

export function getWorkLogNote(date) {
  const notes = getAllData().workLogNotes || {};
  return notes[date] || { nextTodo: "" };
}

export function saveWorkLogNote(date, patch) {
  const data = getAllData();
  data.workLogNotes = { ...(data.workLogNotes || {}), [date]: { ...(data.workLogNotes?.[date] || { nextTodo: "" }), ...patch } };
  saveAllData(data, { silent: true });
}

// ── Gap year daily budget helpers ──
export const GAP_YEAR_TODO_TITLE = "갭이어 예산 올리기";

export function ensureGapYearDailyTodo() {
  const data = getAllData();
  const date = today();
  const exists = (data.todos || []).some((item) => item.title === GAP_YEAR_TODO_TITLE && item.dueDate === date);
  if (exists) return;
  data.todos = [
    {
      id: makeId("todo"),
      title: GAP_YEAR_TODO_TITLE,
      dueDate: date,
      allDay: true,
      startTime: "",
      endTime: "",
      dueTime: "",
      priority: "high",
      category: "돈관리",
      project: "돈관리",
      projectName: "돈관리",
      memo: "지출을 갭이어 예산 시트에 반영했는지 체크해요.",
      completed: false,
      subTasks: [],
      createdAt: date,
      updatedAt: date
    },
    ...(data.todos || [])
  ];
  saveAllData(data, { silent: true });
}

export function isGapYearTodoDoneToday() {
  const data = getAllData();
  const date = today();
  const todo = (data.todos || []).find((item) => item.title === GAP_YEAR_TODO_TITLE && item.dueDate === date);
  return Boolean(todo?.completed);
}

export function getUnregisteredGapYearExpenses() {
  const data = getAllData();
  return (data.expenses || []).filter((item) => item.gapYearUploadRequired && !item.gapYearRegistered).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}
