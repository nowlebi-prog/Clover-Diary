const MS_DAY = 86400000;

export const toDateKey = (date = new Date()) => {
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

export const addDays = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};

export const startOfWeek = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
};

export const getActiveHabits = (habits) => habits.filter((habit) => (habit.status || "active") === "active");
export const getPausedHabits = (habits) => habits.filter((habit) => habit.status === "paused");

export const isHabitDoneOn = (habitId, habitLogs, date) =>
  habitLogs.some((log) => log.habitId === habitId && log.date === date && log.completed);

export const getHabitStreak = (habitId, habitLogs, today) => {
  let streak = 0;
  let cursor = toDateKey(today);
  while (isHabitDoneOn(habitId, habitLogs, cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

export const getHabitCompletionRate = (habitId, habitLogs, startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days = Math.max(1, Math.floor((end - start) / MS_DAY) + 1);
  let done = 0;
  for (let i = 0; i < days; i += 1) {
    const key = toDateKey(new Date(start.getTime() + i * MS_DAY));
    if (isHabitDoneOn(habitId, habitLogs, key)) done += 1;
  }
  return Math.round((done / days) * 100);
};

export const getTodayHabitStatus = (habits, habitLogs, today) => {
  const date = toDateKey(today);
  const active = getActiveHabits(habits);
  const items = active.map((habit) => ({
    ...habit,
    done: isHabitDoneOn(habit.id, habitLogs, date),
    streak: getHabitStreak(habit.id, habitLogs, date)
  }));
  const doneCount = items.filter((item) => item.done).length;
  return {
    date,
    habits: items,
    total: items.length,
    doneCount,
    remaining: items.filter((item) => !item.done),
    rate: items.length ? Math.round((doneCount / items.length) * 100) : 0
  };
};

export const getWeeklyHabitStats = (habits, habitLogs, weekStart) => {
  const start = startOfWeek(weekStart);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return getActiveHabits(habits).map((habit) => {
    const doneDays = days.filter((day) => isHabitDoneOn(habit.id, habitLogs, day));
    return { habit, days, doneDays, rate: Math.round((doneDays.length / days.length) * 100) };
  });
};

export const getMonthlyHabitStats = (habits, habitLogs, year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = Array.from({ length: last.getDate() }, (_, index) => toDateKey(new Date(year, month, index + 1)));
  return getActiveHabits(habits).map((habit) => {
    const doneDays = days.filter((day) => isHabitDoneOn(habit.id, habitLogs, day));
    return { habit, days, doneDays, rate: Math.round((doneDays.length / days.length) * 100) };
  });
};

export const getYearlyHabitStats = (habits, habitLogs, year) =>
  getActiveHabits(habits).map((habit) => {
    const months = Array.from({ length: 12 }, (_, month) => getMonthlyHabitStats([habit], habitLogs, year, month)[0]);
    const done = months.reduce((sum, month) => sum + month.doneDays.length, 0);
    const total = months.reduce((sum, month) => sum + month.days.length, 0);
    return { habit, months, rate: total ? Math.round((done / total) * 100) : 0 };
  });
