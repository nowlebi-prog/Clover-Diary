import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData } from "../../lib/storage/localStorageAdapter";

export default function ArchivePage() {
  const data = getAllData();
  const quotes = data.quotes || [];
  const ideas = data.ideas || [];
  const links = data.links || [];
  const memos = (data.inboxMemos || []).filter((item) => !item.done);
  const reflections = data.reflections || [];
  const randomQuote = quotes[0];

  return (
    <>
      <PageHeader eyebrow="ARCHIVE" title="생각과 자료 보관함" />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <GlassCard>
            <SectionTitle>좋은 말</SectionTitle>
            {randomQuote ? (
              <div className="rounded-[24px] bg-[#FFF8E8]/80 p-5">
                <p className="text-lg font-black leading-relaxed">“{randomQuote.text}”</p>
                <p className="mt-3 text-sm font-bold text-clover-sub">{randomQuote.source || "내가 저장한 문장"}</p>
              </div>
            ) : (
              <p className="text-sm text-clover-sub">오늘 붙잡고 싶은 문장을 저장해보세요.</p>
            )}
          </GlassCard>

          <GlassCard>
            <SectionTitle>아이디어</SectionTitle>
            <div className="grid gap-2 md:grid-cols-2">
              {ideas.slice(0, 6).map((idea) => (
                <article key={idea.id} className="rounded-2xl bg-white/55 p-4">
                  <p className="font-black">{idea.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-clover-sub">{idea.body || idea.memo || "조금 더 구체화해볼 아이디어예요."}</p>
                </article>
              ))}
              {!ideas.length && <p className="text-sm text-clover-sub">사업, 콘텐츠, 디자인 아이디어를 잠깐 맡겨둘 수 있어요.</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>회고 아카이브</SectionTitle>
            <div className="grid gap-2">
              {reflections.slice(0, 5).map((item) => (
                <article key={item.id} className="rounded-2xl bg-white/55 p-4">
                  <p className="text-xs font-black text-clover-deep">{item.date}</p>
                  <p className="mt-1 text-sm font-bold">{item.body || item.memo || item.learned || "오늘의 기록"}</p>
                </article>
              ))}
              {!reflections.length && <p className="text-sm text-clover-sub">일간, 주간, 월간 회고가 여기에 쌓입니다.</p>}
            </div>
          </GlassCard>
        </div>

        <div className="grid content-start gap-4">
          <GlassCard>
            <SectionTitle>레퍼런스</SectionTitle>
            <div className="grid gap-2">
              {links.slice(0, 6).map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold text-clover-deep">
                  {link.title}
                </a>
              ))}
              {!links.length && <p className="text-sm text-clover-sub">웹사이트, PPT 레이아웃, 카피 문구 링크를 모아둘 수 있어요.</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>나중에 정리할 것</SectionTitle>
            <div className="grid gap-2">
              {memos.slice(0, 6).map((memo) => (
                <p key={memo.id} className="rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">{memo.body}</p>
              ))}
              {!memos.length && <p className="text-sm text-clover-sub">빠른 메모에서 넘어온 생각을 잠깐 맡겨둘게요.</p>}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
