import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AppErrorBoundary from "./components/common/AppErrorBoundary.jsx";
import { initializeDiaryStorage } from "./lib/storage/diaryStorage.js";
import "./styles.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch(() => {});
}

if ("caches" in window) {
  caches
    .keys()
    .then((keys) => keys.forEach((key) => caches.delete(key)))
    .catch(() => {});
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<main className="p-8" role="status">기기에 저장된 기록을 여는 중…</main>);
initializeDiaryStorage().then(() => root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
)).catch(() => root.render(<main className="p-8" role="alert">
  <p>기기 저장소를 열지 못했어요. 기존 기록은 삭제하지 않았습니다.</p>
  <button className="mt-3 font-bold" onClick={() => location.reload()}>다시 시도</button>
</main>));
