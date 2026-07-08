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
  importantFiles: "ImportantFile"
};

Object.entries(names).forEach(([collection, name]) => {
  api[`get${name}s`] = () => list(collection);
  if (name === "Top3") api.getTop3 = () => list(collection);
  api[`create${name}`] = (payload) => create(collection, payload);
  api[`update${name}`] = (id, updates) => update(collection, id, updates);
  api[`delete${name}`] = (id) => remove(collection, id);
});

export const storage = api;
export const {
  getTodos, createTodo, updateTodo, deleteTodo,
  getTop3, createTop3, updateTop3, deleteTop3,
  getDelayedTasks, createDelayedTask, updateDelayedTask, deleteDelayedTask,
  getHabits, createHabit, updateHabit, deleteHabit,
  getEvents, createEvent, updateEvent, deleteEvent,
  getTimelineEntries, createTimelineEntry, updateTimelineEntry, deleteTimelineEntry,
  getChores, createChore, updateChore, deleteChore,
  getShoppingItems, createShoppingItem, updateShoppingItem, deleteShoppingItem,
  getPayments, createPayment, updatePayment, deletePayment,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getCampaignParticipants, createCampaignParticipant, updateCampaignParticipant, deleteCampaignParticipant,
  getContentPlans, createContentPlan, updateContentPlan, deleteContentPlan,
  getImportantFiles, createImportantFile, updateImportantFile, deleteImportantFile
} = api;
