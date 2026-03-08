import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type UserConfigExport } from "vite";

const config: UserConfigExport & { workers?: { format: string } } = {
  plugins: [reactRouter()],
  build: {
    lib: {
      entry: "app/root.tsx",
    },
  },
  ssr: {
    resolve: {
      conditions: ["workerd", "worker", "browser"],
    },
  },
  resolve: {
    mainFields: ["browser", "module", "main"],
  },
  workers: {
    format: "esm",
  },
};

export default defineConfig(config);
