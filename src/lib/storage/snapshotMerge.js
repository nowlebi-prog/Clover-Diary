const copy = value => value === undefined ? undefined : structuredClone(value);
export const snapshotsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && snapshotsEqual(a[key], b[key]));
};
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const records = value => Array.isArray(value) && value.every(item => object(item) && item.id != null)
  && new Set(value.map(item => String(item.id))).size === value.length;
const version = value => value === undefined ? { exists: false } : { exists: true, value: copy(value) };

// Compare with the last acknowledged server data, never with device clock timestamps.
export function mergeSnapshots(baseline, local, remote) {
  const conflicts = [];
  function merge(base, left, right, path) {
    if (snapshotsEqual(left, right)) return copy(left);
    if (snapshotsEqual(left, base)) return copy(right);
    if (snapshotsEqual(right, base)) return copy(left);
    if (records(left) && records(right) && (base === undefined || records(base))) {
      const previous = new Map((base || []).map(item => [String(item.id), item]));
      const ours = new Map(left.map(item => [String(item.id), item]));
      const theirs = new Map(right.map(item => [String(item.id), item]));
      const result = [];
      for (const id of new Set([...theirs.keys(), ...ours.keys(), ...previous.keys()])) {
        const item = merge(previous.get(id), ours.get(id), theirs.get(id), [...path, id]);
        if (item !== undefined) result.push(item);
      }
      return result;
    }
    if (object(left) && object(right) && (base === undefined || object(base))) {
      const result = {};
      for (const key of new Set([...Object.keys(base || {}), ...Object.keys(right), ...Object.keys(left)])) {
        const value = merge(base?.[key], left[key], right[key], [...path, key]);
        if (value !== undefined) result[key] = value;
      }
      return result;
    }
    conflicts.push({ path, baseline: version(base), local: version(left), remote: version(right) });
    return copy(left);
  }
  return { data: merge(baseline ?? {}, local ?? {}, remote ?? {}, []), conflicts };
}
