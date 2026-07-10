import SectionTitle from "../common/SectionTitle";

const hours = Array.from({ length: 24 }, (_, index) => index);

const hourOf = (item) => {
  const raw = item.time || item.startedAt;
  if (!raw) return null;
  if (typeof raw === "number") return new Date(raw).getHours();
  const match = String(raw).match(/(\d{1,2}):/);
  return match ? Number(match[1]) : null;
};

export default function DurationTimeline({ items = [], date }) {
  const byHour = hours.map((hour) => ({
    hour,
    items: items.filter((item) => hourOf(item) === hour)
  }));

  return (
    <section className="glass rounded-[28px] bg-[#FFFDF5]/75 p-5">
      <SectionTitle>Duration timeline</SectionTitle>
      <div className="mt-2 grid gap-0">
        {byHour.map(({ hour, items: hourItems }) => (
          <div key={hour} className="grid min-h-10 grid-cols-[38px_1fr] gap-3 border-b border-clover-line/70">
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
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-clover-sub">{date} 기준으로 일정, 기록, 타임트래커를 시간대별로 모아 보여줘요.</p>
    </section>
  );
}
