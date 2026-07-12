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
import SubPageTabs from "../../components/common/SubPageTabs";
import {
  createCapture,
  createExperimentFromCapture,
  createNoteFromCapture,
  createStudyCardFromCapture,
  createStudyExperiment,
  createStudyNote,
  createStudyWorkflow,
  createWorkflowFromNote,
  createWorkflowFromExperiment,
  deleteCapture,
  deleteStudyExperiment,
  deleteStudyNote,
  deleteStudyWorkflow,
  experimentOutcomes,
  experimentStatuses,
  getStudyData,
  markCaptureReason,
  noteFunctionTags,
  noteStatuses,
  noteTopics,
  saveNoteAsTemplate,
  studyReasons,
  studyStatuses,
  studyTypes,
  updateCapture,
  updateStudyExperiment,
  updateStudyNote,
  updateStudyWorkflow
} from "../../lib/study/studyRepository";
import { toDateKey } from "../../lib/utils/date";

const tabs = [
  ["home", "홈"],
  ["inbox", "캡처"],
  ["notes", "노트"],
  ["archive", "아카이브"],
  ["experiments", "실험"],
  ["workflows", "워크플로우"]
];

const statusLabel = Object.fromEntries(studyStatuses);
const reasonLabel = Object.fromEntries(studyReasons);

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

function CaptureCard({ capture, categories, onOpen, onAction }) {
  const category = categories.find((item) => item.id === capture.categoryId);
  return (
    <article className={`overflow-hidden rounded-[26px] border bg-white/70 shadow-glass ${capture.status === "unclassified" ? "border-amber-200" : "border-white/70"}`}>
      <button type="button" onClick={() => onOpen(capture)} className="block w-full text-left">
        <div className="aspect-[4/3] bg-slate-100">
          {capture.images?.[0]?.url ? (
            <img src={capture.images[0].url} alt={capture.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-sm font-bold text-clover-sub">이미지 없음</div>
          )}
        </div>
        <div className="grid gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={capture.status === "unclassified" ? "warning" : capture.status === "applied" ? "done" : "blue"}>{statusLabel[capture.status] || capture.status}</StatusBadge>
            {capture.isImportant && <StatusBadge tone="danger">중요</StatusBadge>}
            {capture.aiAnalysis?.containsSensitiveInfo && <StatusBadge tone="danger">개인정보 주의</StatusBadge>}
          </div>
          <div>
            <h3 className="line-clamp-2 text-base font-black text-clover-text">{capture.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm font-bold text-clover-sub">{capture.summary || capture.aiAnalysis?.summary}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(capture.tags || []).slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-clover-mint/70 px-2.5 py-1 text-[11px] font-black text-clover-deep">{tag}</span>)}
            {category && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-clover-sub">{category.name}</span>}
          </div>
        </div>
      </button>
      <div className="flex flex-wrap gap-2 border-t border-white/70 p-3">
        <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-clover-deep" onClick={() => onAction("study", capture)}>공부</button>
        <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-sky-700" onClick={() => onAction("work", capture)}>업무 적용</button>
        <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-emerald-700" onClick={() => onAction("note", capture)}>노트로 확장</button>
        <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-violet-700" onClick={() => onAction("card", capture)}>카드</button>
      </div>
    </article>
  );
}

function CaptureUploadModal({ onClose, onDone }) {
  const [files, setFiles] = useState([]);
  const [memo, setMemo] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [bundle, setBundle] = useState(true);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!files.length) return;
    setBusy(true);
    const images = await Promise.all(files.map(readImageFile));
    createCapture({ images, memo, sourceUrl, bundle });
    setBusy(false);
    onDone();
  };

  return (
    <Modal title="캡처 빠른 업로드" onClose={onClose}>
      <div className="grid gap-4">
        <label className="grid cursor-pointer place-items-center rounded-[26px] border border-dashed border-clover-deep/30 bg-white/55 p-8 text-center text-sm font-black text-clover-deep">
          이미지 선택하기
          <span className="mt-1 text-xs font-bold text-clover-sub">여러 장을 한 번에 올릴 수 있어요.</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
        </label>
        {!!files.length && <p className="text-sm font-bold text-clover-sub">{files.length}장의 이미지가 선택됐어요.</p>}
        <label className="grid gap-1 text-sm font-bold">출처 URL<AppInput value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="선택 입력" /></label>
        <label className="grid gap-1 text-sm font-bold">짧은 메모<AppTextarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="왜 저장했는지 한 줄만 적어도 좋아요." /></label>
        <label className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
          선택한 이미지를 하나의 자료로 묶기
          <input type="checkbox" checked={bundle} onChange={(event) => setBundle(event.target.checked)} />
        </label>
        <AppButton onClick={save} disabled={!files.length || busy}>{busy ? "저장 중..." : "캡처 저장"}</AppButton>
      </div>
    </Modal>
  );
}

