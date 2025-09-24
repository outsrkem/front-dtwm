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
                            <el-button plain size="small" type="primary" @click="handleOperation({ action: 'submit', text: '提交' })"> 提交 </el-button>
                            <el-button plain size="small" type="warning" @click="handleOperation({ action: 'cancel', text: '撤销' })"> 撤销 </el-button>
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
                            <el-button plain size="small" type="success" @click="handleOperation({ action: 'approve', text: '确认' })"> 确认 </el-button>
                            <el-button plain size="small" type="danger" @click="handleOperation({ action: 'cancel', text: '撤销' })"> 撤销 </el-button>
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
                            <el-button plain size="small" type="warning" @click="handleOperation({ action: 'execute', text: '入库' })"> 入库 </el-button>
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
                            <el-button plain size="small" type="success" @click="handleOperation({ action: 'complete', text: '完成' })"> 完成 </el-button>
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
                        <el-table-column prop="item.unit" label="单位" />
                        <el-table-column prop="detailedly.quantity" label="入库数目" />
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
            OrderDetails: [], // 单据流水列表
            order: {
                warehouse: {},
                classification: {},
                owner: {},
            }, // 订单信息
            loading: true,
            isCurrentSessionExecuted: false, // 标记当前会话是否执行过入库操作
        };
    },
    computed: {
        currentStep() {
            // 取消或拒绝状态下高亮最后一步
            if (this.order.status === "CANCELLED" || this.order.status === "REJECTED") {
                return 3;
            }

            // 正常流程步骤映射
            const statusMap = {
                DRAFT: 0, // 草稿在第一步
                PENDING: 1, // 待审核在第二步
                APPROVED: 2, // 已审核在第三步
                EXECUTED: 3, // 已入库在第四步
                COMPLETED: 3, // 已完成在第四步
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
                if (newVal && newVal.order_id) {
                    this.loadOrderDetails();
                    this.loadGetOrderDetails();
                }
            },
        },
    },
    methods: {
        // 格式化日期时间
        formatDate(time) {
            return time ? formatTime(time).format("YYYY-MM-DD HH:mm:ss") : "-";
        },

        // 分页相关方法
        onCurrentChange(p) {
            this.page = p;
            this.loadOrderDetails(this.pageSize, p);
        },
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadOrderDetails(s, 1);
        },

        // 处理操作按钮点击
        handleOperation(operation) {
            this.$confirm(`确定要${operation.text}吗？`)
                .then(() => {
                    // 记录当前会话执行的入库操作
                    if (operation.action === "execute") {
                        this.isCurrentSessionExecuted = true;
                    }
                    this.executeOperation(operation.action);
                })
                .catch(() => {
                    this.$message.info("已取消操作");
                });
        },

        // 执行具体操作
        executeOperation(action) {
            if (!this.vdata || !this.vdata.order_id) {
                this.$message.error("缺少订单信息");
                return;
            }

            this.loading = true;
            const params = {
                order_id: this.vdata.order_id,
                action: action,
            };

            ReviewFlow(params)
                .then(() => {
                    this.loading = false;
                    this.$message.success("操作成功");
                    this.loadGetOrderDetails();
                    this.$globalBus.emit("onRefresh");
                })
                .catch((err) => {
                    this.loading = false;
                    this.$message.error(`操作失败：${err.data.metadata.message}`);
                });
        },

        // 加载订单流水详情
        loadOrderDetails(page_size = 10, page = 1) {
            this.loading = true;
            const params = { oid: this.vdata.order_id, ...convertToLimitOffset(page, page_size) };

            withDelay(() => GetParticulars(params))
                .then((res) => {
                    this.OrderDetails = res.payload.items || [];
                    this.pageTotal = res.payload.page_info.total;
                    this.loading = false;
                })
                .catch(() => {
                    this.OrderDetails = [];
                    this.loading = false;
                });
        },

        // 加载订单基本信息
        loadGetOrderDetails() {
            const paths = { order_id: this.vdata.order_id };
            withDelay(() => GetOrderDetails(paths))
                .then((res) => {
                    this.order = res.payload || {};
                    this.loading = false;
                })
                .catch(() => {
                    this.loading = false;
                });
        },

        // 打开对话框
        openDialog() {
            this.isCurrentSessionExecuted = false; // 重置标记
            this.dialogVisible = true;
            if (this.vdata && this.vdata.order_id) {
                this.loadOrderDetails();
            }
        },

        // 关闭对话框
        closeDialog() {
            this.dialogVisible = false;
        },
    },
};
</script>

<style scoped></style>
