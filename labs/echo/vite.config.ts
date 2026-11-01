import { defineConfig } from "vite";

// Built with relative paths: the release is served from its own versioned folder on the tools origin.
export default defineConfig({ base: "./", build: { target: "es2022" } });
