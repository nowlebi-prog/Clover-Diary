export default function GlassCard({ className = "", children, ...rest }) {
  return <section className={`glass rounded-[28px] p-5 ${className}`} {...rest}>{children}</section>;
}
