import { useEffect, useState } from "react";

const clamp = (value, max) => {
  const num = Number(value.replace(/\D/g, "").slice(0, 2));
  if (Number.isNaN(num)) return "";
  return String(Math.min(Math.max(num, 0), max));
};

export default function TimeField({ value = "", onChange, disabled = false, className = "" }) {
  const [hour, minute] = (value || "").split(":");
  const [h, setH] = useState(hour || "");
  const [m, setM] = useState(minute || "");

  useEffect(() => {
    const [nh, nm] = (value || "").split(":");
    setH(nh || "");
    setM(nm || "");
  }, [value]);

  const commit = (nextH, nextM) => {
    if (nextH === "" && nextM === "") {
      onChange("");
      return;
    }
    const paddedH = String(nextH || "0").padStart(2, "0");
    const paddedM = String(nextM || "0").padStart(2, "0");
    onChange(`${paddedH}:${paddedM}`);
  };

  return (
    <div className={`flex items-center gap-1 rounded-2xl border border-white/70 bg-white/65 px-3 ${disabled ? "opacity-50" : ""} ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        disabled={disabled}
        value={h}
        placeholder="00"
        onChange={(event) => setH(clamp(event.target.value, 23))}
        onBlur={() => commit(h, m)}
        className="min-h-11 w-9 border-none bg-transparent text-center text-sm font-bold outline-none"
      />
      <span className="text-sm font-bold text-clover-sub">시</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        disabled={disabled}
        value={m}
        placeholder="00"
        onChange={(event) => setM(clamp(event.target.value, 59))}
        onBlur={() => commit(h, m)}
        className="min-h-11 w-9 border-none bg-transparent text-center text-sm font-bold outline-none"
      />
      <span className="text-sm font-bold text-clover-sub">분</span>
    </div>
  );
}
