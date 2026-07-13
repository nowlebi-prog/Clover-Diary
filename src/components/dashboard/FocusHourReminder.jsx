import { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import { getActiveSession } from "../../lib/storage/localStorageAdapter";
import { computeElapsed } from "../../lib/utils/workUtils";

const ONE_HOUR_SECONDS = 60 * 60;

export default function FocusHourReminder() {
  const [reminder, setReminder] = useState(null);

  useEffect(() => {
    const check = () => {
      const session = getActiveSession();
      if (!session) {
        setReminder(null);
        return;
      }

      const elapsed = computeElapsed(session, Date.now());
      const key = `clover-focus-hour-reminder:${session.id}`;
      if (elapsed.workSec >= ONE_HOUR_SECONDS && !sessionStorage.getItem(key)) {
        setReminder({ session, key });
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
    sessionStorage.setItem(reminder.key, "seen");
    setReminder(null);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/20 p-0 sm:place-items-center sm:p-6">
      <section className="w-full rounded-t-[30px] border border-white/80 bg-white/95 p-6 text-center shadow-2xl backdrop-blur sm:max-w-sm sm:rounded-[30px]">
        <button type="button" onClick={close} className="mb-2 ml-auto grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-sm font-black text-clover-sub">
          닫기
        </button>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-4xl">💚</div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-clover-deep">Focus Break</p>
        <h2 className="mt-2 text-xl font-black text-clover-ink">집중한지 1시간, 칭찬해!</h2>
        <p className="mx-auto mt-3 max-w-[260px] text-sm font-bold leading-6 text-clover-sub">
          물 마시고, 어깨랑 손목을 살짝 스트레칭 해볼까?
        </p>
        <p className="mt-4 truncate rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-clover-deep">
          {reminder.session.title}
        </p>
        <AppButton className="mt-5 w-full" onClick={close}>좋아, 잠깐 쉬어갈게</AppButton>
      </section>
    </div>
  );
}
