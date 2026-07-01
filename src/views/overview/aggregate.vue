<template>
    <div class="settings-container">
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>出入库单据聚合查询</span>
                    </div>
                    <div>
                        <el-space>
                            <el-select clearable v-model="query.warehouses.id" placeholder="选择仓库" style="width: 240px" :loading="loadingWarehouses">
                                <el-option v-for="item in warehouses" :key="item.id" :label="item.name" :value="item.id" />
                                <template #empty>
                                    <div>未找到匹配的仓库</div>
                                </template>
                            </el-select>
                            <el-button type="success" @click="onSelectOrder()" :loading="loading" :disabled="!query.warehouses.id"> 选择单据 </el-button>
                            <el-button type="primary" :icon="Search" @click="onRefresh()" :loading="loadingResult" :disabled="query.order.ids.length === 0">
                                查询
                            </el-button>
                            <el-button type="primary" :icon="Printer" @click="onPrint()" :loading="loadingResult" :disabled="aggregateId === ''">
                                打印
                            </el-button>
                        </el-space>
                    </div>
                </div>
            </template>

            <!-- 聚合结果展示区域 -->
            <div class="result-container" v-if="showResult">
                <div class="summary-card">
                    <el-descriptions :column="4" border>
                        <el-descriptions-item label="总单据数">{{ summary.total }}</el-descriptions-item>
                        <el-descriptions-item label="入库单数">{{ summary.in }}</el-descriptions-item>
                        <el-descriptions-item label="出库单数">{{ summary.out }}</el-descriptions-item>
                        <el-descriptions-item label="有效单据数">{{ summary.valid }}</el-descriptions-item>
                    </el-descriptions>
                </div>
                <br style="width: 100%; margin-top: 16px" />
                <el-table :data="aggregatedItems" v-loading="loadingResult">
                    <el-table-column prop="item.sku" label="产品编码" width="150" />
                    <el-table-column prop="item.name" label="物品名称" width="200" />
                    <el-table-column prop="item.specification" label="规格型号" />
                    <el-table-column prop="item.property" label="物品属性" />
                    <el-table-column prop="item.unit" label="计量单位" width="100" />

                    <!-- 入库统计 -->
                    <el-table-column label="入库统计">
                        <el-table-column prop="in_total.original" label="原始" width="100" />
                        <el-table-column prop="in_total.reversal" label="红冲" width="100" />
                        <el-table-column prop="in_total.supplement" label="补充" width="100" />
                        <el-table-column prop="in_total.total" label="总计" width="100" />
                    </el-table-column>

                    <!-- 出库统计 -->
                    <el-table-column label="出库统计">
                        <el-table-column prop="out_total.original" label="原始" width="100" />
                        <el-table-column prop="out_total.reversal" label="红冲" width="100" />
                        <el-table-column prop="out_total.supplement" label="补充" width="100" />
                        <el-table-column prop="out_total.total" label="总计" width="100" />
                    </el-table-column>
                </el-table>
            </div>

            <div v-else-if="query.order.ids.length > 0 && !showResult">
                <div class="empty-result">请点击查询按钮获取聚合结果</div>
            </div>

            <div v-else>
                <div class="empty-result">请先选择仓库和单据</div>
            </div>
            <br style="width: 100%; margin-top: 16px" />
            <!-- 调试信息：显示当前选择的单据ID -->
            <div v-if="debugMode" class="debug-info">
                <p>有效单据代表单据均为入库或完成状态，其他状态不进行聚合计算。</p>
                <p>当前有效单据为：{{ summary.serial }}</p>
            </div>
        </el-card>

        <!-- 单据选择对话框 -->
        <el-dialog v-model="dialogSelectOrder" title="选择单据" width="1200px" :before-close="handleClose">
            <div>
                <el-table :data="orders" style="width: 100%" v-loading="loading" @selection-change="handleSelectionChange" ref="orderTable">
                    <el-table-column type="selection" width="55" />
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
                </el-table>

                <div class="pagination">
                    <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="handleClose">取消</el-button>
                    <el-button type="primary" @click="confirmSelection" :disabled="selectedOrders.length === 0">
                        确认选择 ({{ selectedOrders.length }})
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { Search, Printer } from "@element-plus/icons-vue";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { OrderAggregate, GetWarehouses, SelectStockOrder } from "../../api/index.js";
import pagination from "../../components/pagination/pagination.vue";
import { getStatusConfig } from "../../utils/status.js";
import { formatTime } from "../../utils/date.js";
import { msgcon } from "../../utils/message.js";

