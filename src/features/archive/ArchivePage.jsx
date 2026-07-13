import { useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, moveToTrash, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";
import { collectMonthData, openMonthlyPdf } from "../../lib/utils/monthlyArchive";

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const todayKey = () => toDateKey(new Date());
const ideaCategories = ["뷰티", "AI", "마케팅", "디자인", "실무", "집안일", "사업", "요리", "기타"];
const ideaStatuses = ["아이디어", "실험 준비", "실험 중", "보류", "완료"];

const previousMonth = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

function pickDailyQuestion(prompts, answers, today) {
  const answeredIds = new Set((answers || []).filter((item) => item.date === today).map((item) => item.questionId));
  const active = (prompts || []).filter((item) => item.active !== false && !answeredIds.has(item.id));
  if (!active.length) return null;
  const seed = today.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return active[seed % active.length];
}

function ActionButton({ active, icon, title, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-4 rounded-[8px] border px-6 py-4 text-left transition ${
        active ? "border-clover-deep bg-emerald-50/80 shadow-glass" : "border-clover-line bg-white/65 hover:bg-white"
      }`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-2xl">{icon}</span>
      <span>
        <span className="block font-black text-clover-text">{title}</span>
        <span className="text-sm font-bold text-clover-sub">{sub}</span>
      </span>
    </button>
  );
}

function QuestionManager({ prompts, onAdd, onUpdate, onDelete }) {
  const [draft, setDraft] = useState("");
  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">질문 목록 관리</h2>
        <AppButton
          onClick={() => {
            onAdd(draft);
            setDraft("");
          }}
        >
          등록
        </AppButton>
      </div>
      <AppInput value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="나에게 묻고 싶은 질문을 적어두세요" />
      <div className="mt-4 grid gap-2">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="grid gap-2 rounded-[8px] border border-clover-line bg-white/65 p-3 md:grid-cols-[1fr_auto] md:items-center">
            <AppInput value={prompt.text || ""} onChange={(event) => onUpdate(prompt.id, { text: event.target.value })} />
            <button type="button" onClick={() => onDelete(prompt)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-500">
              삭제
            </button>
          </div>
        ))}
        {!prompts.length && <p className="rounded-[8px] bg-white/45 p-4 text-sm font-bold text-clover-sub">질문을 몇 개 적어두면 Archive 홈에 매일 하나씩 떠요.</p>}
      </div>
    </GlassCard>
  );
}

function AnswerArchive({ answers }) {
  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">나 돌아보기</h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{answers.length}개 답변</span>
      </div>
      <div className="grid gap-3">
        {answers.map((answer) => (
          <article key={answer.id} className="rounded-[8px] border border-clover-line bg-white/65 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-black text-clover-text">{answer.questionText || "나에게 던진 질문"}</p>
              <span className="shrink-0 text-xs font-bold text-clover-sub">{answer.date}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-6 text-clover-sub">{answer.body}</p>
          </article>
        ))}
        {!answers.length && <p className="rounded-[8px] bg-white/45 p-4 text-sm font-bold text-clover-sub">아직 저장된 답변이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function QuoteTable({ quotes, onAdd, onUpdate, onDelete }) {
  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">좋은 문구</h2>
        <AppButton onClick={onAdd}>등록</AppButton>
      </div>
      <div className="overflow-x-auto rounded-[8px] border border-clover-line bg-white/60">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-white/80 text-left text-xs font-black text-clover-sub">
            <tr>
              <th className="px-4 py-3">문구</th>
              <th className="px-4 py-3">출처</th>
              <th className="px-4 py-3">태그</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id} className="border-t border-clover-line/70">
                <td className="px-3 py-2"><AppTextarea value={quote.text || ""} onChange={(event) => onUpdate(quote.id, { text: event.target.value })} className="min-h-16" /></td>
                <td className="px-3 py-2"><AppInput value={quote.source || ""} onChange={(event) => onUpdate(quote.id, { source: event.target.value })} /></td>
                <td className="px-3 py-2"><AppInput value={quote.tags || ""} onChange={(event) => onUpdate(quote.id, { tags: event.target.value })} /></td>
                <td className="px-3 py-2"><button type="button" onClick={() => onDelete(quote)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-500">삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!quotes.length && <p className="p-4 text-sm font-bold text-clover-sub">아직 저장된 문구가 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function IdeaManager({ ideas, selectedCategory, setSelectedCategory, onAdd, onUpdate, onDelete, onPromote }) {
  const [draft, setDraft] = useState("");
  const filtered = selectedCategory === "전체" ? ideas : ideas.filter((idea) => (idea.category || "기타") === selectedCategory);

  return (
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black">아이디어 관리</h2>
        <div className="flex gap-2">
          <AppButton
            variant="soft"
            onClick={() => {
              onAdd(draft, selectedCategory === "전체" ? "기타" : selectedCategory);
              setDraft("");
            }}
          >
            저장
          </AppButton>
        </div>
      </div>
      <AppInput value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="아이디어를 입력하세요" />
      <div className="mt-3 flex flex-wrap gap-2">
        {["전체", ...ideaCategories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-3 py-2 text-xs font-black ${selectedCategory === category ? "bg-clover-deep text-white" : "bg-white/70 text-clover-sub"}`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-[8px] border border-clover-line bg-white/60">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-white/80 text-left text-xs font-black text-clover-sub">
            <tr>
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">카테고리</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">등록일</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((idea) => (
              <tr key={idea.id} className="border-t border-clover-line/70">
                <td className="px-3 py-2">
                  <AppInput value={idea.title || ""} onChange={(event) => onUpdate(idea.id, { title: event.target.value })} />
                  <AppTextarea value={idea.body || ""} onChange={(event) => onUpdate(idea.id, { body: event.target.value })} placeholder="아이디어 메모" className="mt-2 min-h-16" />
                </td>
                <td className="px-3 py-2">
                  <AppSelect value={idea.category || "기타"} onChange={(event) => onUpdate(idea.id, { category: event.target.value })}>
                    {ideaCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </AppSelect>
                </td>
                <td className="px-3 py-2">
                  <AppSelect value={idea.status || "아이디어"} onChange={(event) => onUpdate(idea.id, { status: event.target.value })}>
                    {ideaStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </AppSelect>
                </td>
                <td className="px-3 py-2 text-xs font-bold text-clover-sub">{idea.createdAt || "-"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onPromote(idea)} className="rounded-full bg-clover-deep px-3 py-2 text-xs font-black text-white">실험</button>
                    <button type="button" onClick={() => onDelete(idea)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-500">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="p-4 text-sm font-bold text-clover-sub">이 카테고리에는 아직 아이디어가 없어요.</p>}
      </div>
      <p className="mt-3 text-center text-xs font-bold text-clover-sub">실험 버튼을 누르면 해당 아이디어가 Study의 공부 대기로 이동됩니다.</p>
    </GlassCard>
  );
}

function MemoArchive({ memos, onMoveToIdea, onDone, onDelete }) {
  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">메모장</h2>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{memos.length}개</span>
      </div>
      <div className="grid gap-2">
        {memos.map((memo) => (
          <article key={memo.id} className="rounded-[8px] border border-clover-line bg-white/65 p-4">
            <p className="whitespace-pre-wrap text-sm font-bold leading-6">{memo.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => onMoveToIdea(memo)} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">아이디어로 이동</button>
              <button type="button" onClick={() => onDone(memo)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-clover-sub">확인</button>
              <button type="button" onClick={() => onDelete(memo)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-500">삭제</button>
            </div>
          </article>
        ))}
        {!memos.length && <p className="rounded-[8px] bg-white/45 p-4 text-sm font-bold text-clover-sub">빠른 메모에서 넘어온 내용이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

export default function ArchivePage() {
  const [data, setData] = useState(getAllData());
  const [month, setMonth] = useState(previousMonth());
  const [mode, setMode] = useState("ideas");
  const [answer, setAnswer] = useState("");
  const [ideaCategory, setIdeaCategory] = useState("AI");
  const today = todayKey();

  const prompts = data.questionPrompts || [];
  const answers = data.questionAnswers || [];
  const quotes = data.quotes || [];
  const ideas = data.ideas || [];
  const memos = (data.inboxMemos || []).filter((item) => !item.done);
  const dailyQuestion = useMemo(() => pickDailyQuestion(prompts, answers, today), [prompts, answers, today]);

  const refresh = () => setData(getAllData());
  const persist = (updater) => {
    const next = getAllData();
    updater(next);
    saveAllData(next);
    refresh();
  };

  const openPdf = () => openMonthlyPdf(collectMonthData(getAllData(), month));

  const saveAnswer = () => {
    if (!dailyQuestion || !answer.trim()) return;
    persist((next) => {
      next.questionAnswers = [
        {
          id: makeId("question-answer"),
          questionId: dailyQuestion.id,
          questionText: dailyQuestion.text,
          date: today,
          body: answer.trim(),
          createdAt: today,
          updatedAt: today
        },
        ...(next.questionAnswers || [])
      ];
      next.questionPrompts = (next.questionPrompts || []).filter((item) => item.id !== dailyQuestion.id);
    });
    setAnswer("");
  };

  const addQuestion = (text) => {
    const clean = text.trim();
    if (!clean) return;
    persist((next) => {
      next.questionPrompts = [{ id: makeId("question"), text: clean, active: true, createdAt: today, updatedAt: today }, ...(next.questionPrompts || [])];
    });
  };

  const updateQuestion = (id, updates) => persist((next) => {
    next.questionPrompts = (next.questionPrompts || []).map((item) => item.id === id ? { ...item, ...updates, updatedAt: today } : item);
  });
  const deleteQuestion = (prompt) => persist((next) => moveToTrash(next, "questionPrompts", prompt));

  const addQuote = () => persist((next) => {
    next.quotes = [{ id: makeId("quote"), text: "", source: "", tags: "", createdAt: today, updatedAt: today }, ...(next.quotes || [])];
  });
  const updateQuote = (id, updates) => persist((next) => {
    next.quotes = (next.quotes || []).map((quote) => quote.id === id ? { ...quote, ...updates, updatedAt: today } : quote);
  });
  const deleteQuote = (quote) => persist((next) => moveToTrash(next, "quotes", quote));

  const addIdea = (title, category = "기타") => {
    const clean = title.trim();
    if (!clean) return;
    persist((next) => {
      next.ideas = [{ id: makeId("idea"), title: clean, body: "", category, status: "아이디어", completed: false, createdAt: today, updatedAt: today }, ...(next.ideas || [])];
    });
  };
  const updateIdea = (id, updates) => persist((next) => {
    next.ideas = (next.ideas || []).map((idea) => idea.id === id ? { ...idea, ...updates, updatedAt: today } : idea);
  });
  const deleteIdea = (idea) => persist((next) => moveToTrash(next, "ideas", idea));

  const promoteIdeaToStudy = (idea) => {
    persist((next) => {
      next.studyCaptures = [
        {
          id: makeId("study-cap"),
          images: [],
          title: idea.title || "아이디어 실험",
          summary: idea.body || "Archive 아이디어에서 넘어온 실험 대기 항목",
          memo: idea.body || "",
          sourceUrl: "",
          categoryId: "",
          type: "실험",
          status: "waiting",
          reason: "study",
          customReason: "Archive 아이디어",
          tags: [idea.category || "기타"],
          relatedTools: [],
          projectIds: [],
          ocrText: "",
          aiAnalysis: { status: "pending" },
          isImportant: true,
          isReviewed: false,
          reviewSchedule: { nextReviewAt: today, reviewCount: 0, lastReviewedAt: "" },
          createdAt: today,
          updatedAt: today
        },
        ...(next.studyCaptures || [])
      ];
      next.ideas = (next.ideas || []).map((item) => item.id === idea.id ? { ...item, status: "실험 준비", updatedAt: today } : item);
    });
  };

  const moveMemoToIdea = (memo) => persist((next) => {
    next.ideas = [{ id: makeId("idea"), title: memo.body.slice(0, 40), body: memo.body, category: "기타", status: "아이디어", createdAt: today, updatedAt: today }, ...(next.ideas || [])];
    next.inboxMemos = (next.inboxMemos || []).map((item) => item.id === memo.id ? { ...item, done: true, updatedAt: today } : item);
  });
  const doneMemo = (memo) => persist((next) => {
    next.inboxMemos = (next.inboxMemos || []).map((item) => item.id === memo.id ? { ...item, done: true, updatedAt: today } : item);
  });
  const deleteMemo = (memo) => persist((next) => moveToTrash(next, "inboxMemos", memo));

  return (
    <>
      <PageHeader eyebrow="ARCHIVE" title="생각과 기록 보관함">
        <div className="flex flex-wrap items-center gap-2">
          <AppInput type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-h-10 w-36" />
          <AppButton onClick={openPdf} className="min-h-10 px-3 text-xs">월별 리포트 PDF</AppButton>
        </div>
      </PageHeader>

      <GlassCard className="mb-4">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black">오늘의 질문</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">오늘 랜덤 질문</span>
            </div>
            <h3 className="mb-4 text-xl font-black text-clover-text">
              {dailyQuestion?.text || "질문 목록을 먼저 추가해 주세요."}
            </h3>
            <AppTextarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="여기에 당신의 생각을 자유롭게 적어보세요..."
              className="min-h-36"
              maxLength={1000}
              disabled={!dailyQuestion}
            />
            <div className="mt-2 flex items-center justify-between text-xs font-bold text-clover-sub">
              <span>답변을 저장하면 해당 질문은 질문 목록에서 자동 제거됩니다.</span>
              <span>{answer.length} / 1000</span>
            </div>
          </div>

          <div className="grid content-center gap-4 border-clover-line/70 lg:border-l lg:pl-6">
            <AppButton variant="soft" onClick={() => setMode("questions")}>질문 목록 관리</AppButton>
            <AppButton variant="soft" onClick={() => setMode("answers")}>나 돌아보기</AppButton>
            <AppButton onClick={saveAnswer} disabled={!dailyQuestion || !answer.trim()}>답변 저장</AppButton>
          </div>
        </div>
      </GlassCard>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <ActionButton active={mode === "quotes"} icon="❝" title="좋은 문구" sub="표로 관리" onClick={() => setMode("quotes")} />
        <ActionButton active={mode === "ideas"} icon="💡" title="아이디어" sub="카테고리/실험" onClick={() => setMode("ideas")} />
        <ActionButton active={mode === "memos"} icon="🗒" title="메모장" sub="자유 메모" onClick={() => setMode("memos")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {mode === "questions" && <QuestionManager prompts={prompts} onAdd={addQuestion} onUpdate={updateQuestion} onDelete={deleteQuestion} />}
          {mode === "answers" && <AnswerArchive answers={answers} />}
          {mode === "quotes" && <QuoteTable quotes={quotes} onAdd={addQuote} onUpdate={updateQuote} onDelete={deleteQuote} />}
          {mode === "ideas" && <IdeaManager ideas={ideas} selectedCategory={ideaCategory} setSelectedCategory={setIdeaCategory} onAdd={addIdea} onUpdate={updateIdea} onDelete={deleteIdea} onPromote={promoteIdeaToStudy} />}
          {mode === "memos" && <MemoArchive memos={memos} onMoveToIdea={moveMemoToIdea} onDone={doneMemo} onDelete={deleteMemo} />}
        </div>

        <GlassCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-clover-deep">나 돌아보기</h2>
            <button type="button" onClick={() => setMode("answers")} className="text-xs font-black text-clover-deep">전체 보기 ›</button>
          </div>
          <div className="grid gap-2">
            {answers.slice(0, 5).map((item) => (
              <button key={item.id} type="button" onClick={() => setMode("answers")} className="rounded-[8px] border border-clover-line bg-white/60 p-3 text-left">
                <p className="line-clamp-1 text-sm font-black">{item.questionText}</p>
                <p className="mt-1 line-clamp-2 text-xs font-bold text-clover-sub">{item.body}</p>
                <p className="mt-2 text-right text-xs font-bold text-clover-sub">{item.date}</p>
              </button>
            ))}
            {!answers.length && <p className="rounded-[8px] bg-white/45 p-4 text-sm font-bold text-clover-sub">답변을 저장하면 여기에 쌓여요.</p>}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
