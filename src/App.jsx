import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { getSessionAsync, onAuthChange, usingCloud } from "./lib/auth/authAdapter";
import { useEffect, useState } from "react";
import { getStorageUser, setStorageUser } from "./lib/storage/localStorageAdapter";
import { startCloudSync, stopCloudSync } from "./lib/storage/cloudSync";
import { startGoogleSheetsBackup } from "./lib/storage/googleSheetsBackup";
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
import StudyPage from "./features/study/StudyPage";
import ContentPage from "./features/content/ContentPage";
import ArchivePage from "./features/archive/ArchivePage";
import CampaignsPage from "./features/campaigns/CampaignsPage";
import FilesPage from "./features/files/FilesPage";
import SettingsPage from "./features/settings/SettingsPage";
import SchedulePage from "./features/schedule/SchedulePage";
import PlanPage from "./features/plan/PlanPage";
import WorkLogPage from "./features/worklog/WorkLogPage";
import MemoPage from "./features/memo/MemoPage";
import QuickLinksPage from "./features/quickLinks/QuickLinksPage";

function Protected({ session }) {
  if (!session) return <Navigate to="/login" replace />;
  return (
    <>
      <AppShell />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState("");

  const acceptSession = (next) => {
    const userId = usingCloud ? next?.user?.id || null : null;
    if (getStorageUser() !== userId) {
      stopCloudSync();
      setStorageUser(userId);
    }
    setSession(next);
    setReady(true);
    setAuthError("");
  };

  useEffect(() => {
    let mounted = true;
    let authEventSeen = false;
    const unsubscribe = onAuthChange((next) => {
      authEventSeen = true;
      if (mounted) acceptSession(next);
    });
    getSessionAsync().then((next) => {
      if (mounted && !authEventSeen) acceptSession(next);
    }).catch((error) => { if (mounted && !authEventSeen) setAuthError(error.message); });
    return () => { mounted = false; unsubscribe(); stopCloudSync(); };
  }, []);

  useEffect(() => {
    if (!session) return;
    const stopBackup = startGoogleSheetsBackup();
    const stopSync = usingCloud ? startCloudSync(session.user.id) : () => {};
    return () => { stopSync(); stopBackup(); };
  }, [session?.user?.id]);

  if (authError) return <main className="p-8"><p role="alert">로그인 상태를 확인하지 못했어요: {authError}</p><button onClick={() => window.location.reload()}>다시 확인</button></main>;
  if (!ready) return <main className="p-8" role="status">로그인 상태 확인 중…</main>;

  return (
    <Routes key={session?.user?.id || "signed-out"}>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage onLogin={acceptSession} />} />
      <Route element={<Protected session={session} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/mandalart" element={<MandalartPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/life" element={<LifePage />} />
        <Route path="/money" element={<MoneyPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/worklog" element={<WorkLogPage />} />
        <Route path="/memo" element={<MemoPage />} />
        <Route path="/quick-links" element={<QuickLinksPage />} />
        <Route path="/settings" element={<SettingsPage onLogout={() => acceptSession(null)} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
