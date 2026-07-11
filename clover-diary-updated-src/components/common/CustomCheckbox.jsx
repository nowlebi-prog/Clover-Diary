export default function CustomCheckbox({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange?.(!checked)} className="flex min-h-11 items-center gap-3 text-left">
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${checked ? "border-clover-deep bg-clover-deep text-white" : "border-clover-primary bg-white/60"}`}>
        {checked ? "✓" : ""}
      </span>
      {label && <span className={checked ? "text-clover-sub line-through" : "text-clover-text"}>{label}</span>}
    </button>
  );
}
