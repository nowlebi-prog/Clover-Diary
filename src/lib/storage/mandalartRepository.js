import { getAllData, saveAllData } from './localStorageAdapter.js';
import { normalizeMandalart } from './mandalartData.js';

export function getMandalart() { return normalizeMandalart(getAllData().mandalart); }
export function saveMandalartValue(path, value) {
  const data = getAllData();
  const plan = normalizeMandalart(data.mandalart);
  let cell = plan;
  for (const key of path.slice(0, -1)) cell = cell[key];
  cell[path.at(-1)] = value;
  data.mandalart = plan;
  saveAllData(data);
}
