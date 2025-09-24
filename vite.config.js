import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
// 1. 引入 Element Plus 和 Vant 的解析器
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { VantResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
    base: "/dtwm/",
    plugins: [
        vue(),
        AutoImport({
            // 2. 同时添加两个组件库的解析器（自动导入组件API）
            resolvers: [ElementPlusResolver(), VantResolver()],
        }),
        Components({
            // 3. 同时添加两个组件库的解析器（自动导入组件）
            resolvers: [ElementPlusResolver(), VantResolver()],
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
