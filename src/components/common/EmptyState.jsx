import CloverLogo from "./CloverLogo";

export default function EmptyState({ title = "아직 비어 있어요", body = "가볍게 하나 추가해볼까요?" }) {
  return (
    <div className="grid place-items-center rounded-[24px] border border-dashed border-white/80 bg-white/35 p-8 text-center">
      <CloverLogo small />
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-clover-sub">{body}</p>
    </div>
  );
}
