import { useEffect, useRef, useState } from "react";
import AppButton from "../common/AppButton";
import { getActiveSession } from "../../lib/storage/localStorageAdapter";
import { computeElapsed } from "../../lib/utils/workUtils";

const BREAK_INTERVAL_SECONDS = 30 * 60;

export default function FocusHourReminder() {
  const [reminder, setReminder] = useState(null);
  const reminderRef = useRef(null);

  useEffect(() => {
    reminderRef.current = reminder;
  }, [reminder]);

  useEffect(() => {
    const check = () => {
      if (reminderRef.current) return;

      const session = getActiveSession();
      if (!session) {
        setReminder(null);
        return;
      }

      const elapsed = computeElapsed(session, Date.now());
      const bucket = Math.floor(elapsed.workSec / BREAK_INTERVAL_SECONDS);
      const key = `clover-focus-break-reminder:${session.id}`;
      const seenBucket = Number(sessionStorage.getItem(key) || 0);

      if (bucket >= 1 && bucket > seenBucket) {
        setReminder({ session, key, bucket });
      }
    };

    check();
    const timer = window.setInterval(check, 30 * 1000);
    window.addEventListener("clover-data-change", check);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("clover-data-change", check);
    };
  }, []);

  if (!reminder) return null;

  const close = () => {
    const session = getActiveSession();
    const elapsed = session ? computeElapsed(session, Date.now()) : null;
    const currentBucket = elapsed ? Math.max(reminder.bucket, Math.floor(elapsed.workSec / BREAK_INTERVAL_SECONDS)) : reminder.bucket;
    sessionStorage.setItem(reminder.key, String(currentBucket));
    setReminder(null);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/20 p-0 sm:place-items-center sm:p-6">
      <section className="w-full rounded-t-[30px] border border-white/80 bg-white/95 p-6 text-center shadow-2xl backdrop-blur sm:max-w-sm sm:rounded-[30px]">
        <button type="button" onClick={close} className="mb-2 ml-auto grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-sm font-black text-clover-sub">
          닫기
        </button>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-4xl">🧘</div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-clover-deep">Focus Break</p>
        <h2 className="mt-2 text-xl font-black text-clover-ink">자세 고치고 스트레칭!</h2>
        <p className="mx-auto mt-3 max-w-[260px] text-sm font-bold leading-6 text-clover-sub">
          30분 집중했어요. 어깨 내리고, 목이랑 손목을 가볍게 풀어볼까요?
        </p>
        <p className="mt-4 truncate rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-clover-deep">
          {reminder.session.title}
        </p>
        <AppButton className="mt-5 w-full" onClick={close}>좋아, 다시 집중하기</AppButton>
      </section>
    </div>
  );
}
