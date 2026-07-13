const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export const collections = [
  "todos", "top3", "delayedTasks", "habits", "habitLogs", "events", "timelineEntries",
  "chores", "shoppingItems", "supplies", "expenses", "subscriptions", "payments",
  "reflections", "quotes", "ideas", "links", "inboxMemos", "memoPosts", "contentPlans",
  "campaigns", "campaignParticipants", "importantFiles", "goals", "gratitudeEntries",
  "questionPrompts", "questionAnswers", "timeSessions", "recurringEvents", "beautyItems", "digitalCareLogs",
  "moodEntries", "dailyRecords", "monthlyArchives", "studyCaptures", "studyCategories", "studyNotes", "studyCards", "studyExperiments", "studyWorkflows",
  "workSessions", "savings", "deletedItems"
];

export const DEFAULT_WORK_CATEGORIES = ["업무", "회의", "기획", "잡무"];

export const initialData = {
  todos: [
    { id: "todo-1", title: "클라이언트 수정본 전달", category: "업무", priority: "high", dueDate: today, completed: false, project: "A안 제안서", assignee: "", tagColor: "mint", memo: "", createdAt: today, updatedAt: today },
    { id: "todo-2", title: "인스타 카드뉴스 가격표 수정", category: "콘텐츠", priority: "normal", dueDate: today, completed: false, project: "개인 브랜딩", assignee: "", tagColor: "lavender", memo: "", createdAt: today, updatedAt: today },
    { id: "todo-3", title: "비닐래 버리기", category: "집안일", priority: "low", dueDate: tomorrow, completed: false, project: "", assignee: "", tagColor: "cream", memo: "", createdAt: today, updatedAt: today }
  ],
  top3: [
    { id: "top-1", title: "클라이언트 수정본 전달", completed: false, date: today, createdAt: today, updatedAt: today },
    { id: "top-2", title: "인스타 가격표 수정", completed: false, date: today, createdAt: today, updatedAt: today },
    { id: "top-3", title: "비닐래 버리기", completed: false, date: today, createdAt: today, updatedAt: today }
  ],
  delayedTasks: [
    { id: "delay-1", title: "병원 예약", count: 3, reason: "귀찮음", createdAt: today, updatedAt: today },
    { id: "delay-2", title: "서랍 정리", count: 5, reason: "시간 애매함", createdAt: today, updatedAt: today },
    { id: "delay-3", title: "입금 관련 확인", count: 2, reason: "복잡함", createdAt: today, updatedAt: today }
  ],
  habits: [
    { id: "habit-1", name: "AI study 1 hour", icon: "AI", color: "#F6A6A6", frequencyType: "daily", targetCount: 7, customDays: [], memo: "Keep the learning loop warm.", status: "active", createdAt: today, updatedAt: today },
    { id: "habit-2", name: "Eat probiotic yogurt", icon: "YG", color: "#A9C9FF", frequencyType: "daily", targetCount: 7, customDays: [], memo: "Small health check.", status: "active", createdAt: today, updatedAt: today },
    { id: "habit-3", name: "Personal movement", icon: "MV", color: "#F4B6D2", frequencyType: "weekdays", targetCount: 5, customDays: [], memo: "Stretch, walk, or short workout.", status: "active", createdAt: today, updatedAt: today },
    { id: "habit-4", name: "Vitamins", icon: "VT", color: "#F6C68D", frequencyType: "daily", targetCount: 7, customDays: [], memo: "Vitamin C and B.", status: "active", createdAt: today, updatedAt: today }
  ],
  habitLogs: [
    { id: "habit-log-1", habitId: "habit-1", date: today, completed: true, createdAt: today, updatedAt: today },
    { id: "habit-log-2", habitId: "habit-2", date: today, completed: true, createdAt: today, updatedAt: today }
  ],
  events: [{ id: "event-1", title: "콘텐츠 발행 점검", date: today, time: "14:00", category: "콘텐츠", memo: "이번 주 일정 확인", createdAt: today, updatedAt: today }],
  timelineEntries: [{ id: "time-1", date: today, time: "09:30", title: "아침 정리", memo: "오늘 할 일 스캔", createdAt: today, updatedAt: today }],
  chores: [{ id: "chore-1", title: "분리수거", cycle: "매주", completed: false, lastDoneAt: "", nextDueDate: tomorrow, createdAt: today, updatedAt: today }],
  shoppingItems: [{ id: "shop-1", title: "세탁세제", category: "생활용품", completed: false, memo: "", createdAt: today, updatedAt: today }],
  supplies: [{ id: "supply-1", title: "프린터 용지", amount: "적음", low: true, createdAt: today, updatedAt: today }],
  expenses: [{ id: "exp-1", title: "커피", amount: 4500, date: today, category: "식비", memo: "", createdAt: today, updatedAt: today }],
  subscriptions: [{ id: "sub-1", title: "디자인 툴", amount: 15000, billingDay: "15", active: true, memo: "", createdAt: today, updatedAt: today }],
  payments: [
    { id: "pay-1", project: "A안 제안서", client: "A사", amount: 500000, status: "입금 완료", expectedDate: today, paidDate: today, memo: "", createdAt: today, updatedAt: today },
    { id: "pay-2", project: "B팀 IR", client: "B팀", amount: 800000, status: "계약금 완료", expectedDate: tomorrow, paidDate: "", memo: "", createdAt: today, updatedAt: today },
    { id: "pay-3", project: "C안 수정", client: "C사", amount: 150000, status: "미입금", expectedDate: today, paidDate: "", memo: "", createdAt: today, updatedAt: today }
  ],
  reflections: [{ id: "ref-1", date: today, mood: "보통", learned: "천천히 해도 쌓인다.", good: "대시보드 첫 정리", note: "", createdAt: today, updatedAt: today }],
  quotes: [{ id: "quote-1", text: "오늘도 가볍게 정리해볼까요?", source: "Clover Desk", tags: "routine", createdAt: today, updatedAt: today }],
  ideas: [{ id: "idea-1", title: "PPT 포트폴리오 글", body: "전후 비교 구조로 정리", category: "콘텐츠", status: "생각중", createdAt: today, updatedAt: today }],
  links: [],
  inboxMemos: [{ id: "memo-1", body: "월말 정산 카드 따로 만들기", done: false, createdAt: today, updatedAt: today }],
  contentPlans: [
    { id: "content-1", channel: "인스타", title: "인스타 카드뉴스", weeklyGoal: "1건", publishDate: tomorrow, status: "기획중", memo: "", link: "", createdAt: today, updatedAt: today },
    { id: "content-2", channel: "스레드", title: "엔딩 영상 문구", weeklyGoal: "1건", publishDate: today, status: "완료", memo: "", link: "", createdAt: today, updatedAt: today },
    { id: "content-3", channel: "블로그", title: "PPT 포트폴리오 글", weeklyGoal: "1건", publishDate: tomorrow, status: "미완료", memo: "", link: "", createdAt: today, updatedAt: today }
  ],
  campaigns: [{ id: "camp-1", name: "여름 체험단", brand: "브랜드 A", product: "샘플 키트", recruits: 20, benefit: "제품 제공", applyDueDate: today, uploadDueDate: tomorrow, status: "모집중", memo: "", createdAt: today, updatedAt: today }],
  campaignParticipants: [{ id: "part-1", campaignId: "camp-1", name: "eunbibi", instagram: "@eunbibi", blogUrl: "", contact: "", appliedDate: today, selectedStatus: "미확정", shippingStatus: "미발송", uploadStatus: "미업로드", contentUrl: "", memo: "", createdAt: today, updatedAt: today }],
  importantFiles: [{ id: "file-1", name: "A안 계약서", category: "계약서", url: "https://example.com", project: "A안 제안서", important: true, memo: "원본 링크", createdAt: today, updatedAt: today }]
};

