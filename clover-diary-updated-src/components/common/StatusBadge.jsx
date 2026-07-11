const palette = {
  high: "bg-red-100 text-red-600",
  danger: "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
  mint: "bg-clover-mint text-clover-deep",
  lavender: "bg-clover-lavender text-[#6b5aa8]",
  cream: "bg-clover-cream text-[#95733a]",
  blue: "bg-clover-blue text-[#4d7196]"
};

export default function StatusBadge({ children, tone = "mint" }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${palette[tone] || palette.mint}`}>{children}</span>;
}
