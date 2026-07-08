import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import TodoDock from "./TodoDock";
import FloatingQuickAddButton from "../common/FloatingQuickAddButton";

export default function AppShell() {
  return (
    <div className="mx-auto flex max-w-[1180px] gap-5 px-4 py-5 pb-28 md:px-6 md:pb-8">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <TodoDock />
      <FloatingQuickAddButton onClick={() => window.dispatchEvent(new Event("clover-quick-add"))} />
      <BottomNav />
    </div>
  );
}
