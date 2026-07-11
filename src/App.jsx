import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { getSessionAsync, onAuthChange, usingCloud } from "./lib/auth/authAdapter";
import { startCloudSync, stopCloudSync } from "./lib/storage/cloudSync";
import { useEffect, useState } from "react";
import LoginPage from "./features/auth/LoginPage";
import HomePage from "./features/home/HomePage";
import MandalartPage from "./features/mandalart/MandalartPage";
import CalendarPage from "./features/calendar/CalendarPage";
import DailyPage from "./features/daily/DailyPage";
import JournalPage from "./features/journal/JournalPage";
import TasksPage from "./features/tasks/TasksPage";
import WorkPage from "./features/work/WorkPage";
import HabitsPage from "./features/habits/HabitsPage";
import LifePage from "./features/life/LifePage";
import MoneyPage from "./features/money/MoneyPage";
import ContentPage from "./features/content/ContentPage";
import ArchivePage from "./features/archive/ArchivePage";
import CampaignsPage from "./features/campaigns/CampaignsPage";
import FilesPage from "./features/files/FilesPage";
import SettingsPage from "./features/settings/SettingsPage";

function Protected({ session }) {
  if (!session) return <Navigate to="/login" replace />;
  return <AppShell />;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    getSessionAsync().then((initial) => {
      setSession(initial);
      setChecking(false);
      if (initial && usingCloud) startCloudSync(initial.user.id);
    });
    if (usingCloud) {
      unsub = onAuthChange((next) => {
        setSession(next);
        if (next) startCloudSync(next.user.id);
        else stopCloudSync();
      });
    }
    return unsub;
  }, []);

  if (checking) {
    return <div className="grid min-h-screen place-items-center text-sm font-bold text-clover-sub">불러오는 중…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage onLogin={setSession} />} />
      <Route element={<Protected session={session} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/plan" element={<Navigate to="/work" replace />} />
        <Route path="/mandalart" element={<MandalartPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/life" element={<LifePage />} />
        <Route path="/money" element={<MoneyPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/settings" element={<SettingsPage onLogout={setSession} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
