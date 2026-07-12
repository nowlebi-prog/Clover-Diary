import { Link } from "react-router-dom";

export default function SubPageTabs({ items = [] }) {
  return (
    <nav className="mb-4 flex max-w-full gap-2 overflow-x-auto rounded-full bg-white/55 p-1 shadow-sm thin-scroll">
      {items.map((item) => {
        const className = `shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
          item.active ? "bg-clover-deep text-white shadow-sm" : "text-clover-sub hover:bg-white/75"
        }`;
        if (item.to) {
          return (
            <Link key={item.key || item.to} to={item.to} className={className}>
              {item.label}
            </Link>
          );
        }
        return (
          <button key={item.key} type="button" onClick={item.onClick} className={className}>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
