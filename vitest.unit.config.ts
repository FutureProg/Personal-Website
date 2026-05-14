/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@common": path.join(dirname, "src/common"),
        },
    },
    test: {
        name: "unit",
        environment: "happy-dom",
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        exclude: ["src/backend/**", "**/node_modules/**", "**/dist/**"],
        globals: true,
    },
});
