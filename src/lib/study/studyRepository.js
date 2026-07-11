import { getAllData, saveAllData } from "../storage/localStorageAdapter";
import { addDays, toDateKey } from "../utils/date";

export const studyStatuses = [
  ["unclassified", "미분류"],
  ["waiting", "공부 대기"],
  ["learning", "학습 중"],
  ["summarized", "요약 완료"],
  ["experiment-waiting", "실험 대기"],
  ["experiment-completed", "실험 완료"],
  ["applied", "업무 적용"],
  ["archived", "보관 완료"],
  ["published", "발행 완료"]
];

export const studyReasons = [
  ["study", "나중에 공부하려고"],
  ["work", "업무에 써보려고"],
  ["design-reference", "디자인 참고"],
  ["content-idea", "콘텐츠 아이디어"],
  ["interest", "그냥 흥미로워서"],
  ["custom", "직접 입력"]
];

export const studyTypes = [
  "캡처",
  "개념",
  "AI 툴",
  "프롬프트",
  "참고자료",
  "사용법",
  "실험",
  "리뷰",
  "디자인 레퍼런스",
  "워크플로우",
  "콘텐츠 아이디어"
];

export const noteTopics = [
  "홈페이지 제작",
  "AI 툴",
  "디자인",
  "자동화",
  "글쓰기",
  "이미지/Asset 제작",
  "마케팅",
  "업무 시스템"
];

export const noteFunctionTags = [
  "툴 사용법",
  "프롬프트",
  "Asset 제작법",
  "오류 해결",
  "체크리스트",
  "워크플로우",
  "예시 모음",
  "템플릿"
];

export const noteStatuses = ["캡처", "정리중", "써먹음", "보관"];

export const experimentStatuses = [
  ["planned", "실험 예정"],
  ["in_progress", "실험 중"],
  ["completed", "실험 완료"]
];

export const experimentOutcomes = [
  ["success", "성공"],
  ["fail", "실패"],
  ["hold", "보류"]
];

const today = () => toDateKey(new Date());
const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const splitWords = (text = "") =>
  text
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1);

export function getStudyData() {
  const data = getAllData();
  return {
    captures: data.studyCaptures || [],
    categories: data.studyCategories || [],
    notes: data.studyNotes || [],
    cards: data.studyCards || [],
    experiments: data.studyExperiments || [],
    workflows: data.studyWorkflows || [],
    projects: data.todos || []
  };
}

export function createStudyNote(payload = {}) {
  const current = getStudyData();
  const now = today();
  const note = {
    id: makeId("study-note"),
    title: payload.title || "새 Study 노트",
    summary: payload.summary || "",
    memo: payload.memo || "",
    steps: payload.steps || "",
    prompts: payload.prompts || "",
    links: payload.links || "",
    nextTry: payload.nextTry || "",
    topic: payload.topic || noteTopics[0],
    functionTag: payload.functionTag || noteFunctionTags[0],
    status: payload.status || "정리중",
    captureIds: payload.captureIds || [],
    workflowIds: payload.workflowIds || [],
    templateSaved: Boolean(payload.templateSaved),
    createdAt: now,
    updatedAt: now
  };
  saveStudyPatch({ studyNotes: [note, ...current.notes] });
  return note;
}

export function updateStudyNote(id, updates) {
  const current = getStudyData();
  saveStudyPatch({
    studyNotes: current.notes.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: today() } : item
    )
  });
}

export function deleteStudyNote(id) {
  const current = getStudyData();
  saveStudyPatch({ studyNotes: current.notes.filter((item) => item.id !== id) });
}

export function createNoteFromCapture(capture) {
  const note = createStudyNote({
    title: capture.title || capture.aiAnalysis?.suggestedTitle || "캡처에서 만든 노트",
    summary: capture.summary || capture.aiAnalysis?.summary || "",
    memo: capture.memo || "",
    steps: "",
    prompts: "",
    links: capture.sourceUrl || "",
    nextTry: (capture.aiAnalysis?.possibleUses || [])[0] || "직접 한 번 써보기",
    topic: capture.categoryId ? "AI 툴" : noteTopics[0],
    functionTag: capture.type === "프롬프트" ? "프롬프트" : "툴 사용법",
    status: "캡처",
    captureIds: [capture.id]
  });
  updateCapture(capture.id, { status: "summarized", isReviewed: true });
  return note;
}

