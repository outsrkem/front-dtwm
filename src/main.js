import { createApp } from "vue";
import ElementPlus from "element-plus";
import router from "./router";
import EventBusPlugin from "./utils/event-bus.js";
import "element-plus/dist/index.css";
import "./styles/index.less";
import App from "./App.vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import config from "./config/config";

import vueCookies from "vue-cookies";
const app = createApp(App);

// 注册所有 ElementPlus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.config.globalProperties.$config = config;
app.use(ElementPlus, {
    locale: zhCn,
});
app.use(router);
app.use(EventBusPlugin);
app.use(vueCookies);
// 全局修改默认配置，点击空白处不能关闭弹窗
app._context.components.ElDialog["props"].closeOnClickModal.default = false;
// 全局修改默认配置，按下ESC不能关闭弹窗
app._context.components.ElDialog["props"].closeOnPressEscape.default = false;

// 引入手机端
import Vant from "vant";
import "vant/lib/index.css";
app.use(Vant);

// 挂载app
app.mount("#app");
