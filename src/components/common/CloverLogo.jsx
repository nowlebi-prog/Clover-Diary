export default function CloverLogo({ small = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${small ? "h-9 w-9" : "h-12 w-12"} relative rounded-2xl bg-clover-mint shadow-glass`}>
        <span className="absolute left-2 top-2 h-4 w-4 rounded-full bg-clover-deep" />
        <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-clover-primary" />
        <span className="absolute bottom-2 left-2 h-4 w-4 rounded-full bg-clover-primary" />
        <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-clover-deep" />
      </div>
      <div>
        <p className={`${small ? "text-base" : "text-xl"} font-bold leading-tight text-clover-text`}>Clover Desk</p>
        {!small && <p className="text-xs text-clover-sub">soft personal dashboard</p>}
      </div>
    </div>
  );
}