export function createWorkflowFromNote(note) {
  const current = getStudyData();
  const now = today();
  const stepLines = String(note.steps || "")
    .split("\n")
    .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);
  const workflow = {
    id: makeId("study-workflow"),
    title: `${note.title} 실행법`,
    description: note.summary || note.memo || "노트에서 정리한 내용을 실행 순서로 바꿨어요.",
    category: note.topic || "Study 노트",
    projectIds: [],
    steps: (stepLines.length ? stepLines : ["자료 확인", "AI에 요청", "결과를 내 업무에 맞게 수정"]).map((title, index) => ({
      id: makeId("step"),
      order: index + 1,
      title,
      description: index === 1 && note.prompts ? note.prompts : ""
    })),
    estimatedTime: 30,
    previousEstimatedTime: 60,
    resultExample: note.nextTry || "",
    captureIds: note.captureIds || [],
    experimentIds: [],
    noteIds: [note.id],
    isPublic: false,
    createdAt: now,
    updatedAt: now
  };
  saveStudyPatch({
    studyWorkflows: [workflow, ...current.workflows],
    studyNotes: current.notes.map((item) =>
      item.id === note.id ? { ...item, status: "써먹음", workflowIds: [...(item.workflowIds || []), workflow.id], updatedAt: now } : item
    )
  });
  return workflow;
}

export function saveNoteAsTemplate(note) {
  updateStudyNote(note.id, { templateSaved: true, status: note.status === "캡처" ? "정리중" : note.status });
}

export function saveStudyPatch(patch) {
  const data = getAllData();
  saveAllData({ ...data, ...patch });
}

export function mockAnalyzeCapture({ memo = "", sourceUrl = "", fileNames = [] }, categories = []) {
  const source = `${memo} ${sourceUrl} ${fileNames.join(" ")}`.trim();
  const words = splitWords(source);
  const lower = source.toLowerCase();
  const category =
    categories.find((item) => lower.includes(item.name.toLowerCase())) ||
    categories.find((item) => ["AI 기초", "AI 툴", "디자인·PPT"].includes(item.name)) ||
    categories[0];
  const keywords = [...new Set(words.slice(0, 8))];
  const suggestedTitle = keywords.length ? keywords.slice(0, 4).join(" ") : "새 학습 캡처";
  const containsSensitiveInfo = /010|전화|메일|계좌|카드|주민|비밀번호|password|email/i.test(source);

  return {
    status: "completed",
    suggestedTitle,
    summary: memo ? memo.slice(0, 120) : "이미지에서 다시 볼 만한 자료를 발견했어요. 제목과 분류는 나중에 가볍게 고쳐도 됩니다.",
    keywords,
    suggestedCategoryId: category?.id || "",
    relatedTools: ["ChatGPT", "Claude"].filter((tool) => lower.includes(tool.toLowerCase()) || keywords.length),
    possibleUses: ["공부 카드로 정리", "업무 적용 아이디어 찾기", "실험으로 비교"],
    importanceScore: containsSensitiveInfo ? 4 : 3,
    containsSensitiveInfo
  };
}