function CaptureDetailModal({ capture, data, onClose, onRefresh }) {
  const [draft, setDraft] = useState(capture);
  const [projectId, setProjectId] = useState(capture.projectIds?.[0] || "");

  const save = () => {
    updateCapture(capture.id, { ...draft, projectIds: projectId ? [projectId] : [] });
    onRefresh();
  };

  const makeCard = () => {
    createStudyCardFromCapture(draft);
    onRefresh();
  };

  const makeExperiment = () => {
    createExperimentFromCapture(draft);
    onRefresh();
  };

  const makeNote = () => {
    createNoteFromCapture(draft);
    onRefresh();
  };

  return (
    <Modal title="캡처 상세" onClose={onClose}>
      <div className="grid gap-4">
        <div className="overflow-hidden rounded-[24px] bg-white/55">
          {draft.images?.[0]?.url && <img src={draft.images[0].url} alt={draft.title} className="max-h-80 w-full object-contain" />}
        </div>
        <label className="grid gap-1 text-sm font-bold">제목<AppInput value={draft.title || ""} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label className="grid gap-1 text-sm font-bold">요약<AppTextarea value={draft.summary || ""} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">카테고리<AppSelect value={draft.categoryId || ""} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}><option value="">미선택</option>{data.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">자료 유형<AppSelect value={draft.type || "캡처"} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{studyTypes.map((item) => <option key={item}>{item}</option>)}</AppSelect></label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">상태<AppSelect value={draft.status || "unclassified"} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{studyStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">연결 프로젝트<AppSelect value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">없음</option>{data.projects.slice(0, 20).map((item) => <option key={item.id} value={item.id}>{item.title || item.project || item.name}</option>)}</AppSelect></label>
        </div>
        <label className="grid gap-1 text-sm font-bold">태그<AppInput value={(draft.tags || []).join(", ")} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
        {draft.aiAnalysis?.containsSensitiveInfo && <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600">개인정보가 포함되어 있을 수 있어요. 외부 AI 분석에 보내기 전 확인이 필요합니다.</p>}
        <div className="rounded-2xl bg-white/55 p-4 text-sm text-clover-sub">
          <p className="font-black text-clover-text">Mock AI 분석</p>
          <p className="mt-1">{draft.aiAnalysis?.summary}</p>
          <p className="mt-2 font-bold">추천 사용법: {(draft.aiAnalysis?.possibleUses || []).join(", ")}</p>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <button className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600" onClick={() => { deleteCapture(capture.id); onRefresh(); }}>삭제</button>
          <div className="flex flex-wrap gap-2">
            <AppButton variant="soft" onClick={makeCard}>학습카드로 변환</AppButton>
            <AppButton variant="soft" onClick={makeNote}>노트로 확장</AppButton>
            <AppButton variant="soft" onClick={makeExperiment}>실험 만들기</AppButton>
            <AppButton onClick={save}>저장</AppButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function FlowExplainer() {
  const steps = [
    { key: "capture", label: "캡처", desc: "스크린샷·링크·메모로 재료를 모아요", color: "bg-slate-100 text-slate-700" },
    { key: "branch", label: "노트 / 학습카드 / 실험", desc: "캡처 하나를 세 갈래 중 필요한 걸로 확장해요", color: "bg-violet-100 text-violet-700" },
    { key: "workflow", label: "워크플로우", desc: "노트나 실험이 검증되면 반복 절차로 굳혀요", color: "bg-emerald-100 text-emerald-700" }
  ];
  return (
    <GlassCard className="bg-[#FAFAFF]/80">
      <SectionTitle>Study 흐름 한눈에 보기</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.key} className="relative">
            <div className={`rounded-2xl p-3 ${step.color}`}>
              <p className="text-sm font-black">{index + 1}. {step.label}</p>
              <p className="mt-1 text-xs font-bold opacity-80">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-bold text-clover-sub">
        ⓘ 학습카드는 복습용 요약 카드로 끝나는 별도 갈래예요. 워크플로우로 이어지는 건 <b>노트</b>(노트 상세의 "워크플로우로 만들기")나 <b>완료된 실험</b>(실험 카드의 "워크플로우로 전환")뿐이에요.
      </p>
    </GlassCard>
  );
}

function HomeTab({ data, setTab, onOpen, onUpload }) {
  const today = toDateKey(new Date());
  const due = data.captures
    .map((capture) => {
      let score = 0;
      if (!capture.isReviewed) score += 5;
      if (capture.isImportant) score += 4;
      if (capture.createdAt < today) score += 2;
      if (capture.reviewSchedule?.nextReviewAt && capture.reviewSchedule.nextReviewAt <= today) score += 5;
      if (capture.status === "waiting") score += 3;
      return { ...capture, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const unclassified = data.captures.filter((item) => item.status === "unclassified");

  const stats = [
    { key: "inbox", label: "미분류 캡처", value: unclassified.length, tab: "inbox" },
    { key: "archive", label: "공부 대기", value: data.captures.filter((item) => item.status === "waiting").length, tab: "archive" },
    { key: "notes", label: "정리한 노트", value: data.notes.length, tab: "notes" },
    { key: "experiments", label: "진행 중 실험", value: data.experiments.filter((item) => item.status !== "completed").length, tab: "experiments" },
    { key: "workflows", label: "워크플로우", value: data.workflows.length, tab: "workflows" }
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-5">
        {stats.map((stat) => (
          <button key={stat.key} className="rounded-[24px] bg-white/70 p-4 text-left shadow-glass transition hover:bg-white" onClick={() => setTab(stat.tab)}>
            <p className="text-xs font-bold text-clover-sub">{stat.label}</p>
            <b className="mt-1 block text-2xl font-black text-clover-deep">{stat.value}</b>
          </button>
        ))}
      </div>

      <FlowExplainer />

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle>오늘 다시 볼 캡처</SectionTitle>
            <p className="text-sm font-bold text-clover-sub">잊기 전에 한 번만 훑어볼 자료를 골라왔어요.</p>
          </div>
          <div className="flex gap-2">
            <AppButton variant="soft" onClick={onUpload}>+ 캡처 추가</AppButton>
            <AppButton onClick={() => setTab("inbox")}>시작하기</AppButton>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {due.map((capture) => <CaptureCard key={capture.id} capture={capture} categories={data.categories} onOpen={onOpen} onAction={() => setTab("inbox")} />)}
          {!due.length && <p className="rounded-[24px] bg-white/50 p-6 text-sm font-bold text-clover-sub md:col-span-3">오늘 확인할 자료를 모두 해냈어요.</p>}
        </div>
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <GlassCard>
          <SectionTitle>자동 컬렉션</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {data.categories.slice(0, 6).map((category) => {
              const items = data.captures.filter((capture) => capture.categoryId === category.id);
              return (
                <button key={category.id} className="rounded-[22px] bg-white/55 p-4 text-left" onClick={() => setTab("archive")}>
                  <p className="font-black">{category.name}</p>
                  <p className="mt-1 text-sm font-bold text-clover-sub">{items.length}개 자료</p>
                  <p className="mt-2 line-clamp-1 text-xs text-clover-sub">{items.slice(0, 3).map((item) => item.title).join(", ") || "자료를 기다리는 중"}</p>
                </button>
              );
            })}
          </div>
        </GlassCard>
        <GlassCard>
          <SectionTitle>이번 주 기록</SectionTitle>
          <div className="grid grid-cols-2 gap-2 text-sm font-bold text-clover-sub">
            <p className="rounded-xl bg-white/50 px-3 py-2">확인한 캡처 <b className="text-clover-deep">{data.captures.filter((item) => item.isReviewed).length}</b></p>
            <p className="rounded-xl bg-white/50 px-3 py-2">정리한 노트 <b className="text-clover-deep">{data.notes.length}</b></p>
            <p className="rounded-xl bg-white/50 px-3 py-2">학습카드 <b className="text-clover-deep">{data.cards.length}</b></p>
            <p className="rounded-xl bg-white/50 px-3 py-2">프로젝트 연결 <b className="text-clover-deep">{data.captures.filter((item) => item.projectIds?.length).length}</b></p>
            <p className="rounded-xl bg-white/50 px-3 py-2">완료한 실험 <b className="text-clover-deep">{data.experiments.filter((item) => item.status === "completed").length}</b></p>
            <p className="rounded-xl bg-white/50 px-3 py-2">워크플로우 <b className="text-clover-deep">{data.workflows.length}</b></p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function InboxTab({ data, onOpen, onRefresh }) {
  const unclassified = data.captures.filter((item) => item.status === "unclassified");
  const [index, setIndex] = useState(0);
  const current = unclassified[index];

  const handleReason = (reason) => {
    if (!current) return;
    markCaptureReason(current, reason);
    onRefresh();
    setIndex((value) => Math.min(value, Math.max(0, unclassified.length - 2)));
  };

  return (
    <div className="grid gap-4">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>캡처 인박스</SectionTitle>
          <p className="text-sm font-bold text-clover-sub">미분류 {unclassified.length}개</p>
        </div>
        {current ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <button type="button" onClick={() => onOpen(current)} className="overflow-hidden rounded-[28px] bg-white/55">
              <img src={current.images?.[0]?.url} alt={current.title} className="max-h-[560px] w-full object-contain" />
            </button>
            <div className="grid content-start gap-3">
              <p className="text-sm font-black text-clover-sub">{Math.min(index + 1, unclassified.length)} / {unclassified.length}</p>
              <h2 className="text-2xl font-black">{current.title}</h2>
              <p className="text-sm font-bold text-clover-sub">{current.summary}</p>
              <div className="flex flex-wrap gap-2">
                {(current.tags || []).map((tag) => <span key={tag} className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">{tag}</span>)}
              </div>
              <p className="mt-3 text-sm font-black">이 캡처를 왜 저장했나요?</p>
              <div className="grid gap-2">
                {studyReasons.map(([value, label]) => <button key={value} className="rounded-2xl bg-white/65 px-4 py-3 text-left text-sm font-black text-clover-text" onClick={() => handleReason(value)}>{label}</button>)}
              </div>
              <div className="flex gap-2">
                <AppButton variant="soft" onClick={() => setIndex(Math.max(0, index - 1))}>이전</AppButton>
                <AppButton variant="soft" onClick={() => setIndex(Math.min(unclassified.length - 1, index + 1))}>다음</AppButton>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-[24px] bg-white/50 p-8 text-center text-sm font-bold text-clover-sub">모든 캡처를 확인했어요. 새 자료를 발견하면 부담 없이 저장해보세요.</p>
        )}
      </GlassCard>
    </div>
  );
}

function ArchiveTab({ data, onOpen, onAction, onUpload }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const filtered = data.captures.filter((capture) => {
    const text = `${capture.title} ${capture.summary} ${(capture.tags || []).join(" ")} ${capture.memo || ""}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) &&
      (status === "all" || capture.status === status) &&
      (categoryId === "all" || capture.categoryId === categoryId);
  });

  return (
    <div className="grid gap-4">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle>아카이브</SectionTitle>
          <AppButton onClick={onUpload}>+ 캡처 추가</AppButton>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <AppInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목, 요약, 태그 검색" />
          <AppSelect value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">전체 상태</option>{studyStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</AppSelect>
          <AppSelect value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="all">전체 카테고리</option>{data.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</AppSelect>
        </div>
      </GlassCard>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((capture) => <CaptureCard key={capture.id} capture={capture} categories={data.categories} onOpen={onOpen} onAction={onAction} />)}
        {!filtered.length && <p className="rounded-[24px] bg-white/60 p-8 text-sm font-bold text-clover-sub sm:col-span-2 xl:col-span-3">조건에 맞는 자료가 없어요.</p>}
      </div>
    </div>
  );
}

function CardsList({ data }) {
  return (
    <GlassCard>
      <SectionTitle>학습카드</SectionTitle>
      <div className="grid gap-3">
        {data.cards.map((card) => (
          <article key={card.id} className="rounded-[22px] bg-white/55 p-4">
            <h3 className="font-black">{card.title}</h3>
            <p className="mt-1 text-sm font-bold text-clover-sub">{card.definition}</p>
            <ul className="mt-3 grid gap-1 text-sm font-bold text-clover-text">
              {(card.keyPoints || []).map((point) => <li key={point}>· {point}</li>)}
            </ul>
          </article>
        ))}
        {!data.cards.length && <p className="rounded-2xl bg-white/45 p-5 text-sm font-bold text-clover-sub">학습카드로 바꾼 자료가 아직 없어요.</p>}
      </div>
    </GlassCard>
  );
}

const emptyNote = () => ({
  title: "",
  summary: "",
  memo: "",
  steps: "",
  prompts: "",
  links: "",
  nextTry: "",
  topic: noteTopics[0],
  functionTag: noteFunctionTags[0],
  status: "정리중",
  captureIds: [],
  workflowIds: [],
  templateSaved: false
});

function NoteEditorModal({ note, data, onClose, onSaved }) {
  const [draft, setDraft] = useState(note || emptyNote());
  const set = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  const save = () => {
    const payload = { ...draft, title: draft.title.trim() || "제목 없는 노트" };
    if (payload.id) updateStudyNote(payload.id, payload);
    else createStudyNote(payload);
    onSaved();
  };

  return (
    <Modal title={draft.id ? "Study 노트 수정" : "Study 노트 추가"} onClose={onClose}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-bold">제목<AppInput value={draft.title || ""} onChange={(event) => set("title", event.target.value)} placeholder="예: 홈페이지 제작 툴 비교" autoFocus /></label>
        <label className="grid gap-1 text-sm font-bold">한 줄 요약<AppInput value={draft.summary || ""} onChange={(event) => set("summary", event.target.value)} placeholder="나중에 다시 볼 때 바로 이해되는 한 줄" /></label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold">주제<AppSelect value={draft.topic || noteTopics[0]} onChange={(event) => set("topic", event.target.value)}>{noteTopics.map((item) => <option key={item}>{item}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">기능 태그<AppSelect value={draft.functionTag || noteFunctionTags[0]} onChange={(event) => set("functionTag", event.target.value)}>{noteFunctionTags.map((item) => <option key={item}>{item}</option>)}</AppSelect></label>
          <label className="grid gap-1 text-sm font-bold">상태<AppSelect value={draft.status || "정리중"} onChange={(event) => set("status", event.target.value)}>{noteStatuses.map((item) => <option key={item}>{item}</option>)}</AppSelect></label>
        </div>
        <label className="grid gap-1 text-sm font-bold">핵심 메모<AppTextarea value={draft.memo || ""} onChange={(event) => set("memo", event.target.value)} placeholder="내 말로 이해한 핵심만 짧게" /></label>
        <label className="grid gap-1 text-sm font-bold">따라하는 순서<AppTextarea value={draft.steps || ""} onChange={(event) => set("steps", event.target.value)} placeholder={"1. 자료 준비\n2. 프롬프트 입력\n3. 결과 수정"} /></label>
        <label className="grid gap-1 text-sm font-bold">자주 쓸 프롬프트<AppTextarea value={draft.prompts || ""} onChange={(event) => set("prompts", event.target.value)} placeholder="복붙해서 다시 쓸 문장" /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">관련 링크/이미지<AppTextarea value={draft.links || ""} onChange={(event) => set("links", event.target.value)} placeholder="URL이나 이미지 설명을 한 줄씩" /></label>
          <label className="grid gap-1 text-sm font-bold">다음에 해볼 것<AppTextarea value={draft.nextTry || ""} onChange={(event) => set("nextTry", event.target.value)} placeholder="실제로 써먹을 다음 행동" /></label>
        </div>
        {!!draft.captureIds?.length && (
          <div className="rounded-2xl bg-white/55 p-3 text-sm font-bold text-clover-sub">
            연결된 캡처 {draft.captureIds.length}개 · {draft.captureIds.map((id) => data.captures.find((capture) => capture.id === id)?.title).filter(Boolean).slice(0, 2).join(", ")}
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-2">
          {draft.id && <button className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600" onClick={() => { deleteStudyNote(draft.id); onSaved(); }}>삭제</button>}
          <AppButton onClick={save}>노트 저장</AppButton>
        </div>
      </div>
    </Modal>
  );
}

function NoteCard({ note, data, onEdit, onRefresh }) {
  const linkedCaptures = (note.captureIds || [])
    .map((id) => data.captures.find((capture) => capture.id === id))
    .filter(Boolean);

  const makeWorkflow = () => {
    createWorkflowFromNote(note);
    onRefresh();
  };

  const saveTemplate = () => {
    saveNoteAsTemplate(note);
    onRefresh();
  };

  return (
    <article className="rounded-[26px] border border-white/70 bg-white/70 p-4 shadow-glass">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <StatusBadge tone={note.status === "써먹음" ? "done" : note.status === "캡처" ? "warning" : "blue"}>{note.status}</StatusBadge>
            {note.templateSaved && <StatusBadge tone="mint">템플릿</StatusBadge>}
          </div>
          <h3 className="line-clamp-2 text-lg font-black text-clover-text">{note.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-bold text-clover-sub">{note.summary || note.memo || "짧게 쌓아두는 Study 노트"}</p>
        </div>
        <button type="button" onClick={() => onEdit(note)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-clover-deep">수정</button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-clover-mint/70 px-3 py-1 text-xs font-black text-clover-deep">{note.topic}</span>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">{note.functionTag}</span>
      </div>

      {note.steps && (
        <div className="mt-4 rounded-2xl bg-white/55 p-3">
          <p className="mb-1 text-xs font-black text-clover-sub">따라하는 순서</p>
          <p className="line-clamp-3 whitespace-pre-wrap text-sm font-bold text-clover-text">{note.steps}</p>
        </div>
      )}

      {note.prompts && (
        <div className="mt-2 rounded-2xl bg-[#FFF8E7]/80 p-3">
          <p className="mb-1 text-xs font-black text-amber-700">자주 쓸 프롬프트</p>
          <p className="line-clamp-2 whitespace-pre-wrap text-sm font-bold text-clover-text">{note.prompts}</p>
        </div>
      )}

      {!!linkedCaptures.length && <p className="mt-3 text-xs font-bold text-clover-sub">연결 캡처: {linkedCaptures.slice(0, 2).map((item) => item.title).join(", ")}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <AppButton variant="soft" onClick={makeWorkflow}>워크플로우로 만들기</AppButton>
        <AppButton variant="soft" onClick={saveTemplate}>{note.templateSaved ? "템플릿 저장됨" : "템플릿으로 저장"}</AppButton>
      </div>
    </article>
  );
}

function NotesTab({ data, onRefresh }) {
  const [mode, setMode] = useState("topic");
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);

  const groups = mode === "topic" ? noteTopics : noteFunctionTags;
  const filtered = data.notes.filter((note) => {
    const text = `${note.title} ${note.summary} ${note.memo} ${note.steps} ${note.prompts} ${note.topic} ${note.functionTag}`.toLowerCase();
    const groupValue = mode === "topic" ? note.topic : note.functionTag;
    return (!query || text.includes(query.toLowerCase())) &&
      (filter === "all" || groupValue === filter) &&
      (status === "all" || note.status === status);
  });

  return (
    <div className="grid gap-4">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle>노트 / 글쓰기</SectionTitle>
            <p className="text-sm font-bold text-clover-sub">캡처는 재료, 노트는 이해, 워크플로우는 실행법으로 이어져요.</p>
          </div>
          <AppButton onClick={() => setEditing(emptyNote())}>+ 노트 추가</AppButton>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_150px_180px_150px]">
          <AppInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="노트 검색" />
          <AppSelect value={mode} onChange={(event) => { setMode(event.target.value); setFilter("all"); }}>
            <option value="topic">주제별 보기</option>
            <option value="function">기능별 보기</option>
          </AppSelect>
          <AppSelect value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">전체 {mode === "topic" ? "주제" : "기능"}</option>
            {groups.map((item) => <option key={item}>{item}</option>)}
          </AppSelect>
          <AppSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">전체 상태</option>
            {noteStatuses.map((item) => <option key={item}>{item}</option>)}
          </AppSelect>
        </div>
      </GlassCard>

      <div className="grid gap-3 md:grid-cols-4">
        {groups.slice(0, 8).map((item) => {
          const count = data.notes.filter((note) => (mode === "topic" ? note.topic : note.functionTag) === item).length;
          return (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-[22px] p-4 text-left shadow-glass ${filter === item ? "bg-clover-deep text-white" : "bg-white/70 text-clover-text"}`}>
              <p className="text-sm font-black">{item}</p>
              <p className={`mt-1 text-2xl font-black ${filter === item ? "text-white" : "text-clover-deep"}`}>{count}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((note) => <NoteCard key={note.id} note={note} data={data} onEdit={setEditing} onRefresh={onRefresh} />)}
        {!filtered.length && <p className="rounded-[24px] bg-white/60 p-8 text-sm font-bold text-clover-sub xl:col-span-2">아직 조건에 맞는 노트가 없어요. 캡처를 하나 골라 노트로 확장해보세요.</p>}
      </div>

      {editing && <NoteEditorModal note={editing.id ? editing : null} data={data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh(); }} />}
    </div>
  );
}

const emptyExperiment = () => ({
  title: "",
  purpose: "",
  question: "",
  toolNames: ["ChatGPT", "Claude"],
  commonPrompt: "",
  evaluationCriteria: ["정확도", "소요 시간"],
  conclusion: "",
  status: "planned",
  outcome: ""
});

function ExperimentEditorModal({ experiment, onClose, onSaved }) {
  const [draft, setDraft] = useState(experiment || emptyExperiment());
  const set = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  const save = () => {
    const payload = { ...draft, title: draft.title.trim() || "새 실험" };
    if (payload.id) updateStudyExperiment(payload.id, payload);
    else createStudyExperiment(payload);
    onSaved();
  };

  return (
    <Modal title={draft.id ? "실험 수정" : "실험 추가"} onClose={onClose}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-bold">실험 제목<AppInput value={draft.title || ""} onChange={(event) => set("title", event.target.value)} placeholder="예: 카드뉴스 문구 AI 비교" autoFocus /></label>
        <label className="grid gap-1 text-sm font-bold">목적<AppInput value={draft.purpose || ""} onChange={(event) => set("purpose", event.target.value)} placeholder="이 실험으로 알고 싶은 것" /></label>
        <label className="grid gap-1 text-sm font-bold">질문<AppInput value={draft.question || ""} onChange={(event) => set("question", event.target.value)} placeholder="어떤 방식이 더 나을까?" /></label>
        <label className="grid gap-1 text-sm font-bold">비교할 도구 (쉼표로 구분)<AppInput value={(draft.toolNames || []).join(", ")} onChange={(event) => set("toolNames", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="ChatGPT, Claude, Gemini" /></label>
        <label className="grid gap-1 text-sm font-bold">공통 프롬프트<AppTextarea value={draft.commonPrompt || ""} onChange={(event) => set("commonPrompt", event.target.value)} placeholder="모든 도구에 똑같이 넣을 프롬프트" /></label>
        <label className="grid gap-1 text-sm font-bold">평가 기준 (쉼표로 구분)<AppInput value={(draft.evaluationCriteria || []).join(", ")} onChange={(event) => set("evaluationCriteria", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="정확도, 소요 시간, 수정 용이성" /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">진행 상태<AppSelect value={draft.status || "planned"} onChange={(event) => set("status", event.target.value)}>{experimentStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</AppSelect></label>
          {draft.status === "completed" && (
            <label className="grid gap-1 text-sm font-bold">결과<AppSelect value={draft.outcome || ""} onChange={(event) => set("outcome", event.target.value)}><option value="">선택</option>{experimentOutcomes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</AppSelect></label>
          )}
        </div>
        <label className="grid gap-1 text-sm font-bold">결론 / 배운 것<AppTextarea value={draft.conclusion || ""} onChange={(event) => set("conclusion", event.target.value)} placeholder="어떤 방식이 왜 더 나았는지" /></label>
        <div className="flex flex-wrap justify-between gap-2">
          {draft.id && <button className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600" onClick={() => { deleteStudyExperiment(draft.id); onSaved(); }}>삭제</button>}
          <AppButton onClick={save}>저장</AppButton>
        </div>
      </div>
    </Modal>
  );
}

const outcomeToneMap = { success: "done", fail: "danger", hold: "warning" };
const outcomeLabelMap = Object.fromEntries(experimentOutcomes);
const experimentStatusLabelMap = Object.fromEntries(experimentStatuses);

function ExperimentsTab({ data, onRefresh }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [outcomePromptId, setOutcomePromptId] = useState(null);

  const advance = (experiment) => {
    if (experiment.status === "planned") {
      updateStudyExperiment(experiment.id, { status: "in_progress" });
      onRefresh();
    } else if (experiment.status === "in_progress") {
      setOutcomePromptId(experiment.id);
    }
  };

  const finishWithOutcome = (experiment, outcome) => {
    updateStudyExperiment(experiment.id, { status: "completed", outcome });
    setOutcomePromptId(null);
    onRefresh();
  };

  const groups = [
    ["all", "전체", data.experiments.length],
    ...experimentStatuses.map(([value, label]) => [value, label, data.experiments.filter((item) => item.status === value).length])
  ];

  const filtered = statusFilter === "all" ? data.experiments : data.experiments.filter((item) => item.status === statusFilter);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="grid gap-4">
        <GlassCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <SectionTitle>실험</SectionTitle>
              <p className="text-sm font-bold text-clover-sub">같은 일을 여러 방법으로 시도해보고 결과를 비교해요.</p>
            </div>
            <AppButton onClick={() => setEditing(emptyExperiment())}>+ 실험 추가</AppButton>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {groups.map(([value, label, count]) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusFilter === value ? "bg-clover-deep text-white" : "bg-white/70 text-clover-sub"}`}
              >
                {label} {count}
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-3">
          {filtered.map((experiment) => (
            <article key={experiment.id} className="rounded-[24px] bg-white/55 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-black">{experiment.title}</h3>
                  <p className="mt-1 text-sm font-bold text-clover-sub">{experiment.question || experiment.purpose}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <StatusBadge tone={experiment.status === "completed" ? "done" : experiment.status === "in_progress" ? "warning" : "blue"}>{experimentStatusLabelMap[experiment.status] || experiment.status}</StatusBadge>
                  {experiment.status === "completed" && experiment.outcome && <StatusBadge tone={outcomeToneMap[experiment.outcome]}>{outcomeLabelMap[experiment.outcome]}</StatusBadge>}
                </div>
              </div>
              <p className="mt-3 text-xs font-black text-clover-sub">도구: {(experiment.toolNames || []).join(", ")}</p>
              {experiment.conclusion && <p className="mt-2 text-sm font-bold text-clover-text">{experiment.conclusion}</p>}

              {outcomePromptId === experiment.id && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-amber-50 p-3">
                  <span className="text-xs font-black text-amber-700">결과가 어땠나요?</span>
                  {experimentOutcomes.map(([value, label]) => (
                    <button key={value} onClick={() => finishWithOutcome(experiment, value)} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-clover-deep">{label}</button>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <AppButton variant="ghost" onClick={() => setEditing(experiment)}>수정</AppButton>
                {experiment.status !== "completed" && (
                  <AppButton variant="soft" onClick={() => advance(experiment)}>
                    {experiment.status === "planned" ? "실험 시작" : "완료 처리"}
                  </AppButton>
                )}
                {experiment.status === "completed" && <AppButton onClick={() => { createWorkflowFromExperiment(experiment); onRefresh(); }}>워크플로우로 전환</AppButton>}
              </div>
            </article>
          ))}
          {!filtered.length && <p className="rounded-2xl bg-white/45 p-5 text-sm font-bold text-clover-sub">이 상태의 실험이 아직 없어요.</p>}
        </div>
      </div>
      <CardsList data={data} />

      {editing && <ExperimentEditorModal experiment={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh(); }} />}
    </div>
  );
}

const emptyWorkflow = () => ({ title: "", description: "", category: "개인 학습", steps: [{ title: "" }] });

function WorkflowEditorModal({ workflow, onClose, onSaved }) {
  const [draft, setDraft] = useState(
    workflow || emptyWorkflow()
  );
  const set = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  const setStep = (index, patch) => {
    const steps = [...(draft.steps || [])];
    steps[index] = { ...steps[index], ...patch };
    set("steps", steps);
  };
  const addStep = () => set("steps", [...(draft.steps || []), { title: "" }]);
  const removeStep = (index) => set("steps", (draft.steps || []).filter((_, i) => i !== index));

  const save = () => {
    const payload = { ...draft, title: draft.title.trim() || "새 워크플로우", steps: (draft.steps || []).filter((step) => (step.title || "").trim()) };
    if (payload.id) updateStudyWorkflow(payload.id, payload);
    else createStudyWorkflow(payload);
    onSaved();
  };

  return (
    <Modal title={draft.id ? "워크플로우 수정" : "워크플로우 추가"} onClose={onClose}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-bold">이름<AppInput value={draft.title || ""} onChange={(event) => set("title", event.target.value)} placeholder="예: 인스타 카드뉴스 만들기" autoFocus /></label>
        <label className="grid gap-1 text-sm font-bold">설명<AppTextarea value={draft.description || ""} onChange={(event) => set("description", event.target.value)} placeholder="이 절차가 어떤 상황에 쓸모 있는지" /></label>
        <label className="grid gap-1 text-sm font-bold">분류<AppInput value={draft.category || ""} onChange={(event) => set("category", event.target.value)} placeholder="예: 콘텐츠 제작" /></label>
        <div className="grid gap-2">
          <p className="text-sm font-bold">단계</p>
          {(draft.steps || []).map((step, index) => (
            <div key={index} className="grid gap-2 rounded-2xl bg-white/55 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-clover-sub">{index + 1}.</span>
                <AppInput value={step.title || ""} onChange={(event) => setStep(index, { title: event.target.value })} placeholder="단계 제목" />
                <button className="shrink-0 text-xs font-black text-clover-danger" onClick={() => removeStep(index)}>삭제</button>
              </div>
              <AppInput value={step.description || ""} onChange={(event) => setStep(index, { description: event.target.value })} placeholder="설명 (선택)" />
            </div>
          ))}
          <AppButton variant="soft" onClick={addStep}>+ 단계 추가</AppButton>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          {draft.id && <button className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600" onClick={() => { deleteStudyWorkflow(draft.id); onSaved(); }}>삭제</button>}
          <AppButton onClick={save}>저장</AppButton>
        </div>
      </div>
    </Modal>
  );
}

function WorkflowsTab({ data, onRefresh }) {
  const [editing, setEditing] = useState(null);
  return (
    <div className="grid gap-4">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle>워크플로우</SectionTitle>
            <p className="text-sm font-bold text-clover-sub">검증된 방법을 나만의 업무 절차로 만들어요.</p>
          </div>
          <AppButton onClick={() => setEditing(emptyWorkflow())}>+ 워크플로우 추가</AppButton>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {data.workflows.map((workflow) => (
            <article key={workflow.id} className="rounded-[24px] bg-white/55 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-black">{workflow.title}</h3>
                <button className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-clover-deep" onClick={() => setEditing(workflow)}>수정</button>
              </div>
              <p className="mt-1 text-sm font-bold text-clover-sub">{workflow.description}</p>
              <div className="mt-4 grid gap-2">
                {(workflow.steps || []).sort((a, b) => a.order - b.order).map((step) => (
                  <div key={step.id} className="rounded-2xl bg-white/60 p-3 text-sm">
                    <p className="font-black">{step.order}. {step.title}</p>
                    {step.description && <p className="mt-1 font-bold text-clover-sub">{step.description}</p>}
                  </div>
                ))}
              </div>
            </article>
          ))}
          {!data.workflows.length && <p className="rounded-2xl bg-white/45 p-5 text-sm font-bold text-clover-sub md:col-span-2">실험을 통해 검증된 방법을 나만의 업무 절차로 만들어보세요.</p>}
        </div>
      </GlassCard>
      {editing && <WorkflowEditorModal workflow={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh(); }} />}
    </div>
  );
}

export default function StudyPage() {
  const [data, setData] = useState(getStudyData());
  const [tab, setTab] = useState("home");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const refresh = () => {
    const next = getStudyData();
    setData(next);
    setDetail(null);
  };

  useEffect(() => {
    window.addEventListener("clover-data-change", refresh);
    return () => window.removeEventListener("clover-data-change", refresh);
  }, []);

  const quickAction = (action, capture) => {
    if (action === "card") createStudyCardFromCapture(capture);
    else if (action === "note") {
      createNoteFromCapture(capture);
      setTab("notes");
    }
    else markCaptureReason(capture, action);
    refresh();
  };

  const content = useMemo(() => {
    if (tab === "home") return <HomeTab data={data} setTab={setTab} onOpen={setDetail} onUpload={() => setUploadOpen(true)} />;
    if (tab === "inbox") return <InboxTab data={data} onOpen={setDetail} onRefresh={refresh} />;
    if (tab === "notes") return <NotesTab data={data} onRefresh={refresh} />;
    if (tab === "archive") return <ArchiveTab data={data} onOpen={setDetail} onAction={quickAction} onUpload={() => setUploadOpen(true)} />;
    if (tab === "experiments") return <ExperimentsTab data={data} onRefresh={refresh} />;
    return <WorkflowsTab data={data} onRefresh={refresh} />;
  }, [tab, data]);

  return (
    <>
      <PageHeader eyebrow="Study" title="AI Study">
        <AppButton onClick={() => setUploadOpen(true)}>+ 캡처 추가</AppButton>
      </PageHeader>

      <p className="mb-4 max-w-2xl text-sm font-bold text-clover-sub">저장한 자료를 다시 보고, 실험하고, 내 일에 쓰는 방식으로 바꾸는 공간이에요.</p>

      <SubPageTabs
        items={[
          { key: "home", label: "개요", active: tab === "home", onClick: () => setTab("home") },
          { key: "inbox", label: "캡처", active: tab === "inbox", onClick: () => setTab("inbox") },
          { key: "notes", label: "노트", active: tab === "notes", onClick: () => setTab("notes") },
          { key: "archive", label: "아카이브", active: tab === "archive", onClick: () => setTab("archive") },
          { key: "experiments", label: "실험", active: tab === "experiments", onClick: () => setTab("experiments") },
          { key: "workflows", label: "워크플로우", active: tab === "workflows", onClick: () => setTab("workflows") }
        ]}
      />

      {content}

      <button type="button" onClick={() => setUploadOpen(true)} className="fixed bottom-20 right-5 z-30 rounded-full bg-clover-deep px-5 py-3 text-sm font-black text-white shadow-glass md:hidden">
        + 캡처
      </button>

      {uploadOpen && <CaptureUploadModal onClose={() => setUploadOpen(false)} onDone={() => { setUploadOpen(false); refresh(); setTab("inbox"); }} />}
      {detail && <CaptureDetailModal capture={detail} data={data} onClose={() => setDetail(null)} onRefresh={refresh} />}
    </>
  );
}
