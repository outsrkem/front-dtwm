<script>
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { Resume } from "./api/index.js";

export default {
    name: "App",
    data() {
        return {
            zhCn,
        };
    },
    mounted() {
        this.loadResume();
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
    },
    beforeUnmount() {
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    },
    methods: {
        async loadResume() {
            try {
                await Resume();
            } catch (error) {
                console.error("登录状态检测失败", error);
            }
        },
        async handleVisibilityChange() {
            if (document.visibilityState === "visible") {
                await this.loadResume();
            }
        },
    },
};
</script>

<template>
    <el-config-provider :locale="zhCn">
        <div>
            <router-view />
        </div>
    </el-config-provider>
</template>
