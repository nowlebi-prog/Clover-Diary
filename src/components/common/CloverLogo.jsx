export default function CloverLogo({ small = false }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/icons/icon.svg"
        alt=""
        className={`${small ? "h-9 w-9" : "h-12 w-12"} rounded-2xl shadow-glass`}
      />
      <div>
        <p className={`${small ? "text-base" : "text-xl"} font-bold leading-tight text-clover-text`}>Clover Desk</p>
        {!small && (
          <p className="text-xs leading-snug text-clover-sub">
            Eunbi&apos;s
            <br />
            personal Diary 🍀
          </p>
        )}
      </div>
    </div>
  );
}
