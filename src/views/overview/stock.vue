<template>
    <div>
        <div>
            <el-card class="box-card">
                <template #header>
                    <div class="my_refresh">
                        <el-row>
                            <span>库存数据总览</span>
                            <span style="padding-left: 5px; padding-right: 5px"></span>
                        </el-row>
                        <el-row>
                            <el-select
                                clearable
                                v-model="query.warehouses.id"
                                placeholder="选择仓库"
                                style="width: 240px"
                                @change="onRefresh"
                                filterable
                                remote
                                :remote-method="onRemoteSearch">
                                <el-option v-for="item in warehouses" :key="item.id" :label="item.name" :value="item.id" />
                            </el-select>
                            <el-button type="primary" :icon="Refresh" @click="onRefresh" :loading="loading" style="margin-left: 10px">刷新</el-button>
                        </el-row>
                    </div>
                </template>
                <el-row :gutter="20">
                    <StockIndex :vdata="query" />
                </el-row>
            </el-card>
        </div>
        <div style="padding-top: 10px">
            <el-card>
                <ZeroStockSimple :vdata="query" />
            </el-card>
        </div>
    </div>
</template>

<script>
import { GetWarehouses } from "../../api/index.js";
import { debounce } from "lodash-es";
import StockIndex from "./charts/stock.vue";
import ZeroStockSimple from "./charts/ZeroStockSimple.vue";
import { Refresh } from "@element-plus/icons-vue";
export default {
    setup() {
        return {
            Refresh,
        };
    },
    name: "HomeIndex",
    components: { StockIndex, ZeroStockSimple },
    props: {},
    data() {
        return {
            loading: true,
            stock: [],
            warehouses: [],
            myChart: null,
            query: {
                warehouses: {
                    id: "",
                },
            },
            _isDestroyed: false, // 添加组件销毁标记
            loadingWarehouses: false, // 防止重复请求和提供用户反馈
        };
    },

    methods: {
        onRefresh() {
            this.loadGetWarehouses();
            this.$globalBus.emit("onRefresh");
        },
        onClearableWarehouses() {
            this.query.warehouses.id = "";
        },
        // 获取仓库
        loadGetWarehouses(query = "") {
            if (this.loadingWarehouses) return; // 防止重复请求
            this.loadingWarehouses = true;
            let params = { limit: 20 };

            // 仅在查询不为空且长度大于0时添加搜索参数
            if (typeof query === "string" && query.trim() !== "") {
                // 仅在查询不为空且长度大于0时添加搜索参数
                params = { name: query.trim(), ...params };
            }

            GetWarehouses(params)
                .then((res) => {
                    if (this._isDestroyed) return;
                    // 验证响应结构
                    if (res && res.payload && Array.isArray(res.payload.items)) {
                        this.warehouses = res.payload.items;
                    } else {
                        this.warehouses = [];
                        console.warn("获取仓库信息格式不正确", res);
                    }
                })
                .catch((err) => {
                    console.error("获取仓库信息失败:", err);
                    if (!this._isDestroyed) {
                        this.warehouses = [];
                        this.$message.error("获取仓库列表失败，请稍后重试");
                    }
                })
                .finally(() => {
                    if (!this._isDestroyed) {
                        this.loadingWarehouses = false;
                    }
                    this.loading = false;
                });
        },
        // 远程搜索300ms防抖延迟防抖处理，避免频繁请求
        onRemoteSearch: debounce(function (query = "") {
            const searchQuery = typeof query === "string" ? query.trim() : "";
            if (searchQuery === this.lastWarehouseQuery) return;
            this.lastWarehouseQuery = searchQuery;
            this.loadGetWarehouses(searchQuery);
        }, 300),
    },
    mounted() {},
    created() {
        this._isDestroyed = false;
        this.$globalBus.emit("updateActivePath", "/overview/stock");
        this.onRefresh();
    },
    beforeUnmount() {
        this.$globalBus.off("updateActivePath");
    },
};
</script>

<style scoped>
#kcyj {
    width: 100%;
    height: 400px;
}
</style>
