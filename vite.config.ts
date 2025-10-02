import { defineConfig } from "vite";
import vitePluginShiki from "./plugin";

export default defineConfig({
  plugins: [vitePluginShiki()],
});
