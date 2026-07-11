export default function PageHeader({ eyebrow, title, children }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-clover-deep">{eyebrow}</p>}
        <h1 className="text-2xl font-bold text-clover-text sm:text-3xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}
