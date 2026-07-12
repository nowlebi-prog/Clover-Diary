import { Link } from "react-router-dom";
import CustomCheckbox from "../../../components/common/CustomCheckbox";
import SectionTitle from "../../../components/common/SectionTitle";

const categoryOf = (item, todos) => {
  const source = item.category || todos.find((todo) => todo.id === item.todoId || todo.title === item.title)?.category || item.title || "";
  const value = String(source).toLowerCase();
  if (value.includes("돈") || value.includes("결제") || value.includes("입금") || value.includes("money")) return ["money", "bg-amber-100 text-amber-700"];
  if (value.includes("공부") || value.includes("스터디") || value.includes("study")) return ["study", "bg-violet-100 text-violet-700"];
  if (value.includes("집안") || value.includes("생활") || value.includes("life") || value.includes("루틴")) return ["life", "bg-emerald-100 text-emerald-700"];
  return ["work", "bg-sky-100 text-sky-700"];
};

const linkedTodoId = (item, todos) => item.todoId || todos.find((todo) => todo.title === item.title)?.id || "";

export default function TodayTopThree({ items = [], todos = [], onToggle }) {
  const topItems = items.slice(0, 3);

  return (
    <section className="glass rounded-[28px] bg-gradient-to-br from-[#FFF8EA]/90 to-[#E9F8EF]/80 p-5">
      <SectionTitle action={<Link to="/tasks" className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">수정</Link>}>오늘 꼭 해야 할 TOP 3</SectionTitle>
      <p className="mb-4 text-sm font-bold text-clover-sub">오늘은 이 세 가지만 끝내도 충분해요.</p>
      <div className="grid gap-2">
        {topItems.map((item, index) => {
          const [category, tone] = categoryOf(item, todos);
          const todoId = linkedTodoId(item, todos);
          return (
            <article
              key={item.id}
              className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 transition ${
                item.completed ? "border-clover-primary/30 bg-white/45 opacity-70" : "border-white/80 bg-white/70"
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-clover-deep text-xs font-black text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{category}</span>
                  {todoId && <Link to={`/tasks?edit=${todoId}`} className="text-[11px] font-black text-clover-deep">바로 수정</Link>}
                </div>
                <CustomCheckbox checked={item.completed} label={item.title} onChange={(checked) => onToggle(item.id, checked)} />
              </div>
            </article>
          );
        })}
        {!topItems.length && (
          <div className="rounded-[20px] bg-white/55 p-4 text-sm font-bold text-clover-sub">
            오늘 꼭 끝낼 세 가지를 Tasks에서 정해보세요.
          </div>
        )}
      </div>
    </section>
  );
}
