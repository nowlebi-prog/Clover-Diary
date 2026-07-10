import { useState } from "react";
import AppButton from "../common/AppButton";

const moodGroups = [
  { key: "happy", label: "기쁜", emoji: "✿", face: "◡", tone: "bg-[#FFE88F]", score: 5, details: ["기분좋은", "즐거운", "고마운", "홀가분한", "재밌는", "뿌듯한"] },
  { key: "excited", label: "설레는", emoji: "✦", face: "ᵕ", tone: "bg-[#FFB36B]", score: 5, details: ["기대되는", "두근거리는", "신나는", "새로운", "궁금한", "반가운"] },
  { key: "calm", label: "평범한", emoji: "●", face: "ᴗ", tone: "bg-[#5EE6A8]", score: 3, details: ["잔잔한", "괜찮은", "차분한", "무난한", "편안한", "담담한"] },
  { key: "surprised", label: "놀란", emoji: "!", face: "o", tone: "bg-[#55C7C9]", score: 3, details: ["당황한", "깜짝 놀란", "어리둥절한", "낯선", "멍한", "정신없는"] },
  { key: "unpleasant", label: "불쾌한", emoji: "×", face: "︿", tone: "bg-[#C879FF]", score: 2, details: ["불편한", "찝찝한", "짜증나는", "예민한", "거슬리는", "피곤한"] },
  { key: "fear", label: "두려운", emoji: "~", face: "﹏", tone: "bg-[#38D0A3]", score: 2, details: ["걱정되는", "불안한", "겁나는", "조마조마한", "막막한", "위축된"] },
  { key: "sad", label: "슬픈", emoji: "·", face: "╥", tone: "bg-[#8171FF]", score: 1, details: ["서운한", "외로운", "우울한", "허전한", "속상한", "지친"] },
  { key: "angry", label: "화나는", emoji: "▲", face: "皿", tone: "bg-[#FF5555]", score: 1, details: ["억울한", "분한", "답답한", "날카로운", "참기힘든", "폭발직전"] }
];

function MoodFace({ mood, small = false }) {
  if (!mood) return null;
  const group = moodGroups.find((item) => item.key === mood.core) || moodGroups[0];
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-[36%] ${group.tone} ${small ? "h-7 w-7 text-[10px]" : "h-14 w-14 text-xs"} text-slate-900 shadow-sm`}>
      <span className="absolute -top-0.5 text-[10px] font-black leading-none">{group.emoji}</span>
      <span className={`${small ? "text-xs" : "text-lg"} font-black leading-none`}>{group.face}</span>
    </span>
  );
}

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

const toLocalDate = (dateKey) => new Date(`${dateKey}T00:00:00`);

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const minutesToText = (minutes) => {
  if (!minutes) return "0분";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}분`;
  if (!mins) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
};

const formatClock = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const itemLabel = {
  event: "일정",
  todo: "할 일",
  payment: "납부",
  recurring: "반복",
  campaign: "업무",
  content: "콘텐츠"
};

const itemDot = {
  event: "bg-teal-400",
  todo: "bg-rose-400",
  payment: "bg-amber-400",
  recurring: "bg-sky-400",
  campaign: "bg-violet-400",
  content: "bg-blue-400"
};

const barColor = {
  event: "bg-teal-300",
  todo: "bg-rose-300",
  payment: "bg-amber-300",
  recurring: "bg-sky-300",
  campaign: "bg-violet-300",
  content: "bg-blue-300",
  session: "bg-slate-400"
};

