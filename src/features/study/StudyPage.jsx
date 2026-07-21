import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/layout/PageHeader";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import {
  archiveStudyItem,
  createCapture,
  createStudyItem,
  deleteStudyItem,
  getStudyData,
  relatedProjects,
  studyItemCategories,
  studyItemPriorities,
  studyItemStatuses,
  updateStudyItem
} from "../../lib/study/studyRepository";
import { toDateKey } from "../../lib/utils/date";

const tabs = [
  ["home", "Study Home"],
  ["queue", "Study Queue"],
  ["progress", "In Progress"],
  ["applied", "Applied"],
  ["archive", "Archive"],
  ["captures", "캡처 자료"]
];

const statusLabel = Object.fromEntries(studyItemStatuses);
const priorityLabel = Object.fromEntries(studyItemPriorities);
const statusTone = {
  not_started: "blue",
  in_progress: "warning",
  apply_pending: "mint",
  applied: "done",
  paused: "danger"
};

const statusGuide = {
  not_started: "공부 전",
  in_progress: "공부 중",
  apply_pending: "적용 대기",
  applied: "적용 완료",
  paused: "보류"
};

const todayKey = () => toDateKey(new Date());
const readLines = (items = []) => (items || []).map((item) => item.title ? `${item.title} | ${item.url}` : item.url).join("\n");
const writeLines = (text = "") => text
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [title, ...rest] = line.split("|").map((item) => item.trim());
    const url = rest.length ? rest.join("|").trim() : title;
    return { id: `study-url-${Date.now()}-${Math.random().toString(16).slice(2)}`, title: rest.length ? title : "", url };
  });

