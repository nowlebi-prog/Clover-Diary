export default function GlassCard({ className = "", children }) {
  return <section className={`glass rounded-[28px] p-5 ${className}`}>{children}</section>;
}
