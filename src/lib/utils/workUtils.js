// 초 단위 → "1시간 20분" 형태
export function fmtHM(totalSec = 0) {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
}

// 초 단위 → "00:12:34" (타이머 표시용)
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

// 세션의 실 작업시간(휴식 제외) 계산
export function computeElapsed(session, nowMs = Date.now()) {
  if (!session) return { totalSec: 0, pauseSec: 0, workSec: 0, isPaused: false };
  const openPause = session.pauses.find((p) => !p.end);
  const isPaused = Boolean(openPause);
  const totalSec = Math.round((nowMs - session.startTime) / 1000);
  const livePauseSec = isPaused ? Math.round((nowMs - openPause.start) / 1000) : 0;
  const pauseSec = session.pauseSec + livePauseSec;
  return { totalSec, pauseSec, workSec: Math.max(totalSec - pauseSec, 0), isPaused };
}

// 특정 세션의 시간 범위가 같은 날 다른 세션과 겹치는지 검증. 겹치면 겹치는 세션을 반환.
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
  return categories.find((c) => c.name === name)?.color || "#8DDFA8";
}
