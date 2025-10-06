<template>
    <div class="settings-container">
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>年度汇总</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </div>
                    <div>
                        <el-space>
                            <el-date-picker v-model="pickerdata" type="year" placeholder="选择年份" @change="onChangeYear" />
                            <el-select
                                clearable
                                v-model="query.warehouses.id"
                                placeholder="选择仓库"
                                style="width: 240px"
                                @change="onRefresh"
                                filterable
                                remote
                                :remote-method="onRemoteSearchWarehouse">
                                <el-option v-for="item in warehouses" :key="item.id" :label="item.name" :value="item.id" />
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
            <!-- <el-table :data="summary" style="width: 100%" v-loading="loading">
                <el-table-column prop="item.sku" label="SKU" width="180" />
                <el-table-column label="物品" width="180">
                    <template #default="scope"> {{ scope.row.item.name }}/{{ scope.row.item.property }}/{{ scope.row.item.specification }} </template>
                </el-table-column>
                <el-table-column prop="total_inbound_qty" label="累计入库总量" width="180" />
                <el-table-column prop="total_outbound_qty" label="累计出库总量" />
                <el-table-column prop="net_inventory_change" label="库存净变化" />
                <el-table-column prop="original_inbound_qty" label="原始入库量" />
                <el-table-column prop="inbound_reversal_qty" label="入库红冲量" />
                <el-table-column prop="original_outbound_qty" label="原始出库量" />
                <el-table-column prop="outbound_reversal_qty" label="出库红冲量" />
            </el-table> -->
            <MyTable :data="summary" :columns="columns" v-loading="loading">
                <template #item="{ row }">
                    <span> {{ row.item.name }}/{{ row.item.property }}/{{ row.item.specification }} </span>
                </template>
            </MyTable>
            <div class="pagination" style="margin-top: 15px; text-align: right">
                <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
            </div>
        </el-card>
    </div>
</template>

<script>
import MyTable from "../../components/MyTable/MyTable.vue";
import { debounce } from "lodash-es";
import { msgcon } from "../../utils/message.js";
import { Refresh, Search, Download } from "@element-plus/icons-vue";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { GetStockSummary, GetWarehouses, GetItems } from "../../api/index.js";
import pagination from "../../components/pagination/pagination.vue";

export default {
    name: "YearCollect",
    components: {
        pagination,
        MyTable, // 注册分页组件
    },
    props: {},
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
            pickerdata: new Date(), // 初始化时为当前年份
            query: {
                pt: "year", // 周期类型为年度
                year: "", // 年度参数，初始化时自动填充
                warehouses: {
                    id: "",
                },
                item: {
                    id: "",
                },
            },
            columns: [
                { label: "SKU", prop: "item.sku" },
                { label: "物品", slot: "item" },
                { label: "累计入库总量", prop: "total_inbound_qty" },
                { label: "累计出库总量", prop: "total_outbound_qty" },
                { label: "库存净变化", prop: "net_inventory_change" },
                { label: "原始入库量", prop: "original_inbound_qty" },
                { label: "入库红冲量", prop: "inbound_reversal_qty" },
                { label: "原始出库量", prop: "original_outbound_qty" },
                { label: "出库红冲量", prop: "outbound_reversal_qty" },
            ],
        };
    },
    methods: {
        // 处理年份选择变化
        onChangeYear() {
            if (!this.pickerdata) return; // 防止日期为空

            // 仅获取年份
            const year = this.pickerdata.getFullYear();
            this.query.year = year.toString();

            // 触发查询
            this.loadGetStockSummary();
        },
        // 分页当前页变化
        onCurrentChange(p) {
            this.page = p;
            this.loadGetStockSummary(this.pageSize, p);
        },
        // 分页大小变化
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadGetStockSummary(s, 1);
        },
        // 加载库存汇总数据
        loadGetStockSummary(page_size = 10, page = 1) {
            this.loading = true;
            // 转换分页参数
            const { limit, offset } = convertToLimitOffset(page, page_size);
            // 构建查询参数
            const params = {
                pt: this.query.pt, // 周期类型：year
                year: this.query.year, // 年度参数
                limit,
                offset,
                // 仓库筛选（可选）
                ...(this.query.warehouses.id && { warehouse_id: this.query.warehouses.id }),
                // 物品筛选（可选）
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
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        // 获取仓库列表
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
        // 仓库远程搜索（防抖处理）
        onRemoteSearchWarehouse: debounce(function (query = "") {
            const searchQuery = (query || "").trim();
            if (searchQuery === this.lastWarehouseQuery) return;
            this.lastWarehouseQuery = searchQuery;
            this.loadGetWarehouses(searchQuery);
        }, 200),
        // 物品搜索逻辑
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
        // 物品远程搜索（防抖处理）
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
        // 清空物品列表
        onCleanItemList() {
            this.items = [];
        },
        // 刷新页面数据
        onRefresh() {
            this.page = 1; // 重置到第一页
            this.loadGetStockSummary(this.pageSize, this.page);
        },
        // 搜索处理
        onSearch() {
            this.page = 1; // 搜索时重置到第一页
            this.loadGetStockSummary(this.pageSize, this.page);
        },
        // 初始化年份参数
        initYearParams() {
            const now = new Date();
            this.query.year = now.getFullYear().toString();
        },

        // 导出CSV功能实现
        exportToCSV() {
            // 如果没有数据，直接提示
            if (!this.summary || this.summary.length === 0) {
                this.$message.warning(msgcon("没有可导出的数据"));
                return;
            }

            // 检查年份是否已选择
            if (!this.query.year) {
                this.$message.warning(msgcon("请选择年份"));
                return;
            }

            this.exporting = true;

            try {
                // 1. 准备表头
                const headers = [
                    "SKU",
                    "物品",
                    "属性",
                    "规格",
                    "累计入库总量",
                    "累计出库总量",
                    "库存净变化",
                    "原始入库量",
                    "入库红冲量",
                    "原始出库量",
                    "出库红冲量",
                ];

                // 2. 准备数据行
                const dataRows = this.summary.map((item) => [
                    item.item?.sku || "",
                    item.item?.name || "",
                    item.item?.property || "",
                    item.item?.specification || "",
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

            // 生成包含年份的文件名
            a.download = `年度汇总_${this.query.year}.csv`;

            // 触发下载
            document.body.appendChild(a);
            a.click();

            // 清理
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
    },
    created() {
        this.$globalBus.emit("updateActivePath", "/overview/year");
        // 1. 初始化年份参数
        this.initYearParams();
        // 2. 加载仓库列表
        this.loadGetWarehouses();
        // 3. 加载本年度数据
        this.loadGetStockSummary();
    },
};
</script>

<style scoped>
table {
    width: 100%;
    border-collapse: collapse; /* 合并边框 */
    font-family: Arial, sans-serif;
}

/* 表头样式 */
th {
    font-weight: bold;
}

/* 表头和单元格通用样式 */
th,
td {
    padding: 12px 15px;
    text-align: left;
    border: none; /* 去除所有边框 */
    border-bottom: 1px solid #ddd; /* 仅保留底部横线 */
}

/* 鼠标悬停效果 */
tr:hover {
    background-color: #f5f7fa; /* 灰色背景 */
}
</style>
