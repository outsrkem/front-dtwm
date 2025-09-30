import { createRouter, createWebHashHistory } from "vue-router";
import { isMobile } from "../utils/device";
const NotFound = () => import("../views/404/index.vue");
const Layout = () => import("../views/layout/index.vue");
// const Home = () => import("../views/home/index.vue");
const ReversalIdx = () => import("../views/reversal/index.vue");
const ReversalApplication = () => import("../views/reversal/reversal.vue");
const OverviewStock = () => import("../views/overview/stock.vue");
const OverviewYearCollect = () => import("../views/overview/yearcollect.vue");
const OverviewMonthCollect = () => import("../views/overview/monthcollect.vue");
const OverviewCustomCollect = () => import("../views/overview/custom.vue");
const OrderAggregate = () => import("../views/overview/aggregate.vue");

const Inventory = () => import("../views/inventory/index.vue");
const Stockout = () => import("../views/stockout/index.vue");
const Stockin = () => import("../views/stockin/index.vue");
const Particulars = () => import("../views/particularsInOut/index.vue");
const Warehouse = () => import("../views/warehouse/index.vue");
const Items = () => import("../views/item/index.vue");
const InWarehouse = () => import("../views/stockin/inwarehouse.vue");
const OutWarehouse = () => import("../views/stockout/outwarehouse.vue");
const Supplier = () => import("../views/supplier/index.vue");
const PrintPage = () => import("../views/printmp/printmp.vue"); // 单据打印页面
const AggregateOrderPrintPage = () => import("../views/printmp/aggregate.vue"); // 聚合单据打印

const WarehousePrintTheme = () => import("../views/warehouse/theme.vue");
const EditInWarehouse = () => import("../views/stockin/editwarehouse.vue");
const EditOutWarehouse = () => import("../views/stockout/editwarehouse.vue");

const MobileHome = () => import("../mobile/views/home/index.vue");
const MobileLayout = () => import("../mobile/layout/index.vue");
const MItems = () => import("../mobile/views/item/index.vue");
const Muser = () => import("../mobile/views/user/index.vue");
const MStockin = () => import("../mobile/views/stockin/index.vue");
const MStockout = () => import("../mobile/views/stockout/index.vue");
const MOrderList = () => import("../mobile/views/order/OrderList.vue");
const MOrderSearch = () => import("../mobile/views/order/OrderSearch.vue");
const MOrderDetail = () => import("../mobile/views/order/OrderDetail.vue");

