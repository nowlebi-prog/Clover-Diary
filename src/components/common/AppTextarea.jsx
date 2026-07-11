export default function AppTextarea({ className = "", ...props }) {
  return <textarea className={`min-h-24 w-full rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-clover-primary ${className}`} {...props} />;
}
