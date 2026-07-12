export function fmtHM(totalSec = 0) {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
}

export function fmtHMS(totalSec = 0) {
  const sec = Math.max(0, Math.round(totalSec));
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function fmtClock(ms) {
  if (!ms) return "--:--";
  return new Date(ms).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateLabel(dateKey) {
  if (!dateKey) return "";
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

export function computeElapsed(session, nowMs = Date.now()) {
  if (!session) return { totalSec: 0, pauseSec: 0, workSec: 0, isPaused: false };
  const pauses = session.pauses || [];
  const openPause = pauses.find((pause) => !pause.end);
  const isPaused = Boolean(openPause);
  const totalSec = Math.round((nowMs - session.startTime) / 1000);
  const closedPauseSec = pauses
    .filter((pause) => pause.end)
    .reduce((sum, pause) => sum + Math.max(0, Math.round((pause.end - pause.start) / 1000)), 0);
  const livePauseSec = isPaused ? Math.round((nowMs - openPause.start) / 1000) : 0;
  const pauseSec = closedPauseSec + livePauseSec;
  return { totalSec, pauseSec, workSec: Math.max(totalSec - pauseSec, 0), isPaused };
}

export function findOverlap(session, siblingSessions = []) {
  const start = session.startTime;
  const end = session.endTime ?? session.startTime + (session.duration || 0) * 1000;
  return siblingSessions.find((other) => {
    if (other.id === session.id) return false;
    const otherStart = other.startTime;
    const otherEnd = other.endTime ?? other.startTime + (other.duration || 0) * 1000;
    return start < otherEnd && otherStart < end;
  });
}

export function categoryColor(categories, name) {
  return categories.find((category) => category.name === name)?.color || "#8DDFA8";
}
