export default function AppSelect({ children, ...props }) {
  return <select className="min-h-11 min-w-0 w-full max-w-full rounded-2xl border border-white/70 bg-white/65 px-4 text-sm outline-none focus:ring-2 focus:ring-clover-primary" {...props}>{children}</select>;
}
