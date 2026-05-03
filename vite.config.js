import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { VantResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
    base: "/dtwm/",
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver(), VantResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver(), VantResolver()],
        }),
    ],
    server: {
        host: "0.0.0.0",
        proxy: {
            "/api": {
                target: "https://uias.localvm.outsrkem.top:30078",
                changeOrigin: true,
                secure: false,
            },
            "/authui": {
                target: "https://uias.localvm.outsrkem.top:30078",
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        // 强制启用压缩
        minify: "terser",
        terserOptions: {
            compress: {
                // 移除所有console
                drop_console: true,
                // 移除debugger
                drop_debugger: true,
                // 额外优化：合并连续的console
                collapse_vars: true,
            },
            // 压缩输出
            mangle: true,
            // 保留函数名（可选，便于错误追踪）
            keep_fnames: false,
        },
    },
});
