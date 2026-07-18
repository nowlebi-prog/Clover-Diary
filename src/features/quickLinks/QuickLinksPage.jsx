import { useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";

const today = () => new Date().toISOString().slice(0, 10);
const makeId = () => `quick-link-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const bigCategories = ["업무", "신사업", "개인", "공부", "참고자료", "기타"];
const smallCategorySeeds = ["위스티아", "홈페이지", "PPT", "AI", "마케팅", "자료", "수정 필요", "기타"];

const emptyForm = {
  id: "",
  bigCategory: "업무",
  smallCategory: "위스티아",
  title: "",
  url: "",
  memo: ""
};

const normalizeUrl = (value) => {
  const clean = String(value || "").trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
};

function unique(list) {
  return Array.from(new Set((list || []).map((item) => String(item || "").trim()).filter(Boolean)));
}

function categoryClass(value) {
  const map = {
    업무: "bg-emerald-50 text-emerald-700",
    신사업: "bg-teal-50 text-teal-700",
    개인: "bg-violet-50 text-violet-700",
    공부: "bg-amber-50 text-amber-700",
    참고자료: "bg-sky-50 text-sky-700",
    기타: "bg-slate-50 text-slate-700"
  };
  return map[value] || map["기타"];
}

export default function QuickLinksPage() {
  const [data, setData] = useState(() => getAllData());
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("전체");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");

  const links = data.quickLinks || [];
  const bigOptions = useMemo(() => unique([...bigCategories, ...links.map((item) => item.bigCategory)]), [links]);
  const smallOptions = useMemo(() => unique([...smallCategorySeeds, ...links.map((item) => item.smallCategory)]), [links]);

  const filteredLinks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return links
      .filter((item) => filter === "전체" || item.bigCategory === filter || item.smallCategory === filter)
      .filter((item) => {
        if (!needle) return true;
        return [item.bigCategory, item.smallCategory, item.title, item.url, item.memo].some((value) => String(value || "").toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const left = a.updatedAt || a.createdAt || "";
        const right = b.updatedAt || b.createdAt || "";
        return sort === "oldest" ? left.localeCompare(right) : right.localeCompare(left);
      });
  }, [filter, links, query, sort]);

  const counts = useMemo(() => {
    const map = { 전체: links.length };
    links.forEach((item) => {
      map[item.bigCategory] = (map[item.bigCategory] || 0) + 1;
      map[item.smallCategory] = (map[item.smallCategory] || 0) + 1;
    });
    return map;
  }, [links]);

  const persist = (recipe) => {
    const next = getAllData();
    recipe(next);
    saveAllData(next);
    setData(next);
  };

  const resetForm = () => setForm(emptyForm);

  const saveLink = () => {
    const title = form.title.trim();
    const url = normalizeUrl(form.url);
    if (!title || !url) return;
    persist((next) => {
      const payload = {
        id: form.id || makeId(),
        bigCategory: form.bigCategory || "기타",
        smallCategory: form.smallCategory || "기타",
        title,
        url,
        memo: form.memo.trim(),
        createdAt: form.createdAt || today(),
        updatedAt: today()
      };
      next.quickLinks = form.id
        ? (next.quickLinks || []).map((item) => item.id === form.id ? payload : item)
        : [payload, ...(next.quickLinks || [])];
    });
    resetForm();
  };

  const editLink = (item) => setForm({ ...emptyForm, ...item });

  const deleteLink = (id) => {
    persist((next) => {
      next.quickLinks = (next.quickLinks || []).filter((item) => item.id !== id);
    });
    if (form.id === id) resetForm();
  };

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <PageHeader eyebrow="QUICK URL" title="바로가기 URL">
        <div className="flex flex-wrap gap-2">
          <AppButton onClick={resetForm} variant="soft">+ 새 링크</AppButton>
          <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "todo" }))}>+ 빠른 추가</AppButton>
        </div>
      </PageHeader>
      <p className="-mt-3 mb-6 text-sm font-bold text-clover-sub">자주 쓰는 페이지와 참고 링크를 직접 관리해요.</p>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {unique(["전체", ...bigOptions, ...smallOptions]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full border px-4 py-2 text-sm font-black transition ${filter === item ? "border-clover-deep bg-clover-deep text-white" : "border-clover-line bg-white/70 text-clover-sub hover:text-clover-deep"}`}
          >
            {item} <span className="ml-1 text-xs opacity-70">{counts[item] || 0}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-xl">🔗</span>
            <h2 className="text-lg font-black text-clover-text">링크 등록 / 수정</h2>
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold text-clover-text">
              대분류
              <AppInput value={form.bigCategory} onChange={(event) => setField("bigCategory", event.target.value)} list="quick-link-big-categories" placeholder="예: 업무" />
            </label>
            <label className="grid gap-1 text-sm font-bold text-clover-text">
              소분류
              <AppInput value={form.smallCategory} onChange={(event) => setField("smallCategory", event.target.value)} list="quick-link-small-categories" placeholder="예: 위스티아" />
            </label>
            <datalist id="quick-link-big-categories">
              {bigOptions.map((item) => <option key={item} value={item} />)}
            </datalist>
            <datalist id="quick-link-small-categories">
              {smallOptions.map((item) => <option key={item} value={item} />)}
            </datalist>
            <label className="grid gap-1 text-sm font-bold text-clover-text">
              제목
              <AppInput value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="예: 홈페이지" />
            </label>
            <label className="grid gap-1 text-sm font-bold text-clover-text">
              URL
              <AppInput value={form.url} onChange={(event) => setField("url", event.target.value)} placeholder="https://example.com" />
            </label>
            <label className="grid gap-1 text-sm font-bold text-clover-text">
              메모
              <AppTextarea value={form.memo} onChange={(event) => setField("memo", event.target.value)} placeholder="예: 수정 필요" className="min-h-[110px]" maxLength={300} />
              <span className="text-right text-xs text-clover-sub">{form.memo.length} / 300</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <AppButton onClick={saveLink} disabled={!form.title.trim() || !form.url.trim()}>{form.id ? "수정" : "저장"}</AppButton>
              <AppButton variant="soft" onClick={resetForm}>초기화</AppButton>
              {form.id ? <AppButton variant="danger" onClick={() => deleteLink(form.id)}>삭제</AppButton> : <AppButton variant="ghost" disabled>삭제</AppButton>}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-xl">☘</span>
              <h2 className="text-lg font-black text-clover-text">저장된 링크</h2>
              <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-black text-clover-sub">총 {filteredLinks.length}개</span>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(180px,1fr)_120px]">
              <AppInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목, 메모, URL 검색" />
              <AppSelect value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </AppSelect>
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-clover-line bg-white/60">
            <div className="hidden grid-cols-[86px_96px_minmax(90px,1fr)_minmax(160px,1.4fr)_minmax(100px,1fr)_136px] border-b border-clover-line bg-white/60 text-center text-xs font-black text-clover-sub md:grid">
              <span className="px-3 py-3">대분류</span>
              <span className="px-3 py-3">소분류</span>
              <span className="px-3 py-3">제목</span>
              <span className="px-3 py-3">URL</span>
              <span className="px-3 py-3">메모</span>
              <span className="px-3 py-3">액션</span>
            </div>
            <div className="divide-y divide-clover-line">
              {filteredLinks.map((item) => (
                <article key={item.id} className="grid gap-2 p-3 text-sm md:grid-cols-[86px_96px_minmax(90px,1fr)_minmax(160px,1.4fr)_minmax(100px,1fr)_136px] md:items-center">
                  <button type="button" onClick={() => setFilter(item.bigCategory)} className={`w-fit rounded-full px-3 py-1 text-xs font-black ${categoryClass(item.bigCategory)}`}>
                    {item.bigCategory}
                  </button>
                  <button type="button" onClick={() => setFilter(item.smallCategory)} className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-clover-sub">
                    {item.smallCategory}
                  </button>
                  <p className="font-black text-clover-text">{item.title}</p>
                  <a href={normalizeUrl(item.url)} target="_blank" rel="noreferrer" className="truncate font-bold text-blue-600 hover:underline">
                    {item.url}
                  </a>
                  <p className="text-clover-sub">{item.memo || "-"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <a href={normalizeUrl(item.url)} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">열기</a>
                    <button type="button" onClick={() => editLink(item)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">수정</button>
                    <button type="button" onClick={() => deleteLink(item.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600">삭제</button>
                  </div>
                </article>
              ))}
              {!filteredLinks.length && (
                <p className="p-8 text-center text-sm font-bold text-clover-sub">아직 저장된 링크가 없어요. 왼쪽에서 자주 쓰는 URL을 추가해보세요.</p>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
