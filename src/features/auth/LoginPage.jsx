import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import CloverLogo from "../../components/common/CloverLogo";
import GlassCard from "../../components/common/GlassCard";
import { login, signUp, usingCloud } from "../../lib/auth/authAdapter";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [username, setUsername] = useState(usingCloud ? "" : "eunbibi");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    const result = mode === "signup" ? await signUp(username, password) : await login(username, password);
    setBusy(false);
    if (!result.ok) return setError(result.message);
    if (result.needsConfirm) return setInfo(result.message);
    onLogin(result.session);
    navigate("/");
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <GlassCard className="w-full max-w-md">
        <CloverLogo />
        <div className="my-8">
          <p className="text-sm text-clover-sub">오늘도 가볍게 정리해볼까요?</p>
          <h1 className="mt-2 text-3xl font-bold">나만의 작업 책상</h1>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <AppInput
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={usingCloud ? "이메일" : "아이디"}
            type={usingCloud ? "email" : "text"}
          />
          <AppInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" type="password" />
          {error && <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          {info && <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">{info}</p>}
          <AppButton disabled={busy}>{busy ? "처리 중…" : mode === "signup" ? "가입하고 시작하기" : "로그인"}</AppButton>
        </form>

        {usingCloud ? (
          <button
            className="mt-4 w-full text-center text-xs font-bold text-clover-sub underline"
            onClick={() => {
              setMode((m) => (m === "login" ? "signup" : "login"));
              setError("");
              setInfo("");
            }}
          >
            {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
          </button>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-clover-sub">
            클라우드 동기화가 아직 연결되지 않아 이 브라우저에만 데이터가 저장돼요. Vercel 환경변수에
            VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 추가하면 자동으로 로그인 방식이 전환돼요.
          </p>
        )}
      </GlassCard>
    </main>
  );
}