// 动态导入组件（根据设备类型）
const loadComponent = (pcComponent, mobileComponent) => {
    return isMobile() ? mobileComponent : pcComponent;
};
// 路由配置
const routes = [
    {
        path: "/",
        component: loadComponent(Layout, MobileLayout), // 动态选择布局（PC端Layout或移动端Layout）
        meta: { title: "DTWM" },
        children: [
            { meta: { title: "首页" }, path: "/", name: "home", component: loadComponent(OverviewStock, MobileHome) },
            { meta: { title: "数据统计" }, path: "/overview/stock", name: "overviewStock", component: OverviewStock },
            { meta: { title: "数据统计" }, path: "/overview/year", name: "overviewYearCollect", component: OverviewYearCollect },
            { meta: { title: "数据统计" }, path: "/overview/month", name: "overviewMonthCollect", component: OverviewMonthCollect },
            { meta: { title: "数据统计" }, path: "/overview/custom", name: "overviewCustomCollect", component: OverviewCustomCollect },
            { meta: { title: "数据统计" }, path: "/overview/aggregate", name: "orderAggregate", component: OrderAggregate },

            { meta: { title: "库存信息" }, path: "/inventory", name: "inventory", component: Inventory },
            { meta: { title: "出库管理" }, path: "/stockout", name: "stockout", component: Stockout },
            { meta: { title: "出库管理 - 出库申请" }, path: "/stockout/create", name: "outWarehouse", component: loadComponent(OutWarehouse, MStockout) },
            { meta: { title: "出库管理 - 修改出库单" }, path: "/stockout/update", name: "editOutWarehouse", component: EditOutWarehouse },

            { meta: { title: "入库管理" }, path: "/stockin", name: "stockin", component: Stockin },
            { meta: { title: "入库管理 - 入库申请" }, path: "/stockin/create", name: "inWarehouse", component: loadComponent(InWarehouse, MStockin) },
            { meta: { title: "入库管理 - 修改入库单" }, path: "/stockin/update", name: "editInWarehouse", component: EditInWarehouse },

            { meta: { title: "出入库明细" }, path: "/particulars", name: "particulars", component: Particulars },
            { meta: { title: "单据红冲" }, path: "/order/reversal/:oid", name: "ReversalApplication", component: ReversalApplication },
            { meta: { title: "仓库信息" }, path: "/warehouse", name: "warehouse", component: Warehouse },
            { meta: { title: "仓库信息" }, path: "/warehouse/theme", name: "warehousePrintTheme", component: WarehousePrintTheme },
            { meta: { title: "物品管理" }, path: "/items", name: "items", component: loadComponent(Items, MItems) },
            { meta: { title: "客户管理" }, path: "/supplier", name: "supplier", component: Supplier },
            { meta: { title: "红冲管理" }, path: "/reversal", name: "reversalIdx", component: ReversalIdx },
            // 手机独立页面
            { meta: { title: "用户中心" }, path: "/user", name: "user", component: Muser },
            { meta: { title: "单据列表", keepAlive: true }, path: "/order-list", name: "StockOrderList", component: MOrderList },
            { meta: { title: "搜索单据" }, path: "/stock/order-search", name: "StockOrderSearch", component: MOrderSearch },
            { meta: { title: "单据详情" }, path: "/stock/order-detail/:oid", name: "StockOrderDetail", component: MOrderDetail, props: true },
        ],
    },
    { meta: { title: "仓库管理系统 - 数据打印" }, path: "/eprint", name: "eprint", component: PrintPage },
    {
        meta: { title: "仓库管理系统 - 聚合单据打印打印" },
        path: "/eprint/aggregate-order",
        name: "aggregateOrderPrintPage",
        component: AggregateOrderPrintPage,
    },
    {
        path: "/:pathMatch(.*)*",
        component: NotFound,
    },
];
// const routes = [
//     {
//         path: "/",
//         component: Layout,
//         meta: { title: "DTWM" },
//         children: [
//             { meta: { title: "首页" }, path: "/", name: "home", component: Overview },
//             { meta: { title: "数据统计" }, path: "/overview", name: "overview", component: Overview },
//             { meta: { title: "库存信息" }, path: "/inventory", name: "inventory", component: Inventory },
//             { meta: { title: "出库管理" }, path: "/stockout", name: "stockout", component: Stockout },
//             { meta: { title: "出库管理 - 出库申请" }, path: "/stockin/delivery", name: "outWarehouse", component: OutWarehouse },
//             { meta: { title: "入库管理" }, path: "/stockin", name: "stockin", component: Stockin },
//             { meta: { title: "入库管理 - 入库申请" }, path: "/stockin/create", name: "inWarehouse", component: InWarehouse },
//             { meta: { title: "出入库明细" }, path: "/particulars", name: "particulars", component: Particulars },
//             { meta: { title: "仓库信息" }, path: "/warehouse", name: "warehouse", component: Warehouse },
//             { meta: { title: "物品管理" }, path: "/items", name: "items", component: Items },
//             { meta: { title: "客户管理" }, path: "/supplier", name: "supplier", component: Supplier },
//         ],
//     },
//     { meta: { title: "404 页面未找到" }, path: "/:pathMatch(.*)*", component: NotFound },
// ];

const router = createRouter({
    history: createWebHashHistory("/dtwm/"),
    routes,
});

import { saveNavPath } from "../utils/common.js";
router.beforeEach((to, from, next) => {
    if (to.meta && to.meta.title) {
        document.title = to.meta.title;
    }
    const path = to.path;
    const activePath = path.split("/")[0] + "/" + path.split("/")[1];
    saveNavPath(activePath);
    next();
});

export default router;
