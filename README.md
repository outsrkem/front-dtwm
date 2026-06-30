# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

```
src/
├── views/                  # 页面容器组件目录
│   ├── stockin/            # 入库相关页面
│   │   ├── inwarehouse.vue      # 入库新增容器组件
│   │   └── editwarehouse.vue    # 入库库修改容器组件
│   │
│   └── stockout/           # 出库相关页面
│       ├── outwarehouse.vue     # 出库新增容器组件
│       └── editwarehouse.vue    # 出库修改容器组件
│
├── components/             # 通用组件目录
│   └── stock/              # 库存相关组件
│       └── StockForm.vue        # 通用展示组件（入库/出库共用）
│
├── api/                    # 接口请求目录
│   ├── stockin.js          # 入库相关接口
│   ├── stockout.js         # 出库相关接口
│   └── common.js           # 公共接口（分类/仓库/供应商等）
│
├── utils/                  # 工具函数目录
│   ├── date.js             # 日期格式化工具
│   ├── message.js          # 消息提示工具
│   └── common.js           # 通用工具函数
│
└── router/                 # 路由配置
    └── index.js            # 路由定义（包含库存相关页面路由）

```

### 开发环境项目运行

创建`.env.local`配置文件,内容为`api`服务器地址

```
VITE_API_Endpoint=https://api.svc.local:8998
```
