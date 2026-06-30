// vite.config.js
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { VantResolver } from "unplugin-vue-components/resolvers";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const API_Endpoint = env.VITE_API_Endpoint;

    return {
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
                    target: API_Endpoint,
                    changeOrigin: true,
                    secure: false,
                },
                "/authui": {
                    target: API_Endpoint,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
        build: {
            minify: "terser",
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    collapse_vars: true,
                },
                mangle: true,
                keep_fnames: false,
            },
        },
    };
});