function weekDates(selectedDate) {
  const selected = toLocalDate(selectedDate);
  const start = addDays(selected, -selected.getDay());
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function getSessionRows(data, selectedDate) {
  return (data.timeSessions || [])
    .filter((session) => session.date === selectedDate)
    .map((session) => {
      const minutes = Number(session.minutes || 0);
      const started = formatClock(session.startedAt);
      const ended = formatClock(session.endedAt);
      return {
        id: session.id,
        type: "session",
        title: session.title || "타임트래커",
        timeText: started && ended ? `${started} - ${ended}` : minutesToText(minutes),
        minutes: minutes || 60
      };
    });
}

function getItemRows(selectedItems) {
  return selectedItems.map((item, index) => ({
    id: item.id || `${item.type}-${index}`,
    type: item.type,
    title: item.displayTitle || item.title || item.name || "일정",
    timeText: item.time || item.date || "",
    minutes: item.type === "todo" ? 45 : 60
  }));
}

function getWeekMinutes(data, dates, itemsByDate) {
  const dateKeys = dates.map(toDateKey);
  const sessionMinutes = (data.timeSessions || [])
    .filter((session) => dateKeys.includes(session.date))
    .reduce((sum, session) => sum + Number(session.minutes || 0), 0);
  const itemMinutes = dateKeys.reduce((sum, date) => sum + ((itemsByDate[date] || []).length * 60), 0);
  return sessionMinutes || itemMinutes;
}

export default function MobileWorkCalendar({
  cursor,
  selectedDate,
  selectedItems,
  itemsByDate,
  data,
  onSelectDate,
  onMoveMonth,
  onToday,
  onAddEvent,
  onSaveMood
}) {
  const [moodOpen, setMoodOpen] = useState(false);
  const [selectedCore, setSelectedCore] = useState(null);
  const dates = weekDates(selectedDate);
  const selected = toLocalDate(selectedDate);
  const todayKey = toDateKey(new Date());
  const moodByDate = (data.moodEntries || []).reduce((map, mood) => ({ ...map, [mood.date]: mood }), {});
  const selectedMood = moodByDate[selectedDate];
  const sessionRows = getSessionRows(data, selectedDate);
  const itemRows = getItemRows(selectedItems);
  const rows = sessionRows.length ? sessionRows : itemRows;
  const selectedMinutes = rows.reduce((sum, row) => sum + Number(row.minutes || 0), 0);
  const weekMinutes = getWeekMinutes(data, dates, itemsByDate);
  const weekStart = dates[0];
  const weekEnd = dates[6];

  return (
    <section className="mx-auto min-h-[calc(100vh-116px)] max-w-md rounded-[30px] bg-white shadow-glass">
      <div className="px-5 pb-4 pt-7">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">근무·휴가</h1>
          <AppButton onClick={onAddEvent}>+ 추가</AppButton>
        </div>

        <div className="mt-7 flex gap-7 border-b border-slate-100 text-sm font-black">
          <button className="border-b-2 border-slate-900 pb-3 text-slate-900">내 근무</button>
          <button className="pb-3 text-slate-300">내 휴가</button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button className="rounded-full px-3 py-2 text-sm font-bold text-slate-400" onClick={() => onMoveMonth(-1)}>
            이전
          </button>
          <button className="rounded-full bg-slate-50 px-5 py-2 text-sm font-black text-slate-800" onClick={onToday}>
            {cursor.year}년 {cursor.month + 1}월
          </button>
          <button className="rounded-full px-3 py-2 text-sm font-bold text-slate-400" onClick={() => onMoveMonth(1)}>
            다음
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 border-b border-slate-100 pb-4">
          {dates.map((date) => {
            const dateKey = toDateKey(date);
            const isSelected = dateKey === selectedDate;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const hasItems = Boolean((itemsByDate[dateKey] || []).length);
            const mood = dateKey <= todayKey ? moodByDate[dateKey] : null;
            return (
              <button
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
                className={`grid h-[72px] place-items-center rounded-2xl text-sm transition ${isSelected ? "bg-slate-800 text-white" : "text-slate-700"}`}
              >
                <span className={isWeekend && !isSelected ? "font-black text-coral" : "font-black"}>{date.getDate()}</span>
                <span className={`text-xs ${isSelected ? "text-slate-300" : isWeekend ? "text-coral" : "text-slate-400"}`}>
                  {dayLabels[date.getDay()]}
                </span>
                {mood ? <MoodFace mood={mood} small /> : <span className={`h-1.5 w-1.5 rounded-full ${hasItems ? "bg-teal-400" : "bg-transparent"}`} />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedCore(null);
            setMoodOpen(true);
          }}
          className="mt-4 flex w-full items-center justify-between rounded-[26px] bg-[#F8FAF7] px-4 py-4 text-left shadow-sm"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-clover-deep">Daily mood</p>
            <p className="mt-1 text-base font-black text-slate-900">
              {selectedMood ? `${selectedMood.coreLabel} · ${selectedMood.detail}` : "오늘 기분 남기기"}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-400">
              {selected.getMonth() + 1}월 {selected.getDate()}일의 감정을 가볍게 체크해요.
            </p>
          </div>
          <MoodFace mood={selectedMood || { core: "calm" }} />
        </button>

        <div className="flex items-center justify-between border-b border-slate-100 py-5">
          <div>
            <p className="text-lg font-black text-slate-900">
              {weekStart.getMonth() + 1}. {weekStart.getDate()} ({dayLabels[weekStart.getDay()]}) - {weekEnd.getMonth() + 1}. {weekEnd.getDate()} ({dayLabels[weekEnd.getDay()]})
            </p>
            <p className="mt-1 text-xs font-bold text-slate-400">{selected.getFullYear()}년 선택 주간</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-slate-800">{Math.round(weekMinutes / 60)}/52h</p>
            <p className="text-xs font-bold text-slate-400">주간 기록</p>
          </div>
        </div>

        <div className="py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">근무시간</h2>
            <strong className="text-base font-black text-slate-900">{minutesToText(selectedMinutes)}</strong>
          </div>

          <div className="mt-6 grid grid-cols-[22px_1fr_22px] items-center gap-2 text-[10px] font-bold text-slate-300">
            <span>6</span>
            <div className="flex justify-between">
              {[8, 10, 12, 14, 16, 18, 20].map((hour) => <span key={hour}>{hour}</span>)}
            </div>
            <span>22</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            {rows.length ? (
              <div className="flex h-full">
                {rows.map((row) => (
                  <span
                    key={row.id}
                    className={`${barColor[row.type] || "bg-slate-300"}`}
                    style={{ flex: Math.max(1, Number(row.minutes || 30)) }}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full w-full bg-slate-100" />
            )}
          </div>

          <div className="mt-6 grid gap-1">
            {rows.length ? rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-2xl py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${itemDot[row.type] || "bg-slate-300"}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">{row.title}</p>
                    <p className="text-xs font-bold text-slate-400">{itemLabel[row.type] || "기록"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-3 text-sm font-black text-slate-700">
                  <span>{row.timeText || minutesToText(row.minutes)}</span>
                  <span className="text-slate-300">›</span>
                </div>
              </div>
            )) : (
              <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-black text-slate-700">오늘 등록된 일정이 없어요</p>
                <p className="mt-1 text-xs font-bold text-slate-400">+ 추가로 일정이나 할 일을 넣어둘 수 있어요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {moodOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/25">
          <section className="w-full max-w-md rounded-t-[30px] bg-white p-5 shadow-glass">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">{selectedCore ? "Step 2" : "Step 1"}</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {selectedCore ? "조금 더 가까운 감정을 골라주세요" : "오늘의 핵심 감정은 뭐였나요?"}
                </h2>
              </div>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 font-black text-slate-400" onClick={() => setMoodOpen(false)}>
                ×
              </button>
            </div>

            {!selectedCore ? (
              <div className="grid grid-cols-2 gap-3">
                {moodGroups.map((group) => (
                  <button
                    type="button"
                    key={group.key}
                    className="flex min-h-[96px] items-center justify-between rounded-[24px] bg-slate-50 p-4 text-left shadow-sm"
                    onClick={() => setSelectedCore(group)}
                  >
                    <span className="text-base font-black text-slate-900">{group.label}</span>
                    <MoodFace mood={{ core: group.key }} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                {selectedCore.details.map((detail) => (
                  <button
                    type="button"
                    key={detail}
                    className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4 text-left text-base font-black text-slate-800 shadow-sm"
                    onClick={() => {
                      onSaveMood?.({
                        date: selectedDate,
                        core: selectedCore.key,
                        coreLabel: selectedCore.label,
                        detail,
                        score: selectedCore.score
                      });
                      setMoodOpen(false);
                    }}
                  >
                    <span>{detail}</span>
                    <MoodFace mood={{ core: selectedCore.key }} small />
                  </button>
                ))}
                <button type="button" className="mt-1 rounded-full py-3 text-sm font-black text-slate-400" onClick={() => setSelectedCore(null)}>
                  핵심 감정 다시 고르기
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
