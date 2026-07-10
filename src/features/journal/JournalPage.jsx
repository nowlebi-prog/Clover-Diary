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

function MiniTrend({ entries, today }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(today, index - 13)), [today]);
  const byDate = entries.reduce((map, item) => ({ ...map, [item.date]: item }), {});
  return (
    <div className="grid grid-cols-14 items-end gap-1">
      {days.map((date) => {
        const score = Number(byDate[date]?.score || 0);
        return (
          <div key={date} className="grid gap-1 text-center">
            <span className="mx-auto w-3 rounded-full bg-teal-400" style={{ height: `${Math.max(8, score * 14)}px`, opacity: score ? 1 : 0.2 }} />
            <span className="text-[10px] font-bold text-clover-sub">{new Date(`${date}T00:00:00`).getDate()}</span>
          </div>
        );
      })}
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
    load();
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
    load();
  };

  return (
    <>
      <PageHeader eyebrow={today} title="오늘 기록" />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-4">
          <GlassCard>
            <SectionTitle>기분과 숙면</SectionTitle>
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
              <label className="grid gap-1 text-sm font-bold">기분 점수 1-5<AppInput type="number" min="1" max="5" step="0.5" value={score} onChange={(event) => setScore(event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">숙면시간<AppInput type="number" min="0" max="24" step="0.5" value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} placeholder="예: 7.5" /></label>
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
            <SectionTitle>기분 흐름 14일</SectionTitle>
            <MiniTrend entries={data.moodEntries || []} today={today} />
          </GlassCard>
          <GlassCard>
            <SectionTitle>오늘 저장된 기록</SectionTitle>
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/55 p-4">
                <p className="text-xs font-black text-clover-deep">기분</p>
                <p className="mt-1 font-bold">{todayMood ? `${todayMood.emoji} ${todayMood.label} · ${todayMood.score}점 · ${todayMood.sleepHours || 0}시간` : "아직 저장 전이에요."}</p>
              </div>
              <div className="rounded-2xl bg-white/55 p-4">
                <p className="text-xs font-black text-clover-deep">오늘 요약</p>
                <p className="mt-1 text-sm font-bold">{todayReflection?.body || todayReflection?.memo || "아직 저장된 요약이 없어요."}</p>
              </div>
              <div className="rounded-2xl bg-white/55 p-4">
                <p className="text-xs font-black text-clover-deep">감사 일기</p>
                <ul className="mt-1 grid gap-1 text-sm font-bold">
                  {(todayGratitude?.items || []).filter(Boolean).map((item, index) => <li key={index}>· {item}</li>)}
                  {!(todayGratitude?.items || []).filter(Boolean).length && <li className="text-clover-sub">아직 저장된 감사 일기가 없어요.</li>}
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
