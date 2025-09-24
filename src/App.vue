<script>
import { Resume } from "./api/index.js";
import { toLoginPage } from "./utils/common.js";
export default {
    name: "App",
    data() {
        return { data: "" };
    },
    mounted() {
        // 注册可见性变化事件监听
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
    },
    beforeUnmount() {
        // 移除事件监听，防止内存泄漏
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    },
    methods: {
        // 加载简历数据的方法
        async loadResume() {
            // 注意这里需要返回接口调用结果，否则无法获取res
            return await Resume();
        },
        // 页面可见性变化的处理逻辑
        async handleVisibilityChange() {
            // 仅当页面切回前台（可见状态）时，调用检测接口
            if (document.visibilityState === "visible") {
                try {
                    const res = await this.loadResume();
                    // 登录过期（示例用401状态码，需与后端协商一致）
                    if (res.code === 401) {
                        toLoginPage(); // 跳转至登录页
                    }
                } catch (error) {
                    console.error("登录状态检测失败", error);
                }
            }
        },
    },
};
</script>

<template>
    <div>
        <router-view />
    </div>
</template>

<style scoped></style>
