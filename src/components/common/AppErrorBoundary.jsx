import { Component } from "react";
import { STORAGE_KEYS } from "../../lib/storage/storageKeys";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Clover Desk render error", error, info);
  }

  reloadApp = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  resetSessionOnly = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.auth);
      sessionStorage.removeItem("clover-money-unlocked");
    } catch {
      // Keep user data intact even if storage cleanup fails.
    }
    window.location.href = "/login";
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center px-5 py-10">
        <section className="glass w-full max-w-lg rounded-[28px] bg-white/85 p-6 text-center">
          <p className="text-4xl">!</p>
          <h1 className="mt-4 text-2xl font-black text-clover-ink">화면을 다시 불러올게요</h1>
          <p className="mt-3 text-sm leading-relaxed text-clover-sub">
            화면 표시 중 충돌이 생겼어요. 저장된 일정, 기분, 일기, 할 일 데이터는 지우지 않습니다.
            먼저 새로고침을 눌러보고, 로그인이 꼬였을 때만 세션 정리를 눌러주세요.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-2xl bg-slate-100 p-3 text-left text-xs text-slate-500">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={this.reloadApp}
              className="rounded-full bg-clover-deep px-5 py-3 text-sm font-black text-white shadow-glass"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={this.resetSessionOnly}
              className="rounded-full bg-white px-5 py-3 text-sm font-black text-clover-deep shadow-sm"
            >
              세션만 정리
            </button>
          </div>
        </section>
      </main>
    );
  }
}
