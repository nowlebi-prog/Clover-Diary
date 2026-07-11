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
  createCapture,
  createExperimentFromCapture,
  createStudyCardFromCapture,
  createWorkflowFromExperiment,
  deleteCapture,
  getStudyData,
  markCaptureReason,
  saveStudyPatch,
  studyReasons,
  studyStatuses,
  studyTypes,
  updateCapture
} from "../../lib/study/studyRepository";
import { toDateKey } from "../../lib/utils/date";

const tabs = [
  ["home", "홈"],
  ["inbox", "캡처"],
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
            <AppButton variant="soft" onClick={makeExperiment}>실험 만들기</AppButton>
            <AppButton onClick={save}>저장</AppButton>
          </div>
        </div>
      </div>
    </Modal>
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

  return (
    <div className="grid gap-4">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle>오늘 다시 볼 캡처</SectionTitle>
            <p className="text-sm font-bold text-clover-sub">잊기 전에 한 번만 훑어볼 자료를 골라왔어요.</p>
          </div>
          <AppButton onClick={() => setTab("inbox")}>시작하기</AppButton>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {due.map((capture) => <CaptureCard key={capture.id} capture={capture} categories={data.categories} onOpen={onOpen} onAction={() => setTab("inbox")} />)}
          {!due.length && <p className="rounded-[24px] bg-white/50 p-6 text-sm font-bold text-clover-sub md:col-span-3">오늘 확인할 자료를 모두 해냈어요.</p>}
        </div>
      </GlassCard>

      <div className="grid gap-3 md:grid-cols-4">
        <button className="rounded-[24px] bg-white/70 p-4 text-left shadow-glass" onClick={() => setTab("inbox")}><p className="text-sm font-black">미분류 캡처</p><b className="text-2xl text-clover-deep">{unclassified.length}</b></button>
        <button className="rounded-[24px] bg-white/70 p-4 text-left shadow-glass" onClick={() => setTab("archive")}><p className="text-sm font-black">공부 대기</p><b className="text-2xl text-clover-deep">{data.captures.filter((item) => item.status === "waiting").length}</b></button>
        <button className="rounded-[24px] bg-white/70 p-4 text-left shadow-glass" onClick={() => setTab("experiments")}><p className="text-sm font-black">실험 대기</p><b className="text-2xl text-clover-deep">{data.experiments.filter((item) => item.status !== "completed").length}</b></button>
        <button className="rounded-[24px] bg-white/70 p-4 text-left shadow-glass" onClick={() => setTab("workflows")}><p className="text-sm font-black">워크플로우</p><b className="text-2xl text-clover-deep">{data.workflows.length}</b></button>
      </div>

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
          <div className="grid gap-2 text-sm font-bold text-clover-sub">
            <p>확인한 캡처 {data.captures.filter((item) => item.isReviewed).length}개</p>
            <p>학습카드 {data.cards.length}개</p>
            <p>프로젝트 연결 {data.captures.filter((item) => item.projectIds?.length).length}개</p>
            <p>완료한 실험 {data.experiments.filter((item) => item.status === "completed").length}개</p>
            <p>만든 워크플로우 {data.workflows.length}개</p>
          </div>
          <AppButton className="mt-4 w-full" onClick={onUpload}>+ 캡처 추가</AppButton>
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

function ArchiveTab({ data, onOpen, onAction }) {
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
        <SectionTitle>아카이브</SectionTitle>
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

function ExperimentsTab({ data, onRefresh }) {
  const complete = (experiment) => {
    const next = getStudyData();
    saveStudyPatch({
      studyExperiments: next.experiments.map((item) => item.id === experiment.id ? { ...item, status: "completed", conclusion: item.conclusion || "다음에 워크플로우로 정리해볼 만해요.", updatedAt: toDateKey(new Date()) } : item)
    });
    onRefresh();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <GlassCard>
        <SectionTitle>실험</SectionTitle>
        <div className="grid gap-3">
          {data.experiments.map((experiment) => (
            <article key={experiment.id} className="rounded-[24px] bg-white/55 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{experiment.title}</h3>
                  <p className="mt-1 text-sm font-bold text-clover-sub">{experiment.question || experiment.purpose}</p>
                </div>
                <StatusBadge tone={experiment.status === "completed" ? "done" : "blue"}>{experiment.status}</StatusBadge>
              </div>
              <p className="mt-3 text-xs font-black text-clover-sub">도구: {(experiment.toolNames || []).join(", ")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <AppButton variant="soft" onClick={() => complete(experiment)}>완료 처리</AppButton>
                <AppButton onClick={() => { createWorkflowFromExperiment(experiment); onRefresh(); }}>워크플로우로 전환</AppButton>
              </div>
            </article>
          ))}
          {!data.experiments.length && <p className="rounded-2xl bg-white/45 p-5 text-sm font-bold text-clover-sub">AI에게 같은 일을 시켜보고 비교할 실험을 만들어보세요.</p>}
        </div>
      </GlassCard>
      <CardsList data={data} />
    </div>
  );
}

function WorkflowsTab({ data }) {
  return (
    <div className="grid gap-4">
      <GlassCard>
        <SectionTitle>워크플로우</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          {data.workflows.map((workflow) => (
            <article key={workflow.id} className="rounded-[24px] bg-white/55 p-4">
              <h3 className="font-black">{workflow.title}</h3>
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
    else markCaptureReason(capture, action);
    refresh();
  };

  const content = useMemo(() => {
    if (tab === "home") return <HomeTab data={data} setTab={setTab} onOpen={setDetail} onUpload={() => setUploadOpen(true)} />;
    if (tab === "inbox") return <InboxTab data={data} onOpen={setDetail} onRefresh={refresh} />;
    if (tab === "archive") return <ArchiveTab data={data} onOpen={setDetail} onAction={quickAction} />;
    if (tab === "experiments") return <ExperimentsTab data={data} onRefresh={refresh} />;
    return <WorkflowsTab data={data} />;
  }, [tab, data]);

  return (
    <>
      <PageHeader eyebrow="Study" title="AI Study">
        <AppButton onClick={() => setUploadOpen(true)}>+ 캡처 추가</AppButton>
      </PageHeader>

      <p className="mb-4 max-w-2xl text-sm font-bold text-clover-sub">저장한 자료를 다시 보고, 실험하고, 내 일에 쓰는 방식으로 바꾸는 공간이에요.</p>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 thin-scroll">
        {tabs.map(([value, label]) => <Chip key={value} active={tab === value} onClick={() => setTab(value)}>{label}</Chip>)}
      </div>

      {content}

      <button type="button" onClick={() => setUploadOpen(true)} className="fixed bottom-20 right-5 z-30 rounded-full bg-clover-deep px-5 py-3 text-sm font-black text-white shadow-glass md:hidden">
        + 캡처
      </button>

      {uploadOpen && <CaptureUploadModal onClose={() => setUploadOpen(false)} onDone={() => { setUploadOpen(false); refresh(); setTab("inbox"); }} />}
      {detail && <CaptureDetailModal capture={detail} data={data} onClose={() => setDetail(null)} onRefresh={refresh} />}
    </>
  );
}
