<!-- 聚合源报表打印 -->
<template>
    <div style="margin-bottom: 50px">
        <!-- 固定顶部的横条 -->
        <div class="print-header">
            <div class="reminder" style="display: flex; align-items: center; margin-right: 20px">
                <p>点击入库或出库按钮选择打印主题</p>
                <p>，点击设置按钮进行出入库打印主题设置</p>
            </div>
            <el-space>
                <button @click="goBack()">返回</button>
                <button @click="onSetInTheme()">入库</button>
                <button @click="onSetOutTheme()">出库</button>
                <button @click="onSetPrintCfg()">设置</button>
                <button @click="onRefresh()">刷新</button>
                <button @click="handlePrint()">打印</button>
            </el-space>
        </div>

        <!-- 主容器：添加顶部内边距，避免内容被固定横条遮挡 -->
        <div class="print-container" v-loading="loading" style="min-height: 500px">
            <!-- 打印内容区域 -->
            <div class="print-content-wrapper" v-show="!loading">
                <div class="print-template pdf-page" style="padding: 5px">
                    <!-- 主标题：根据类型切换 -->
                    <div class="head-title">
                        <p class="main-title">{{ printTheme.title.main }}</p>
                        <p class="sub-title">{{ printTheme.title.sub }}</p>
                    </div>

                    <div style="margin: 30px 0 5px; display: flex; justify-content: space-between">
                        <div style="display: flex; flex-direction: column; justify-content: flex-end">
                            <div style="display: flex; align-items: flex-end">
                                <p>多单据汇聚数据</p>
                            </div>
                        </div>
                    </div>

                    <!-- 摘要信息 -->
                    <table>
                        <thead>
                            <tr>
                                <th style="padding: 8px 12px">仓库名称</th>
                                <th style="padding: 8px 12px">仓库地址</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="text-align: center">{{ warehouse.name }}</td>
                                <td style="text-align: center">{{ warehouse.location }}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- 汇总统计信息 -->
                    <div style="margin-top: 10px">
                        <table>
                            <thead>
                                <tr>
                                    <th style="padding: 8px 12px">总单据数</th>
                                    <th style="padding: 8px 12px">入库单数</th>
                                    <th style="padding: 8px 12px">出库单数</th>
                                    <th style="padding: 8px 12px">有效单据数</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="text-align: center">{{ aggregateData.summary.total }}</td>
                                    <td style="text-align: center">{{ aggregateData.summary.in }}</td>
                                    <td style="text-align: center">{{ aggregateData.summary.out }}</td>
                                    <td style="text-align: center">{{ aggregateData.summary.valid }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- 出入库明细表格 -->
                    <div>
                        <br style="margin-top: 10px" />
                        <table>
                            <thead>
                                <tr>
                                    <th colspan="7" style="padding: 8px 12px">入库明细</th>
                                </tr>
                                <tr>
                                    <th style="padding: 8px 12px">No.</th>
                                    <th style="padding: 8px 12px">物品名称</th>
                                    <th style="padding: 8px 12px">规格</th>
                                    <th style="padding: 8px 12px">单位</th>
                                    <th style="padding: 8px 12px">原始数量</th>
                                    <th style="padding: 8px 12px">红冲</th>
                                    <th style="padding: 8px 12px">总计</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(val, inx) in filteredInItems" :key="'in_' + inx">
                                    <td style="text-align: center">{{ inx + 1 }}</td>
                                    <td style="text-align: center">{{ val.item.name }}</td>
                                    <td style="text-align: center">{{ val.item.specification }}</td>
                                    <td style="text-align: center">{{ val.item.unit }}</td>
                                    <td style="text-align: center">{{ val.in_total.original }}</td>
                                    <td style="text-align: center">{{ val.in_total.reversal }}</td>
                                    <td style="text-align: center">{{ val.in_total.total }}</td>
                                </tr>
                                <tr v-if="filteredInItems.length === 0">
                                    <td colspan="7" style="text-align: center">无入库数据</td>
                                </tr>
                            </tbody>
                        </table>

                        <br style="margin-top: 10px" />
                        <table>
                            <thead>
                                <tr>
                                    <th colspan="7" style="padding: 8px 12px">出库明细</th>
                                </tr>
                                <tr>
                                    <th style="padding: 8px 12px">No.</th>
                                    <th style="padding: 8px 12px">物品名称</th>
                                    <th style="padding: 8px 12px">规格</th>
                                    <th style="padding: 8px 12px">单位</th>
                                    <th style="padding: 8px 12px">原始数量</th>
                                    <th style="padding: 8px 12px">红冲</th>
                                    <th style="padding: 8px 12px">总计</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(val, inx) in filteredOutItems" :key="'out_' + inx">
                                    <td style="text-align: center">{{ inx + 1 }}</td>
                                    <td style="text-align: center">{{ val.item.name }}</td>
                                    <td style="text-align: center">{{ val.item.specification }}</td>
                                    <td style="text-align: center">{{ val.item.unit }}</td>
                                    <td style="text-align: center">{{ val.out_total.original }}</td>
                                    <td style="text-align: center">{{ val.out_total.reversal }}</td>
                                    <td style="text-align: center">{{ val.out_total.total }}</td>
                                </tr>
                                <tr v-if="filteredOutItems.length === 0">
                                    <td colspan="7" style="text-align: center">无出库数据</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style="margin: 15px 0 10px">
                        <p class="serial-content">汇聚单据：{{ formatSerialList(aggregateData.summary.serial) }}</p>
                    </div>

                    <div style="margin-right: 20px" v-if="printTheme.signature.enabled">
                        <div style="display: flex; flex-direction: column; align-items: flex-end; width: 100%">
                            <span v-for="(val, index) in printTheme.signature.items" :key="index">
                                <span v-if="val.required">
                                    <p style="padding-top: 35px">{{ val.label }}：______________________</p>
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import dayjs from "dayjs";
import { msgcon } from "../../utils/message.js";
import { withDelay } from "../../utils/common.js";
import { printTheme } from "../../utils/theme.js";
import { GetWarehouseByID, OrderAggregateCache, GetParticulars, GetPrintTheme } from "../../api/index.js";
export default {
    name: "PrintPageIndex",
    props: {},
    data() {
        return {
            loading: false,
            warehouse: {},
            printTheme: printTheme(),
            OrderDetails: [],
            aggregateData: {
                items: [],
                summary: {
                    total: 0,
                    in: 0,
                    out: 0,
                    valid: 0,
                    serial: [],
                },
            },
            query: {
                type: "",
                aggregate_id: "",
                warehouse_id: "",
            },
            resTime: null,
        };
    },
    computed: {
        filteredInItems() {
            return this.aggregateData.items.filter((item) => {
                const original = Number(item.in_total.original);
                const reversal = Number(item.in_total.reversal);
                const total = Number(item.in_total.total);
                return original !== 0 || reversal !== 0 || total !== 0;
            });
        },
        filteredOutItems() {
            return this.aggregateData.items.filter((item) => {
                const original = Number(item.out_total.original);
                const reversal = Number(item.out_total.reversal);
                const total = Number(item.out_total.total);
                return original !== 0 || reversal !== 0 || total !== 0;
            });
        },
    },
    methods: {
        formatSerialList(serialList) {
            if (!Array.isArray(serialList) || serialList.length === 0) {
                return "无单据";
            }
            return serialList.filter((serial) => serial && serial.trim() !== "").join("; ");
        },

        isTimestampOver(timestamp, timeThreshold = 1) {
            return dayjs().diff(dayjs(timestamp), "minute") > timeThreshold;
        },
        goBack() {
            this.$router.push({ name: "orderAggregate" });
        },
        onSetPrintCfg() {
            this.$router.push({
                name: "warehousePrintTheme",
                query: {
                    warehouse_id: this.query.warehouse_id,
                    _s: this.$route.fullPath,
                },
            });
        },
        handlePrint() {
            if (this.isTimestampOver(this.resTime, 1)) {
                this.$message.warning(msgcon("当前数据已超时，请刷新后再打印"));
                return;
            }
            setTimeout(() => {
                const afterPrint = () => {
                    window.removeEventListener("afterprint", afterPrint);
                };
                window.addEventListener("afterprint", afterPrint);
                window.print();
            }, 100);
        },
        loadSelectStockOrder() {
            const paths = { aggregate_id: this.query.aggregate_id };
            withDelay(() => OrderAggregateCache(paths))
                .then((res) => {
                    this.resTime = res.metadata.time;
                    this.aggregateData = res.payload;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        loadOrderDetails() {
            this.loading = true;
            const params = { oid: this.query.order_id, offset: 0, limit: 100 };
            withDelay(() => GetParticulars(params))
                .then((res) => {
                    this.OrderDetails = res.payload.items || [];
                })
                .catch(() => {
                    this.OrderDetails = [];
                });
        },
        onSetInTheme() {
            this.query.type = "IN";
            this.updateUrlWithType("IN");
            this.onRefresh();
        },
        onSetOutTheme() {
            this.query.type = "OUT";
            this.updateUrlWithType("OUT");
            this.onRefresh();
        },
        updateUrlWithType(type) {
            const query = { ...this.$route.query };
            query._type = type;
            this.$router.push({ name: this.$route.name, query: query }, () => {});
        },
        loadGetPrintTheme() {
            const paths = { warehouse_id: this.query.warehouse_id };
            GetPrintTheme(paths)
                .then((res) => {
                    if (this.query.type === "IN") {
                        this.printTheme = res.payload.theme.in;
                    } else if (this.query.type === "OUT") {
                        this.printTheme = res.payload.theme.out;
                    } else {
                        this.printTheme = printTheme();
                    }
                })
                .catch(() => {
                    this.printTheme = printTheme();
                });
        },
        loadGetWarehouseByID() {
            const paths = { warehouse_id: this.query.warehouse_id };
            GetWarehouseByID(paths).then((res) => {
                this.warehouse = res.payload.warehouse;
            });
        },
        onRefresh() {
            this.loadGetPrintTheme();
            this.loadSelectStockOrder();
            this.loadOrderDetails();
        },
    },
    created() {
        // 关键修复：添加延迟确保DOM渲染完成
        setTimeout(() => {
            this.query.type = this.$route.query._type;
            this.query.warehouse_id = this.$route.query.warehouse_id;
            this.query.aggregate_id = this.$route.query.aggregate_id;
            this.loadGetWarehouseByID();
            this.loadGetPrintTheme();
            this.loadSelectStockOrder();
            this.loadOrderDetails();
        }, 50);
    },
};
</script>

<style scoped>
.head-title {
    p {
        text-align: center;
    }
    .main-title {
        font-size: 20px;
        text-align: center;
        font-weight: bold;
    }
    .sub-title {
        font-size: 15px;
        margin: 0;
        margin-top: 5px;
    }
}

p {
    font-size: 14px;
    margin: 0px;
}

.serial-content {
    margin-bottom: 5px;
    width: 100%;
    word-wrap: break-word;
    word-break: break-all;
    white-space: normal;
    line-height: 1.5;
}

th,
td {
    border: 1px solid black;
    text-align: center;
}
table {
    width: 100%;
    border-collapse: collapse;
    font-family: Arial, sans-serif;
    font-size: 14px;
}

td {
    padding: 8px 12px;
    text-align: left;
}

.print-container {
    margin-top: 10px;
    min-width: 1024px;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 54px;
}

.print-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
    background-color: #f5f5f5;
    padding: 10px 15mm;
    box-sizing: border-box;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: flex-end;
}

.print-header button {
    padding: 8px 16px;
    background-color: #42b983;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.print-header button:hover {
    background-color: #359e75;
}

.print-content-wrapper {
    margin-top: 30px;
    display: flex;
    justify-content: center;
    width: 100%;
}

.pdf-page {
    width: 210mm;
    box-sizing: border-box;
    position: relative;
    background-color: white;
}

.reminder {
    width: auto;
    padding-left: 10px;
    padding-right: 10px;
    border: 1px solid #ffb300e8;
    background-color: #fff3cd;
    border-radius: 5px;
    p {
        margin: 2px 0 2px;
        font-size: 14px;
        color: mediumblue;
    }
}

@media print {
    .print-header {
        display: none !important;
    }
    .print-container {
        padding: 0;
        margin: 0;
        background-color: white;
    }
    .print-template {
        width: 100%;
        height: 100%;
    }
    .pdf-page {
        border: none;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        box-shadow: none;
    }
}
</style>
