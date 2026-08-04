import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pagesで https://<user>.github.io/sf-tech-lifeline/ に公開する想定
export default defineConfig({
  plugins: [react()],
  base: "/sf-tech-lifeline/",
});
