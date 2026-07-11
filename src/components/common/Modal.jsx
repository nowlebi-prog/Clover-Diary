import AppButton from "./AppButton";

export default function Modal({ title, children, onClose }) {
  if (!title) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/20 p-0 sm:place-items-center sm:p-6">
      <div className="glass max-h-[88vh] w-full overflow-auto rounded-t-[28px] p-5 sm:max-w-xl sm:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <AppButton variant="ghost" onClick={onClose}>닫기</AppButton>
        </div>
        {children}
      </div>
    </div>
  );
}
