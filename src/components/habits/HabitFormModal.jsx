import { useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import AppTextarea from "../common/AppTextarea";
import Modal from "../common/Modal";

const defaults = { name: "", icon: "CL", color: "#8DDFA8", frequencyType: "daily", targetCount: 7, customDays: [], memo: "", status: "active" };

export default function HabitFormModal({ habit, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...defaults, ...(habit || {}) });
  if (!habit) return null;
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  return (
    <Modal title={form.id ? "Edit habit" : "Add habit"} onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-bold">Habit name<AppInput value={form.name} onChange={(event) => set("name", event.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm font-bold">Icon<AppInput value={form.icon} maxLength={3} onChange={(event) => set("icon", event.target.value.toUpperCase())} /></label>
          <label className="grid gap-1 text-sm font-bold">Color<AppInput type="color" value={form.color} onChange={(event) => set("color", event.target.value)} /></label>
        </div>
        <label className="grid gap-1 text-sm font-bold">Frequency
          <AppSelect value={form.frequencyType} onChange={(event) => set("frequencyType", event.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekends">Weekends</option>
            <option value="weekly_count">Weekly count</option>
            <option value="custom_days">Custom days</option>
          </AppSelect>
        </label>
        <label className="grid gap-1 text-sm font-bold">Weekly target<AppInput type="number" min="1" max="7" value={form.targetCount} onChange={(event) => set("targetCount", Number(event.target.value))} /></label>
        <label className="grid gap-1 text-sm font-bold">Status
          <AppSelect value={form.status} onChange={(event) => set("status", event.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </AppSelect>
        </label>
        <label className="grid gap-1 text-sm font-bold">Memo<AppTextarea value={form.memo} onChange={(event) => set("memo", event.target.value)} /></label>
        <div className="flex flex-wrap gap-2">
          <AppButton onClick={() => onSave(form)}>Save</AppButton>
          {form.id && <AppButton variant="soft" onClick={() => onSave({ ...form, status: form.status === "paused" ? "active" : "paused" })}>{form.status === "paused" ? "Activate" : "Pause"}</AppButton>}
          {form.id && <AppButton variant="danger" onClick={() => onDelete(form.id)}>Delete</AppButton>}
        </div>
      </div>
    </Modal>
  );
}
