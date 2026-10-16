import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { cloverWidgetPlugin } from "./widgets/buildWidget.js";

export default defineConfig(({ mode }) => ({
  plugins: [react(), cloverWidgetPlugin(loadEnv(mode, process.cwd(), 'VITE_'))]
}));
