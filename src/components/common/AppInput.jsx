export default function AppInput({ className = "", ...props }) {
  return <input className={`min-h-11 w-full rounded-2xl border border-white/70 bg-white/65 px-4 text-sm outline-none focus:ring-2 focus:ring-clover-primary ${className}`} {...props} />;
}
