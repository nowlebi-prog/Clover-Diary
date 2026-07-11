import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import QuickAddModal from "../dashboard/QuickAddModal";
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
    <div className="mx-auto flex max-w-[1120px] gap-5 px-4 py-5 pb-28 md:px-6 md:pb-8">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <QuickAddModal open={Boolean(quickAddType)} initialType={quickAddType || "todo"} onClose={() => setQuickAddType(null)} />
      {weeklyReport && <WeeklyReportModal data={weeklyReport.data} today={weeklyReport.today} onClose={closeWeeklyReport} />}
      {!weeklyReport && routineCoach && <RoutineCoachModal data={routineCoach.data} today={routineCoach.today} onClose={closeRoutineCoach} />}
      {!quickAddType && !weeklyReport && !routineCoach && <TodayTaskReminder />}
      <BottomNav />
    </div>
  );
}