export function createCapture({ images, memo = "", sourceUrl = "", bundle = true }) {
  const current = getStudyData();
  const now = today();
  const files = images.map((image) => image.fileName || "capture");
  const analysis = mockAnalyzeCapture({ memo, sourceUrl, fileNames: files }, current.categories);
  const makeCapture = (imageGroup, index = 0) => ({
    id: makeId("study-capture"),
    images: imageGroup.map((image, order) => ({ ...image, order })),
    title: analysis.suggestedTitle + (bundle || images.length === 1 ? "" : ` ${index + 1}`),
    summary: analysis.summary,
    memo,
    sourceUrl,
    categoryId: analysis.suggestedCategoryId,
    type: "캡처",
    status: "unclassified",
    reason: "",
    customReason: "",
    tags: analysis.keywords.slice(0, 5),
    relatedTools: analysis.relatedTools,
    projectIds: [],
    ocrText: "",
    aiAnalysis: analysis,
    isImportant: Boolean(analysis.containsSensitiveInfo),
    isReviewed: false,
    reviewSchedule: { nextReviewAt: "", reviewCount: 0, lastReviewedAt: "" },
    createdAt: now,
    updatedAt: now
  });

  const captures = bundle
    ? [makeCapture(images)]
    : images.map((image, index) => makeCapture([image], index));
  saveStudyPatch({ studyCaptures: [...captures, ...current.captures] });
  return captures;
}

export function updateCapture(id, updates) {
  const current = getStudyData();
  saveStudyPatch({
    studyCaptures: current.captures.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: today() } : item
    )
  });
}

export function deleteCapture(id) {
  const current = getStudyData();
  saveStudyPatch({ studyCaptures: current.captures.filter((item) => item.id !== id) });
}

export function markCaptureReason(capture, reason, projectIds = []) {
  const statusMap = {
    study: "waiting",
    work: "applied",
    "design-reference": "archived",
    "content-idea": "archived",
    interest: "archived",
    custom: "archived"
  };
  const nextReviewAt = reason === "study" ? addDays(today(), 7) : "";
  updateCapture(capture.id, {
    reason,
    status: statusMap[reason] || "archived",
    projectIds,
    isReviewed: true,
    reviewSchedule: {
      ...(capture.reviewSchedule || {}),
      nextReviewAt,
      reviewCount: capture.reviewSchedule?.reviewCount || 0,
      lastReviewedAt: today()
    }
  });
}

export function createStudyCardFromCapture(capture) {
  const current = getStudyData();
  const now = today();
  const card = {
    id: makeId("study-card"),
    sourceCaptureId: capture.id,
    title: capture.title || capture.aiAnalysis?.suggestedTitle || "새 학습 카드",
    definition: capture.summary || capture.aiAnalysis?.summary || "이 자료에서 다시 볼 핵심을 정리해요.",
    keyPoints: (capture.tags || []).slice(0, 3).map((tag) => `${tag} 관련 핵심 포인트`),
    terms: (capture.relatedTools || []).slice(0, 3).map((tool) => ({ term: tool, description: `${tool}를 활용해볼 수 있는 자료` })),
    workApplications: capture.aiAnalysis?.possibleUses || ["업무에 적용할 방법 찾기"],
    nextActions: ["직접 써보기", "결과 비교하기", "나만의 절차로 정리하기"],
    reviewQuestion: "이 자료를 실제로 어디에 써볼 수 있을까?",
    reviewDates: [addDays(now, 1), addDays(now, 7), addDays(now, 30)],
    lastReviewedAt: "",
    createdAt: now,
    updatedAt: now
  };
  saveStudyPatch({
    studyCards: [card, ...current.cards],
    studyCaptures: current.captures.map((item) => item.id === capture.id ? { ...item, status: "summarized", updatedAt: now } : item)
  });
  return card;
}

export function createStudyExperiment(payload = {}) {
  const current = getStudyData();
  const now = today();
  const experiment = {
    id: makeId("study-experiment"),
    title: payload.title || "새 실험",
    purpose: payload.purpose || "",
    question: payload.question || "",
    toolNames: payload.toolNames?.length ? payload.toolNames : ["ChatGPT", "Claude"],
    commonPrompt: payload.commonPrompt || "",
    evaluationCriteria: payload.evaluationCriteria?.length ? payload.evaluationCriteria : ["정확도", "소요 시간"],
    results: payload.results || [],
    conclusion: payload.conclusion || "",
    nextExperiment: payload.nextExperiment || "",
    status: payload.status || "planned",
    outcome: payload.outcome || "",
    captureIds: payload.captureIds || [],
    studyCardIds: payload.studyCardIds || [],
    projectIds: payload.projectIds || [],
    createdAt: now,
    updatedAt: now
  };
  saveStudyPatch({ studyExperiments: [experiment, ...current.experiments] });
  return experiment;
}

