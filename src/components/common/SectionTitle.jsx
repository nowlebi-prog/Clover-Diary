export default function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-bold text-clover-text">{children}</h2>
      {action}
    </div>
  );
}
