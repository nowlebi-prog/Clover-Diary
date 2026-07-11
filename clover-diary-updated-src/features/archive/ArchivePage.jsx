import { useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";
import { base64ToBlob, buildMonthlyArchivePackage, collectMonthData, downloadBlob, openMonthlyPdf } from "../../lib/utils/monthlyArchive";

const previousMonth = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function ArchivePage() {
  const [data, setData] = useState(getAllData());
  const [month, setMonth] = useState(previousMonth());
  const [busy, setBusy] = useState(false);
  const quotes = data.quotes || [];
  const ideas = data.ideas || [];
  const links = data.links || [];
  const memos = (data.inboxMemos || []).filter((item) => !item.done);
  const reflections = data.reflections || [];
  const archives = data.monthlyArchives || [];
  const randomQuote = quotes[0];

  const refresh = () => setData(getAllData());

  const saveArchive = async () => {
    setBusy(true);
    const current = getAllData();
    const pack = await buildMonthlyArchivePackage(current, month);
    const next = getAllData();
    const item = {
      id: `monthly-${month}`,
      month,
      filename: pack.filename,
      size: pack.zip.size,
      dataBase64: pack.base64,
      summary: pack.summary,
      createdAt: toDateKey(new Date()),
      updatedAt: toDateKey(new Date())
    };
    next.monthlyArchives = [item, ...(next.monthlyArchives || []).filter((entry) => entry.month !== month)];
    saveAllData(next);
    setBusy(false);
    refresh();
  };

  const openPdf = () => {
    openMonthlyPdf(collectMonthData(getAllData(), month));
  };

  const downloadArchive = (archive) => {
    downloadBlob(base64ToBlob(archive.dataBase64), archive.filename || `clover-desk-${archive.month}.zip`);
  };

  return (
    <>
      <PageHeader eyebrow="ARCHIVE" title="생각과 기록 보관함" />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          <GlassCard>
            <SectionTitle>월별 리포트 / 지난달 기록</SectionTitle>
            <div className="grid gap-3 md:grid-cols-[180px_1fr]">
              <label className="grid gap-1 text-sm font-bold">
                월 선택
                <AppInput type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
              </label>
              <div className="flex flex-wrap items-end gap-2">
                <AppButton onClick={openPdf}>월간 리포트 PDF로 저장</AppButton>
                <AppButton variant="soft" onClick={saveArchive} disabled={busy}>{busy ? "저장 중..." : "월별 ZIP 서버 저장"}</AppButton>
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-clover-sub">
              PDF는 새 창에서 열리고, 인쇄 메뉴에서 PDF로 저장하면 돼요. ZIP은 월별 데이터와 리포트 HTML을 묶어서 Supabase 동기화 데이터 안에 저장합니다.
            </p>
          </GlassCard>

          <GlassCard>
            <SectionTitle>저장된 월별 기록</SectionTitle>
            <div className="grid gap-2">
              {archives.map((archive) => (
                <article key={archive.id || archive.month} className="rounded-2xl bg-white/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-black">{archive.month} 기록</p>
                      <p className="mt-1 text-xs font-bold text-clover-sub">
                        {archive.filename} · {Math.round(Number(archive.size || 0) / 1024)}KB
                      </p>
                    </div>
                    <AppButton variant="soft" onClick={() => downloadArchive(archive)}>ZIP 다운로드</AppButton>
                  </div>
                  {archive.summary && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-clover-sub md:grid-cols-4">
                      <span>할 일 {archive.summary.completedTodos}/{archive.summary.totalTodos}</span>
                      <span>기분 {archive.summary.moodAvg}점</span>
                      <span>수면 {archive.summary.sleepAvg}h</span>
                      <span>기록 {archive.summary.journalCount}개</span>
                    </div>
                  )}
                </article>
              ))}
              {!archives.length && <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">아직 저장된 월별 ZIP 기록이 없어요.</p>}
            </div>
          </GlassCard>

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
              {!ideas.length && <p className="text-sm text-clover-sub">사업, 콘텐츠, 디자인 아이디어를 모아둘 수 있어요.</p>}
            </div>
          </GlassCard>
        </div>

        <div className="grid content-start gap-4">
          <GlassCard>
            <SectionTitle>회고 아카이브</SectionTitle>
            <div className="grid gap-2">
              {reflections.slice(0, 6).map((item) => (
                <article key={item.id} className="rounded-2xl bg-white/55 p-4">
                  <p className="text-xs font-black text-clover-deep">{item.date}</p>
                  <p className="mt-1 text-sm font-bold">{item.body || item.memo || item.learned || "오늘의 기록"}</p>
                </article>
              ))}
            </div>
          </GlassCard>

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
