<template>
    <div>
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>出库管理</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </div>
                    <div>
                        <el-space>
                            <el-select v-model="query.status" style="width: 220px" clearable @change="onSearch()">
                                <el-option v-for="(option, index) in query.statusOptions" :key="index" :label="option.label" :value="option.value" />
                            </el-select>
                            <el-input
                                v-model="query.serial"
                                style="width: 340px"
                                placeholder="输入业务单据"
                                clearable
                                @clear="onSearch()"
                                @change="onSearch()" />
                            <el-button type="success" :icon="Search" @click="onSearch()" :loading="loading">检索</el-button>
                            <el-button type="success" @click="onInStock()">创建出库单</el-button>
                            <el-button type="primary" :icon="Refresh" @click="onRefresh()" :loading="loading">刷新</el-button>
                        </el-space>
                    </div>
                </div>
            </template>
            <el-table :data="order" style="width: 100%" v-loading="loading">
                <el-table-column prop="serial" label="业务单据" width="300" />
                <el-table-column prop="warehouse.name" label="仓库" />
                <el-table-column prop="classification.name" label="类型" />
                <el-table-column prop="owner.username" label="提交人" />
                <el-table-column prop="status" label="状态">
                    <template #default="scope">
                        <span class="status-dot" :class="getStatusConfig(scope.row.status).class" :title="getStatusConfig(scope.row.status).label"></span>
                        <span class="status-text">
                            {{ getStatusConfig(scope.row.status).label }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="创建时间">
                    <template #default="scope">{{ formatDate(scope.row.create_time) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="scope">
                        <el-space>
                            <el-button link type="primary" @click="onLookParticulars(scope.row)">明细</el-button>
                            <el-button link type="primary" @click="onPrint(scope.row)">打印</el-button>
                            <el-button link type="primary" @click="onOpenDealWith(scope.row)">处理</el-button>
                            <el-dropdown trigger="click" placement="bottom-end">
                                <el-button link type="primary">更多</el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <div v-if="scope.row.status === 'COMPLETED'">
                                            <el-dropdown-item>
                                                <el-button link type="primary" @click="onReversal(scope.row)">红冲</el-button>
                                            </el-dropdown-item>
                                        </div>
                                        <div v-if="scope.row.status === 'PENDING'">
                                            <el-dropdown-item>
                                                <el-button link type="primary" @click="onUpdateOrder(scope.row)">编辑</el-button>
                                            </el-dropdown-item>
                                        </div>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </el-space>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination">
                <div>
                    <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
                </div>
            </div>
        </el-card>
        <Status ref="InStatus" :vdata="orderRow"></Status>
    </div>
</template>

<script>
import { Refresh, Search } from "@element-plus/icons-vue";
import pagination from "../../components/pagination/pagination.vue";
import Status from "./status.vue";
import { formatTime } from "../../utils/date.js";
import { Getstockorder } from "../../api/index.js";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { getStatusConfig } from "../../utils/status.js";
import { getSuatusOption } from "../../utils/status.js";

export default {
    name: "HomeIndex",
    components: { pagination, Status },
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
            order: [],
            orderRow: {},
            query: {
                loading: false,
                statusOptions: getSuatusOption(), // 引入状态选项
                status: [],
                serial: "",
            },
        };
    },
    methods: {
        getStatusConfig,
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
        },
        loadGetstockorder: function (page_size, page) {
            this.loading = true;
            let params = { direction: "out", ...convertToLimitOffset(page, page_size) };
            if (this.query.serial !== "") {
                params = { serial: this.query.serial, ...params };
            }
            if (this.query.status !== "") {
                params.status = this.query.status;
            }

            withDelay(() => Getstockorder(params))
                .then((res) => {
                    this.order = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                })
                .finally(() => {
                    this.loading = false;
                    this.query.loading = false;
                });
        },
        onInStock() {
            this.$router.push({ name: "outWarehouse" });
        },
        onCurrentChange(p) {
            this.page = p;
            this.loadGetstockorder(this.pageSize, p);
        },
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadGetstockorder(s, 1);
        },
        onRefresh() {
            this.loading = true;
            this.loadGetstockorder(this.pageSize, this.page);
        },
        onOpenDealWith(val) {
            this.orderRow = val;
            this.$refs.InStatus.openDialog();
        },
        onSearch() {
            this.query.loading = true;
            this.loadGetstockorder(this.pageSize, this.page);
        },
        onPrint(val) {
            // 构建路由跳转的完整URL
            this.$router.push({
                name: "eprint",
                query: {
                    _type: val.type,
                    warehouse_id: val.warehouse.id,
                    order_id: val.order_id,
                },
            });
        },
        onLookParticulars(val) {
            this.$router.push({ name: "particulars", query: { serial: val.serial } });
        },
        onReversal(val) {
            this.$router.push({
                name: "ReversalApplication",
                params: { oid: val.order_id },
                query: { _b: "o" },
            });
        },
        onUpdateOrder(val) {
            this.$router.push({ name: "editOutWarehouse", query: { order_id: val.order_id } });
        },
    },
    created() {
        this.$globalBus.emit("updateActivePath", "/stockout");
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

<style scoped></style>
