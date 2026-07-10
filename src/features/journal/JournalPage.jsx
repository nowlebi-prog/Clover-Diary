import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { addDays, toDateKey } from "../../lib/utils/date";

const moods = [
  ["happy", "😊", "기쁨", "#FFF1A8", 5],
  ["love", "💗", "행복", "#FFD1DC", 5],
  ["proud", "😎", "뿌듯", "#FFD39A", 4],
  ["calm", "🙂", "평온", "#BFEFE0", 4],
  ["tired", "😴", "피곤", "#E5E7EB", 2],
  ["sad", "😢", "슬픔", "#BFE3FF", 2],
  ["anxious", "😟", "불안", "#D8C7FF", 2],
  ["angry", "😡", "화남", "#FF9FB0", 1],
  ["down", "☁️", "우울", "#D1D5DB", 1]
];

const average = (values) => {
  const filtered = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  if (!filtered.length) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
};

const oneDecimal = (value) => Math.round(value * 10) / 10;

const getWeekStart = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
};

const getWeekNumber = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return Math.ceil(date.getDate() / 7);
};

function TrendChart({ entries, today }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(today, index - 13)), [today]);
  const width = 720;
  const height = 220;
  const left = 54;
  const right = 24;
  const top = 28;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const byDate = entries.reduce((map, entry) => ({ ...map, [entry.date]: entry }), {});
  const xOf = (index) => left + (chartWidth / (days.length - 1)) * index;
  const moodY = (score = 0) => top + chartHeight - ((score - 1) / 4) * chartHeight;
  const sleepY = (hours = 0) => top + chartHeight - (Math.min(hours, 12) / 12) * chartHeight;
  const moodPoints = days
    .map((date, index) => ({ date, x: xOf(index), y: moodY(Number(byDate[date]?.score || 0)), value: Number(byDate[date]?.score || 0) }))
    .filter((point) => point.value > 0);
  const sleepPoints = days
    .map((date, index) => ({ date, x: xOf(index), y: sleepY(Number(byDate[date]?.sleepHours || 0)), value: Number(byDate[date]?.sleepHours || 0) }))
    .filter((point) => point.value > 0);
  const pathOf = (points) => points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[680px]">
        {[1, 2, 3, 4, 5].map((score) => (
          <g key={score}>
            <text x="14" y={moodY(score) + 5} className="text-[18px]">{["", "😡", "😢", "🙂", "😎", "😊"][score]}</text>
            <line x1={left} x2={width - right} y1={moodY(score)} y2={moodY(score)} stroke="#E9EEE9" strokeWidth="1" />
          </g>
        ))}

        {sleepPoints.length > 1 && <path d={pathOf(sleepPoints)} fill="none" stroke="#9ADFCB" strokeWidth="3" strokeLinecap="round" />}
        {moodPoints.length > 1 && <path d={pathOf(moodPoints)} fill="none" stroke="#14B8A6" strokeWidth="4" strokeLinecap="round" />}

        {sleepPoints.map((point) => (
          <circle key={`sleep-${point.date}`} cx={point.x} cy={point.y} r="4" fill="#9ADFCB" />
        ))}
        {moodPoints.map((point) => (
          <circle key={`mood-${point.date}`} cx={point.x} cy={point.y} r="5" fill="#F59E0B" stroke="#fff" strokeWidth="2" />
        ))}

        {days.map((date, index) => (
          <text key={date} x={xOf(index)} y={height - 12} textAnchor="middle" className="fill-slate-400 text-[11px] font-bold">
            {new Date(`${date}T00:00:00`).getDate()}
          </text>
        ))}
      </svg>
      <div className="flex justify-center gap-5 text-xs font-black">
        <span className="flex items-center gap-1 text-teal-600"><i className="h-2.5 w-2.5 rounded-full bg-teal-500" />기분</span>
        <span className="flex items-center gap-1 text-emerald-300"><i className="h-2.5 w-2.5 rounded-full bg-emerald-200" />숙면시간</span>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const todayMood = (data.moodEntries || []).find((item) => item.date === today);
  const todayReflection = (data.reflections || []).find((item) => item.date === today);
  const todayGratitude = (data.gratitudeEntries || []).find((item) => item.date === today);
  const selectedMood = moods.find((mood) => mood[0] === todayMood?.mood) || moods[3];
  const [moodKey, setMoodKey] = useState(todayMood?.mood || selectedMood[0]);
  const [score, setScore] = useState(todayMood?.score || selectedMood[4]);
  const [sleepHours, setSleepHours] = useState(todayMood?.sleepHours || "");
  const [summary, setSummary] = useState(todayReflection?.body || todayReflection?.memo || "");
  const [gratitude, setGratitude] = useState([0, 1, 2].map((index) => todayGratitude?.items?.[index] || ""));

  const load = () => setData(getAllData());
  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  useEffect(() => {
    const mood = moods.find((item) => item[0] === moodKey);
    if (mood && !todayMood?.score) setScore(mood[4]);
  }, [moodKey]);

  const weekStart = getWeekStart(today);
  const lastWeekStart = addDays(weekStart, -7);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const lastWeekDays = Array.from({ length: 7 }, (_, index) => addDays(lastWeekStart, index));
  const entriesByDate = (data.moodEntries || []).reduce((map, entry) => ({ ...map, [entry.date]: entry }), {});
  const weekMood = oneDecimal(average(weekDays.map((date) => entriesByDate[date]?.score)));
  const lastWeekMood = oneDecimal(average(lastWeekDays.map((date) => entriesByDate[date]?.score)));
  const weekSleep = oneDecimal(average(weekDays.map((date) => entriesByDate[date]?.sleepHours)));
  const lastWeekSleep = oneDecimal(average(lastWeekDays.map((date) => entriesByDate[date]?.sleepHours)));
  const moodDiff = oneDecimal(weekMood - lastWeekMood);
  const sleepDiff = oneDecimal(weekSleep - lastWeekSleep);

  const saveMoodAndSleep = () => {
    const mood = moods.find((item) => item[0] === moodKey) || moods[3];
    const next = getAllData();
    next.moodEntries = [
      {
        id: todayMood?.id || `mood-${Date.now()}`,
        date: today,
        mood: mood[0],
        emoji: mood[1],
        label: mood[2],
        color: mood[3],
        score: Number(score) || mood[4],
        sleepHours: Number(sleepHours) || 0,
        createdAt: today,
        updatedAt: today
      },
      ...(next.moodEntries || []).filter((item) => item.date !== today)
    ];
    saveAllData(next);
  };

  const saveJournal = () => {
    const next = getAllData();
    next.reflections = [
      { id: todayReflection?.id || `reflection-${Date.now()}`, date: today, title: "오늘 요약", body: summary, memo: summary, createdAt: today, updatedAt: today },
      ...(next.reflections || []).filter((item) => item.date !== today)
    ];
    next.gratitudeEntries = [
      { id: todayGratitude?.id || `gratitude-${Date.now()}`, date: today, items: gratitude, createdAt: today, updatedAt: today },
      ...(next.gratitudeEntries || []).filter((item) => item.date !== today)
    ];
    saveAllData(next);
  };

  return (
    <>
      <PageHeader eyebrow={today} title="오늘 기록" />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-4">
          <GlassCard>
            <SectionTitle>오늘 기분과 숙면</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood[0]}
                  onClick={() => {
                    setMoodKey(mood[0]);
                    setScore(mood[4]);
                  }}
                  className={`rounded-[22px] p-4 text-center transition ${moodKey === mood[0] ? "ring-2 ring-clover-deep" : "bg-white/50 hover:bg-white/75"}`}
                  style={{ background: moodKey === mood[0] ? mood[3] : undefined }}
                >
                  <p className="text-3xl">{mood[1]}</p>
                  <p className="mt-2 text-sm font-bold">{mood[2]}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                기분 점수 1-5
                <AppInput type="number" min="1" max="5" step="0.5" value={score} onChange={(event) => setScore(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                숙면시간
                <AppInput type="number" min="0" max="24" step="0.5" value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} placeholder="예: 7.5" />
              </label>
            </div>
            <AppButton className="mt-3" onClick={saveMoodAndSleep}>기분/숙면 저장</AppButton>
          </GlassCard>

          <GlassCard>
            <SectionTitle>오늘 요약</SectionTitle>
            <AppTextarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="오늘을 한 문단으로 정리해보세요." />
          </GlassCard>

          <GlassCard>
            <SectionTitle>감사 일기 3개</SectionTitle>
            <div className="grid gap-2">
              {gratitude.map((item, index) => (
                <AppInput key={index} value={item} onChange={(event) => setGratitude((current) => current.map((value, i) => i === index ? event.target.value : value))} placeholder={`${index + 1}. 감사한 일`} />
              ))}
            </div>
            <AppButton className="mt-3" onClick={saveJournal}>기록 저장</AppButton>
          </GlassCard>
        </div>

        <div className="grid h-fit gap-4">
          <GlassCard>
            <SectionTitle>📈 기분 & 숙면 트렌드 (14일)</SectionTitle>
            <TrendChart entries={data.moodEntries || []} today={today} />
          </GlassCard>

          <GlassCard>
            <SectionTitle>{getWeekNumber(today)}째주 요약</SectionTitle>
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/55 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-clover-deep">기분 점수</p>
                <p className="mt-1 text-3xl font-black">{weekMood || "-"}점</p>
                <p className="mt-1 text-sm font-bold text-clover-sub">
                  {lastWeekMood ? `지난주보다 ${Math.abs(moodDiff)}점 ${moodDiff >= 0 ? "좋아졌어요! 🙂" : "낮아졌어요. 오늘은 조금 느슨하게 가요."}` : "지난주 기록이 쌓이면 비교해줄게요."}
                </p>
              </div>
              <div className="rounded-2xl bg-white/55 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-clover-deep">평균 1일 숙면시간</p>
                <p className="mt-1 text-3xl font-black">{weekSleep || "-"}시간</p>
                <p className="mt-1 text-sm font-bold text-clover-sub">
                  {lastWeekSleep ? `지난주보다 ${Math.abs(sleepDiff)}시간 ${sleepDiff >= 0 ? "더 잤어요! 🙂" : "덜 잤어요. 회복 시간을 조금 챙겨요."}` : "지난주 수면 기록이 있으면 차이를 보여줄게요."}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
