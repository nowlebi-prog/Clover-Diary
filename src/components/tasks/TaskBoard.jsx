import TaskSection from "./TaskSection";

export default function TaskBoard({ sections, today, onToggle, onEdit, onDelay }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {sections.map((section) => (
        <TaskSection key={section.key} title={section.title} items={section.items} today={today} onToggle={onToggle} onEdit={onEdit} onDelay={onDelay} />
      ))}
    </div>
  );
}
