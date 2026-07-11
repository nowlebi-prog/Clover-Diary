const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export const collections = [
  "todos", "top3", "delayedTasks", "habits", "habitLogs", "events", "timelineEntries",
  "chores", "shoppingItems", "supplies", "expenses", "subscriptions", "payments",
  "reflections", "quotes", "ideas", "links", "inboxMemos", "contentPlans",
  "campaigns", "campaignParticipants", "importantFiles", "goals", "gratitudeEntries",
  "questionPrompts", "questionAnswers", "timeSessions", "recurringEvents", "beautyItems", "digitalCareLogs",
  "moodEntries", "monthlyArchives"
];

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
  links: [{ id: "link-1", title: "Vercel", url: "https://vercel.com", category: "배포", memo: "", createdAt: today, updatedAt: today }],
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

collections.forEach((key) => {
  if (!initialData[key]) initialData[key] = [];
});
