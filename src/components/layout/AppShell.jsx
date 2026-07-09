import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import TodoDock from "./TodoDock";
import FloatingQuickAddButton from "../common/FloatingQuickAddButton";
import QuickAddModal from "../dashboard/QuickAddModal";

export default function AppShell() {
  const [quickAddType, setQuickAddType] = useState(null);
  useEffect(() => {
    const open = (event) => setQuickAddType(event.detail || "todo");
    window.addEventListener("clover-quick-add", open);
    window.addEventListener("clover-open-quick-add", open);
    return () => {
      window.removeEventListener("clover-quick-add", open);
      window.removeEventListener("clover-open-quick-add", open);
    };
  }, []);
  return (
    <div className="mx-auto flex max-w-[1180px] gap-5 px-4 py-5 pb-28 md:px-6 md:pb-8">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <TodoDock />
      <FloatingQuickAddButton onClick={() => window.dispatchEvent(new Event("clover-quick-add"))} />
      <QuickAddModal open={Boolean(quickAddType)} initialType={quickAddType || "todo"} onClose={() => setQuickAddType(null)} />
      <BottomNav />
    </div>
  );
}
