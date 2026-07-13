import { useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, moveToTrash, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";
import { collectMonthData, openMonthlyPdf } from "../../lib/utils/monthlyArchive";

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const ideaCategories = ["뷰티", "AI", "마케팅", "디자인", "실무", "집안일", "사업", "요리", "기타"];
const archiveTabs = [
  ["home", "아카이브 홈"],
  ["questions", "회고 질문"],
  ["answers", "나 돌아보기"],
  ["quotes", "좋은 문구"],
  ["ideas", "아이디어"],
  ["memos", "메모장"]
];

const previousMonth = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const todayQuestion = (questions) => {
  const active = questions.filter((item) => !item.done && (item.text || "").trim());
  if (!active.length) return null;
  const seed = Number(toDateKey(new Date()).replaceAll("-", ""));
  return active[seed % active.length];
};

export default function ArchivePage() {
  const [data, setData] = useState(getAllData());
  const [tab, setTab] = useState("home");
  const [answer, setAnswer] = useState("");
  const [month, setMonth] = useState(previousMonth());
  const today = toDateKey(new Date());

  const refresh = () => setData(getAllData());
  const persist = (updater) => {
    const next = getAllData();
    updater(next);
    saveAllData(next);
    setData(getAllData());
  };

  const questions = data.questionPrompts || [];
  const answers = data.questionAnswers || [];
  const quotes = data.quotes || [];
  const ideas = data.ideas || [];
  const memos = (data.inboxMemos || []).filter((item) => !item.done);
  const currentQuestion = useMemo(() => todayQuestion(questions), [questions]);

  const answerQuestion = () => {
    if (!currentQuestion || !answer.trim()) return;
    persist((next) => {
      next.questionAnswers = [
        {
          id: makeId("answer"),
          promptId: currentQuestion.id,
          question: currentQuestion.text,
          answer: answer.trim(),
          date: today,
          createdAt: today,
          updatedAt: today
        },
        ...(next.questionAnswers || [])
      ];
      next.questionPrompts = (next.questionPrompts || []).filter((item) => item.id !== currentQuestion.id);
    });
    setAnswer("");
  };

  const addQuestion = () => {
    persist((next) => {
      next.questionPrompts = [
        { id: makeId("question"), text: "", createdAt: today, updatedAt: today },
        ...(next.questionPrompts || [])
      ];
    });
  };

  const updateQuestion = (id, text) => {
    persist((next) => {
      next.questionPrompts = (next.questionPrompts || []).map((item) => item.id === id ? { ...item, text, updatedAt: today } : item);
    });
  };

  const removeQuestion = (id) => {
    persist((next) => {
      next.questionPrompts = (next.questionPrompts || []).filter((item) => item.id !== id);
    });
  };

  const addQuote = () => {
    persist((next) => {
      next.quotes = [{ id: makeId("quote"), text: "", source: "", tags: "", createdAt: today, updatedAt: today }, ...(next.quotes || [])];
    });
  };

  const updateQuote = (id, updates) => {
    persist((next) => {
      next.quotes = (next.quotes || []).map((item) => item.id === id ? { ...item, ...updates, updatedAt: today } : item);
    });
  };

  const addIdea = (payload = {}) => {
    persist((next) => {
      next.ideas = [
        {
          id: makeId("idea"),
          title: payload.title || "",
          body: payload.body || "",
          category: payload.category || ideaCategories[0],
          status: "생각중",
          completed: false,
          createdAt: today,
          updatedAt: today
        },
        ...(next.ideas || [])
      ];
    });
    setTab("ideas");
  };

  const updateIdea = (id, updates) => {
    persist((next) => {
      next.ideas = (next.ideas || []).map((item) => item.id === id ? { ...item, ...updates, updatedAt: today } : item);
    });
  };

  const sendIdeaToStudy = (idea) => {
    persist((next) => {
      next.studyCaptures = [
        {
          id: makeId("study-capture"),
          images: [],
          title: idea.title || "아이디어 실험",
          summary: idea.body || "",
          memo: idea.body || "",
          sourceUrl: "",
          categoryId: "",
          type: "아이디어",
          status: "waiting",
          reason: "study",
          customReason: "",
          tags: [idea.category || "아이디어"].filter(Boolean),
          relatedTools: [],
          projectIds: [],
          ocrText: "",
          aiAnalysis: { summary: idea.body || "", keywords: [idea.category || "아이디어"], possibleUses: ["실험으로 검증하기"] },
          isImportant: false,
          isReviewed: false,
          reviewSchedule: { nextReviewAt: "", reviewCount: 0, lastReviewedAt: "" },
          createdAt: today,
          updatedAt: today
        },
        ...(next.studyCaptures || [])
      ];
      next.ideas = (next.ideas || []).map((item) => item.id === idea.id ? { ...item, status: "실험 대기", updatedAt: today } : item);
    });
  };

  const addMemo = () => {
    persist((next) => {
      next.inboxMemos = [{ id: makeId("memo"), body: "", done: false, createdAt: today, updatedAt: today }, ...(next.inboxMemos || [])];
    });
  };

  const updateMemo = (id, body) => {
    persist((next) => {
      next.inboxMemos = (next.inboxMemos || []).map((item) => item.id === id ? { ...item, body, updatedAt: today } : item);
    });
  };

  const memoToIdea = (memo) => {
    addIdea({ title: memo.body, body: memo.body, category: "기타" });
    persist((next) => {
      next.inboxMemos = (next.inboxMemos || []).map((item) => item.id === memo.id ? { ...item, done: true, updatedAt: today } : item);
    });
  };

  const openPdf = () => openMonthlyPdf(collectMonthData(getAllData(), month));

  return (
    <>
      <PageHeader eyebrow="ARCHIVE" title="아카이브">
        <div className="flex flex-wrap items-center gap-2">
          <AppInput type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-h-10 w-36" />
          <AppButton onClick={openPdf} className="min-h-10 px-3 text-xs">월간 리포트 PDF</AppButton>
        </div>
      </PageHeader>

      <nav className="mb-4 flex gap-2 overflow-x-auto rounded-full bg-white/55 p-1 shadow-sm thin-scroll">
        {archiveTabs.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${tab === key ? "bg-clover-deep text-white" : "text-clover-sub hover:bg-white/75"}`}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "home" && (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <GlassCard>
            <SectionTitle>오늘의 회고 질문</SectionTitle>
            {currentQuestion ? (
              <div className="grid gap-3">
                <p className="rounded-[8px] bg-white/65 p-4 text-lg font-black">{currentQuestion.text}</p>
                <AppTextarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="오늘의 답변을 적어보세요." />
                <AppButton onClick={answerQuestion}>답변 저장</AppButton>
              </div>
            ) : (
              <div className="rounded-[8px] bg-white/55 p-5">
                <p className="text-sm font-bold text-clover-sub">아직 회고 질문이 없어요. 회고 질문 탭에서 질문을 추가해보세요.</p>
                <AppButton className="mt-3" variant="soft" onClick={() => setTab("questions")}>질문 추가하러 가기</AppButton>
              </div>
            )}
          </GlassCard>

          <div className="grid content-start gap-3">
            {[
              ["quotes", "좋은 문구", `${quotes.length}개`],
              ["ideas", "아이디어", `${ideas.length}개`],
              ["memos", "메모장", `${memos.length}개`],
              ["answers", "나 돌아보기", `${answers.length}개`]
            ].map(([key, label, count]) => (
              <button key={key} type="button" onClick={() => setTab(key)} className="rounded-[8px] bg-white/65 p-4 text-left shadow-sm transition hover:-translate-y-0.5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-clover-deep">{count}</p>
                <p className="mt-1 text-lg font-black">{label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "questions" && (
        <GlassCard>
          <SectionTitle action={<AppButton variant="soft" onClick={addQuestion} className="min-h-9 px-3 text-xs">+ 질문</AppButton>}>회고 질문 목록</SectionTitle>
          <div className="grid gap-2">
            {questions.map((question) => (
              <div key={question.id} className="grid gap-2 rounded-[8px] bg-white/60 p-3 md:grid-cols-[1fr_auto]">
                <AppInput value={question.text || ""} onChange={(event) => updateQuestion(question.id, event.target.value)} placeholder="나에게 묻고 싶은 질문" />
                <button type="button" onClick={() => removeQuestion(question.id)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-500">삭제</button>
              </div>
            ))}
            {!questions.length && <button onClick={addQuestion} className="rounded-[8px] border border-dashed border-clover-line bg-white/45 p-4 text-left text-sm font-bold text-clover-sub">질문을 추가해보세요.</button>}
          </div>
        </GlassCard>
      )}

      {tab === "answers" && (
        <GlassCard>
          <SectionTitle>나 돌아보기</SectionTitle>
          <div className="grid gap-3">
            {answers.map((item) => (
              <article key={item.id} className="rounded-[8px] bg-white/60 p-4">
                <p className="text-xs font-black text-clover-deep">{item.date}</p>
                <h3 className="mt-1 font-black">{item.question}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-clover-sub">{item.answer}</p>
              </article>
            ))}
            {!answers.length && <p className="rounded-[8px] bg-white/45 p-4 text-sm font-bold text-clover-sub">아직 답변 기록이 없어요.</p>}
          </div>
        </GlassCard>
      )}

      {tab === "quotes" && (
        <GlassCard>
          <SectionTitle action={<AppButton variant="soft" onClick={addQuote} className="min-h-9 px-3 text-xs">+ 문구</AppButton>}>좋은 문구</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead><tr className="text-left text-xs text-clover-sub"><th className="p-2">문구</th><th className="p-2">출처</th><th className="p-2">태그</th><th className="p-2">관리</th></tr></thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className="border-t border-white/70">
                    <td className="p-2"><AppTextarea value={quote.text || ""} onChange={(event) => updateQuote(quote.id, { text: event.target.value })} className="min-h-16 bg-white/55" /></td>
                    <td className="p-2"><AppInput value={quote.source || ""} onChange={(event) => updateQuote(quote.id, { source: event.target.value })} /></td>
                    <td className="p-2"><AppInput value={quote.tags || ""} onChange={(event) => updateQuote(quote.id, { tags: event.target.value })} /></td>
                    <td className="p-2"><button onClick={() => persist((next) => moveToTrash(next, "quotes", quote))} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-500">삭제</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {tab === "ideas" && (
        <GlassCard>
          <SectionTitle action={<AppButton variant="soft" onClick={() => addIdea()} className="min-h-9 px-3 text-xs">+ 아이디어</AppButton>}>아이디어</SectionTitle>
          <div className="grid gap-2">
            {ideas.map((idea) => (
              <article key={idea.id} className="grid gap-2 rounded-[8px] bg-white/65 p-3">
                <div className="grid gap-2 md:grid-cols-[1fr_150px_auto_auto]">
                  <AppInput value={idea.title || ""} onChange={(event) => updateIdea(idea.id, { title: event.target.value })} placeholder="아이디어 제목" />
                  <AppSelect value={idea.category || ideaCategories[0]} onChange={(event) => updateIdea(idea.id, { category: event.target.value })}>{ideaCategories.map((item) => <option key={item}>{item}</option>)}</AppSelect>
                  <button type="button" onClick={() => sendIdeaToStudy(idea)} className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-600">실험</button>
                  <button type="button" onClick={() => persist((next) => moveToTrash(next, "ideas", idea))} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-500">삭제</button>
                </div>
                <AppTextarea value={idea.body || idea.memo || ""} onChange={(event) => updateIdea(idea.id, { body: event.target.value })} placeholder="아이디어 내용" />
              </article>
            ))}
            {!ideas.length && <button onClick={() => addIdea()} className="rounded-[8px] border border-dashed border-clover-line bg-white/45 p-4 text-left text-sm font-bold text-clover-sub">아이디어를 추가해보세요.</button>}
          </div>
        </GlassCard>
      )}

      {tab === "memos" && (
        <GlassCard>
          <SectionTitle action={<AppButton variant="soft" onClick={addMemo} className="min-h-9 px-3 text-xs">+ 메모</AppButton>}>메모장</SectionTitle>
          <div className="grid gap-2">
            {memos.map((memo) => (
              <article key={memo.id} className="grid gap-2 rounded-[8px] bg-white/60 p-3">
                <AppTextarea value={memo.body || ""} onChange={(event) => updateMemo(memo.id, event.target.value)} placeholder="메모" />
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => memoToIdea(memo)} className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">아이디어로 이동</button>
                  <button type="button" onClick={() => persist((next) => { next.inboxMemos = (next.inboxMemos || []).map((item) => item.id === memo.id ? { ...item, done: true, updatedAt: today } : item); })} className="rounded-full bg-white px-3 py-2 text-xs font-black text-clover-sub">확인</button>
                </div>
              </article>
            ))}
            {!memos.length && <button onClick={addMemo} className="rounded-[8px] border border-dashed border-clover-line bg-white/45 p-4 text-left text-sm font-bold text-clover-sub">메모를 추가해보세요.</button>}
          </div>
        </GlassCard>
      )}
    </>
  );
}
