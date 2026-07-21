import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const nowIso = () => new Date().toISOString();
const dateKey = () => new Date().toISOString().slice(0, 10);

const formatDateTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  });
};

const sortByLatest = (items) =>
  [...items].sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));

const searchableText = (post) => [
  post.title,
  post.body,
  post.link,
  ...(post.comments || []).flatMap((comment) => [comment.body, comment.link])
].filter(Boolean).join(" ").toLowerCase();

const matchesSearch = (post, query) => {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;
  return searchableText(post).includes(keyword);
};

const clipboardImages = (event) =>
  Array.from(event.clipboardData?.items || [])
    .filter((item) => item.type?.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);

const fileToImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ id: makeId("image"), name: file.name, src: reader.result, createdAt: nowIso() });
    reader.readAsDataURL(file);
  });

function ImagePreviewModal({ image, onClose }) {
  if (!image) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[22px] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-clover-line px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-clover-ink">{image.name || "첨부 이미지"}</p>
            <p className="text-xs font-bold text-clover-sub">클릭한 이미지를 크게 보고 있어요.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-black text-clover-sub hover:bg-rose-50 hover:text-rose-500">
            x
          </button>
        </div>
        <div className="grid max-h-[82vh] place-items-center overflow-auto bg-slate-50 p-3">
          <img src={image.src} alt={image.name || "첨부 이미지"} className="max-h-[78vh] max-w-full rounded-2xl object-contain" />
        </div>
      </div>
    </div>
  );
}

