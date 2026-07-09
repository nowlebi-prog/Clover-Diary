export const toDateKey = (date = new Date()) => {
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

export const addDays = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};

export const daysBetween = (from, to) => {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  return Math.round((end - start) / 86400000);
};

export const monthMatrix = (year, month) => {
  const first = new Date(year, month, 1);
  const firstDay = first.getDay();
  const startOffset = firstDay === 0 ? -6 : 1 - firstDay;
  const start = new Date(year, month, 1 + startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: toDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: toDateKey(date) === toDateKey(new Date())
    };
  });
};

export const formatMonth = (year, month) =>
  new Date(year, month, 1).toLocaleDateString("en", { month: "long", year: "numeric" });
