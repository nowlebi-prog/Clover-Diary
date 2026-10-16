import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import CloverLogo from "../../components/common/CloverLogo";
import GlassCard from "../../components/common/GlassCard";
import { login, usingCloud } from "../../lib/auth/authAdapter";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState(usingCloud ? "" : "eunbibi");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await login(username, password);
      if (!result.ok) return setError(result.message);
      onLogin(result.session);
      navigate("/");
    } catch (error) { setError(error.message || "로그인하지 못했어요. 연결을 확인해주세요."); }
    finally { setSubmitting(false); }
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
          <AppInput value={username} onChange={(event) => setUsername(event.target.value)} placeholder={usingCloud ? "Supabase 계정 이메일" : "아이디"} type={usingCloud ? "email" : "text"} autoComplete="username" required />
          <AppInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" type="password" autoComplete="current-password" required />
          {error && <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          <AppButton disabled={submitting}>{submitting ? "로그인 중…" : "로그인"}</AppButton>
        </form>
        <p className="mt-4 text-xs leading-relaxed text-clover-sub">{usingCloud ? "모든 기기에서 같은 Supabase 계정으로 로그인해주세요. 이 기기의 기존 기록은 설정에서 가져올 수 있어요." : "현재는 이 브라우저에만 저장됩니다. 기기 간 동기화에는 Supabase 연결이 필요해요."}</p>
      </GlassCard>
    </main>
  );
}
