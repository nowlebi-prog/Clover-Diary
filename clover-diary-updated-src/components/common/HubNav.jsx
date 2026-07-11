import { Link } from "react-router-dom";
import AppButton from "./AppButton";

export default function HubNav({ links = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([to, label]) => (
        <Link key={to} to={to}>
          <AppButton variant="soft">{label}</AppButton>
        </Link>
      ))}
    </div>
  );
}
