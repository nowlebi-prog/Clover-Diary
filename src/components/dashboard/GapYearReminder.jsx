import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppButton from "../common/AppButton";
import Modal from "../common/Modal";
import { GAP_YEAR_TODO_TITLE, isGapYearTodoDoneToday } from "../../lib/storage/localStorageAdapter";

export default function GapYearReminder() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      if (sessionStorage.getItem("clover-gapyear-dismissed") === "1") return;
      if (!isGapYearTodoDoneToday()) setOpen(true);
    };
    const timer = setTimeout(check, 800);
    window.addEventListener("clover-data-change", check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("clover-data-change", check);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("clover-gapyear-dismissed", "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Modal title="오늘 아직 안 했어요" onClose={dismiss}>
      <div className="grid gap-3">
        <p className="text-sm font-bold text-clover-sub">
          "{GAP_YEAR_TODO_TITLE}" 항목이 아직 완료되지 않았어요. 매일 꼭 해야 하는 항목이에요.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/gapyear"><AppButton onClick={dismiss}>갭이어 탭으로 이동</AppButton></Link>
          <AppButton variant="soft" onClick={dismiss}>나중에</AppButton>
        </div>
      </div>
    </Modal>
  );
}
