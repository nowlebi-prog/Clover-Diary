import { useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, moveToTrash, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";
import { collectMonthData, openMonthlyPdf } from "../../lib/utils/monthlyArchive";

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const previousMonth = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function ArchivePage() {
  const [data, setData] = useState(getAllData());
  const [month, setMonth] = useState(previousMonth());
  const quotes = data.quotes || [];
  const ideas = data.ideas || [];
  const memos = (data.inboxMemos || []).filter((item) => !item.done);
  const reflections = data.reflections || [];

  const refresh = () => setData(getAllData());

  const persist = (updater) => {
    const next = getAllData();
    updater(next);
    saveAllData(next);
    refresh();
  };

  const openPdf = () => {
    openMonthlyPdf(collectMonthData(getAllData(), month));
  };

  const addQuote = () => {
    persist((next) => {
      next.quotes = [
        {
          id: makeId("quote"),
          text: "",
          source: "",
          tags: "",
          createdAt: toDateKey(new Date()),
          updatedAt: toDateKey(new Date())
        },
        ...(next.quotes || [])
      ];
    });
  };

  const updateQuote = (id, updates) => {
    persist((next) => {
      next.quotes = (next.quotes || []).map((quote) => (quote.id === id ? { ...quote, ...updates, updatedAt: toDateKey(new Date()) } : quote));
    });
  };

  const removeQuote = (quote) => {
    persist((next) => moveToTrash(next, "quotes", quote));
  };

  const addIdea = () => {
    persist((next) => {
      next.ideas = [
        {
          id: makeId("idea"),
          title: "",
          body: "",
          category: "",
          status: "생각중",
          completed: false,
          createdAt: toDateKey(new Date()),
          updatedAt: toDateKey(new Date())
        },
        ...(next.ideas || [])
      ];
    });
  };

  const updateIdea = (id, updates) => {
    persist((next) => {
      next.ideas = (next.ideas || []).map((idea) => (idea.id === id ? { ...idea, ...updates, updatedAt: toDateKey(new Date()) } : idea));
    });
  };

  const removeIdea = (idea) => {
    persist((next) => moveToTrash(next, "ideas", idea));
  };

  return (
    <>
      <PageHeader eyebrow="ARCHIVE" title="생각과 기록 보관함">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold text-clover-sub">
            <span className="sr-only">월 선택</span>
            <AppInput type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-h-10 w-36" />
          </label>
          <AppButton onClick={openPdf} className="min-h-10 px-3 text-xs">월별 리포트 PDF</AppButton>
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <GlassCard>
            <SectionTitle action={<AppButton variant="soft" onClick={addQuote} className="min-h-9 px-3 text-xs">+ 추가</AppButton>}>좋은 말</SectionTitle>
            <div className="grid gap-3 md:grid-cols-2">
              {quotes.map((quote, index) => (
                <article key={quote.id} className={`grid gap-3 rounded-[8px] border border-white/70 p-4 shadow-sm ${index % 3 === 0 ? "bg-blue-50/85" : index % 3 === 1 ? "bg-pink-50/85" : "bg-amber-50/85"}`}>
                  <AppTextarea
                    value={quote.text || ""}
                    onChange={(event) => updateQuote(quote.id, { text: event.target.value })}
                    placeholder="기억하고 싶은 문장"
                    className="min-h-28 bg-white/55 text-sm leading-6"
                  />
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <AppInput value={quote.source || ""} onChange={(event) => updateQuote(quote.id, { source: event.target.value })} placeholder="출처나 제목" />
                    <button type="button" onClick={() => removeQuote(quote)} className="rounded-full px-3 py-2 text-xs font-bold text-clover-sub transition hover:bg-white/60 hover:text-red-500">
                      삭제
                    </button>
                  </div>
                </article>
              ))}
              {!quotes.length && (
                <button type="button" onClick={addQuote} className="rounded-[8px] border border-dashed border-clover-line bg-white/45 p-5 text-left text-sm font-bold text-clover-sub">
                  마음에 남은 문장을 카드처럼 저장해보세요.
                </button>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle action={<AppButton variant="soft" onClick={addIdea} className="min-h-9 px-3 text-xs">+ 추가</AppButton>}>아이디어</SectionTitle>
            <div className="grid gap-2">
              {ideas.map((idea) => (
                <article key={idea.id} className="grid gap-2 rounded-[8px] bg-white/65 p-3 shadow-sm">
                  <div className="grid grid-cols-[24px_1fr_auto] items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(idea.completed)}
                      onChange={(event) => updateIdea(idea.id, { completed: event.target.checked, status: event.target.checked ? "완료" : "생각중" })}
                      className="h-4 w-4 accent-clover-deep"
                      aria-label="아이디어 완료"
                    />
                    <AppInput
                      value={idea.title || ""}
                      onChange={(event) => updateIdea(idea.id, { title: event.target.value })}
                      placeholder="아이디어 제목"
                    />
                    <button type="button" onClick={() => removeIdea(idea)} className="rounded-full px-3 py-2 text-xs font-bold text-clover-sub transition hover:bg-red-50 hover:text-red-500">
                      삭제
                    </button>
                  </div>
                  <AppTextarea
                    value={idea.body || idea.memo || ""}
                    onChange={(event) => updateIdea(idea.id, { body: event.target.value })}
                    placeholder="세부 항목, 다음 액션, 참고 메모"
                    className="min-h-20 bg-white/55 text-sm"
                  />
                </article>
              ))}
              {!ideas.length && (
                <button type="button" onClick={addIdea} className="rounded-[8px] border border-dashed border-clover-line bg-white/45 p-4 text-left text-sm font-bold text-clover-sub">
                  체크리스트처럼 바로 고칠 수 있는 아이디어를 추가해보세요.
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="grid content-start gap-4">
          <GlassCard>
            <SectionTitle>회고 아카이브</SectionTitle>
            <div className="grid gap-2">
              {reflections.slice(0, 8).map((item) => (
                <article key={item.id} className="rounded-[8px] bg-white/55 p-4">
                  <p className="text-xs font-black text-clover-deep">{item.date}</p>
                  <p className="mt-1 text-sm font-bold leading-6">{item.body || item.memo || item.learned || item.good || "오늘의 기록"}</p>
                </article>
              ))}
              {!reflections.length && <p className="text-sm font-bold text-clover-sub">아직 회고 기록이 없어요.</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>나중에 정리할 것</SectionTitle>
            <div className="grid gap-2">
              {memos.slice(0, 8).map((memo) => (
                <p key={memo.id} className="rounded-[8px] bg-white/55 px-4 py-3 text-sm font-bold">{memo.body}</p>
              ))}
              {!memos.length && <p className="text-sm font-bold text-clover-sub">빠른 메모에서 들어온 생각이 없어요.</p>}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