initialData.studyCategories = [
  { id: "study-cat-1", name: "AI 기초", icon: "AI", order: 1, isDefault: true },
  { id: "study-cat-2", name: "프롬프트", icon: "PR", order: 2, isDefault: true },
  { id: "study-cat-3", name: "AI 툴", icon: "TL", order: 3, isDefault: true },
  { id: "study-cat-4", name: "디자인·PPT", icon: "PT", order: 4, isDefault: true },
  { id: "study-cat-5", name: "코딩·앱", icon: "CD", order: 5, isDefault: true },
  { id: "study-cat-6", name: "콘텐츠·마케팅", icon: "MK", order: 6, isDefault: true },
  { id: "study-cat-7", name: "사업·수익화", icon: "BZ", order: 7, isDefault: true },
  { id: "study-cat-8", name: "워크플로우", icon: "WF", order: 8, isDefault: true },
  { id: "study-cat-9", name: "기타", icon: "ET", order: 9, isDefault: true }
];

initialData.studyCaptures = [
  {
    id: "study-cap-1",
    images: [],
    title: "Claude Code로 웹사이트 수정 자동화",
    summary: "개발 중인 웹앱을 AI와 함께 빠르게 수정하는 흐름. 나중에 실제 업무 절차로 바꿔볼 만함.",
    memo: "업무 적용 가능성이 높음",
    sourceUrl: "",
    categoryId: "study-cat-3",
    type: "사용법",
    status: "waiting",
    reason: "study",
    customReason: "",
    tags: ["Claude", "자동화", "웹앱"],
    relatedTools: ["Claude", "Codex"],
    projectIds: [],
    ocrText: "",
    aiAnalysis: {
      status: "completed",
      suggestedTitle: "Claude Code 웹앱 수정 자동화",
      summary: "AI 코딩 도구를 업무 수정 흐름에 연결하는 자료",
      keywords: ["Claude", "Codex", "자동화"],
      suggestedCategoryId: "study-cat-3",
      relatedTools: ["Claude", "Codex"],
      possibleUses: ["업무 수정 흐름 만들기"],
      importanceScore: 4,
      containsSensitiveInfo: false
    },
    isImportant: true,
    isReviewed: false,
    reviewSchedule: { nextReviewAt: today, reviewCount: 0, lastReviewedAt: "" },
    createdAt: today,
    updatedAt: today
  }
];

