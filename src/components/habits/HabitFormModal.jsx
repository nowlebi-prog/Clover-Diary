import { useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import AppTextarea from "../common/AppTextarea";
import Modal from "../common/Modal";

const defaults = { name: "", icon: "🍀", color: "#8DDFA8", frequencyType: "daily", targetCount: 7, customDays: [], memo: "", status: "active" };

export default function HabitFormModal({ habit, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...defaults, ...(habit || {}) });
  if (!habit) return null;
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  return (
    <Modal title={form.id ? "습관 수정" : "습관 추가"} onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-bold">습관 이름<AppInput value={form.name} onChange={(event) => set("name", event.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm font-bold">아이콘<AppInput value={form.icon} maxLength={4} onChange={(event) => set("icon", event.target.value)} /></label>
          <label className="grid gap-1 text-sm font-bold">색상<AppInput type="color" value={form.color} onChange={(event) => set("color", event.target.value)} /></label>
        </div>
        <label className="grid gap-1 text-sm font-bold">반복 방식
          <AppSelect value={form.frequencyType} onChange={(event) => set("frequencyType", event.target.value)}>
            <option value="daily">매일</option>
            <option value="weekdays">평일</option>
            <option value="weekends">주말</option>
            <option value="weekly_count">주간 횟수</option>
            <option value="custom_days">요일 직접 선택</option>
          </AppSelect>
        </label>
        <label className="grid gap-1 text-sm font-bold">주간 목표 횟수<AppInput type="number" min="1" max="7" value={form.targetCount} onChange={(event) => set("targetCount", Number(event.target.value))} /></label>
        <label className="grid gap-1 text-sm font-bold">상태
          <AppSelect value={form.status} onChange={(event) => set("status", event.target.value)}>
            <option value="active">진행중</option>
            <option value="paused">잠시 멈춤</option>
            <option value="archived">보관</option>
          </AppSelect>
        </label>
        <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.memo} onChange={(event) => set("memo", event.target.value)} /></label>
        <div className="flex flex-wrap gap-2">
          <AppButton onClick={() => onSave(form)}>저장</AppButton>
          {form.id && <AppButton variant="soft" onClick={() => onSave({ ...form, status: form.status === "paused" ? "active" : "paused" })}>{form.status === "paused" ? "다시 시작" : "잠시 멈춤"}</AppButton>}
          {form.id && <AppButton variant="danger" onClick={() => onDelete(form.id)}>삭제</AppButton>}
        </div>
      </div>
    </Modal>
  );
}
