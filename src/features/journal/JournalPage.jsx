import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import Modal from "../../components/common/Modal";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { addDays, monthMatrix, toDateKey } from "../../lib/utils/date";

const moods = [
  ["happy", "◡", "기분 좋은", "#FFE88F", 5],
  ["excited", "ᵕ", "설레는", "#FFB36B", 5],
  ["calm", "ᴗ", "차분한", "#BFEFE0", 4],
  ["normal", "•", "평범한", "#E7F0EA", 3],
  ["tired", "﹏", "지친", "#E5E7EB", 2],
  ["sad", "╥", "슬픈", "#BFE3FF", 2],
  ["anxious", "o", "불안한", "#D8C7FF", 2],
  ["angry", "皿", "화나는", "#FF9FB0", 1]
];

const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const moodByKey = (key) => moods.find((item) => item[0] === key) || moods[3];

function TrendGraph({ entries, today }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(today, index - 13)), [today]);
  const byDate = Object.fromEntries(entries.map((item) => [item.date, item]));

  return (
    <div className="rounded-[24px] bg-white/45 p-4">
      <div className="flex h-40 items-end gap-2 overflow-x-auto pb-2">
        {days.map((date) => {
          const entry = byDate[date];
          const score = Number(entry?.score || 0);
          const sleep = Number(entry?.sleepHours || 0);
          return (
            <div key={date} className="flex min-w-9 flex-col items-center justify-end gap-1 text-center">
              <span className="grid h-7 w-7 place-items-center rounded-[35%] text-sm font-black" style={{ background: entry?.color || "#F1F5F9" }}>
                {entry?.emoji || "·"}
              </span>
              <span className="w-2 rounded-full bg-teal-400" style={{ height: `${Math.max(6, score * 18)}px`, opacity: score ? 1 : 0.2 }} />
              <span className="w-2 rounded-full bg-sky-300" style={{ height: `${Math.max(4, sleep * 6)}px`, opacity: sleep ? 0.75 : 0.15 }} />
              <span className="text-[10px] font-bold text-clover-sub">{new Date(`${date}T00:00:00`).getDate()}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs font-bold text-clover-sub">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-teal-400" />기분</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-300" />수면</span>
      </div>
    </div>
  );
}

function MonthlyJournalModal({ data, today, onClose }) {
  const now = new Date(`${today}T00:00:00`);
  const year = now.getFullYear();
  const month = now.getMonth();
  const moodsByDate = Object.fromEntries((data.moodEntries || []).map((item) => [item.date, item]));
  const reflectionsByDate = Object.fromEntries((data.reflections || []).map((item) => [item.date, item]));
  const gratitudeByDate = Object.fromEntries((data.gratitudeEntries || []).map((item) => [item.date, item]));

  return (
    <Modal title="이달의 기록" onClose={onClose}>
      <div className="grid gap-4">
        <p className="text-sm font-bold text-clover-sub">기분, 수면, 오늘 요약, 감사일기를 날짜별로 모아봤어요.</p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-clover-sub">
          {["월", "화", "수", "목", "금", "토", "일"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {monthMatrix(year, month).map((cell) => {
            const mood = moodsByDate[cell.date];
            const reflection = reflectionsByDate[cell.date];
            const gratitude = gratitudeByDate[cell.date];
            const hasRecord = mood || reflection || gratitude;
            return (
              <div key={cell.date} className={`min-h-24 rounded-2xl border p-2 ${cell.inMonth ? "border-white/70 bg-white/55" : "border-transparent bg-white/20 opacity-40"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black ${cell.isToday ? "text-clover-deep" : "text-clover-sub"}`}>{cell.day}</span>
                  <span>{mood?.emoji}</span>
                </div>
                {hasRecord && (
                  <div className="mt-2 grid gap-1 text-[11px] font-bold text-clover-sub">
                    {mood && <p>{mood.label} · {mood.score}점</p>}
                    {mood?.weather && <p>{mood.weather}</p>}
                    {reflection?.body && <p className="line-clamp-2 text-clover-text">{reflection.body}</p>}
                    {!!gratitude?.items?.filter(Boolean).length && <p>감사 {gratitude.items.filter(Boolean).length}개</p>}
                    {!!mood?.photos?.length && <p>사진 {mood.photos.length}장</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

export default function JournalPage() {
  const [data, setData] = useState(getAllData());
  const [showMonth, setShowMonth] = useState(false);
  const today = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const dateTabs = [addDays(today, -2), addDays(today, -1), today];

  const todayMood = (data.moodEntries || []).find((item) => item.date === selectedDate);
  const todayReflection = (data.reflections || []).find((item) => item.date === selectedDate);
  const todayGratitude = (data.gratitudeEntries || []).find((item) => item.date === selectedDate);
  const selectedMood = moodByKey(todayMood?.mood);

  const [moodKey, setMoodKey] = useState(todayMood?.mood || selectedMood[0]);
  const [score, setScore] = useState(todayMood?.score || selectedMood[4]);
  const [sleepHours, setSleepHours] = useState(todayMood?.sleepHours || "");
  const [weather, setWeather] = useState(todayMood?.weather || "");
  const [summary, setSummary] = useState(todayReflection?.body || todayReflection?.memo || "");
  const [gratitude, setGratitude] = useState([0, 1, 2].map((index) => todayGratitude?.items?.[index] || ""));
  const [photos, setPhotos] = useState(todayMood?.photos || []);

  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  useEffect(() => {
    const mood = moodByKey(todayMood?.mood);
    setMoodKey(todayMood?.mood || mood[0]);
    setScore(todayMood?.score || mood[4]);
    setSleepHours(todayMood?.sleepHours || "");
    setWeather(todayMood?.weather || "");
    setSummary(todayReflection?.body || todayReflection?.memo || "");
    setGratitude([0, 1, 2].map((index) => todayGratitude?.items?.[index] || ""));
    setPhotos(todayMood?.photos || []);
  }, [selectedDate, todayMood?.id, todayReflection?.id, todayGratitude?.id]);

  const addPhotos = (files) => {
    Array.from(files || []).slice(0, 6).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((current) => [
          ...current,
          { id: makeId("photo"), name: file.name, src: reader.result, createdAt: selectedDate }
        ].slice(-9));
      };
      reader.readAsDataURL(file);
    });
  };

  const saveTodayRecord = () => {
    const mood = moodByKey(moodKey);
    const next = getAllData();
    next.moodEntries = [
      {
        id: todayMood?.id || makeId("mood"),
        date: selectedDate,
        mood: mood[0],
        emoji: mood[1],
        label: mood[2],
        color: mood[3],
        score: Number(score) || mood[4],
        sleepHours: Number(sleepHours) || 0,
        weather: weather.trim(),
        photos,
        createdAt: todayMood?.createdAt || selectedDate,
        updatedAt: today
      },
      ...(next.moodEntries || []).filter((item) => item.date !== selectedDate)
    ];
    next.reflections = [
      {
        id: todayReflection?.id || makeId("reflection"),
        date: selectedDate,
        title: "오늘 요약",
        body: summary.trim(),
        memo: summary.trim(),
        createdAt: todayReflection?.createdAt || selectedDate,
        updatedAt: today
      },
      ...(next.reflections || []).filter((item) => item.date !== selectedDate)
    ];
    next.gratitudeEntries = [
      {
        id: todayGratitude?.id || makeId("gratitude"),
        date: selectedDate,
        items: gratitude,
        createdAt: todayGratitude?.createdAt || selectedDate,
        updatedAt: today
      },
      ...(next.gratitudeEntries || []).filter((item) => item.date !== selectedDate)
    ];
    saveAllData(next);
    setData(getAllData());
  };

  return (
    <>
      <PageHeader eyebrow={selectedDate} title={selectedDate === today ? "오늘 기록" : "지난 기록 수정"}>
        <AppButton variant="soft" onClick={() => setShowMonth(true)}>이달의 기록</AppButton>
        <AppButton onClick={saveTodayRecord}>기록 저장</AppButton>
      </PageHeader>

      <div className="mb-4 flex gap-2 rounded-[24px] border border-white/70 bg-white/45 p-2">
        {dateTabs.map((date) => {
          const label = date === today ? "오늘" : new Date(`${date}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
          const hasRecord = (data.moodEntries || []).some((item) => item.date === date) || (data.reflections || []).some((item) => item.date === date) || (data.gratitudeEntries || []).some((item) => item.date === date);
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelectedDate(date)}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${selectedDate === date ? "bg-clover-deep text-white" : "bg-white/70 text-clover-sub hover:bg-white"}`}
            >
              {label}
              {hasRecord && <span className={`ml-1 ${selectedDate === date ? "text-white" : "text-emerald-500"}`}>●</span>}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-4">
          <GlassCard>
            <SectionTitle>기분과 수면</SectionTitle>
            <div className="grid grid-cols-4 gap-3">
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
                  <p className="text-2xl font-black">{mood[1]}</p>
                  <p className="mt-2 text-sm font-bold">{mood[2]}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm font-bold">기분 점수 1-5<AppInput type="number" min="1" max="5" step="0.5" value={score} onChange={(event) => setScore(event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">수면 시간<AppInput type="number" min="0" max="24" step="0.5" value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} placeholder="예: 7.5" /></label>
              <label className="grid gap-1 text-sm font-bold">날씨<AppInput value={weather} onChange={(event) => setWeather(event.target.value)} placeholder="맑음, 비, 흐림..." /></label>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>오늘 요약</SectionTitle>
            <AppTextarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="오늘 하루를 짧게 정리해보세요." />
          </GlassCard>

          <GlassCard>
            <SectionTitle>감사일기 3개</SectionTitle>
            <div className="grid gap-2">
              {gratitude.map((item, index) => (
                <AppInput key={index} value={item} onChange={(event) => setGratitude((current) => current.map((value, i) => (i === index ? event.target.value : value)))} placeholder={`${index + 1}. 오늘 감사한 일`} />
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>오늘 사진</SectionTitle>
            <label className="grid cursor-pointer place-items-center rounded-[24px] border border-dashed border-clover-deep/30 bg-white/45 p-6 text-center text-sm font-bold text-clover-deep">
              사진 올리기
              <input className="hidden" type="file" accept="image/*" multiple onChange={(event) => addPhotos(event.target.files)} />
            </label>
            {!!photos.length && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <button key={photo.id} type="button" onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))} className="aspect-square overflow-hidden rounded-2xl bg-white/60">
                    <img src={photo.src} alt={photo.name || "오늘 사진"} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <AppButton className="mt-3" onClick={saveTodayRecord}>기록 저장</AppButton>
          </GlassCard>
        </div>

        <div className="grid h-fit gap-4">
          <GlassCard>
            <SectionTitle>기분 & 수면 흐름 14일</SectionTitle>
            <TrendGraph entries={data.moodEntries || []} today={today} />
          </GlassCard>
          <GlassCard>
            <SectionTitle action={<button className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep" onClick={() => setShowMonth(true)}>전체 보기</button>}>오늘 저장된 기록</SectionTitle>
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/55 p-4">
                <p className="text-xs font-black text-clover-deep">기분 / 수면 / 날씨</p>
                <p className="mt-1 font-bold">{todayMood ? `${todayMood.emoji} ${todayMood.label} · ${todayMood.score}점 · ${todayMood.sleepHours || 0}시간 · ${todayMood.weather || "날씨 미입력"}` : "아직 저장된 기록이 없어요"}</p>
              </div>
              <div className="rounded-2xl bg-white/55 p-4">
                <p className="text-xs font-black text-clover-deep">오늘 요약</p>
                <p className="mt-1 text-sm font-bold">{todayReflection?.body || todayReflection?.memo || "아직 저장된 요약이 없어요"}</p>
              </div>
              <div className="rounded-2xl bg-white/55 p-4">
                <p className="text-xs font-black text-clover-deep">감사일기</p>
                <ul className="mt-1 grid gap-1 text-sm font-bold">
                  {(todayGratitude?.items || []).filter(Boolean).map((item, index) => <li key={index}>· {item}</li>)}
                  {!(todayGratitude?.items || []).filter(Boolean).length && <li className="text-clover-sub">아직 저장된 감사일기가 없어요</li>}
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <button type="button" onClick={() => setShowMonth(true)} className="fixed bottom-5 right-5 z-30 rounded-full bg-clover-deep px-5 py-3 text-sm font-black text-white shadow-glass">
        이달의 기록
      </button>

      {showMonth && <MonthlyJournalModal data={data} today={today} onClose={() => setShowMonth(false)} />}
    </>
  );
}
