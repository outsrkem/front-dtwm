<template>
    <div>
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>入库管理</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </div>
                    <div>
                        <el-space>
                            <el-select v-model="query.status" placeholder="选择状态" style="width: 220px" clearable @change="onSearch()">
                                <el-option v-for="(option, index) in query.statusOptions" :key="index" :label="option.label" :value="option.value" />
                            </el-select>
                            <el-input
                                v-model="query.serial"
                                style="width: 340px"
                                placeholder="输入业务单据"
                                clearable
                                @clear="onRefresh()"
                                @change="onSearch()" />
                            <el-button type="success" :icon="Search" @click="onSearch()" :loading="query.loading">检索</el-button>
                            <el-button type="success" @click="onInStock()">创建入库单</el-button>
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
                        <!-- 状态标识点 -->
                        <span class="status-dot" :class="getStatusConfig(scope.row.status).class" :title="getStatusConfig(scope.row.status).label"></span>
                        <!-- 中文状态文本 -->
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
                            <el-button link type="primary" @click="onOpenParticulars(scope.row)">处理</el-button>
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
                    <!--分页开始-->
                    <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
                    <!--分页结束-->
                </div>
            </div>
        </el-card>
        <InStatus ref="InStatus" :vdata="orderRow"></InStatus>
    </div>
</template>

<script>
import { Refresh, Search } from "@element-plus/icons-vue";
import InWarehouse from "./inwarehouse.vue";
import InStatus from "./status.vue";
import pagination from "../../components/pagination/pagination.vue";
import PrintPage from "../printmp/printmp.vue";
import { formatTime } from "../../utils/date.js";
import { Getstockorder } from "../../api/index.js";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { getStatusConfig } from "../../utils/status.js";
import { getSuatusOption } from "../../utils/status.js";
export default {
    name: "HomeIndex",
    components: { pagination, InWarehouse, InStatus, PrintPage },
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
                statusOptions: getSuatusOption(),
                status: [],
                serial: "",
            },
        };
    },
    methods: {
        getStatusConfig, // 引入的函数挂载到 methods 中，使其能被模板访问
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
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
        // 加载单据列表
        loadGetstockorder: function (page_size = 10, page = 1) {
            this.loading = true;
            let params = { direction: "in", ...convertToLimitOffset(page, page_size) };
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
        // 创建入库单
        onInStock() {
            this.$router.push({ name: "inWarehouse" });
        },

        // 刷新
        onRefresh() {
            this.loadGetstockorder(this.pageSize, this.page);
        },
        // 打开审批弹窗
        onOpenParticulars(val) {
            this.orderRow = val;
            this.$refs.InStatus.openDialog();
        },
        // 搜索
        onSearch() {
            this.query.loading = true;
            this.page = 1;
            this.loadGetstockorder(this.pageSize, this.page);
        },
        // 打印单据
        onPrint(val) {
            this.$router.push({
                name: "eprint",
                query: {
                    _type: val.type,
                    warehouse_id: val.warehouse.id,
                    order_id: val.order_id,
                },
            });
        },
        // 查看明细
        onLookParticulars(val) {
            this.$router.push({ name: "particulars", query: { serial: val.serial } });
        },
        // 红冲
        onReversal(val) {
            this.$router.push({
                name: "ReversalApplication",
                params: { oid: val.order_id },
                query: { _b: "i" },
            });
        },
        // 修改单据
        onUpdateOrder(val) {
            this.$router.push({ name: "editInWarehouse", query: { order_id: val.order_id } });
        },
    },
    created() {
        this.$globalBus.emit("updateActivePath", "/stockin");
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
