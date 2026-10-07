import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  test: {
    environment: "node",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**", "core/**"],
      exclude: [
        "dist/**",
        "docs/**",
        "**/*.md",
        "**/*.json",
        "**/.env*",
        "**/*.css",
        "**/.gitignore",
        "**/*.config.js",
        "**/*.config.cjs",
        "**/.ipynb_checkpoints/**",
        "src/main.jsx",
        "src/Main2.jsx",
        "src/setupTests.jsx",
        "src/reportWebVitals.jsx",
        "src/output.css",
        "src/App.jsx",
        "src/GenerateJson.jsx",
        
      ],
    },
  },
});