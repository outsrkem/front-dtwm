<template>
    <div class="settings-container">
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>自定义日期出入库汇总</span>
                    </div>
                    <div>
                        <el-space>
                            <el-date-picker
                                v-model="dateRange"
                                type="daterange"
                                range-separator="至"
                                start-placeholder="开始日期"
                                end-placeholder="结束日期"
                                format="YYYY-MM-DD"
                                value-format="YYYYMMDD"
                                @change="onDateRangeChange"
                                :disabled-date="disabledDate" />
                            <el-select
                                clearable
                                v-model="query.warehouses.id"
                                placeholder="选择仓库"
                                style="width: 240px"
                                @change="onRefresh"
                                filterable
                                remote
                                :remote-method="onRemoteSearchWarehouse"
                                :loading="loadingWarehouses">
                                <el-option v-for="item in warehouses" :key="item.id" :label="item.name" :value="item.id" />
                                <template #empty>
                                    <div v-if="!loadingWarehouses">未找到匹配的仓库</div>
                                    <div v-else>搜索中...</div>
                                </template>
                            </el-select>
                            <el-select
                                clearable
                                v-model="query.item.id"
                                placeholder="搜索物品"
                                style="width: 240px"
                                @change="onRefresh"
                                filterable
                                remote
                                :remote-method="onRemoteSearchItem"
                                @clear="onCleanItemList"
                                :loading="loadingItems">
                                <el-option v-for="item in items" :key="item.id" :label="`${item.name} (${item.sku})`" :value="item.id" />
                                <template #empty>
                                    <div v-if="!loadingItems">未找到匹配的物品</div>
                                    <div v-else>搜索中...</div>
                                </template>
                            </el-select>
                            <el-button :icon="Search" type="success" @click="onSearch()" :loading="loading">检索</el-button>
                            <el-button :icon="Download" type="warning" @click="exportToCSV()" :loading="exporting">导出</el-button>
                            <el-button type="primary" :icon="Refresh" @click="onRefresh()" :loading="loading">刷新</el-button>
                        </el-space>
                    </div>
                </div>
            </template>
            <el-table :data="summary" style="width: 100%" v-loading="loading">
                <el-table-column prop="item.sku" label="SKU" width="180" />
                <el-table-column prop="item.name" label="物品" width="180" />
                <el-table-column prop="total_inbound_qty" label="累计入库总量" width="180" />
                <el-table-column prop="total_outbound_qty" label="累计出库总量" width="180" />
                <el-table-column prop="net_inventory_change" label="库存净变化" width="180" />
                <el-table-column prop="original_inbound_qty" label="原始入库量" width="180" />
                <el-table-column prop="inbound_reversal_qty" label="入库红冲量" width="180" />
                <el-table-column prop="original_outbound_qty" label="原始出库量" width="180" />
                <el-table-column prop="outbound_reversal_qty" label="出库红冲量" width="180" />
            </el-table>
            <div class="pagination" v-if="pageTotal > 0">
                <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
            </div>
            <div v-else-if="!loading" class="no-data">没有找到符合条件的数据</div>
        </el-card>
    </div>
</template>

<script>
import { debounce } from "lodash-es";
import { msgcon } from "../../utils/message.js";
import { Refresh, Search, Download } from "@element-plus/icons-vue";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { GetStockSummary, GetWarehouses, GetItems } from "../../api/index.js";
import pagination from "../../components/pagination/pagination.vue";

