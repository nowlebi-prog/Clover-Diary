export default function FloatingQuickAddButton({ onClick }) {
  return (
    <button onClick={onClick} className="fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-clover-deep text-3xl font-light text-white shadow-glass md:bottom-8 md:right-8" aria-label="quick add">
      +
    </button>
  );
}
