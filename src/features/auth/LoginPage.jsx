import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import CloverLogo from "../../components/common/CloverLogo";
import GlassCard from "../../components/common/GlassCard";
import { login } from "../../lib/auth/localAuthAdapter";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("eunbibi");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    const result = login(username, password);
    if (!result.ok) return setError(result.message);
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
          <AppInput value={username} onChange={(event) => setUsername(event.target.value)} placeholder="아이디" />
          <AppInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" type="password" />
          {error && <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          <AppButton>로그인</AppButton>
        </form>
        <p className="mt-4 text-xs leading-relaxed text-clover-sub">MVP용 로컬 로그인입니다. 비밀번호는 프론트엔드에 남아 있으므로 실제 보안 인증이 아니며, 추후 Supabase Auth 어댑터로 교체하는 구조입니다.</p>
      </GlassCard>
    </main>
  );
}
