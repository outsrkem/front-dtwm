<template>
    <el-dialog v-model="dialogVisible" width="1200" title="处理订单">
        <div v-if="!loading">
            <!-- 步骤流程区域 -->
            <el-steps :active="currentStep" finish-status="success" align-center style="margin-bottom: 30px">
                <!-- 提交步骤 -->
                <el-step>
                    <template #title>提交</template>
                    <template #description>
                        <div v-if="order.status === 'DRAFT'">
                            <el-button plain size="small" type="primary" @click="confirmOperation('submit', '提交')"> 提交 </el-button>
                            <el-button plain size="small" type="warning" @click="confirmOperation('cancel', '撤销')"> 撤销 </el-button>
                        </div>
                        <div v-else>
                            {{ order.status === "CANCELLED" ? "已撤销" : "已提交" }}
                        </div>
                    </template>
                </el-step>

                <!-- 确认步骤 (非取消/拒绝状态显示) -->
                <el-step v-if="order.status !== 'CANCELLED' && order.status !== 'REJECTED'">
                    <template #title>确认</template>
                    <template #description>
                        <div v-if="order.status === 'PENDING'">
                            <el-button plain size="small" type="success" @click="confirmOperation('approve', '确认')"> 确认 </el-button>
                            <el-button plain size="small" type="danger" @click="confirmOperation('cancel', '撤销')"> 撤销 </el-button>
                        </div>
                        <div v-else-if="order.status === 'APPROVED'">已确认</div>
                        <div v-else-if="order.status === 'REJECTED'">已拒绝</div>
                        <div v-else>-</div>
                    </template>
                </el-step>

                <!-- 入库步骤 (非取消/拒绝状态显示) -->
                <el-step v-if="order.status !== 'CANCELLED' && order.status !== 'REJECTED'">
                    <template #title>入库</template>
                    <template #description>
                        <div v-if="order.status === 'APPROVED'">
                            <el-button plain size="small" type="warning" @click="confirmOperation('execute', '入库')"> 入库 </el-button>
                        </div>
                        <div v-else-if="order.status === 'EXECUTED'">已入库</div>
                        <div v-else>-</div>
                    </template>
                </el-step>

                <!-- 完成/结束步骤 -->
                <el-step>
                    <template #title>
                        {{ order.status !== "CANCELLED" && order.status !== "REJECTED" ? "完成" : "结束" }}
                    </template>
                    <template #description>
                        <div v-if="order.status === 'EXECUTED' && !isCurrentSessionExecuted">
                            <el-button plain size="small" type="success" @click="confirmOperation('complete', '完成')"> 完成 </el-button>
                        </div>
                        <div v-else>
                            {{ statusText }}
                        </div>
                    </template>
                </el-step>
            </el-steps>

            <!-- 订单详情区域 -->
            <div style="margin: 12px 0">
                <el-descriptions border>
                    <el-descriptions-item label="仓库">{{ order.warehouse?.name || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="仓库地址">{{ order.warehouse?.location || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="入库类型">{{ order.classification?.name || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="订单编号">{{ order.serial || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="提交人">{{ order.owner?.username || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ formatDate(order.create_time) }}</el-descriptions-item>
                </el-descriptions>

                <el-divider content-position="left">订单详情</el-divider>

                <div class="scrollable-div">
                    <el-table :data="OrderDetails" v-loading="loading">
                        <el-table-column prop="item.sku" label="物品编码" show-overflow-tooltip />
                        <el-table-column prop="item.name" label="名称" />
                        <el-table-column prop="item.property" label="属性" />
                        <el-table-column prop="item.specification" label="规格" />
                        <el-table-column prop="item.unit" label="单位" width="100" />
                        <el-table-column prop="detailedly.quantity" label="入库数目" width="100" />
                        <el-table-column label="类型" width="150">
                            <template #default="scope">
                                <span v-if="scope.row.detailedly.correct_type === 'ORIGINAL'">原始记录</span>
                                <span v-if="scope.row.detailedly.correct_type === 'REVERSAL'" style="color: red">红冲修正</span>
                                <span v-if="scope.row.detailedly.correct_type === 'SUPPLEMENT'">补充修正</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <div class="pagination">
                    <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script>
import { GetOrderDetails, GetParticulars, ReviewFlow } from "../../api/index.js";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { formatTime } from "../../utils/date.js";

// 操作配置映射
const OPERATION_CONFIG = {
    submit: { text: "提交", successMsg: "提交成功" },
    cancel: { text: "撤销", successMsg: "撤销成功" },
    approve: { text: "确认", successMsg: "确认成功" },
    execute: { text: "入库", successMsg: "入库成功" },
    complete: { text: "完成", successMsg: "完成成功" },
};

export default {
    name: "InStatus",
    props: {
        vdata: {
            type: Object,
            default: () => null,
        },
    },
    data() {
        return {
            dialogVisible: false,
            pageTotal: 0,
            pageSize: 10,
            page: 1,
            OrderDetails: [],
            order: {
                warehouse: {},
                classification: {},
                owner: {},
            },
            loading: true,
            isCurrentSessionExecuted: false,
        };
    },
    computed: {
        currentStep() {
            if (this.order.status === "CANCELLED" || this.order.status === "REJECTED") {
                return 3;
            }

            const statusMap = {
                DRAFT: 0,
                PENDING: 1,
                APPROVED: 2,
                EXECUTED: 3,
                COMPLETED: 4,
            };
            return statusMap[this.order.status] || 0;
        },
        statusText() {
            const statusMap = {
                DRAFT: "草稿",
                PENDING: "待审核",
                APPROVED: "已审核",
                EXECUTED: "执行中",
                COMPLETED: "已完成",
                CANCELLED: "已取消",
                REJECTED: "已拒绝",
            };
            return statusMap[this.order.status] || this.order.status;
        },
    },
    watch: {
        vdata: {
            deep: true,
            immediate: true,
            handler(newVal) {
                if (newVal?.order_id) {
                    this.loadOrderDetails();
                    this.loadGetOrderDetails();
                }
            },
        },
    },
    methods: {
        formatDate(time) {
            return time ? formatTime(time).format("YYYY-MM-DD HH:mm:ss") : "-";
        },

        onCurrentChange(p) {
            this.page = p;
            this.loadOrderDetails(this.pageSize, p);
        },

        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadOrderDetails(s, 1);
        },

        // 确认操作
        confirmOperation(action, text) {
            this.$confirm(`确定要${text}吗？`)
                .then(() => this.executeOperation(action))
                .catch(() => this.$message.info("已取消操作"));
        },

        // 执行操作
        async executeOperation(action) {
            if (!this.vdata?.order_id) {
                this.$message.error("缺少订单信息");
                return;
            }

            this.loading = true;

            // 记录入库操作
            if (action === "execute") {
                this.isCurrentSessionExecuted = true;
            }

            try {
                await ReviewFlow({
                    order_id: this.vdata.order_id,
                    action: action,
                });

                this.$message.success(OPERATION_CONFIG[action]?.successMsg || "操作成功");
                this.loadGetOrderDetails();
                this.$globalBus.emit("onRefresh");
            } catch (err) {
                this.$message.error(`操作失败：${err.data.metadata.message}`);
            } finally {
                this.loading = false;
            }
        },

        // 加载订单详情列表
        async loadOrderDetails(page_size = 10, page = 1) {
            this.loading = true;
            const params = { oid: this.vdata.order_id, ...convertToLimitOffset(page, page_size) };

            try {
                const res = await withDelay(() => GetParticulars(params));
                this.OrderDetails = res.payload.items || [];
                this.pageTotal = res.payload.page_info.total;
            } catch {
                this.OrderDetails = [];
            } finally {
                this.loading = false;
            }
        },

        // 加载订单基本信息
        async loadGetOrderDetails() {
            const paths = { order_id: this.vdata.order_id };

            try {
                const res = await withDelay(() => GetOrderDetails(paths), 500);
                this.order = res.payload || {};
            } catch {
                // 错误处理
            } finally {
                this.loading = false;
            }
        },

        openDialog() {
            this.isCurrentSessionExecuted = false;
            this.dialogVisible = true;
            if (this.vdata?.order_id) {
                this.loadOrderDetails();
            }
        },

        closeDialog() {
            this.dialogVisible = false;
        },
    },
};
</script>

<style scoped></style>
