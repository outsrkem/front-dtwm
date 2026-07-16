import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import router from "./router";
import EventBusPlugin from "./utils/event-bus.js";
import vueCookies from "vue-cookies";
import "./styles/normalize.css";
import "./styles/index.less";
import App from "./App.vue";

const app = createApp(App);

// Register all element-plus icon components globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

// Register global plugins in order
app.use(ElementPlus, {
    locale: zhCn,
});
app.use(router);
app.use(EventBusPlugin);
app.use(vueCookies);

// Override default ElDialog props
// Disable close dialog by clicking mask or pressing ESC key
app._context.components.ElDialog.props.closeOnClickModal.default = false;
app._context.components.ElDialog.props.closeOnPressEscape.default = false;

// Mount root app to #app dom node
app.mount("#app");
