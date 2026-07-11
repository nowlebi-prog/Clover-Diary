export default function StarRating({ value = 0, onChange, size = "text-lg" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          className={`${size} leading-none ${n <= value ? "text-amber-400" : "text-clover-sub/30"}`}
          title={`중요도 ${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