export default {
    name: "OrderAggregate",
    components: { pagination },
    props: {},
    setup() {
        return {
            Printer,
            Search,
        };
    },
    data() {
        return {
            pageTotal: 0,
            pageSize: 10,
            page: 1,
            loading: false,
            loadingWarehouses: false,
            loadingResult: false,
            dialogSelectOrder: false,
            warehouses: [],
            orders: [],
            query: {
                warehouses: { id: "" },
                order: { ids: [] },
            },
            selectedOrders: [],
            aggregatedItems: [],
            aggregatedSummary: { serial: [] },
            summary: {},
            showResult: false,
            debugMode: true, // 调试模式，显示选择的ID
            aggregateId: "", // 汇聚数据的缓存ID
        };
    },
    methods: {
        getStatusConfig,

        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
        },

        onCurrentChange(p) {
            this.page = p;
            const selectedIds = this.selectedOrders.map((item) => this.getOrderId(item));
            this.loadSelectStockOrder().then(() => {
                this.$nextTick(() => {
                    this.orders.forEach((row) => {
                        if (selectedIds.includes(this.getOrderId(row))) {
                            this.$refs.orderTable.toggleRowSelection(row, true);
                        }
                    });
                });
            });
        },

        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            const selectedIds = this.selectedOrders.map((item) => this.getOrderId(item));
            this.loadSelectStockOrder().then(() => {
                this.$nextTick(() => {
                    this.orders.forEach((row) => {
                        if (selectedIds.includes(this.getOrderId(row))) {
                            this.$refs.orderTable.toggleRowSelection(row, true);
                        }
                    });
                });
            });
        },

        onRefresh() {
            // 过滤掉可能的null值
            const validIds = this.query.order.ids.filter((id) => id !== null && id !== undefined && id !== "");

            if (validIds.length === 0) {
                this.$message.warning(msgcon("请选择有效的单据"));
                return;
            }

            this.loadOrderAggregate(validIds);
        },
        // 聚哈报表打印
        onPrint() {
            this.$router.push({
                name: "aggregateOrderPrintPage",
                query: {
                    warehouse_id: this.query.warehouses.id,
                    aggregate_id: this.aggregateId,
                },
            });
        },
        onSelectOrder() {
            if (!this.query.warehouses.id) {
                this.$message.warning(msgcon("请先选择仓库"));
                return;
            }
            this.selectedOrders = [];
            this.page = 1;
            this.loadSelectStockOrder();
            this.dialogSelectOrder = true;
        },

        handleClose() {
            this.dialogSelectOrder = false;
        },

        handleSelectionChange(selection) {
            this.selectedOrders = selection;
            // 调试：打印选择的单据完整信息
            console.log("已选择的单据:", selection);
            // 提取ID时进行验证
            const ids = selection.map((item) => this.getOrderId(item));
            console.log("提取的单据ID:", ids);
        },

        confirmSelection() {
            if (this.selectedOrders.length === 0) {
                this.$message.warning(msgcon("请选择至少一个单据"));
                return;
            }

            // 修复核心：正确提取单据ID，增加错误处理
            this.query.order.ids = this.selectedOrders
                .map((item) => {
                    const id = this.getOrderId(item);
                    if (id === null || id === undefined) {
                        console.error("无法获取单据ID，单据数据:", item);
                        this.$message.warning(msgcon("发现无效单据，请重新选择"));
                    }
                    return id;
                })
                .filter((id) => id !== null && id !== undefined);

            this.dialogSelectOrder = false;
            this.$message.success(msgcon(`已选择 ${this.query.order.ids.length} 个有效单据`));
        },

        // 安全获取单据ID的方法
        getOrderId(order) {
            // 尝试多种可能的ID字段，根据实际数据结构调整
            if (!order) return null;
            if (order.id !== undefined) return order.id;
            if (order.orderId !== undefined) return order.orderId;
            if (order.order_id !== undefined) return order.order_id;
            console.warn("单据对象中未找到ID字段:", order);
            return null;
        },

        loadOrderAggregate(validIds) {
            this.loadingResult = true;
            const data = { order: { ids: validIds } };

            withDelay(() => OrderAggregate(data))
                .then((res) => {
                    this.aggregatedItems = res.payload.items || [];
                    this.summary = res.payload.summary || {};
                    this.aggregateId = res.payload.id;
                    this.showResult = true;
                })
                .catch((err) => {
                    console.error("聚合查询失败:", err);
                    this.$message.error(msgcon("聚合查询失败，请稍后重试"));
                })
                .finally(() => {
                    this.loadingResult = false;
                });
        },

        loadSelectStockOrder() {
            this.loading = true;
            const { offset, limit } = convertToLimitOffset(this.page, this.pageSize);
            // 修改仓库ID参数名为wd
            const params = {
                wd: this.query.warehouses.id,
                offset,
                limit,
            };

            return withDelay(() => SelectStockOrder(params))
                .then((res) => {
                    console.log("获取到的单据数据:", res.payload.items);
                    this.orders = res.payload.items || [];
                    this.pageTotal = res.payload.page_info?.total || 0;

                    // 检查单据是否包含ID字段
                    if (this.orders.length > 0) {
                        const firstOrder = this.orders[0];
                        if (!firstOrder.id && !firstOrder.orderId && !firstOrder.order_id) {
                            console.error("单据数据中不包含ID字段，第一个单据数据:", firstOrder);
                            this.$message.warning(msgcon("单据数据格式异常，无法获取ID"));
                        }
                    } else if (this.orders.length === 0) {
                        this.$message.info(msgcon("当前仓库没有可选择的单据"));
                    }
                })
                .catch((err) => {
                    console.error("获取单据列表失败:", err);
                    this.$message.error(msgcon("获取单据列表失败，请稍后重试"));
                    this.orders = [];
                    this.pageTotal = 0;
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        loadGetWarehouses() {
            if (this.loadingWarehouses) return;

            this.loadingWarehouses = true;
            const params = {
                limit: 20,
            };

            withDelay(() => GetWarehouses(params))
                .then((res) => {
                    this.warehouses = res.payload?.items || [];
                })
                .catch((err) => {
                    console.error("获取仓库信息失败:", err);
                    this.$message.error(msgcon("获取仓库列表失败，请稍后重试"));
                })
                .finally(() => {
                    this.loadingWarehouses = false;
                });
        },
    },
    created() {
        this.$globalBus.emit("updateActivePath", "/overview/aggregate");
        this.loadGetWarehouses();
    },
};
</script>

<style scoped>
.my_refresh {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

.result-container {
    margin-top: 16px;
}

.empty-result {
    text-align: center;
    padding: 40px 0;
    color: #666;
    background-color: #f9f9f9;
    border-radius: 4px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.debug-info {
    padding: 10px;
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
}
</style>