initialData.studyCards = [];
initialData.studyNotes = [
  {
    id: "study-note-1",
    title: "Claude Code로 웹앱 수정 흐름 정리",
    summary: "캡처한 자동화 자료를 실제 Clover Desk 수정 루틴으로 바꾸기 위한 짧은 노트",
    memo: "수정 요청을 작은 단위로 쪼개고, 빌드 확인 후 GitHub에 올리는 흐름을 반복한다.",
    steps: "1. 수정할 화면과 목표를 적는다.\n2. 관련 파일을 먼저 확인한다.\n3. 작은 컴포넌트 단위로 수정한다.\n4. 빌드 후 커밋한다.",
    prompts: "이 기능을 기존 저장 로직은 유지하면서 UI 중심으로 리팩토링해줘.",
    links: "",
    nextTry: "Study 캡처에서 노트로 확장하는 흐름 직접 써보기",
    topic: "업무 시스템",
    functionTag: "워크플로우",
    status: "정리중",
    captureIds: ["study-cap-1"],
    workflowIds: [],
    templateSaved: false,
    createdAt: today,
    updatedAt: today
  }
];
initialData.studyExperiments = [
  {
    id: "study-exp-1",
    title: "ChatGPT·Claude·Gemini 소개글 구성 비교",
    purpose: "같은 입력으로 결과 품질을 비교하기",
    question: "어떤 AI가 소개글 구조를 가장 잘 잡을까?",
    toolNames: ["ChatGPT", "Claude", "Gemini"],
    commonPrompt: "",
    evaluationCriteria: ["정확도", "문장력", "수정 용이성"],
    results: [],
    conclusion: "",
    nextExperiment: "",
    status: "planned",
    captureIds: [],
    studyCardIds: [],
    projectIds: [],
    createdAt: today,
    updatedAt: today
  }
];

initialData.studyWorkflows = [
  {
    id: "study-wf-1",
    title: "AI로 회사소개서 기획하기",
    description: "자료 수집부터 초안 비교, 최종 정리까지 이어지는 개인 업무 흐름",
    category: "PPT·제안서",
    projectIds: [],
    steps: [
      { id: "study-wf-step-1", order: 1, title: "레퍼런스 캡처 저장", description: "좋아 보이는 구성과 문구를 Study에 모은다." },
      { id: "study-wf-step-2", order: 2, title: "AI별 초안 비교", description: "같은 조건으로 ChatGPT, Claude, Gemini 결과를 비교한다." },
      { id: "study-wf-step-3", order: 3, title: "내 톤으로 재정리", description: "좋은 부분만 가져와 실제 제안서 흐름으로 바꾼다." }
    ],
    estimatedTime: 40,
    previousEstimatedTime: 90,
    resultExample: "",
    captureIds: [],
    experimentIds: ["study-exp-1"],
    isPublic: false,
    createdAt: today,
    updatedAt: today
  }
];

initialData.taskCategories = [...DEFAULT_WORK_CATEGORIES];
initialData.workLogNotes = {};
initialData.activeWorkTimer = null;
initialData.deletedItems = [];

collections.forEach((key) => {
  if (!initialData[key]) initialData[key] = [];
});