export function updateStudyExperiment(id, updates) {
  const current = getStudyData();
  saveStudyPatch({
    studyExperiments: current.experiments.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: today() } : item
    )
  });
}

export function deleteStudyExperiment(id) {
  const current = getStudyData();
  saveStudyPatch({ studyExperiments: current.experiments.filter((item) => item.id !== id) });
}

export function createExperimentFromCapture(capture) {
  const current = getStudyData();
  const now = today();
  const experiment = {
    id: makeId("study-experiment"),
    title: `${capture.title || "캡처"} 실험`,
    purpose: "같은 일을 여러 AI/방법으로 비교해보기",
    question: "어떤 방식이 더 빠르고 쓸 만할까?",
    toolNames: capture.relatedTools?.length ? capture.relatedTools : ["ChatGPT", "Claude", "Gemini"],
    commonPrompt: "",
    evaluationCriteria: ["정확도", "기획력", "수정 용이성", "소요 시간"],
    results: [],
    conclusion: "",
    nextExperiment: "",
    status: "planned",
    captureIds: [capture.id],
    studyCardIds: [],
    projectIds: capture.projectIds || [],
    createdAt: now,
    updatedAt: now
  };
  saveStudyPatch({ studyExperiments: [experiment, ...current.experiments] });
  return experiment;
}

export function createWorkflowFromExperiment(experiment) {
  const current = getStudyData();
  const now = today();
  const workflow = {
    id: makeId("study-workflow"),
    title: `${experiment.title} 워크플로우`,
    description: experiment.conclusion || "실험에서 괜찮았던 방식을 업무 절차로 정리해요.",
    category: "개인 학습",
    projectIds: experiment.projectIds || [],
    steps: [
      { id: makeId("step"), order: 1, title: "입력 자료 준비", description: "필요한 캡처와 조건을 모읍니다." },
      { id: makeId("step"), order: 2, title: "AI에 요청", description: "공통 프롬프트를 넣고 결과를 받습니다.", prompt: experiment.commonPrompt || "" },
      { id: makeId("step"), order: 3, title: "사람이 확인", humanCheck: "민감정보, 사실관계, 톤을 확인합니다." }
    ],
    estimatedTime: 30,
    previousEstimatedTime: 60,
    resultExample: "",
    captureIds: experiment.captureIds || [],
    experimentIds: [experiment.id],
    isPublic: false,
    createdAt: now,
    updatedAt: now
  };
  saveStudyPatch({ studyWorkflows: [workflow, ...current.workflows] });
  return workflow;
}

export function createStudyWorkflow(payload = {}) {
  const current = getStudyData();
  const now = today();
  const workflow = {
    id: makeId("study-workflow"),
    title: payload.title || "새 워크플로우",
    description: payload.description || "",
    category: payload.category || "개인 학습",
    projectIds: payload.projectIds || [],
    steps: (payload.steps?.length ? payload.steps : [{ title: "첫 단계" }]).map((step, index) => ({
      id: makeId("step"),
      order: index + 1,
      title: step.title || `${index + 1}단계`,
      description: step.description || ""
    })),
    estimatedTime: payload.estimatedTime || 30,
    previousEstimatedTime: payload.previousEstimatedTime || 0,
    resultExample: payload.resultExample || "",
    captureIds: payload.captureIds || [],
    experimentIds: payload.experimentIds || [],
    noteIds: payload.noteIds || [],
    isPublic: false,
    createdAt: now,
    updatedAt: now
  };
  saveStudyPatch({ studyWorkflows: [workflow, ...current.workflows] });
  return workflow;
}

export function updateStudyWorkflow(id, updates) {
  const current = getStudyData();
  saveStudyPatch({
    studyWorkflows: current.workflows.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: today() } : item
    )
  });
}

export function deleteStudyWorkflow(id) {
  const current = getStudyData();
  saveStudyPatch({ studyWorkflows: current.workflows.filter((item) => item.id !== id) });
}
