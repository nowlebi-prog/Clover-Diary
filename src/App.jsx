import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { getSession } from "./lib/auth/localAuthAdapter";
import { useState } from "react";
import LoginPage from "./features/auth/LoginPage";
import HomePage from "./features/home/HomePage";
import CalendarPage from "./features/calendar/CalendarPage";
import DailyPage from "./features/daily/DailyPage";
import TasksPage from "./features/tasks/TasksPage";
import HabitsPage from "./features/habits/HabitsPage";
import LifePage from "./features/life/LifePage";
import MoneyPage from "./features/money/MoneyPage";
import ArchivePage from "./features/archive/ArchivePage";
import CampaignsPage from "./features/campaigns/CampaignsPage";
import FilesPage from "./features/files/FilesPage";
import SettingsPage from "./features/settings/SettingsPage";

function Protected({ session }) {
  if (!session) return <Navigate to="/login" replace />;
  return <AppShell />;
}

export default function App() {
  const [session, setSession] = useState(getSession());

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage onLogin={setSession} />} />
      <Route element={<Protected session={session} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/life" element={<LifePage />} />
        <Route path="/money" element={<MoneyPage />} />
        <Route path="/content" element={<ArchivePage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/settings" element={<SettingsPage onLogout={setSession} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
