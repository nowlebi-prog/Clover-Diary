import { initialData, collections } from "./initialData";
import { STORAGE_KEYS } from "./storageKeys";
import { isCloudSyncEnabled, pullRemoteSnapshot, pushRemoteSnapshot } from "./supabaseSnapshotAdapter";

const clone = (value) => JSON.parse(JSON.stringify(value));
const today = () => new Date().toISOString().slice(0, 10);
const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  digitalCareLogs: "DigitalCareLog", moodEntries: "MoodEntry"
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
  getMoodEntrys, createMoodEntry, updateMoodEntry, deleteMoodEntry
} = api;