export default {
    name: "CustomCollect",
    components: {
        pagination,
    },
    setup() {
        return {
            Refresh,
            Search,
            Download,
        };
    },
    data() {
        return {
            pageTotal: 0,
            pageSize: 10,
            page: 1,
            loading: true,
            exporting: false, // 导出加载状态
            summary: [],
            // 仓库相关
            warehouses: [],
            loadingWarehouses: false,
            lastWarehouseQuery: "",
            // 物品相关
            items: [],
            loadingItems: false,
            lastItemQuery: "",
            dateRange: [], // 存储选择的日期范围
            query: {
                pt: "custom",
                from: "",
                to: "",
                warehouses: {
                    id: "",
                },
                item: {
                    id: "",
                },
            },
        };
    },
    methods: {
        // 限制日期选择不能超过今天
        disabledDate(time) {
            return time.getTime() > Date.now();
        },

        onDateRangeChange(range) {
            if (!range || range.length !== 2) {
                this.query.from = "";
                this.query.to = "";
                return;
            }
            this.query.from = range[0];
            this.query.to = range[1];
            this.loadGetStockSummary();
        },

        onCurrentChange(p) {
            this.page = p;
            this.loadGetStockSummary(this.pageSize, p);
        },

        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadGetStockSummary(s, 1);
        },

        loadGetStockSummary(page_size = 10, page = 1) {
            if (!this.query.from || !this.query.to) {
                this.loading = false;
                this.$message.warning("请选择完整的日期范围");
                return;
            }

            this.loading = true;
            const { limit, offset } = convertToLimitOffset(page, page_size);
            const params = {
                pt: this.query.pt,
                from: this.query.from,
                to: this.query.to,
                limit,
                offset,
                ...(this.query.warehouses.id && { warehouse_id: this.query.warehouses.id }),
                ...(this.query.item.id && { item_id: this.query.item.id }),
            };

            withDelay(() => GetStockSummary(params))
                .then((res) => {
                    this.summary = res.payload?.items || [];
                    this.pageTotal = res.payload?.page_info?.total || 0;
                })
                .catch((err) => {
                    console.error("获取库存汇总失败:", err);
                    this.$message.error("获取数据失败，请稍后重试");
                    this.summary = [];
                    this.pageTotal = 0;
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        // 仓库相关方法
        loadGetWarehouses(query = "") {
            if (this.loadingWarehouses) return;

            this.loadingWarehouses = true;
            const params = { limit: 20 };

            if (typeof query === "string" && query.trim()) {
                params.name = query.trim();
            }

            GetWarehouses(params)
                .then((res) => {
                    if (this._isDestroyed) return;
                    this.warehouses = res.payload?.items || [];
                })
                .catch((err) => {
                    console.error("获取仓库信息失败:", err);
                    if (!this._isDestroyed) {
                        this.$message.error("获取仓库列表失败，请稍后重试");
                    }
                })
                .finally(() => {
                    if (!this._isDestroyed) {
                        this.loadingWarehouses = false;
                    }
                });
        },

        onRemoteSearchWarehouse: debounce(function (query = "") {
            const searchQuery = (query || "").trim();
            if (searchQuery === this.lastWarehouseQuery) return;
            this.lastWarehouseQuery = searchQuery;
            this.loadGetWarehouses(searchQuery);
        }, 200),

        // 物品相关方法
        loadGetItems(query = "") {
            // 清空当前结果
            this.items = [];
            if (this.loadingItems) return;

            this.loadingItems = true;
            const params = {
                limit: 20,
                ...(query && { name: query }), // 仅当有搜索词时才传递搜索参数
            };

            GetItems(params)
                .then((res) => {
                    if (!this._isDestroyed) {
                        this.items = res.payload?.items || [];
                    }
                })
                .catch((err) => {
                    console.error("获取物品失败:", err);
                    if (!this._isDestroyed) {
                        this.items = [];
                        this.$message.error("获取物品失败");
                    }
                })
                .finally(() => {
                    if (!this._isDestroyed) this.loadingItems = false;
                });
        },

        onRemoteSearchItem: debounce(function (query) {
            const searchQuery = (query || "").trim();

            // 如果没有输入内容，不执行搜索并清空结果
            if (!searchQuery) {
                this.lastItemQuery = "";
                return;
            }

            // 只有当搜索词有变化时才执行新的搜索
            if (searchQuery === this.lastItemQuery) return;

            this.lastItemQuery = searchQuery;
            this.loadGetItems(searchQuery);
        }, 200),

        onCleanItemList() {
            this.items = [];
        },

        onRefresh() {
            this.page = 1;
            this.loadGetStockSummary(this.pageSize, this.page);
        },

        onSearch() {
            this.page = 1;
            this.loadGetStockSummary(this.pageSize, this.page);
        },

        // 初始化默认日期范围（今天）
        initDefaultDateRange() {
            const today = new Date(); // 今天的日期

            // 格式化日期为YYYYMMDD（提交格式）
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            const todayStr = `${year}${month}${day}`;

            // 开始和结束日期都设为今天
            this.dateRange = [todayStr, todayStr];
            this.query.from = todayStr;
            this.query.to = todayStr;
        },

        // 导出CSV功能实现
        exportToCSV() {
            // 如果没有数据，直接提示
            if (!this.summary || this.summary.length === 0) {
                this.$message.warning(msgcon("没有可导出的数据"));
                return;
            }

            // 检查日期范围是否完整
            if (!this.query.from || !this.query.to) {
                this.$message.warning(msgcon("请选择完整的日期范围"));
                return;
            }

            this.exporting = true;

            try {
                // 1. 准备表头
                const headers = ["SKU", "物品", "累计入库总量", "累计出库总量", "库存净变化", "原始入库量", "入库红冲量", "原始出库量", "出库红冲量"];

                // 2. 准备数据行
                const dataRows = this.summary.map((item) => [
                    item.item?.sku || "",
                    item.item?.name || "",
                    item.total_inbound_qty || 0,
                    item.total_outbound_qty || 0,
                    item.net_inventory_change || 0,
                    item.original_inbound_qty || 0,
                    item.inbound_reversal_qty || 0,
                    item.original_outbound_qty || 0,
                    item.outbound_reversal_qty || 0,
                ]);

                // 3. 组合表头和数据
                const csvData = [headers, ...dataRows];

                // 4. 转换为CSV格式
                const csvContent = this.convertToCSV(csvData);

                // 5. 触发下载
                this.downloadCSV(csvContent);

                this.$message.success(msgcon("数据导出成功"));
            } catch (error) {
                console.error("导出CSV失败:", error);
                this.$message.error(msgcon("导出失败，请稍后重试"));
            } finally {
                this.exporting = false;
            }
        },

        // 转换数据为CSV格式，修复前置零丢失问题
        convertToCSV(data) {
            // 添加BOM头以支持UTF-8编码的中文
            const bom = "\uFEFF";

            return (
                bom +
                data
                    .map((row, rowIndex) => {
                        // 跳过表头行
                        if (rowIndex === 0) {
                            return row.map((cell) => this.escapeCSVCell(cell)).join(",");
                        }

                        // 处理数据行，第0列是SKU，需要保留前置零
                        return row
                            .map((cell, colIndex) => {
                                // 对SKU列(第0列)添加制表符前缀，强制Excel识别为文本
                                if (colIndex === 0) {
                                    return `\t${this.escapeCSVCell(cell)}`;
                                }
                                return this.escapeCSVCell(cell);
                            })
                            .join(",");
                    })
                    .join("\n")
            );
        },

        // 单独的CSV单元格转义处理函数
        escapeCSVCell(cell) {
            // 转换为字符串处理
            const cellStr = cell.toString().trim();

            // 处理包含逗号、引号或换行符的单元格
            if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
                // 替换双引号为两个双引号
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        },

        // 下载CSV文件
        downloadCSV(content) {
            // 创建Blob对象
            const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            // 创建下载链接
            const a = document.createElement("a");
            a.href = url;

            // 生成包含日期范围的文件名
            const startDate = this.formatDateForFilename(this.query.from);
            const endDate = this.formatDateForFilename(this.query.to);
            a.download = `自定义汇总_${startDate}_至_${endDate}.csv`;

            // 触发下载
            document.body.appendChild(a);
            a.click();

            // 清理
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        // 格式化日期用于文件名（YYYYMMDD -> YYYY-MM-DD）
        formatDateForFilename(dateStr) {
            if (!dateStr || dateStr.length !== 8) return dateStr;
            return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        },
    },
    created() {
        this.$globalBus.emit("updateActivePath", "/overview/custom");
        this.initDefaultDateRange(); // 初始化今天的日期范围
        this.loadGetWarehouses();
        this.loadGetStockSummary();
    },
};
</script>

<style scoped></style>
