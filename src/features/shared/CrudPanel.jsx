import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import CustomCheckbox from "../../components/common/CustomCheckbox";
import EmptyState from "../../components/common/EmptyState";
import GlassCard from "../../components/common/GlassCard";
import Modal from "../../components/common/Modal";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";

const today = () => new Date().toISOString().slice(0, 10);

function Field({ field, value, onChange }) {
  const common = { value: value ?? "", onChange: (event) => onChange(field.name, event.target.value), placeholder: field.placeholder || field.label };
  if (field.type === "textarea") return <AppTextarea {...common} />;
  if (field.type === "select") {
    return (
      <AppSelect {...common}>
        <option value="">선택</option>
        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
      </AppSelect>
    );
  }
  if (field.type === "checkbox") return <CustomCheckbox checked={Boolean(value)} onChange={(checked) => onChange(field.name, checked)} label={field.label} />;
  return <AppInput type={field.type || "text"} {...common} />;
}

export default function CrudPanel({ title, description, fields, getItems, createItem, updateItem, deleteItem, completedField = "completed", searchable = true, defaultItem = {} }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);

  const load = () => setItems(getItems());
  useEffect(() => {
    load();
    const quick = () => setEditing({ ...defaultItem });
    window.addEventListener("clover-data-change", load);
    window.addEventListener("clover-quick-add", quick);
    return () => {
      window.removeEventListener("clover-data-change", load);
      window.removeEventListener("clover-quick-add", quick);
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => Number(Boolean(a[completedField])) - Number(Boolean(b[completedField])));
    if (!q) return sorted;
    return sorted.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [items, query, completedField]);

  const save = () => {
    const payload = { ...editing };
    if (!payload.id) createItem(payload);
    else updateItem(payload.id, payload);
    setEditing(null);
    load();
  };

  return (
    <GlassCard>
      <SectionTitle action={<AppButton onClick={() => setEditing({ ...defaultItem })}>추가</AppButton>}>{title}</SectionTitle>
      {description && <p className="mb-4 text-sm text-clover-sub">{description}</p>}
      {searchable && <AppInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색" />}
      <div className="mt-4 grid gap-3">
        {visible.map((item) => {
          const titleField = fields.find((field) => field.primary)?.name || fields[0]?.name;
          const dateValue = item.dueDate || item.date || item.expectedDate || item.publishDate || item.uploadDueDate;
          const isUrgent = dateValue && dateValue <= today() && !item[completedField] && item.status !== "입금 완료";
          return (
            <article key={item.id} className={`rounded-[22px] bg-white/55 p-4 ${item[completedField] ? "opacity-55" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <CustomCheckbox checked={Boolean(item[completedField])} onChange={(checked) => updateItem(item.id, { [completedField]: checked })} />
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold ${item[completedField] ? "line-through" : ""}`}>{item[titleField] || item.title || item.name || "Untitled"}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-clover-sub">{item.memo || item.body || item.reason || item.project || item.category || "메모 없음"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.status && <StatusBadge tone={item.status.includes("미") ? "danger" : "mint"}>{item.status}</StatusBadge>}
                    {item.category && <StatusBadge tone="blue">{item.category}</StatusBadge>}
                    {dateValue && <StatusBadge tone={isUrgent ? "danger" : "cream"}>{dateValue}</StatusBadge>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <AppButton variant="ghost" onClick={() => setEditing(item)}>수정</AppButton>
                  <AppButton variant="ghost" onClick={() => deleteItem(item.id)}>삭제</AppButton>
                </div>
              </div>
            </article>
          );
        })}
        {!visible.length && <EmptyState />}
      </div>

      <Modal title={editing ? `${title} ${editing.id ? "수정" : "추가"}` : ""} onClose={() => setEditing(null)}>
        <div className="grid gap-3">
          {fields.map((field) => (
            <label key={field.name} className="grid gap-1 text-sm font-semibold text-clover-text">
              {field.type !== "checkbox" && <span>{field.label}</span>}
              <Field field={field} value={editing?.[field.name]} onChange={(name, value) => setEditing((current) => ({ ...current, [name]: value }))} />
            </label>
          ))}
          <AppButton onClick={save}>저장</AppButton>
        </div>
      </Modal>
    </GlassCard>
  );
}
