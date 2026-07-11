export default function AppButton({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-clover-deep text-white hover:bg-[#31754f]",
    soft: "bg-white/70 text-clover-deep hover:bg-white",
    danger: "bg-clover-danger text-white hover:bg-red-500",
    ghost: "bg-transparent text-clover-sub hover:bg-white/60"
  };
  return (
    <button className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
