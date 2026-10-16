export default function GlassCard({ className = "", children }) {
  return <section className={`glass min-w-0 rounded-[28px] p-5 ${className}`}>{children}</section>;
}
