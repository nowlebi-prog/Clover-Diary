import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AppErrorBoundary from "./components/common/AppErrorBoundary.jsx";
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);
