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

  resetApp = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.auth);
      localStorage.removeItem(STORAGE_KEYS.appData);
      localStorage.removeItem("clover-desk:mandalart:v1");
    } catch {
      // Ignore storage cleanup errors and still reload.
    }
    window.location.href = "/login";
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center px-5 py-10">
        <section className="glass w-full max-w-lg rounded-[28px] bg-white/80 p-6 text-center">
          <p className="text-4xl">🍀</p>
          <h1 className="mt-4 text-2xl font-black text-clover-ink">앱을 다시 정리할게요</h1>
          <p className="mt-3 text-sm leading-relaxed text-clover-sub">
            예전 저장 데이터나 로그인 캐시가 새 버전과 충돌해서 화면이 멈췄을 수 있어요.
            아래 버튼을 누르면 저장 캐시를 비우고 로그인 화면으로 돌아갑니다.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-2xl bg-slate-100 p-3 text-left text-xs text-slate-500">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            type="button"
            onClick={this.resetApp}
            className="mt-5 rounded-full bg-clover-deep px-5 py-3 text-sm font-black text-white shadow-glass"
          >
            복구하고 다시 열기
          </button>
        </section>
      </main>
    );
  }
}
