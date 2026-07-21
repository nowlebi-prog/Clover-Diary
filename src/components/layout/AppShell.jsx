import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import FloatingScratchMemo from "./FloatingScratchMemo";
import Sidebar from "./Sidebar";
import QuickAddModal from "../dashboard/QuickAddModal";
import FocusHourReminder from "../dashboard/FocusHourReminder";
import RoutineCoachModal from "../dashboard/RoutineCoachModal";
import TodayTaskReminder from "../dashboard/TodayTaskReminder";
import WeeklyReportModal from "../dashboard/WeeklyReportModal";
import { getAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

export default function AppShell() {
  const [quickAddType, setQuickAddType] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [routineCoach, setRoutineCoach] = useState(null);
  useEffect(() => {
    const open = (event) => setQuickAddType(event.detail || "todo");
    window.addEventListener("clover-quick-add", open);
    window.addEventListener("clover-open-quick-add", open);
    return () => {
      window.removeEventListener("clover-quick-add", open);
      window.removeEventListener("clover-open-quick-add", open);
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    if (now.getDay() !== 0) return;
    const today = toDateKey(now);
    const key = `clover-weekly-report-${today}`;
    const coachKey = `clover-routine-coach-${today}`;
    const data = getAllData();
    if (!localStorage.getItem(key)) setWeeklyReport({ data, today, key });
    if (!localStorage.getItem(coachKey)) setRoutineCoach({ data, today, key: coachKey });
  }, []);

  const closeWeeklyReport = () => {
    if (weeklyReport?.key) localStorage.setItem(weeklyReport.key, "seen");
    setWeeklyReport(null);
  };

  const closeRoutineCoach = () => {
    if (routineCoach?.key) localStorage.setItem(routineCoach.key, "seen");
    setRoutineCoach(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1120px] overflow-x-hidden px-3 py-4 pb-28 sm:px-4 md:gap-5 md:px-6 md:py-5 md:pb-8">
      <Sidebar />
      <main className="min-w-0 max-w-full flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <QuickAddModal open={Boolean(quickAddType)} initialType={quickAddType || "todo"} onClose={() => setQuickAddType(null)} />
      {weeklyReport && <WeeklyReportModal data={weeklyReport.data} today={weeklyReport.today} onClose={closeWeeklyReport} />}
      {!weeklyReport && routineCoach && <RoutineCoachModal data={routineCoach.data} today={routineCoach.today} onClose={closeRoutineCoach} />}
      {!quickAddType && !weeklyReport && !routineCoach && <TodayTaskReminder />}
      {!quickAddType && !weeklyReport && !routineCoach && <FocusHourReminder />}
      {!quickAddType && !weeklyReport && !routineCoach && <FloatingScratchMemo />}
      <BottomNav />
    </div>
  );
}
