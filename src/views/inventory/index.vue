<template>
    <div class="settings-container">
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>库存信息</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </div>
                    <div>
                        <el-space>
                            <el-select clearable v-model="query.warehouses.id" placeholder="选择仓库" style="width: 240px" @change="selectWarehouse">
                                <el-option v-for="item in warehouses" :key="item.id" :label="item.name" :value="item.id" />
                            </el-select>
                            <el-input
                                v-model="query.serial"
                                style="width: 340px"
                                placeholder="输入物品名称"
                                clearable
                                @clear="onRefresh"
                                @change="onSearch()" />
                            <el-button type="success" :icon="Search" @click="onSearch" :loading="loading">检索</el-button>
                            <el-button type="primary" :icon="Refresh" @click="onRefresh" :loading="loading">刷新</el-button>
                        </el-space>
                    </div>
                </div>
            </template>
            <el-table :data="inventory" style="width: 100%" v-loading="loading">
                <el-table-column prop="warehouse.name" label="仓库" show-overflow-tooltip />
                <el-table-column prop="name" label="名称" show-overflow-tooltip min-width="150px" />
                <el-table-column prop="property" label="属性" show-overflow-tooltip />
                <el-table-column prop="specification" label="规格" />
                <el-table-column prop="unit" label="单位" />
                <el-table-column prop="status" label="物品状态">
                    <template #default="scope">
                        <span class="status-dot" :class="scope.row.status === 1 ? 'usable' : 'unusable'" />
                        <span v-if="scope.row.status === 1">上架</span>
                        <span v-else>下架</span>
                    </template>
                </el-table-column>
                <el-table-column prop="current" label="总库存" sortable />
                <el-table-column prop="available" label="可用库存" sortable />
                <el-table-column prop="lock" label="已锁定" sortable />
                <el-table-column prop="update_time" label="更新时间" width="200" sortable>
                    <template #default="scope">{{ formatDate(scope.row.update_time) }}</template>
                </el-table-column>
            </el-table>
            <div class="pagination">
                <div>
                    <!--分页开始-->
                    <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
                    <!--分页结束-->
                </div>
            </div>
        </el-card>
    </div>
</template>

<script>
import { Refresh, Search } from "@element-plus/icons-vue";
import pagination from "../../components/pagination/pagination.vue";
import { msgcon } from "../../utils/message.js";
import { formatTime } from "../../utils/date.js";
import { SelectInventory, GetWarehouses } from "../../api/index.js";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
export default {
    name: "InventoryIndex",
    components: {
        pagination,
    },
    setup() {
        return {
            Refresh,
            Search,
        };
    },
    data() {
        return {
            pageTotal: 0,
            pageSize: 10,
            page: 1,
            loading: true,
            inventory: [],
            warehouses: [], // 仓库信息
            // 查询条件
            query: {
                warehouses: { id: "" },
                serial: "",
            },
        };
    },
    methods: {
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
        },
        // 切换仓库
        selectWarehouse() {
            this.loadSelectInventory(this.pageSize, 1);
        },
        // 获取库存
        loadSelectInventory: function (page_size = 10, page = 1) {
            this.loading = true;
            let params = { wd: this.query.warehouses.id, ...convertToLimitOffset(page, page_size) };
            if (this.query.serial !== "") params = { name: this.query.serial, ...params };
            withDelay(() => SelectInventory(params))
                .then((res) => {
                    this.inventory = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                    this.loading = false;
                })
                .catch((err) => {
                    this.inventory = [];
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        // 获取仓库信息
        loadGetWarehouses: function () {
            GetWarehouses().then((res) => {
                this.warehouses = res.payload.items;
            });
        },
        onRefresh() {
            this.loading = true;
            this.loadSelectInventory(this.pageSize, this.page);
            this.loadGetWarehouses();
        },
        onCurrentChange(p) {
            this.page = p;
            this.loadSelectInventory(this.pageSize, p);
        },
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadSelectInventory(s, 1);
        },
        onSearch() {
            this.page = 1;
            if (this.query.serial != "") this.loadSelectInventory(this.pageSize, 1);
            else this.$message.warning(msgcon("请输入检索条件"));
        },
    },
    created() {
        this.$globalBus.emit("updateActivePath", "/inventory");
        this.onRefresh();
        this.$globalBus.on("onRefresh", () => {
            this.onRefresh();
        });
    },
    beforeUnmount() {
        this.$globalBus.off("onRefresh");
        this.$globalBus.off("updateActivePath");
    },
};
</script>

<style scoped>
.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
}
.usable {
    background-color: #50d4ab;
}
.unusable {
    background-color: #ffb700;
}
</style>
