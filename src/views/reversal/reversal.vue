<template>
    <div>
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span style="color: red">单据红冲</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </div>
                    <div>
                        <el-space>
                            <el-button type="primary" :icon="ArrowLeft" @click="goBack()">返回</el-button>
                            <el-button type="primary" :icon="Refresh" @click="onRefresh()" :loading="loading">刷新</el-button>
                        </el-space>
                    </div>
                </div>
            </template>
            <div v-loading="loading">
                <el-descriptions border>
                    <el-descriptions-item label="仓库">{{ order.warehouse?.name || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="仓库地址">{{ order.warehouse?.location || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="出入库类型">{{ order.classification?.name || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="订单编号">{{ order.serial || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="提交人">{{ order.owner?.username || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ formatDate(order.create_time) }}</el-descriptions-item>
                </el-descriptions>
            </div>
        </el-card>
        <el-card style="margin-top: 10px" v-loading="loading">
            <div class="scrollable-div">
                <el-table :data="particulars">
                    <el-table-column prop="item.sku" label="物品编码" show-overflow-tooltip />
                    <el-table-column prop="item.name" label="物品 名称" />
                    <el-table-column prop="item.property" label="属性" />
                    <el-table-column prop="item.specification" label="规格" width="200" />
                    <el-table-column prop="item.unit" label="单位" width="100" />
                    <el-table-column prop="detailedly.quantity" label="出入库数目" width="200" />
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
                    <el-table-column label="操作" width="150">
                        <template #default="scope">
                            <el-button link type="danger" @click="onCreateReversal(scope.row)">冲销</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="pagination">
                    <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
                </div>
            </div>
        </el-card>
        <CreateReversal ref="CreateReversal" />
    </div>
</template>

<script>
import CreateReversal from "./create.vue";
import pagination from "../../components/pagination/pagination.vue";
import { Refresh, ArrowLeft } from "@element-plus/icons-vue";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { formatTime } from "../../utils/date.js";
import { GetOrderDetails, GetParticulars } from "../../api/index.js";
import { getSuatusOption } from "../../utils/status.js";
import { getStatusConfig } from "../../utils/status.js";
export default {
    name: "ReversalApplicationlIndex",
    components: { CreateReversal, pagination },
    props: {},
    setup() {
        return {
            Refresh,
            ArrowLeft,
        };
    },
    data() {
        return {
            pageTotal: 0,
            pageSize: 10,
            page: 1,
            loading: false,
            original: "", // 上一个标签
            oid: null, // 单据ID
            order: {
                // 订单信息详情
                warehouse: {},
                classification: {},
                owner: {},
            },
            particulars: null, // 单据的物品出入库流水
        };
    },
    methods: {
        getStatusConfig,
        formatDate(time) {
            return time ? formatTime(time).format("YYYY-MM-DD HH:mm:ss") : "--";
        },
        onCurrentChange(p) {
            this.page = p;
            this.loadGetParticulars(this.pageSize, p);
        },
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadGetParticulars(s, 1);
        },
        // 加载订单流水信息
        async loadGetParticulars(page_size = 10, page = 1, oid) {
            this.loading = true;
            this.error = false;
            this.particularsdata = [];
            let params = convertToLimitOffset(page, page_size);
            if (this.oid !== "") params = { oid: this.oid, ...params };
            withDelay(() => GetParticulars(params))
                .then((res) => {
                    if (res && res.payload) {
                        this.particulars = res.payload.items || [];
                        if (this.particulars.length > 0) {
                            this.particulars = this.particulars || {};
                        }
                        this.pageTotal = res.payload.page_info.total;
                    }
                })
                .catch((err) => {
                    console.error("获取单据详情失败:", err);
                    this.error = true;
                    this.errorMessage = err.data?.metadata || "加载单据详情失败";
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        //  加载订单信息详情
        async loadGetOrderDetails(oid) {
            const paths = { order_id: oid };
            try {
                const res = await withDelay(() => GetOrderDetails(paths));
                this.order = res.payload;
            } catch {
                // 错误处理
            } finally {
                this.loading = false;
            }
        },

        onRefresh() {
            this.loadGetParticulars(this.pageSize, this.page);
            this.loadGetOrderDetails(this.oid);
        },
        goBack() {
            // 按来源返回对应的页
            if (this.original === "i") this.$router.push({ name: "stockin" });
            if (this.original === "o") this.$router.push({ name: "stockout" });
        },
        onCreateReversal(val) {
            this.$refs.CreateReversal.openDialog(val);
        },
    },
    created() {
        this.original = this.$route.query._b; // 获取上一页标志
        this.oid = this.$route.params.oid;
        if (this.original === "i") this.$globalBus.emit("updateActivePath", "/stockin");
        if (this.original === "o") this.$globalBus.emit("updateActivePath", "/stockout");

        this.onRefresh();
        this.$globalBus.on("onRefresh", () => {
            this.onRefresh();
        });
    },
    beforeUnmount() {
        this.$globalBus.off("updateActivePath");
        this.$globalBus.off("onRefresh");
    },
};
</script>

<style scoped></style>