const readImageFile = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      url: reader.result,
      fileName: file.name,
      size: file.size,
      order: 0
    });
    reader.readAsDataURL(file);
  });

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${active ? "bg-clover-deep text-white" : "bg-white/70 text-clover-sub hover:bg-white"}`}
    >
      {children}
    </button>
  );
}

function EmptyBox({ title, note, action, onAction }) {
  return (
    <div className="rounded-[22px] border border-dashed border-clover-line bg-white/45 p-5 text-center">
      <p className="font-black text-clover-ink">{title}</p>
      <p className="mt-2 text-sm font-bold text-clover-sub">{note}</p>
      {action && <button type="button" onClick={onAction} className="mt-4 rounded-full bg-clover-deep px-4 py-2 text-sm font-black text-white">{action}</button>}
    </div>
  );
}

function QuickAddModal({ onClose, onDone }) {
  const [draft, setDraft] = useState({
    title: "",
    category: "AI",
    sourceNote: "",
    referenceUrl: "",
    uploadUrl: "",
    revisitDate: "",
    priority: "normal"
  });
  const set = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  const save = () => {
    if (!draft.title.trim()) return;
    createStudyItem({
      title: draft.title.trim(),
      category: draft.category,
      sourceNote: draft.sourceNote.trim(),
      referenceUrls: draft.referenceUrl.trim() ? [{ title: "", url: draft.referenceUrl.trim() }] : [],
      uploadUrls: draft.uploadUrl.trim() ? [{ title: "", url: draft.uploadUrl.trim() }] : [],
      revisitDate: draft.revisitDate,
      priority: draft.priority,
      status: "not_started",
      archived: false
    });
    onDone();
  };

  return (
    <Modal title="공부 주제 빠른 추가" onClose={onClose}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-bold">공부 주제 제목<AppInput value={draft.title} onChange={(event) => set("title", event.target.value)} placeholder="예: 인스타 릴스 자동 분석 툴" autoFocus /></label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold">카테고리<AppSelect value={draft.category} onChange={(event) => set("category", event.target.value)}>{studyItemCategories.map((item) => <option key={item}>{item}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">우선순위<AppSelect value={draft.priority} onChange={(event) => set("priority", event.target.value)}>{studyItemPriorities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">다시 볼 날짜<AppInput type="date" value={draft.revisitDate} onChange={(event) => set("revisitDate", event.target.value)} /></label>
        </div>
        <label className="grid gap-1 text-sm font-bold">공부 내용 자세히<AppTextarea value={draft.sourceNote} onChange={(event) => set("sourceNote", event.target.value)} placeholder="공부할 내용, 왜 필요한지, 참고할 포인트를 적어두세요." /></label>
        <label className="grid gap-1 text-sm font-bold">참고 URL<AppInput value={draft.referenceUrl} onChange={(event) => set("referenceUrl", event.target.value)} placeholder="https://..." /></label>
        <label className="grid gap-1 text-sm font-bold">업로드 URL<AppInput value={draft.uploadUrl} onChange={(event) => set("uploadUrl", event.target.value)} placeholder="결과물이나 파일을 올려둔 링크" /></label>
        <AppButton onClick={save} disabled={!draft.title.trim()}>저장</AppButton>
      </div>
    </Modal>
  );
}

function UrlList({ title, items }) {
  const urls = (items || []).filter((item) => item.url);
  if (!urls.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-clover-sub">{title}</p>
      <div className="grid gap-2">
        {urls.map((item) => (
          <a key={item.id || item.url} href={item.url} target="_blank" rel="noreferrer" className="truncate rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold text-clover-deep underline decoration-dotted">
            {item.title || item.url}
          </a>
        ))}
      </div>
    </div>
  );
}

function StudyItemCard({ item, onOpen, onStatus, onArchive }) {
  return (
    <article className="rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-glass">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={() => onOpen(item)} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={statusTone[item.status]}>{statusLabel[item.status] || item.status}</StatusBadge>
            <span className="rounded-full bg-clover-mint/70 px-2.5 py-1 text-[11px] font-black text-clover-deep">{item.category}</span>
            {item.priority === "high" && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-600">중요</span>}
          </div>
          <h3 className="mt-3 line-clamp-2 text-lg font-black text-clover-ink">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-bold text-clover-sub">{item.nextAction || item.sourceNote || "다음 액션을 정해보세요."}</p>
        </button>
        {item.revisitDate && <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-clover-sub">{item.revisitDate}</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.status === "not_started" && <AppButton variant="soft" onClick={() => onStatus(item, "in_progress")}>공부 시작</AppButton>}
        {item.status === "in_progress" && <AppButton variant="soft" onClick={() => onStatus(item, "apply_pending")}>적용 대기로</AppButton>}
        {item.status === "apply_pending" && <AppButton variant="soft" onClick={() => onStatus(item, "applied")}>적용 완료</AppButton>}
        {item.status === "applied" && !item.archived && <AppButton onClick={() => onArchive(item)}>Archive 이동</AppButton>}
        <AppButton variant="ghost" onClick={() => onOpen(item)}>상세 보기</AppButton>
      </div>
    </article>
  );
}

function StudyItemEditor({ item, onClose, onSaved, onDelete }) {
  const [draft, setDraft] = useState({
    ...item,
    summary: Array.isArray(item.summary) ? item.summary : ["", "", ""],
    referenceUrlsText: readLines(item.referenceUrls),
    uploadUrlsText: readLines(item.uploadUrls),
    appliedUrlsText: readLines(item.appliedUrls)
  });
  const [archiveNote, setArchiveNote] = useState(item.archiveNote || "");
  const set = (name, value) => setDraft((current) => ({ ...current, [name]: value }));
  const setSummary = (index, value) => {
    const summary = [...(draft.summary || ["", "", ""])];
    summary[index] = value;
    set("summary", summary);
  };

  const payload = () => ({
    ...draft,
    title: draft.title.trim() || "새 공부 주제",
    referenceUrls: writeLines(draft.referenceUrlsText),
    uploadUrls: writeLines(draft.uploadUrlsText),
    appliedUrls: writeLines(draft.appliedUrlsText),
    summary: draft.summary || ["", "", ""]
  });

  const save = () => {
    updateStudyItem(item.id, payload());
    onSaved();
  };

  const moveArchive = () => {
    updateStudyItem(item.id, payload());
    archiveStudyItem(item.id, archiveNote);
    onSaved();
  };

  return (
    <Modal title="공부 주제 상세" onClose={onClose}>
      <div className="grid max-h-[78vh] gap-4 overflow-y-auto pr-1">
        <label className="grid gap-1 text-sm font-bold">제목<AppInput value={draft.title || ""} onChange={(event) => set("title", event.target.value)} /></label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold">상태<AppSelect value={draft.status || "not_started"} onChange={(event) => set("status", event.target.value)}>{studyItemStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">카테고리<AppSelect value={draft.category || "AI"} onChange={(event) => set("category", event.target.value)}>{studyItemCategories.map((category) => <option key={category}>{category}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">우선순위<AppSelect value={draft.priority || "normal"} onChange={(event) => set("priority", event.target.value)}>{studyItemPriorities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</AppSelect></label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold">세부 카테고리<AppInput value={draft.subCategory || ""} onChange={(event) => set("subCategory", event.target.value)} placeholder="예: 홈페이지, 영상, 프롬프트" /></label>
          <label className="grid gap-1 text-sm font-bold">관련 프로젝트<AppSelect value={draft.relatedProject || ""} onChange={(event) => set("relatedProject", event.target.value)}><option value="">선택 안 함</option>{relatedProjects.map((project) => <option key={project}>{project}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">다시 볼 날짜<AppInput type="date" value={draft.revisitDate || ""} onChange={(event) => set("revisitDate", event.target.value)} /></label>
        </div>
        <label className="grid gap-1 text-sm font-bold">공부 내용 자세히<AppTextarea value={draft.sourceNote || ""} onChange={(event) => set("sourceNote", event.target.value)} /></label>
        <label className="grid gap-1 text-sm font-bold">참고 URL 목록<span className="text-xs text-clover-sub">한 줄에 하나씩. 제목을 붙이고 싶으면 `제목 | URL`</span><AppTextarea value={draft.referenceUrlsText} onChange={(event) => set("referenceUrlsText", event.target.value)} /></label>
        <label className="grid gap-1 text-sm font-bold">공부 메모<AppTextarea value={draft.studyNotes || ""} onChange={(event) => set("studyNotes", event.target.value)} className="min-h-[110px]" /></label>
        <div className="grid gap-2">
          <p className="text-sm font-bold">핵심 요약 3줄</p>
          {[0, 1, 2].map((index) => (
            <AppInput key={index} value={draft.summary?.[index] || ""} onChange={(event) => setSummary(index, event.target.value)} placeholder={`${index + 1}. 핵심 요약`} />
          ))}
        </div>
        <label className="grid gap-1 text-sm font-bold">적용 아이디어<AppTextarea value={draft.applicationIdeas || ""} onChange={(event) => set("applicationIdeas", event.target.value)} /></label>
        <label className="grid gap-1 text-sm font-bold">다음 액션<AppTextarea value={draft.nextAction || ""} onChange={(event) => set("nextAction", event.target.value)} /></label>
        <label className="grid gap-1 text-sm font-bold">업로드 URL 목록<AppTextarea value={draft.uploadUrlsText} onChange={(event) => set("uploadUrlsText", event.target.value)} /></label>
        <label className="grid gap-1 text-sm font-bold">적용 URL 목록<AppTextarea value={draft.appliedUrlsText} onChange={(event) => set("appliedUrlsText", event.target.value)} /></label>
        <label className="grid gap-1 text-sm font-bold">Archive 메모<AppTextarea value={archiveNote} onChange={(event) => setArchiveNote(event.target.value)} placeholder="나중에 다시 볼 때 기억할 점" /></label>

        <div className="flex flex-wrap justify-between gap-2 border-t border-clover-line pt-4">
          <button type="button" onClick={() => { deleteStudyItem(item.id); onDelete(); }} className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600">삭제</button>
          <div className="flex flex-wrap gap-2">
            <AppButton variant="soft" onClick={save}>저장</AppButton>
            <AppButton onClick={moveArchive}>Archive 이동</AppButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function StudyHome({ items, onTab, onOpen, onStatus, onArchive, onAdd }) {
  const today = todayKey();
  const activeItems = items.filter((item) => !item.archived);
  const revisit = activeItems
    .filter((item) => item.revisitDate && item.revisitDate <= today && ["not_started", "in_progress", "apply_pending"].includes(item.status))
    .sort((a, b) => (a.revisitDate || "").localeCompare(b.revisitDate || ""))
    .slice(0, 4);
  const stats = [
    ["not_started", "공부 전", activeItems.filter((item) => item.status === "not_started").length, "queue"],
    ["in_progress", "공부 중", activeItems.filter((item) => item.status === "in_progress").length, "progress"],
    ["apply_pending", "적용 대기", activeItems.filter((item) => item.status === "apply_pending").length, "applied"],
    ["applied", "적용 완료", activeItems.filter((item) => item.status === "applied").length, "applied"]
  ];
  const categories = studyItemCategories.map((category) => ({
    category,
    total: activeItems.filter((item) => item.category === category).length,
    done: activeItems.filter((item) => item.category === category && item.status === "applied").length
  })).filter((item) => item.total);
  const recentApplied = items.filter((item) => item.status === "applied").slice(0, 3);

  return (
    <div className="grid gap-4">
      <GlassCard className="rounded-[26px] border border-clover-line bg-white/86 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle>오늘 다시 볼 공부 주제</SectionTitle>
            <p className="text-sm font-bold text-clover-sub">나중에 봐야지 했던 주제를 오늘 다시 꺼내볼게요.</p>
          </div>
          <AppButton onClick={onAdd}>+ 공부 주제 추가</AppButton>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {revisit.map((item) => <StudyItemCard key={item.id} item={item} onOpen={onOpen} onStatus={onStatus} onArchive={onArchive} />)}
          {!revisit.length && <EmptyBox title="오늘 다시 볼 공부 주제가 없어요." note="떠오른 주제가 있다면 가볍게 추가해보세요." action="주제 추가" onAction={onAdd} />}
        </div>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([status, label, count, tab]) => (
          <button key={status} type="button" onClick={() => onTab(tab)} className="rounded-[24px] bg-white/75 p-4 text-left shadow-glass">
            <p className="text-sm font-black text-clover-sub">{label}</p>
            <b className="mt-2 block text-3xl font-black text-clover-deep">{count}</b>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <GlassCard className="rounded-[26px] border border-clover-line bg-white/86 p-5">
          <SectionTitle>카테고리별 진행</SectionTitle>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {categories.map((item) => (
              <div key={item.category} className="rounded-[20px] bg-white/60 p-4">
                <div className="flex items-center justify-between">
                  <b>{item.category}</b>
                  <span className="text-sm font-black text-clover-deep">{item.total}개</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-clover-deep" style={{ width: `${Math.round((item.done / item.total) * 100)}%` }} />
                </div>
                <p className="mt-2 text-xs font-bold text-clover-sub">적용 완료 {item.done}개</p>
              </div>
            ))}
            {!categories.length && <EmptyBox title="카테고리별 주제가 아직 없어요." note="공부 주제를 하나 추가하면 여기에서 현황을 볼 수 있어요." />}
          </div>
        </GlassCard>

        <GlassCard className="rounded-[26px] border border-clover-line bg-white/86 p-5">
          <SectionTitle>최근 적용 완료</SectionTitle>
          <div className="mt-3 grid gap-2">
            {recentApplied.map((item) => (
              <button key={item.id} type="button" onClick={() => onOpen(item)} className="rounded-2xl bg-white/60 p-3 text-left">
                <b className="line-clamp-1 text-sm">{item.title}</b>
                <p className="mt-1 text-xs font-bold text-clover-sub">{item.category} · {item.nextAction || "적용 완료"}</p>
              </button>
            ))}
            {!recentApplied.length && <EmptyBox title="아직 적용 완료한 공부가 없어요." note="공부한 내용을 실제 작업에 한 번 연결해보세요." />}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function BoardTab({ title, note, items, empty, onOpen, onStatus, onArchive, onAdd }) {
  return (
    <div className="grid gap-4">
      <GlassCard className="rounded-[26px] border border-clover-line bg-white/86 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle>{title}</SectionTitle>
            <p className="text-sm font-bold text-clover-sub">{note}</p>
          </div>
          <AppButton onClick={onAdd}>+ 공부 주제 추가</AppButton>
        </div>
      </GlassCard>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => <StudyItemCard key={item.id} item={item} onOpen={onOpen} onStatus={onStatus} onArchive={onArchive} />)}
        {!items.length && <EmptyBox {...empty} onAction={onAdd} />}
      </div>
    </div>
  );
}

function ArchiveTab({ items, onOpen }) {
  const archived = items.filter((item) => item.archived);
  return (
    <div className="grid gap-4">
      <GlassCard className="rounded-[26px] border border-clover-line bg-white/86 p-5">
        <SectionTitle>Study Archive Shortcut</SectionTitle>
        <p className="text-sm font-bold text-clover-sub">다시 꺼내보고 싶은 공부 기록만 모아둔 곳이에요.</p>
      </GlassCard>
      <div className="grid gap-3">
        {archived.map((item) => (
          <article key={item.id} className="rounded-[24px] bg-white/70 p-4 shadow-glass">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button type="button" onClick={() => onOpen(item)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-clover-mint/70 px-2.5 py-1 text-[11px] font-black text-clover-deep">{item.category}</span>
                  {item.relatedProject && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-clover-sub">{item.relatedProject}</span>}
                </div>
                <h3 className="mt-3 text-lg font-black text-clover-ink">{item.title}</h3>
                <p className="mt-2 text-sm font-bold text-clover-sub">{item.archiveNote || item.summary?.filter(Boolean).join(" · ") || item.nextAction || "아카이브된 공부 기록"}</p>
              </button>
              <AppButton variant="ghost" onClick={() => onOpen(item)}>다시 보기</AppButton>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <UrlList title="참고 URL" items={item.referenceUrls} />
              <UrlList title="업로드 URL" items={item.uploadUrls} />
              <UrlList title="적용 URL" items={item.appliedUrls} />
            </div>
          </article>
        ))}
        {!archived.length && <EmptyBox title="아직 아카이브된 공부 기록이 없어요." note="다시 꺼내보고 싶은 공부만 Archive로 옮겨보세요." />}
      </div>
    </div>
  );
}

function CaptureSupportTab({ captures, onUpload }) {
  return (
    <div className="grid gap-4">
      <GlassCard className="rounded-[26px] border border-clover-line bg-white/86 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle>캡처 자료</SectionTitle>
            <p className="text-sm font-bold text-clover-sub">캡처는 메인이 아니라 공부 주제에 붙일 참고 재료로 사용해요.</p>
          </div>
          <AppButton variant="soft" onClick={onUpload}>+ 캡처 자료 추가</AppButton>
        </div>
      </GlassCard>
      <div className="grid gap-3 md:grid-cols-3">
        {captures.map((capture) => (
          <article key={capture.id} className="overflow-hidden rounded-[24px] bg-white/70 shadow-glass">
            <div className="aspect-[4/3] bg-slate-100">
              {capture.images?.[0]?.url ? <img src={capture.images[0].url} alt={capture.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm font-bold text-clover-sub">이미지 없음</div>}
            </div>
            <div className="p-4">
              <b className="line-clamp-2">{capture.title}</b>
              <p className="mt-1 line-clamp-2 text-sm font-bold text-clover-sub">{capture.summary || capture.memo}</p>
            </div>
          </article>
        ))}
        {!captures.length && <EmptyBox title="저장된 캡처 자료가 없어요." note="공부 주제를 먼저 만들고 필요할 때 캡처를 보조 자료로 붙여보세요." action="캡처 추가" onAction={onUpload} />}
      </div>
    </div>
  );
}

function CaptureUploadModal({ onClose, onDone }) {
  const [files, setFiles] = useState([]);
  const [memo, setMemo] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!files.length) return;
    setBusy(true);
    const images = await Promise.all(files.map(readImageFile));
    createCapture({ images, memo, sourceUrl, bundle: true });
    setBusy(false);
    onDone();
  };

  return (
    <Modal title="캡처 자료 추가" onClose={onClose}>
      <div className="grid gap-4">
        <label className="grid cursor-pointer place-items-center rounded-[26px] border border-dashed border-clover-deep/30 bg-white/55 p-8 text-center text-sm font-black text-clover-deep">
          이미지 선택하기
          <span className="mt-1 text-xs font-bold text-clover-sub">공부 주제에 붙일 참고 자료로 보관돼요.</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
        </label>
        {!!files.length && <p className="text-sm font-bold text-clover-sub">{files.length}개의 이미지가 선택됐어요.</p>}
        <label className="grid gap-1 text-sm font-bold">출처 URL<AppInput value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="선택 입력" /></label>
        <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="왜 저장했는지만 짧게 적어도 좋아요." /></label>
        <AppButton onClick={save} disabled={!files.length || busy}>{busy ? "저장 중..." : "캡처 저장"}</AppButton>
      </div>
    </Modal>
  );
}

export default function StudyPage() {
  const [data, setData] = useState(getStudyData());
  const [tab, setTab] = useState("home");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => setData(getStudyData());

  useEffect(() => {
    window.addEventListener("clover-data-change", refresh);
    return () => window.removeEventListener("clover-data-change", refresh);
  }, []);

  const items = useMemo(() => data.items || [], [data.items]);
  const activeItems = items.filter((item) => !item.archived);
  const today = todayKey();
  const queue = activeItems.filter((item) => item.status === "not_started");
  const progress = activeItems.filter((item) => item.status === "in_progress");
  const applied = activeItems.filter((item) => ["apply_pending", "applied"].includes(item.status));
  const due = activeItems.filter((item) => item.revisitDate && item.revisitDate <= today && ["not_started", "in_progress", "apply_pending"].includes(item.status));

  const updateStatus = (item, status) => {
    updateStudyItem(item.id, { status, completedAt: status === "applied" ? todayKey() : item.completedAt });
    refresh();
  };

  const moveArchive = (item) => {
    archiveStudyItem(item.id, item.archiveNote || "");
    refresh();
  };

  const content = (() => {
    if (tab === "home") return <StudyHome items={items} onTab={setTab} onOpen={setEditing} onStatus={updateStatus} onArchive={moveArchive} onAdd={() => setQuickAddOpen(true)} />;
    if (tab === "queue") return <BoardTab title="Study Queue" note="아직 시작하지 않은 공부 주제예요." items={queue} empty={{ title: "아직 저장된 공부 주제가 없어요.", note: "나중에 찾아보고 싶은 주제를 먼저 적어두세요.", action: "주제 추가" }} onOpen={setEditing} onStatus={updateStatus} onArchive={moveArchive} onAdd={() => setQuickAddOpen(true)} />;
    if (tab === "progress") return <BoardTab title="In Progress" note="지금 공부 중인 주제와 메모를 관리해요." items={progress} empty={{ title: "지금 공부 중인 주제가 없어요.", note: "오늘 다시 볼 주제에서 하나를 골라 시작해보세요.", action: "주제 추가" }} onOpen={setEditing} onStatus={updateStatus} onArchive={moveArchive} onAdd={() => setQuickAddOpen(true)} />;
    if (tab === "applied") return <BoardTab title="Applied" note="적용 대기와 적용 완료 주제를 관리해요." items={applied} empty={{ title: "아직 적용 완료한 공부가 없어요.", note: "공부한 내용을 실제 작업에 한 번 연결해보세요.", action: "주제 추가" }} onOpen={setEditing} onStatus={updateStatus} onArchive={moveArchive} onAdd={() => setQuickAddOpen(true)} />;
    if (tab === "archive") return <ArchiveTab items={items} onOpen={setEditing} />;
    return <CaptureSupportTab captures={data.captures || []} onUpload={() => setUploadOpen(true)} />;
  })();

  return (
    <>
      <PageHeader eyebrow="Study" title="공부 대시보드">
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 rounded-full bg-white/70 px-4 py-2 text-sm font-black text-clover-deep">오늘 다시 볼 {due.length}개</span>
          <AppButton onClick={() => setQuickAddOpen(true)}>+ 공부 주제 추가</AppButton>
        </div>
      </PageHeader>

      <p className="-mt-3 mb-4 max-w-2xl text-sm font-bold text-clover-sub">캡처를 쌓는 곳이 아니라, 나중에 공부하고 써먹을 주제를 잃어버리지 않게 관리하는 보드예요.</p>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 thin-scroll">
        {tabs.map(([value, label]) => <Chip key={value} active={tab === value} onClick={() => setTab(value)}>{label}</Chip>)}
      </div>

      {content}

      {quickAddOpen && <QuickAddModal onClose={() => setQuickAddOpen(false)} onDone={() => { setQuickAddOpen(false); refresh(); setTab("queue"); }} />}
      {uploadOpen && <CaptureUploadModal onClose={() => setUploadOpen(false)} onDone={() => { setUploadOpen(false); refresh(); setTab("captures"); }} />}
      {editing && (
        <StudyItemEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
          onDelete={() => { setEditing(null); refresh(); }}
        />
      )}
    </>
  );
}
