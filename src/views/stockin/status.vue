<template>
    <el-dialog v-model="dialogVisible" width="1200" title="处理处理">
        <div style="display: flex" v-if="!loading">
            <!-- 操作按钮区域 -->
            <el-steps style="width: 600px" :active="currentStep" finish-status="success" align-center>
                <!-- 始终显示提交步骤 -->
                <el-step title="提交" />

                <!-- 非取消状态显示审核和入库步骤 -->
                <template v-if="order.status !== 'CANCELLED' && order.status !== 'REJECTED'">
                    <el-step title="确认" />
                    <el-step title="入库" />
                </template>

                <!-- 结束/完成步骤 -->
                <el-step :title="order.status !== 'CANCELLED' && order.status !== 'REJECTED' ? '完成' : '结束'" />
            </el-steps>

            <div class="operation-buttons" v-if="hasOperations">
                <el-button v-for="op in currentOperations" :key="op.action" :type="op.type" @click="handleOperation(op)">
                    {{ op.text }}
                </el-button>
            </div>
        </div>

        <div style="margin: 12px 0 12px 0">
            <el-descriptions border>
                <el-descriptions-item label="仓库">{{ order.warehouse.name }}</el-descriptions-item>
                <el-descriptions-item label="仓库地址">{{ order.warehouse.location }}</el-descriptions-item>
                <el-descriptions-item label="入库类型">{{ order.classification.name }}</el-descriptions-item>
                <el-descriptions-item label="订单编号">
                    {{ order.serial }}
                </el-descriptions-item>
                <el-descriptions-item label="提交人">{{ order.owner.username }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatDate(order.create_time) }}</el-descriptions-item>
            </el-descriptions>

            <div>
                <el-divider content-position="left">订单详情</el-divider>
            </div>

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
                warehouse: {
                    id: "",
                    name: "",
                    location: "",
                },
                classification: {
                    id: null,
                    name: "",
                    order_id: "",
                    order_no: "",
                    status: "",
                    update_time: "",
                    create_time: "",
                },
                owner: { username: "" },
            }, // 单据
            loading: true,
            // 新增：标记是否是当前会话中执行的入库操作
            isCurrentSessionExecuted: false,
            // 操作配置：根据状态定义可执行的操作
            operations: {
                DRAFT: [
                    { action: "submit", text: "提交", type: "primary" },
                    { action: "cancel", text: "撤销", type: "warning" },
                ],
                PENDING: [
                    { action: "approve", text: "确认", type: "success" },
                    { action: "cancel", text: "撤销", type: "warning" },
                ],
                APPROVED: [{ action: "execute", text: "入库", type: "primary" }],
                EXECUTED: [{ action: "complete", text: "完成", type: "primary" }],
                COMPLETED: [],
                CANCELLED: [], // 取消状态下没有操作按钮
                REJECTED: [], // 取消状态下没有操作按钮
            },
        };
    },
    computed: {
        currentOperations() {
            if (!this.order || !this.order.status) return [];

            // 关键逻辑：如果是当前会话中执行的入库操作，即使状态是EXECUTED也不显示完成按钮
            if (this.order.status === "EXECUTED" && this.isCurrentSessionExecuted) {
                return [];
            }

            return this.operations[this.order.status] || [];
        },
        hasOperations() {
            return this.currentOperations.length > 0;
        },
        currentStep() {
            // 取消状态下只有两个步骤，设置currentStep为2以高亮"结束"步骤
            if (this.order.status === "CANCELLED" || this.order.status === "REJECTED") {
                return 3;
            }

            const statusMap = {
                DRAFT: 1, // 草稿状态对应第一步"提交"
                PENDING: 1, // 待审核对应第二步"审核"
                APPROVED: 2, // 已审核对应第三步"入库"
                EXECUTED: 3, // 执行中仍属于入库步骤
                COMPLETED: 4, // 已完成对应第四步"完成"
            };
            return statusMap[this.order.status] || 1;
        },
        statusText() {
            const statusMap = {
                DRAFT: "草稿",
                PENDING: "待审核",
                APPROVED: "已审核",
                EXECUTED: "执行中",
                COMPLETED: "已完成",
                CANCELLED: "已取消",
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
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
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
        handleOperation(operation) {
            this.$confirm(`确定要${operation.text}吗？`)
                .then(() => {
                    // 如果是入库操作，标记为当前会话执行
                    if (operation.action === "execute") {
                        this.isCurrentSessionExecuted = true;
                    }
                    this.executeOperation(operation.action);
                })
                .catch(() => {
                    this.$message.info("已取消操作");
                });
        },
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
                    this.$message.error(`操作失败：${err.message || "未知错误"}`);
                });
        },
        // 加载出入库流水
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
        // 加载订单详情
        loadGetOrderDetails: function () {
            const paths = { order_id: this.vdata.order_id };
            withDelay(() => GetOrderDetails(paths)).then((res) => {
                this.order = res.payload;
            });
        },
        openDialog() {
            // 每次打开对话框重置标记
            this.isCurrentSessionExecuted = false;
            this.dialogVisible = true;
            if (this.vdata && this.vdata.order_id) {
                this.loadOrderDetails();
            }
        },
        closeDialog() {
            this.dialogVisible = false;
        },
    },
};
</script>

<style scoped>
.operation-buttons {
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
}

.operation-buttons .el-button {
    margin-right: 8px;
    margin-bottom: 8px;
}

.scrollable-div {
    height: 450px;
    overflow-y: auto;
}
</style>
