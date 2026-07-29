import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/layout/PageHeader";
import SectionTitle from "../../components/common/SectionTitle";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const today = toDateKey(new Date());
const projectColors = [
  "from-blue-500 to-sky-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-indigo-500",
  "from-rose-400 to-orange-400",
  "from-slate-600 to-slate-500",
  "from-cyan-500 to-blue-500"
];
const itemTones = {
  계획: "border-emerald-100 bg-emerald-50 text-emerald-800",
  마감: "border-rose-100 bg-rose-50 text-rose-700",
  회의: "border-sky-100 bg-sky-50 text-sky-700",
  자료: "border-violet-100 bg-violet-50 text-violet-700",
  아이디어: "border-amber-100 bg-amber-50 text-amber-800"
};

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const monthLabel = ({ year, month }) => `${year}년 ${month + 1}월`;
const emptyProject = () => ({ title: "", category: "업무", purpose: "", color: projectColors[0] });
const emptyItem = (projectId, date) => ({ projectId, date, title: "", type: "계획", status: "planned", memo: "", url: "" });

function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: toDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: toDateKey(date) === today
    };
  });
}

function ProjectModal({ initial, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(initial || emptyProject());
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    onSave({ ...form, title, purpose: form.purpose.trim(), category: form.category.trim() || "기타" });
  };

  return (
    <Modal title={initial?.id ? "프로젝트 수정" : "프로젝트 생성"} onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-bold">프로젝트명<AppInput value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="예: 위스티아 홈페이지 개선" /></label>
        <label className="grid gap-1 text-sm font-bold">분류<AppInput value={form.category} onChange={(event) => set("category", event.target.value)} placeholder="업무, 공부, 사업..." /></label>
        <label className="grid gap-1 text-sm font-bold">목표 / 설명<AppTextarea value={form.purpose} onChange={(event) => set("purpose", event.target.value)} placeholder="이 프로젝트로 만들고 싶은 결과를 짧게 적어주세요." /></label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {projectColors.map((color) => (
            <button key={color} type="button" onClick={() => set("color", color)} className={`h-10 rounded-2xl bg-gradient-to-br ${color} ${form.color === color ? "ring-2 ring-clover-deep ring-offset-2" : ""}`} aria-label="프로젝트 색상 선택" />
          ))}
        </div>
        <div className="flex justify-between gap-2">
          {initial?.id ? <AppButton variant="danger" onClick={() => onDelete(initial.id)}>삭제</AppButton> : <span />}
          <div className="flex gap-2">
            <AppButton variant="soft" onClick={onClose}>취소</AppButton>
            <AppButton onClick={save}>저장</AppButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PlanItemModal({ initial, projectId, date, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(initial || emptyItem(projectId, date));
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    onSave({ ...form, projectId, title, memo: form.memo.trim(), url: form.url.trim() });
  };

  return (
    <Modal title={initial?.id ? "계획 수정" : "계획 추가"} onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-bold">날짜<AppInput type="date" value={form.date} onChange={(event) => set("date", event.target.value)} /></label>
        <label className="grid gap-1 text-sm font-bold">제목<AppInput value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="예: 메인 페이지 와이어프레임" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">유형<AppSelect value={form.type} onChange={(event) => set("type", event.target.value)}>{Object.keys(itemTones).map((type) => <option key={type}>{type}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">상태<AppSelect value={form.status} onChange={(event) => set("status", event.target.value)}><option value="planned">예정</option><option value="done">완료</option></AppSelect></label>
        </div>
        <label className="grid gap-1 text-sm font-bold">URL<AppInput value={form.url} onChange={(event) => set("url", event.target.value)} placeholder="https://..." /></label>
        <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.memo} onChange={(event) => set("memo", event.target.value)} placeholder="클릭해서 볼 세부 내용을 적어두세요." /></label>
        <div className="flex justify-between gap-2">
          {initial?.id ? <AppButton variant="danger" onClick={() => onDelete(initial.id)}>삭제</AppButton> : <span />}
          <div className="flex gap-2">
            <AppButton variant="soft" onClick={onClose}>취소</AppButton>
            <AppButton onClick={save}>저장</AppButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PlanHome({ projects, items, onNewProject, onEditProject, onOpenProject }) {
  return (
    <>
      <PageHeader eyebrow="PLAN" title="프로젝트 플랜">
        <AppButton onClick={onNewProject}>+ 프로젝트 생성</AppButton>
      </PageHeader>
      <p className="-mt-3 mb-5 text-sm font-bold text-clover-sub">프로젝트별 월간 계획을 따로 만들고, 날짜 칸에 직접 실행 계획을 쌓아두세요.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const count = items.filter((item) => item.projectId === project.id).length;
          return (
            <article key={project.id} className={`min-h-[132px] rounded-[22px] bg-gradient-to-br ${project.color || projectColors[0]} p-4 text-white shadow-[0_18px_42px_rgba(44,86,120,0.18)]`}>
              <button type="button" onClick={() => onOpenProject(project.id)} className="block h-full w-full text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/75">{project.category || "Project"}</p>
                <h2 className="mt-2 line-clamp-2 text-lg font-black leading-snug">{project.title}</h2>
                <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-white/82">{project.purpose || "월간 계획을 채워보세요."}</p>
              </button>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">{count}개 계획</span>
                <button type="button" onClick={() => onEditProject(project)} className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">수정</button>
              </div>
            </article>
          );
        })}
        {!projects.length && (
          <GlassCard className="grid min-h-[180px] place-items-center rounded-[22px] border border-dashed border-clover-line bg-white/70 p-6 text-center sm:col-span-2 xl:col-span-3">
            <div>
              <p className="text-lg font-black text-clover-ink">아직 프로젝트가 없어요.</p>
              <p className="mt-2 text-sm font-bold text-clover-sub">먼저 프로젝트를 만들면, 그 프로젝트 전용 월 캘린더가 생겨요.</p>
              <AppButton className="mt-4" onClick={onNewProject}>프로젝트 생성</AppButton>
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}

function ProjectPlan({ project, items, month, setMonth, selectedDate, setSelectedDate, onBack, onAdd, onEdit, onEditProject }) {
  const cells = monthCells(month.year, month.month);
  const itemsByDate = useMemo(() => items.reduce((map, item) => {
    map[item.date] = [...(map[item.date] || []), item];
    return map;
  }, {}), [items]);
  const selectedItems = itemsByDate[selectedDate] || [];
  const moveMonth = (amount) => setMonth((current) => {
    const next = new Date(current.year, current.month + amount, 1);
    return { year: next.getFullYear(), month: next.getMonth() };
  });

  return (
    <>
      <PageHeader eyebrow="PLAN" title={project.title}>
        <div className="flex flex-wrap gap-2">
          <AppButton variant="soft" onClick={onBack}>목록으로</AppButton>
          <AppButton variant="soft" onClick={() => onEditProject(project)}>프로젝트 수정</AppButton>
          <AppButton onClick={() => onAdd(selectedDate)}>+ 계획 추가</AppButton>
        </div>
      </PageHeader>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
        <GlassCard className="min-w-0 overflow-hidden rounded-[22px] border border-clover-line bg-white/88 p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <SectionTitle>{monthLabel(month)}</SectionTitle>
              <p className="mt-1 text-xs font-bold text-clover-sub">{project.category} · {items.length}개 계획</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => moveMonth(-1)} className="h-9 rounded-full bg-white px-3 text-xs font-black text-clover-sub">이전</button>
              <button type="button" onClick={() => setMonth({ year: new Date().getFullYear(), month: new Date().getMonth() })} className="h-9 rounded-full bg-white px-3 text-xs font-black text-clover-deep">오늘</button>
              <button type="button" onClick={() => moveMonth(1)} className="h-9 rounded-full bg-white px-3 text-xs font-black text-clover-sub">다음</button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-y border-clover-line bg-white/60 text-center text-[11px] font-black text-clover-sub">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day} className="py-2">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 bg-white">
            {cells.map((cell) => {
              const dayItems = itemsByDate[cell.date] || [];
              const selected = cell.date === selectedDate;
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => setSelectedDate(cell.date)}
                  onDoubleClick={() => onAdd(cell.date)}
                  className={`min-h-[92px] min-w-0 border-b border-r border-clover-line/70 p-1.5 text-left ${selected ? "bg-emerald-50 ring-2 ring-inset ring-clover-primary" : "bg-white/60 hover:bg-emerald-50/50"} ${cell.inMonth ? "" : "opacity-35"}`}
                >
                  <span className={`inline-grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-black ${cell.isToday ? "bg-clover-deep text-white" : "text-clover-ink"}`}>{cell.day}</span>
                  <div className="mt-1 grid gap-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <span key={item.id} className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-black ${itemTones[item.type] || itemTones["계획"]}`}>
                        {item.title}
                      </span>
                    ))}
                    {dayItems.length > 3 && <span className="text-[10px] font-black text-clover-deep">+{dayItems.length - 3}개</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>
        <GlassCard className="min-w-0 rounded-[22px] border border-clover-line bg-white/88 p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <SectionTitle>{Number(selectedDate.slice(5, 7))}월 {Number(selectedDate.slice(8))}일 계획</SectionTitle>
              <p className="mt-1 text-xs font-bold text-clover-sub">{selectedItems.length}개</p>
            </div>
            <AppButton variant="soft" className="min-h-9 px-3 py-1.5 text-xs" onClick={() => onAdd(selectedDate)}>추가</AppButton>
          </div>
          <div className="grid gap-2">
            {selectedItems.map((item) => (
              <article key={item.id} className="rounded-[16px] border border-clover-line bg-white/70 p-3">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <button type="button" onClick={() => onEdit(item)} className="min-w-0 text-left">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${itemTones[item.type] || itemTones["계획"]}`}>{item.type}</span>
                    <b className="mt-2 block min-w-0 truncate text-sm text-clover-ink">{item.title}</b>
                  </button>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${item.status === "done" ? "bg-emerald-100 text-clover-deep" : "bg-slate-100 text-clover-sub"}`}>{item.status === "done" ? "완료" : "예정"}</span>
                </div>
                {item.memo && <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-clover-sub">{item.memo}</p>}
              </article>
            ))}
            {!selectedItems.length && <p className="rounded-[16px] bg-white/60 p-4 text-sm font-bold text-clover-sub">이 날짜에는 아직 계획이 없어요.</p>}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

export default function PlanPage() {
  const [data, setData] = useState(getAllData());
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectModal, setProjectModal] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState(today);
  const projects = data.planProjects || [];
  const items = data.planItems || [];
  const activeProjectId = searchParams.get("project");
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const projectItems = items.filter((item) => item.projectId === activeProjectId);

  const persist = (next) => {
    saveAllData(next);
    setData(getAllData());
  };
  const saveProject = (payload) => {
    const timestamp = toDateKey(new Date());
    const next = { ...data };
    if (payload.id) {
      next.planProjects = projects.map((project) => project.id === payload.id ? { ...project, ...payload, updatedAt: timestamp } : project);
    } else {
      const created = { id: makeId("planProject"), createdAt: timestamp, updatedAt: timestamp, ...payload };
      next.planProjects = [created, ...projects];
      setSearchParams({ project: created.id });
    }
    persist(next);
    setProjectModal(null);
  };
  const deleteProject = (id) => {
    const next = {
      ...data,
      planProjects: projects.filter((project) => project.id !== id),
      planItems: items.filter((item) => item.projectId !== id)
    };
    persist(next);
    setProjectModal(null);
    setSearchParams({});
  };
  const saveItem = (payload) => {
    const timestamp = toDateKey(new Date());
    const next = { ...data };
    if (payload.id) {
      next.planItems = items.map((item) => item.id === payload.id ? { ...item, ...payload, updatedAt: timestamp } : item);
    } else {
      next.planItems = [{ id: makeId("planItem"), createdAt: timestamp, updatedAt: timestamp, ...payload }, ...items];
    }
    persist(next);
    setItemModal(null);
  };
  const deleteItem = (id) => {
    persist({ ...data, planItems: items.filter((item) => item.id !== id) });
    setItemModal(null);
  };

  return (
    <>
      {activeProject ? (
        <ProjectPlan
          project={activeProject}
          items={projectItems}
          month={month}
          setMonth={setMonth}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onBack={() => setSearchParams({})}
          onAdd={(date) => setItemModal(emptyItem(activeProject.id, date))}
          onEdit={setItemModal}
          onEditProject={setProjectModal}
        />
      ) : (
        <PlanHome
          projects={projects}
          items={items}
          onNewProject={() => setProjectModal(emptyProject())}
          onEditProject={setProjectModal}
          onOpenProject={(id) => setSearchParams({ project: id })}
        />
      )}
      {projectModal && <ProjectModal initial={projectModal.id ? projectModal : null} onClose={() => setProjectModal(null)} onSave={saveProject} onDelete={deleteProject} />}
      {itemModal && activeProject && <PlanItemModal initial={itemModal.id ? itemModal : null} projectId={activeProject.id} date={itemModal.date || selectedDate} onClose={() => setItemModal(null)} onSave={saveItem} onDelete={deleteItem} />}
    </>
  );
}
