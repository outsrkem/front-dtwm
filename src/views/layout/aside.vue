<template>
    <div>
        <div>
            <el-aside class="aside" style="width: auto">
                <p style="text-align: center">出入库管理系统</p>
                <el-menu :default-active="activePath" unique-opened>
                    <el-sub-menu index="1">
                        <template #title>
                            <el-icon><DataLine /></el-icon>
                            <span>数据总览</span>
                        </template>
                        <el-menu-item index="/overview/stock" @click="OnSwitchRoutes('/overview/stock')">
                            <el-icon><Warning /></el-icon>
                            <template #title><span>库存预警</span></template>
                        </el-menu-item>
                        <el-menu-item index="/overview/month" @click="OnSwitchRoutes('/overview/month')">
                            <el-icon><Histogram /></el-icon>
                            <template #title><span>月度汇总</span></template>
                        </el-menu-item>
                        <el-menu-item index="/overview/year" @click="OnSwitchRoutes('/overview/year')">
                            <el-icon><Memo /></el-icon>
                            <template #title><span>年度汇总</span></template>
                        </el-menu-item>
                        <el-menu-item index="/overview/custom" @click="OnSwitchRoutes('/overview/custom')">
                            <el-icon><ZoomIn /></el-icon>
                            <template #title><span>自定义查询</span></template>
                        </el-menu-item>
                        <el-menu-item index="/overview/aggregate" @click="OnSwitchRoutes('/overview/aggregate')">
                            <el-icon><Memo /></el-icon>
                            <template #title><span>聚合查询</span></template>
                        </el-menu-item>
                    </el-sub-menu>
                    <!-- <el-menu-item index="/overview/stock" @click="OnSwitchRoutes('/overview/stock')">
                        <el-icon><DataLine /></el-icon>
                        <template #title><span>数据总览</span></template>
                    </el-menu-item> -->
                    <el-menu-item index="/inventory" @click="OnSwitchRoutes('/inventory')">
                        <el-icon><Reading /></el-icon>
                        <template #title><span>库存信息</span></template>
                    </el-menu-item>
                    <el-menu-item index="/stockout" @click="OnSwitchRoutes('/stockout')">
                        <el-icon><Sell /></el-icon>
                        <template #title><span>出库管理</span></template>
                    </el-menu-item>
                    <el-menu-item index="/stockin" @click="OnSwitchRoutes('/stockin')">
                        <el-icon><SoldOut /></el-icon>
                        <template #title><span>入库管理</span></template>
                    </el-menu-item>
                    <el-menu-item index="/particulars" @click="OnSwitchRoutes('/particulars')">
                        <el-icon><Tickets /></el-icon>
                        <template #title><span>出入库明细</span></template>
                    </el-menu-item>
                    <el-menu-item index="/items" @click="OnSwitchRoutes('/items')">
                        <el-icon><Goods /></el-icon>
                        <template #title><span>物品管理</span></template>
                    </el-menu-item>
                    <el-menu-item index="/warehouse" @click="OnSwitchRoutes('/warehouse')">
                        <el-icon><School /></el-icon>
                        <template #title><span>仓库管理</span></template>
                    </el-menu-item>
                    <el-menu-item index="/supplier" @click="OnSwitchRoutes('/supplier')">
                        <el-icon><User /></el-icon>
                        <template #title><span>供应商/客户管理</span></template>
                    </el-menu-item>
                    <el-menu-item index="/reversal" @click="OnSwitchRoutes('/reversal')">
                        <el-icon><DocumentChecked /></el-icon>
                        <template #title><span>冲销管理</span></template>
                    </el-menu-item>
                </el-menu>
            </el-aside>
        </div>
    </div>
</template>

<script>
export default {
    name: "AppAside",
    components: {},
    props: {},
    data() {
        return {
            activePath: "",
            size: {
                x: "",
                z: "primary",
                d: "",
            },
        };
    },
    computed: {},
    watch: {},
    methods: {
        OnSwitchRoutes(activePath) {
            this.$router.push({ path: activePath });
        },
        // 设置元素尺寸
        onSetSize(size) {
            this.$globalBus.emit("element-size", size);
            const sizeConfigMap = {
                small: { x: "primary", z: "", d: "" },
                default: { x: "", z: "primary", d: "" },
                large: { x: "", z: "", d: "primary" },
            };
            this.size = sizeConfigMap[size] || sizeConfigMap.default;
        },
    },
    created() {
        this.$globalBus.on("updateActivePath", (data) => {
            this.activePath = data || "/";
        });
        this.onSetSize(window.localStorage.getItem("element-size")); // 加载默认元素尺寸
    },
    beforeUnmount() {
        this.$globalBus.off("updateActivePath");
    },
};
</script>

<style scoped>
.el-aside {
    /* 处理菜单右边的阴影 */
    background-color: #ffffff;
    .el-menu {
        border-right: none;
    }
}
</style>