function ImageGrid({ images = [], onOpen, onRemove }) {
  if (!images.length) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {images.map((image) => (
        <div key={image.id} className="group relative aspect-video overflow-hidden rounded-2xl bg-white/70">
          <button type="button" onClick={() => onOpen(image)} className="h-full w-full">
            <img src={image.src} alt={image.name || "첨부 이미지"} className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(image.id)}
              className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-black text-rose-500 opacity-0 shadow-sm transition group-hover:opacity-100"
            >
              삭제
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function PostComposer({ onCreate }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [images, setImages] = useState([]);

  const addImages = async (files) => {
    const nextImages = await Promise.all(Array.from(files || []).map(fileToImage));
    setImages((current) => [...current, ...nextImages]);
  };

  const pasteImages = (event) => {
    const files = clipboardImages(event);
    if (!files.length) return;
    event.preventDefault();
    addImages(files);
  };

  const submit = () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle && !cleanBody && !link.trim() && !images.length) return;
    onCreate({
      title: cleanTitle || cleanBody.slice(0, 28) || "새 메모",
      body: cleanBody,
      link: link.trim(),
      images
    });
    setTitle("");
    setBody("");
    setLink("");
    setImages([]);
  };

  return (
    <GlassCard className="rounded-[22px] border border-clover-line bg-white/86 p-5">
      <div className="mb-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">Memo Inbox</p>
        <h2 className="mt-1 text-xl font-black text-clover-ink">게시글 등록</h2>
      </div>
      <div className="grid gap-2" onPaste={pasteImages}>
        <AppInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 콘텐츠 아이디어" />
        <AppTextarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="어 이거 좋은데? 싶은 걸 바로 적어두세요." className="min-h-[92px]" />
        <AppInput value={link} onChange={(event) => setLink(event.target.value)} placeholder="링크 붙여넣기" />
        <label className="rounded-2xl border border-dashed border-clover-line bg-white/55 px-4 py-3 text-sm font-bold text-clover-deep">
          사진 추가
          <input type="file" accept="image/*" multiple onChange={(event) => addImages(event.target.files)} className="mt-2 block text-xs text-clover-sub" />
        </label>
        {!!images.length && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image) => (
              <button key={image.id} type="button" onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/60">
                <img src={image.src} alt={image.name || "첨부 이미지"} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <AppButton onClick={submit}>등록</AppButton>
      </div>
    </GlassCard>
  );
}

function PostList({ posts, selectedId, onSelect, onToggleDone, showDone, onToggleList }) {
  return (
    <GlassCard className="rounded-[22px] border border-clover-line bg-white/86 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-clover-ink">{showDone ? "완료 목록" : "게시글 목록"}</h2>
          <p className="text-xs font-bold text-clover-sub">제목을 누르면 오른쪽에 상세 창이 열려요.</p>
        </div>
        <button type="button" onClick={onToggleList} className="rounded-full bg-white/70 px-3 py-2 text-xs font-black text-clover-deep">
          {showDone ? "진행 목록" : "완료 보기"}
        </button>
      </div>
      <div className="grid divide-y divide-clover-line/70">
        {posts.map((post) => (
          <article key={post.id} className={`transition ${selectedId === post.id ? "bg-emerald-50/70" : "hover:bg-white/65"}`}>
            <div className="flex items-start gap-3 px-2 py-3">
              <input type="checkbox" checked={Boolean(post.done)} onChange={() => onToggleDone(post)} className="mt-1 h-4 w-4 accent-clover-deep" />
              <button type="button" onClick={() => onSelect(post.id)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-black text-clover-ink">{post.title || "새 메모"}</p>
                <p className="mt-1 truncate text-[12px] font-bold text-clover-sub">
                  {formatDateTime(post.createdAt)} · 댓글 {post.comments?.length || 0}
                </p>
              </button>
              {!!post.images?.length && (
                <img src={post.images[0].src} alt={post.images[0].name || "첨부 이미지"} className="h-11 w-11 shrink-0 rounded-lg object-cover" />
              )}
            </div>
          </article>
        ))}
        {!posts.length && <p className="rounded-2xl bg-white/45 p-4 text-center text-sm font-bold text-clover-sub">{showDone ? "완료한 메모가 없어요." : "아직 게시글이 없어요."}</p>}
      </div>
    </GlassCard>
  );
}

function CommentComposer({ onAdd }) {
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [images, setImages] = useState([]);

  const addImages = async (files) => {
    const nextImages = await Promise.all(Array.from(files || []).map(fileToImage));
    setImages((current) => [...current, ...nextImages]);
  };

  const pasteImages = (event) => {
    const files = clipboardImages(event);
    if (!files.length) return;
    event.preventDefault();
    addImages(files);
  };

  const submit = () => {
    if (!body.trim() && !link.trim() && !images.length) return;
    onAdd({ body: body.trim(), link: link.trim(), images });
    setBody("");
    setLink("");
    setImages([]);
  };

  return (
    <div className="sticky bottom-2 mt-5 rounded-[22px] border border-white/70 bg-white/90 p-3 shadow-glass backdrop-blur">
      <div className="grid gap-2" onPaste={pasteImages}>
        <AppTextarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="댓글처럼 계속 끄적끄적..." className="min-h-[76px]" />
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <AppInput value={link} onChange={(event) => setLink(event.target.value)} placeholder="링크" />
          <label className="grid min-h-11 cursor-pointer place-items-center rounded-full bg-white/75 px-4 text-sm font-black text-clover-deep">
            사진
            <input type="file" accept="image/*" multiple onChange={(event) => addImages(event.target.files)} className="hidden" />
          </label>
          <AppButton onClick={submit}>등록</AppButton>
        </div>
        {!!images.length && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image) => (
              <button key={image.id} type="button" onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/60">
                <img src={image.src} alt={image.name || "첨부 이미지"} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditablePostHeader({ post, onUpdate, onToggleDone }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: post.title || "", body: post.body || "", link: post.link || "" });

  useEffect(() => {
    setDraft({ title: post.title || "", body: post.body || "", link: post.link || "" });
  }, [post.id, post.title, post.body, post.link]);

  const save = () => {
    onUpdate({ title: draft.title.trim() || "새 메모", body: draft.body.trim(), link: draft.link.trim() });
    setEditing(false);
  };

  return (
    <div className="mb-5 border-b border-clover-line/70 pb-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">상세보기</p>
          {editing ? (
            <AppInput value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2" />
          ) : (
            <h2 className="mt-1 break-keep text-2xl font-black text-clover-ink">{post.title || "새 메모"}</h2>
          )}
          <p className="mt-1 text-sm font-bold text-clover-sub">{formatDateTime(post.createdAt)}</p>
        </div>
        <button type="button" onClick={() => onToggleDone(post)} className={`rounded-full px-4 py-2 text-sm font-black ${post.done ? "bg-white text-clover-deep" : "bg-emerald-50 text-clover-deep"}`}>
          {post.done ? "완료 취소" : "완료"}
        </button>
      </div>

      {editing ? (
        <div className="grid gap-2">
          <AppTextarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} className="min-h-[100px]" />
          <AppInput value={draft.link} onChange={(event) => setDraft((current) => ({ ...current, link: event.target.value }))} placeholder="링크" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-clover-sub">취소</button>
            <button type="button" onClick={save} className="rounded-full bg-clover-deep px-3 py-1.5 text-xs font-black text-white">저장</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="text-xs font-black text-clover-deep">게시글 수정</button>
      )}
    </div>
  );
}

function MemoEntry({ entry, type, onOpenImage, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ body: entry.body || "", link: entry.link || "" });

  useEffect(() => {
    setDraft({ body: entry.body || "", link: entry.link || "" });
  }, [entry.id, entry.body, entry.link]);

  const save = () => {
    onUpdate(entry.id, { body: draft.body.trim(), link: draft.link.trim() });
    setEditing(false);
  };

  return (
    <article className={`rounded-[18px] border p-4 ${type === "post" ? "border-emerald-100 bg-emerald-50/35" : "border-clover-line bg-white/55"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ${type === "post" ? "bg-emerald-100 text-clover-deep" : "bg-white text-clover-deep"}`}>
          {type === "post" ? "글" : "댓"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${type === "post" ? "bg-emerald-100 text-clover-deep" : "bg-slate-100 text-slate-600"}`}>
                {type === "post" ? "게시글" : "댓글"}
              </span>
              <p className="text-sm font-black text-clover-ink">이은비</p>
            </div>
            <p className="text-xs font-bold text-clover-sub">{formatDateTime(entry.createdAt)}</p>
          </div>

          {editing ? (
            <div className="grid gap-2">
              <AppTextarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} className="min-h-[88px]" />
              <AppInput value={draft.link} onChange={(event) => setDraft((current) => ({ ...current, link: event.target.value }))} placeholder="링크" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-clover-sub">취소</button>
                <button type="button" onClick={save} className="rounded-full bg-clover-deep px-3 py-1.5 text-xs font-black text-white">저장</button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-keep text-[15px] font-bold leading-7 text-clover-text">{entry.body}</p>
              {entry.link && <a href={entry.link} target="_blank" rel="noreferrer" className="mt-2 block truncate rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-clover-deep underline decoration-dotted">{entry.link}</a>}
              <ImageGrid images={entry.images || []} onOpen={onOpenImage} />
              <div className="mt-3 flex gap-3">
                <button type="button" onClick={() => setEditing(true)} className="text-xs font-black text-clover-deep">수정</button>
                {type === "comment" && <button type="button" onClick={() => onDelete(entry.id)} className="text-xs font-black text-rose-500">삭제</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function PostDetail({ post, onAddComment, onUpdatePost, onUpdateComment, onDeleteComment, onToggleDone, onOpenImage }) {
  if (!post) {
    return (
      <GlassCard className="grid min-h-[420px] place-items-center rounded-[22px] border border-clover-line bg-white/86 p-5 text-center">
        <div>
          <p className="text-lg font-black text-clover-ink">게시글을 선택해 주세요</p>
          <p className="mt-2 text-sm font-bold text-clover-sub">목록에서 제목을 고르면 별도 상세 창처럼 열려요.</p>
        </div>
      </GlassCard>
    );
  }

  const rootEntry = { id: `${post.id}-body`, body: post.body || post.title, link: post.link, images: post.images || [], createdAt: post.createdAt };
  const comments = post.comments || [];

  return (
    <GlassCard className="rounded-[22px] border border-clover-line bg-white/86 p-5">
      <EditablePostHeader post={post} onUpdate={onUpdatePost} onToggleDone={onToggleDone} />

      <div className="grid gap-3">
        {(rootEntry.body || rootEntry.link || rootEntry.images?.length) && (
          <MemoEntry entry={rootEntry} type="post" onOpenImage={onOpenImage} onUpdate={(_, updates) => onUpdatePost(updates)} onDelete={() => {}} />
        )}
        {comments.map((entry) => (
          <MemoEntry key={entry.id} entry={entry} type="comment" onOpenImage={onOpenImage} onUpdate={onUpdateComment} onDelete={onDeleteComment} />
        ))}
      </div>

      {!post.done && <CommentComposer onAdd={onAddComment} />}
    </GlassCard>
  );
}

export default function MemoPage() {
  const [data, setData] = useState(getAllData());
  const [selectedId, setSelectedId] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [query, setQuery] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const posts = useMemo(() => sortByLatest(data.memoPosts || []), [data.memoPosts]);
  const visiblePosts = posts.filter((post) => Boolean(post.done) === showDone && matchesSearch(post, query));
  const selectedPost = visiblePosts.find((post) => post.id === selectedId) || visiblePosts[0] || null;

  useEffect(() => {
    if (!selectedPost?.id) return;
    if (selectedId !== selectedPost.id) setSelectedId(selectedPost.id);
  }, [selectedPost?.id, selectedId]);

  const persist = (recipe) => {
    const next = getAllData();
    next.memoPosts = next.memoPosts || [];
    recipe(next.memoPosts);
    saveAllData(next);
    load();
  };

  const createPost = (payload) => {
    const timestamp = nowIso();
    const post = {
      id: makeId("memoPost"),
      title: payload.title,
      body: payload.body,
      link: payload.link,
      images: payload.images || [],
      comments: [],
      done: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      date: dateKey()
    };
    persist((list) => list.unshift(post));
    setSelectedId(post.id);
    setShowDone(false);
  };

  const toggleDone = (post) => {
    persist((list) => {
      const target = list.find((item) => item.id === post.id);
      if (!target) return;
      target.done = !target.done;
      target.completedAt = target.done ? nowIso() : "";
      target.updatedAt = nowIso();
    });
  };

  const updatePost = (updates) => {
    if (!selectedPost) return;
    persist((list) => {
      const target = list.find((item) => item.id === selectedPost.id);
      if (!target) return;
      Object.assign(target, updates, { updatedAt: nowIso() });
    });
  };

  const addComment = (payload) => {
    if (!selectedPost) return;
    persist((list) => {
      const target = list.find((item) => item.id === selectedPost.id);
      if (!target) return;
      const timestamp = nowIso();
      target.comments = [
        ...(target.comments || []),
        { id: makeId("memoComment"), body: payload.body, link: payload.link, images: payload.images || [], createdAt: timestamp, updatedAt: timestamp }
      ];
      target.updatedAt = timestamp;
    });
  };

  const updateComment = (commentId, updates) => {
    if (!selectedPost) return;
    persist((list) => {
      const target = list.find((item) => item.id === selectedPost.id);
      if (!target) return;
      const timestamp = nowIso();
      target.comments = (target.comments || []).map((item) => (
        item.id === commentId ? { ...item, ...updates, updatedAt: timestamp } : item
      ));
      target.updatedAt = timestamp;
    });
  };

  const deleteComment = (commentId) => {
    if (!selectedPost) return;
    persist((list) => {
      const target = list.find((item) => item.id === selectedPost.id);
      if (!target) return;
      target.comments = (target.comments || []).filter((item) => item.id !== commentId);
      target.updatedAt = nowIso();
    });
  };

  return (
    <>
      <PageHeader eyebrow="MEMO" title="생각 인박스">
        <div className="rounded-full bg-white/70 px-4 py-2 text-sm font-black text-clover-deep">
          진행 {posts.filter((post) => !post.done).length} · 완료 {posts.filter((post) => post.done).length}
        </div>
      </PageHeader>
      <p className="-mt-3 mb-5 text-sm font-bold text-clover-sub">카카오톡 나에게 보내기처럼 게시글을 만들고, 댓글처럼 계속 자료를 쌓아두세요.</p>
      <GlassCard className="mb-4 rounded-[18px] border border-clover-line bg-white/86 p-3">
        <AppInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="검색어를 입력하세요. 예: 템플릿"
        />
        {query.trim() && (
          <p className="mt-2 text-xs font-bold text-clover-sub">
            검색 결과 {visiblePosts.length}개 · 제목, 내용, 댓글, 링크에서 찾아요.
          </p>
        )}
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <PostComposer onCreate={createPost} />
          <PostList
            posts={visiblePosts}
            selectedId={selectedPost?.id}
            onSelect={setSelectedId}
            onToggleDone={toggleDone}
            showDone={showDone}
            onToggleList={() => setShowDone((value) => !value)}
          />
        </div>
        <PostDetail
          post={selectedPost}
          onAddComment={addComment}
          onUpdatePost={updatePost}
          onUpdateComment={updateComment}
          onDeleteComment={deleteComment}
          onToggleDone={toggleDone}
          onOpenImage={setPreviewImage}
        />
      </div>
      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
}
