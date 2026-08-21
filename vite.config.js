import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],

  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        about: "about.html",
        contact: "contact.html",
        shop: "shop.html",
        customizer: "customizer.html"
      }
    }
  }
});
