import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
    base: "/dtwm/",
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
    ],
    server: {
        host: "0.0.0.0",
        proxy: {
            "/api": {
                target: "https://uias.localvm.outsrkem.top:30078",
                changeOrigin: true,
                // rewrite: (path) => path.replace(/^\/api/, ""),
            },
            "/authui": {
                target: "https://uias.localvm.outsrkem.top:30078",
                changeOrigin: true,
                // rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
});
