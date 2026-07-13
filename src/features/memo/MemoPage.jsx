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

const fileToImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ id: makeId("image"), name: file.name, src: reader.result, createdAt: nowIso() });
    reader.readAsDataURL(file);
  });

function PostComposer({ onCreate }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [images, setImages] = useState([]);

  const addImages = async (files) => {
    const nextImages = await Promise.all(Array.from(files || []).map(fileToImage));
    setImages((current) => [...current, ...nextImages]);
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
      <div className="grid gap-2">
        <AppInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 콘텐츠 아이디어" />
        <AppTextarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="어 이거 좋은데? 싶은 걸 바로 적어두세요." className="min-h-[92px]" />
        <AppInput value={link} onChange={(event) => setLink(event.target.value)} placeholder="링크 붙여넣기" />
        <label className="rounded-2xl border border-dashed border-clover-line bg-white/55 px-4 py-3 text-sm font-bold text-clover-deep">
          사진 추가
          <input type="file" accept="image/*" multiple onChange={(event) => addImages(event.target.files)} className="mt-2 block text-xs text-clover-sub" />
        </label>
        {!!images.length && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image) => (
              <button key={image.id} type="button" onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))} className="aspect-square overflow-hidden rounded-2xl bg-white/60">
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
    <GlassCard className="rounded-[22px] border border-clover-line bg-white/86 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-clover-ink">{showDone ? "완료 목록" : "게시글 목록"}</h2>
          <p className="text-xs font-bold text-clover-sub">최신순 정렬 · 체크하면 완료로 이동</p>
        </div>
        <button type="button" onClick={onToggleList} className="rounded-full bg-white/70 px-3 py-2 text-xs font-black text-clover-deep">
          {showDone ? "진행 목록" : "완료 보기"}
        </button>
      </div>
      <div className="grid gap-2">
        {posts.map((post) => (
          <article key={post.id} className={`rounded-[16px] border p-3 transition ${selectedId === post.id ? "border-clover-deep bg-emerald-50/70" : "border-clover-line bg-white/65"}`}>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={Boolean(post.done)} onChange={() => onToggleDone(post)} className="mt-1 h-4 w-4 accent-clover-deep" />
              <button type="button" onClick={() => onSelect(post.id)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-black text-clover-ink">{post.title || "새 메모"}</p>
                <p className="mt-1 line-clamp-2 text-xs font-bold text-clover-sub">{post.body || post.comments?.[0]?.body || "내용 없음"}</p>
                <p className="mt-2 text-[11px] font-bold text-clover-sub">{formatDateTime(post.createdAt)}</p>
              </button>
              <span className="shrink-0 rounded-full bg-white/80 px-2 py-1 text-[11px] font-black text-clover-deep">{post.comments?.length || 0}</span>
            </div>
          </article>
        ))}
        {!posts.length && <p className="rounded-2xl bg-white/45 p-4 text-center text-sm font-bold text-clover-sub">{showDone ? "완료된 메모가 없어요." : "아직 게시글이 없어요."}</p>}
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

  const submit = () => {
    if (!body.trim() && !link.trim() && !images.length) return;
    onAdd({ body: body.trim(), link: link.trim(), images });
    setBody("");
    setLink("");
    setImages([]);
  };

  return (
    <div className="sticky bottom-2 mt-4 rounded-[22px] border border-white/70 bg-white/90 p-3 shadow-glass backdrop-blur">
      <div className="grid gap-2">
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

function PostDetail({ post, onAddComment, onDeleteComment, onToggleDone }) {
  if (!post) {
    return (
      <GlassCard className="grid min-h-[420px] place-items-center rounded-[22px] border border-clover-line bg-white/86 p-5 text-center">
        <div>
          <p className="text-lg font-black text-clover-ink">게시글을 선택해 주세요</p>
          <p className="mt-2 text-sm font-bold text-clover-sub">왼쪽 목록에서 고르면 댓글처럼 계속 기록할 수 있어요.</p>
        </div>
      </GlassCard>
    );
  }

  const entries = [
    { id: `${post.id}-body`, body: post.body || post.title, link: post.link, images: post.images || [], createdAt: post.createdAt, isRoot: true },
    ...(post.comments || [])
  ].filter((item) => item.body || item.link || item.images?.length);

  return (
    <GlassCard className="rounded-[22px] border border-clover-line bg-white/86 p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">상세보기</p>
          <h2 className="mt-1 break-keep text-2xl font-black text-clover-ink">{post.title || "새 메모"}</h2>
          <p className="mt-1 text-sm font-bold text-clover-sub">{formatDateTime(post.createdAt)}</p>
        </div>
        <button type="button" onClick={() => onToggleDone(post)} className={`rounded-full px-4 py-2 text-sm font-black ${post.done ? "bg-white text-clover-deep" : "bg-emerald-50 text-clover-deep"}`}>
          {post.done ? "완료 취소" : "완료"}
        </button>
      </div>

      <div className="grid gap-4">
        {entries.map((entry) => (
          <article key={entry.id} className="border-b border-clover-line/70 pb-4 last:border-0">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-black text-clover-deep">나</div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-clover-ink">이은비</p>
                  <p className="shrink-0 text-xs font-bold text-clover-sub">{formatDateTime(entry.createdAt)}</p>
                </div>
                <p className="whitespace-pre-wrap break-keep text-base font-bold leading-7 text-clover-text">{entry.body}</p>
                {entry.link && <a href={entry.link} target="_blank" rel="noreferrer" className="mt-2 block truncate rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-clover-deep underline decoration-dotted">{entry.link}</a>}
                {!!entry.images?.length && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {entry.images.map((image) => (
                      <a key={image.id} href={image.src} target="_blank" rel="noreferrer" className="aspect-video overflow-hidden rounded-2xl bg-white/60">
                        <img src={image.src} alt={image.name || "첨부 이미지"} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                {!entry.isRoot && (
                  <button type="button" onClick={() => onDeleteComment(entry.id)} className="mt-2 text-xs font-black text-rose-500">삭제</button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {!post.done && <CommentComposer onAdd={onAddComment} />}
    </GlassCard>
  );
}

function PostListCompact({ posts, selectedId, onSelect, onToggleDone, showDone, onToggleList }) {
  return (
    <GlassCard className="rounded-[22px] border border-clover-line bg-white/86 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-clover-ink">{showDone ? "완료 목록" : "게시글 목록"}</h2>
          <p className="text-xs font-bold text-clover-sub">최신순 · 체크하면 완료 목록으로 이동</p>
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
        {!posts.length && <p className="rounded-2xl bg-white/45 p-4 text-center text-sm font-bold text-clover-sub">{showDone ? "완료된 메모가 없어요." : "아직 게시글이 없어요."}</p>}
      </div>
    </GlassCard>
  );
}

function CommentItem({ entry, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.body || "");

  const save = () => {
    onUpdate(entry.id, { body: draft.trim() });
    setEditing(false);
  };

  return (
    <article className="border-b border-clover-line/70 pb-4 last:border-0">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-black text-clover-deep">나</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-clover-ink">이은비</p>
            <p className="shrink-0 text-xs font-bold text-clover-sub">{formatDateTime(entry.createdAt)}</p>
          </div>
          {editing ? (
            <div className="grid gap-2">
              <AppTextarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[88px]" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setDraft(entry.body || ""); setEditing(false); }} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-clover-sub">취소</button>
                <button type="button" onClick={save} className="rounded-full bg-clover-deep px-3 py-1.5 text-xs font-black text-white">저장</button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-keep text-base font-bold leading-7 text-clover-text">{entry.body}</p>
          )}
          {entry.link && <a href={entry.link} target="_blank" rel="noreferrer" className="mt-2 block truncate rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-clover-deep underline decoration-dotted">{entry.link}</a>}
          {!!entry.images?.length && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {entry.images.map((image) => (
                <a key={image.id} href={image.src} target="_blank" rel="noreferrer" className="aspect-video overflow-hidden rounded-2xl bg-white/60">
                  <img src={image.src} alt={image.name || "첨부 이미지"} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={() => setEditing(true)} className="text-xs font-black text-clover-deep">수정</button>
            <button type="button" onClick={() => onDelete(entry.id)} className="text-xs font-black text-rose-500">삭제</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PostDetailEditable({ post, onAddComment, onUpdateComment, onDeleteComment, onToggleDone }) {
  if (!post) {
    return (
      <GlassCard className="grid min-h-[420px] place-items-center rounded-[22px] border border-clover-line bg-white/86 p-5 text-center">
        <div>
          <p className="text-lg font-black text-clover-ink">게시글을 선택해 주세요</p>
          <p className="mt-2 text-sm font-bold text-clover-sub">목록에서 고르면 댓글처럼 계속 기록할 수 있어요.</p>
        </div>
      </GlassCard>
    );
  }

  const rootEntry = { id: `${post.id}-body`, body: post.body || post.title, link: post.link, images: post.images || [], createdAt: post.createdAt, isRoot: true };
  const comments = post.comments || [];

  return (
    <GlassCard className="rounded-[22px] border border-clover-line bg-white/86 p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">상세보기</p>
          <h2 className="mt-1 break-keep text-2xl font-black text-clover-ink">{post.title || "새 메모"}</h2>
          <p className="mt-1 text-sm font-bold text-clover-sub">{formatDateTime(post.createdAt)}</p>
        </div>
        <button type="button" onClick={() => onToggleDone(post)} className={`rounded-full px-4 py-2 text-sm font-black ${post.done ? "bg-white text-clover-deep" : "bg-emerald-50 text-clover-deep"}`}>
          {post.done ? "완료 취소" : "완료"}
        </button>
      </div>

      <div className="grid gap-4">
        {(rootEntry.body || rootEntry.link || rootEntry.images?.length) && (
          <article className="border-b border-clover-line/70 pb-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-black text-clover-deep">나</div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-clover-ink">이은비</p>
                  <p className="shrink-0 text-xs font-bold text-clover-sub">{formatDateTime(rootEntry.createdAt)}</p>
                </div>
                <p className="whitespace-pre-wrap break-keep text-base font-bold leading-7 text-clover-text">{rootEntry.body}</p>
                {rootEntry.link && <a href={rootEntry.link} target="_blank" rel="noreferrer" className="mt-2 block truncate rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-clover-deep underline decoration-dotted">{rootEntry.link}</a>}
              </div>
            </div>
          </article>
        )}
        {comments.map((entry) => (
          <CommentItem key={entry.id} entry={entry} onUpdate={onUpdateComment} onDelete={onDeleteComment} />
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
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const posts = useMemo(() => sortByLatest(data.memoPosts || []), [data.memoPosts]);
  const visiblePosts = posts.filter((post) => Boolean(post.done) === showDone);
  const selectedPost = posts.find((post) => post.id === selectedId) || visiblePosts[0] || null;

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
    persist((list) => {
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
      list.unshift(post);
      setSelectedId(post.id);
      setShowDone(false);
    });
  };

  const toggleDone = (post) => {
    persist((list) => {
      const target = list.find((item) => item.id === post.id);
      if (target) {
        target.done = !target.done;
        target.completedAt = target.done ? nowIso() : "";
        target.updatedAt = nowIso();
      }
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
      <p className="-mt-3 mb-5 text-sm font-bold text-clover-sub">카톡 나에게 보내기처럼 게시글을 만들고, 댓글처럼 자료를 계속 쌓아두세요.</p>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <PostComposer onCreate={createPost} />
          <PostListCompact
            posts={visiblePosts}
            selectedId={selectedPost?.id}
            onSelect={setSelectedId}
            onToggleDone={toggleDone}
            showDone={showDone}
            onToggleList={() => setShowDone((value) => !value)}
          />
        </div>
        <PostDetailEditable post={selectedPost} onAddComment={addComment} onUpdateComment={updateComment} onDeleteComment={deleteComment} onToggleDone={toggleDone} />
      </div>
    </>
  );
}
