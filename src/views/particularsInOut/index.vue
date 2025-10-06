<template>
    <div>
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>出入库明细</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </div>
                    <div>
                        <el-space>
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
                            <el-select
                                v-model="query.direction"
                                :max-collapse-tags="3"
                                placeholder="选择动作"
                                style="width: 120px"
                                clearable
                                @change="onSearch()">
                                <el-option key="index" label="入库" value="in" />
                                <el-option key="index" label="出库" value="out" />
                            </el-select>
                            <el-select v-model="query.status" :max-collapse-tags="3" placeholder="选择状态" style="width: 120px" clearable @change="onSearch()">
                                <el-option v-for="(option, index) in query.statusOptions" :key="index" :label="option.label" :value="option.value" />
                            </el-select>
                            <el-input v-model="query.serial" style="width: 240px" placeholder="输入业务单据" clearable @clear="onSearch()" />
                            <el-input v-model="query.name" style="width: 180px" placeholder="物品名称(模糊搜索)" clearable @clear="onSearch()" />
                            <el-button :icon="Search" type="success" @click="onSearch()" :loading="loading">检索</el-button>
                            <el-button type="primary" :icon="Refresh" @click="onRefresh()" :loading="loading">刷新</el-button>
                        </el-space>
                    </div>
                </div>
            </template>
            <!-- <el-table :data="particularsdata" style="width: 100%" v-loading="loading">
                <el-table-column label="业务单据" min-width="100px">
                    <template #default="scope">
                        <span :class="{ 'text-red': scope.row.order.supplement === 1 }">
                            {{ scope.row.order.serial }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="warehouse.name" label="仓库" />
                <el-table-column label="动作" width="100">
                    <template #default="scope">
                        {{ scope.row.order.type === "IN" ? "入库" : scope.row.order.type === "OUT" ? "出库" : scope.row.order.type }}
                    </template>
                </el-table-column>
                <el-table-column label="物品" min-width="100">
                    <template #default="scope"> {{ scope.row.item.name }}/{{ scope.row.item.property }}/{{ scope.row.item.specification }} </template>
                </el-table-column>
                <el-table-column prop="detailedly.quantity" label="出入库数量" width="120" />
                <el-table-column prop="item.unit" label="单位" width="150" />
                <el-table-column prop="status" label="状态" width="100">
                    <template #default="scope">
                        <span
                            class="status-dot"
                            :class="getStatusConfig(scope.row.detailedly.status).class"
                            :title="getStatusConfig(scope.row.detailedly.status).label"></span>
                        <span class="status-text">
                            {{ getStatusConfig(scope.row.detailedly.status).label }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="类型" width="100">
                    <template #default="scope">
                        <span v-if="scope.row.detailedly.correct_type === 'ORIGINAL'">原始记录</span>
                        <span v-if="scope.row.detailedly.correct_type === 'REVERSAL'" style="color: red">红冲修正</span>
                        <span v-if="scope.row.detailedly.correct_type === 'SUPPLEMENT'">补充修正</span>
                    </template>
                </el-table-column>
                <el-table-column label="提交时间" width="260">
                    <template #default="scope">{{ formatDate(scope.row.detailedly.create_time) }}</template>
                </el-table-column>
            </el-table> -->
            <MyTable :data="particularsdata" :columns="columns" :rowStyle="handleRowStyle" v-loading="loading">
                <template #ordertype="{ row }">
                    <span> {{ row.order.type === "IN" ? "入库" : row.order.type === "OUT" ? "出库" : row.order.type }}</span>
                </template>
                <template #item="{ row }">
                    <span> {{ row.item.name }}/{{ row.item.property }}/{{ row.item.specification }}</span>
                </template>
                <template #status="{ row }">
                    <span class="status-dot" :class="getStatusConfig(row.detailedly.status).class" :title="getStatusConfig(row.detailedly.status).label"></span>
                    <span class="status-text">
                        {{ getStatusConfig(row.detailedly.status).label }}
                    </span>
                </template>
                <template #create_time="{ row }">
                    {{ formatDate(row.detailedly.create_time) }}
                </template>
                <template #operation_time="{ row }">
                    {{ formatDate(row.order.operation_time) }}
                </template>
            </MyTable>
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
import MyTable from "../../components/MyTable/MyTable.vue";
import { debounce } from "lodash-es";
import dayjs from "dayjs";
import { Refresh, Search } from "@element-plus/icons-vue";
import { msgcon } from "../../utils/message.js";
import pagination from "../../components/pagination/pagination.vue";
import { GetParticulars, GetWarehouses } from "../../api/index.js";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { getSuatusOption } from "../../utils/status.js";
import { getStatusConfig } from "../../utils/status.js";
export default {
    name: "ParticularsIndex",
    components: { pagination, MyTable },
    props: {},
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
            particularsdata: [],
            query: {
                statusOptions: getSuatusOption(), // 引入状态选项
                status: "",
                serial: "",
                warehouses: {
                    id: "",
                },
                direction: "", // in/out
                name: "", // 物品名称，模糊搜索
            },
            warehouses: [],
            loadingWarehouses: false,
            columns: [
                { label: "业务单据", prop: "order.serial" },
                { label: "仓库", prop: "warehouse.name" },
                { label: "动作", slot: "ordertype" },
                { label: "物品", slot: "item" },
                { label: "出入库数量", prop: "detailedly.quantity" },
                { label: "单位", prop: "item.unit" },
                { label: "状态", slot: "status" },
                { label: "提交时间", slot: "create_time" },
                { label: "出入库时间", slot: "operation_time" },
            ],
        };
    },
    methods: {
        getStatusConfig,
        formatDate(time) {
            if (time <= 0) return "--";
            return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
        },
        handleRowStyle(row, index) {
            const styles = {};
            if (row.order.supplement === 1) {
                styles.backgroundColor = "#e8f5f7"; // 补历史单行，呼吸感浅青色
            }
            if (row.detailedly.correct_type === "REVERSAL") {
                styles.color = "#e74c3c"; // 红冲行淡红色
            }
            return styles;
        },
        loadGetParticulars: function (page_size = 10, page = 1) {
            this.loading = true;
            let params = convertToLimitOffset(page, page_size);
            if (this.query.serial !== "") params = { serial: this.query.serial, ...params };
            if (this.query.status !== "") params.status = this.query.status;
            if (this.query.warehouses.id !== "") params = { wd: this.query.warehouses.id, ...params };
            if (this.query.direction !== "") params = { direction: this.query.direction, ...params };
            if (this.query.name !== "") params = { name: this.query.name, ...params };
            withDelay(() => GetParticulars(params))
                .then((res) => {
                    this.particularsdata = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                })
                .catch((err) => {
                    let msg = err.data.metadata;
                    this.particularsdata = [];
                    this.$message.warning(msgcon(msg));
                })
                .finally(() => {
                    this.loading = false;
                });
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
                });
        },
        // 远程搜索300ms防抖延迟防抖处理，避免频繁请求
        onRemoteSearch: debounce(function (query = "") {
            const searchQuery = typeof query === "string" ? query.trim() : "";
            if (searchQuery === this.lastWarehouseQuery) return;
            this.lastWarehouseQuery = searchQuery;
            this.loadGetWarehouses(searchQuery);
        }, 300),
        onCurrentChange(p) {
            this.page = p;
            this.loadGetParticulars(this.pageSize, p);
        },
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadGetParticulars(s, 1);
        },
        onRefresh() {
            this.loading = true;
            this.loadGetParticulars(this.pageSize, this.page);
        },
        onSearch() {
            this.loadGetParticulars(this.pageSize, this.page);
        },
    },
    created() {
        this.query.serial = this.$route.query.serial;
        this.onRefresh();
        this.loadGetWarehouses();
        this.$globalBus.on("onRefresh", () => {
            this.onRefresh();
        });
    },
    mounted() {
        this.$globalBus.emit("updateActivePath", "/particulars");
    },
    beforeUnmount() {
        this.$globalBus.off("onRefresh");
        this.$globalBus.off("updateActivePath");
    },
};
</script>

<style scoped>
.text-red {
    color: red;
}
</style>
