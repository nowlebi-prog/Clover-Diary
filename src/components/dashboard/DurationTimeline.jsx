import { useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import SectionTitle from "../common/SectionTitle";

const hours = Array.from({ length: 24 }, (_, index) => index);

const hourOf = (item) => {
  const raw = item.time || item.startedAt;
  if (!raw) return null;
  if (typeof raw === "number") return new Date(raw).getHours();
  const match = String(raw).match(/(\d{1,2}):/);
  return match ? Number(match[1]) : null;
};

export default function DurationTimeline({ items = [], date, onSaveEntries }) {
  const [drafts, setDrafts] = useState({});
  const byHour = hours.map((hour) => ({
    hour,
    items: items.filter((item) => hourOf(item) === hour)
  }));
  const dirtyEntries = useMemo(
    () => Object.entries(drafts).filter(([, value]) => value.trim()),
    [drafts]
  );

  const saveDrafts = () => {
    if (!dirtyEntries.length) return;
    onSaveEntries?.(
      dirtyEntries.map(([hour, title]) => ({
        hour: Number(hour),
        title: title.trim()
      }))
    );
    setDrafts({});
  };

  return (
    <section className="glass relative rounded-[28px] bg-[#FFFDF5]/75 p-5">
      <SectionTitle>Duration timeline</SectionTitle>

      {dirtyEntries.length > 0 && (
        <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2 md:right-8">
          <AppButton onClick={saveDrafts} className="shadow-glass">
            입력 {dirtyEntries.length}
          </AppButton>
        </div>
      )}

      <div className="mt-2 grid gap-0">
        {byHour.map(({ hour, items: hourItems }) => (
          <div key={hour} className="grid min-h-14 grid-cols-[38px_1fr] gap-3 border-b border-clover-line/70">
            <div className="pt-2 text-right text-xs font-bold text-clover-sub">{String(hour).padStart(2, "0")}</div>
            <div className="relative py-1">
              <span className="absolute left-0 top-0 h-full w-px bg-clover-line" />
              <div className="ml-4 grid gap-1">
                {hourItems.map((item, index) => (
                  <article key={`${item.id || item.title}-${index}`} className="rounded-2xl bg-white/70 px-3 py-2 text-sm">
                    <b>{item.title}</b>
                    {item.minutes && <span className="ml-2 text-clover-sub">{item.minutes}분</span>}
                  </article>
                ))}
                <input
                  value={drafts[hour] || ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [hour]: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) saveDrafts();
                  }}
                  placeholder="여기에 바로 기록"
                  className="min-h-10 rounded-2xl border border-transparent bg-white/35 px-3 text-sm text-clover-text outline-none transition placeholder:text-clover-sub/60 focus:border-clover-primary focus:bg-white/80 focus:ring-2 focus:ring-clover-primary/30"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-clover-sub">
        {date} 기준으로 일정, 기록, 타임트래커를 시간대별로 모아 보여줘요. 입력 후 오른쪽의 입력 버튼을 누르면 저장돼요.
      </p>
    </section>
  );
}
