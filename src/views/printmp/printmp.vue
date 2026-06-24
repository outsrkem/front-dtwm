<!-- 出入库单据打印 -->
<template>
    <div style="margin-bottom: 50px">
        <!-- 固定顶部的横条 -->
        <div class="print-header">
            <el-space>
                <button @click="goBack()">返回</button>
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

                    <div style="margin: 20px 0 5px; display: flex; justify-content: space-between">
                        <div style="display: flex; flex-direction: column; justify-content: flex-end">
                            <div style="display: flex; align-items: flex-end">
                                <p>提交人：{{ stockorder.owner.username }}</p>
                                <p style="margin-left: 15px">提交时间：{{ formatDate(stockorder.create_time) }}</p>
                            </div>

                            <div style="display: flex; align-items: flex-end; margin-top: 5px">
                                <p>{{ stockorder.type === "OUT" ? "领用单位" : "供应商" }}：{{ stockorder.supplier.name }}</p>
                            </div>

                            <div style="display: flex; align-items: flex-end; margin-top: 5px">
                                <p>单据编号：{{ stockorder.serial }}</p>
                                <p style="margin-left: 15px">状态：{{ getStatusConfig(stockorder.status).label }}</p>
                                <p style="margin-left: 15px">
                                    {{ currentTheme.statusText.name }}
                                    <!-- 当状态为 EXECUTED 或 COMPLETED 时显示实际日期 -->
                                    <span v-if="['EXECUTED', 'COMPLETED'].includes(stockorder.status)">
                                        {{ formatDate(stockorder.operation_time, "YYYY-MM-DD") }}
                                    </span>
                                    <!-- 其他状态显示固定文本 -->
                                    <span v-else>{{ currentTheme.statusText.pending }}</span>
                                </p>
                            </div>
                        </div>
                        <div>
                            <SvgQrcode :content="stockorder.serial" :size="85" :padding="2" />
                        </div>
                    </div>

                    <!-- 摘要信息 -->
                    <table>
                        <thead>
                            <tr>
                                <th style="padding: 8px 12px">仓库名称</th>
                                <th style="padding: 8px 12px">仓库地址</th>
                                <th style="padding: 8px 12px">{{ currentTheme.table.title.type }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="text-align: center">{{ stockorder.warehouse.name }}</td>
                                <td style="text-align: center">{{ stockorder.warehouse.location }}</td>
                                <td style="text-align: center">{{ stockorder.classification.name }}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- 出入库明细表格 -->
                    <div>
                        <br style="margin-top: 10px" />
                        <table>
                            <thead>
                                <tr>
                                    <th colspan="6" style="padding: 8px 12px">{{ currentTheme.table.title.details }}</th>
                                </tr>
                                <tr>
                                    <th style="padding: 8px 12px">No.</th>
                                    <th style="padding: 8px 12px">物品名称</th>
                                    <th style="padding: 8px 12px">属性</th>
                                    <th style="padding: 8px 12px">规格</th>
                                    <th style="padding: 8px 12px">单位</th>
                                    <th style="padding: 8px 12px">{{ currentTheme.table.column.quantity }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(val, inx) in OrderDetails" :key="inx">
                                    <td style="text-align: center">{{ inx + 1 }}</td>
                                    <td style="text-align: center">{{ itemName(val) }}</td>
                                    <td style="text-align: center">{{ val.item.property }}</td>
                                    <td style="text-align: center">{{ val.item.specification }}</td>
                                    <td style="text-align: center">{{ val.item.unit }}</td>
                                    <td style="text-align: center">{{ val.detailedly.quantity }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <!-- 备注 -->
                    <div style="margin: 5px 0 5px">
                        <p>备注：{{ stockorder.remark ? stockorder.remark : "无" }}</p>
                    </div>
                    <!-- 签字区域 -->
                    <div style="margin-right: 20px" v-if="printTheme.signature.enabled">
                        <div style="display: flex; flex-direction: column; align-items: flex-end; width: 100%">
                            <span v-for="val in printTheme.signature.items">
                                <span v-if="val.required">
                                    <p style="padding-top: 35px">{{ val.label }}：______________________</p>
                                </span>
                            </span>
                        </div>
                    </div>
                    <!-- 签字区域 -->
                </div>
            </div>
            <!-- 打印内容区域 -->
        </div>
    </div>
</template>
<script>
import dayjs from "dayjs";
import { msgcon } from "../../utils/message.js";
import SvgQrcode from "../../components//SvgQrcode/SvgQrcode.vue";
import { formatTime } from "../../utils/date.js";
import { withDelay } from "../../utils/common.js";
import { getStatusConfig } from "../../utils/status.js";
import { printTheme } from "../../utils/theme.js";
import { GetOrderDetails, GetParticulars, GetPrintTheme } from "../../api/index.js";
export default {
    name: "PrintPageIndex",
    components: { SvgQrcode },
    props: {},
    data() {
        return {
            dayjs,
            getStatusConfig,
            loading: false,
            // 统一的静态展示文本
            theme: {
                in: {
                    statusText: {
                        name: "入库日期：",
                        pending: "待入库", // 入库场景的待处理文本
                    },
                    table: {
                        title: {
                            type: "入库类型",
                            details: "入库明细",
                        },
                        column: {
                            quantity: "入库数目",
                        },
                    },
                },
                out: {
                    statusText: {
                        name: "出库日期：",
                        pending: "待出库", // 出库场景的待处理文本
                    },
                    table: {
                        title: {
                            type: "出库类型",
                            details: "出库明细",
                        },
                        column: {
                            quantity: "出库数目",
                        },
                    },
                },
            },
            // 当前使用的主题（根据类型动态切换）
            currentTheme: {
                statusText: { name: "", pending: "" },
                table: { title: { type: "", details: "" }, column: { quantity: "" } },
            },
            // 分仓库的打印配置参数文本
            printTheme: printTheme(),
            stockorder: {
                warehouse: {
                    name: "",
                    location: "",
                },
                classification: {
                    name: "",
                },
                owner: {
                    username: "",
                },
                supplier: {
                    name: "",
                },
                serial: "",
            }, // 单据信息
            OrderDetails: [],
            query: {
                type: "",
                serial: "",
                order_id: "",
                warehouse_id: "",
            },
            resTime: null,
        };
    },
    computed: {},
    methods: {
        formatDate(time, format = "YYYY-MM-DD HH:mm:ss") {
            return formatTime(time).format(format);
        },
        itemName(val) {
            if (val.detailedly.correct_type === "ORIGINAL") {
                return val.item.name;
            }
            if (val.detailedly.correct_type === "REVERSAL") {
                if (val.detailedly.status === "PENDING") {
                    return val.item.name + "（红冲修正,待审核）";
                }
                if (val.detailedly.status === "COMPLETED") {
                    return val.item.name + "（红冲修正,已完成）";
                }
                if (val.detailedly.status === "REJECTED") {
                    return val.item.name + "（红冲修正,已拒绝）";
                }
                if (val.detailedly.status === "APPROVED") {
                    return val.item.name + "（红冲修正,已执行）";
                }
            }
        },
        isTimestampOver(timestamp, timeThreshold = 1) {
            // 判断毫秒时间戳是否超过当前时间指定分钟数，超过返回true
            return dayjs().diff(dayjs(timestamp), "minute") > timeThreshold;
        },
        eprint() {
            this.loading = true;
        },
        goBack() {
            // 按来源类型返回对应的页
            if (this.query.type === "IN") this.$router.push({ name: "stockin" });
            if (this.query.type === "OUT") this.$router.push({ name: "stockout" });
        },
        // 跳转打印配置页面
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
                // 如果数据时1分钟前加载的，就拒绝打印
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
        loadSelectStockOrder: function (id) {
            withDelay(() => GetOrderDetails({ order_id: id }))
                .then((res) => {
                    this.resTime = res.metadata.time;
                    this.stockorder = res.payload;
                    this.currentTheme = this.stockorder.type === "IN" ? this.theme.in : this.theme.out;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        loadOrderDetails(id) {
            this.loading = true;
            const params = { oid: id, offset: 0, limit: 100 };
            withDelay(() => GetParticulars(params))
                .then((res) => {
                    this.OrderDetails = res.payload.items || [];
                    // this.pageTotal = res.payload.page_info.total;
                })
                .catch(() => {
                    this.OrderDetails = [];
                });
        },
        // 获取打印主题
        loadGetPrintTheme: function (warehouse_id) {
            const paths = { warehouse_id: warehouse_id };
            GetPrintTheme(paths)
                .then((res) => {
                    if (this.query.type === "IN") {
                        this.printTheme = res.payload.theme.in;
                        return;
                    }
                    if (this.query.type === "OUT") {
                        this.printTheme = res.payload.theme.out;
                        return;
                    }
                    this.printTheme = printTheme(); // 兜底
                })
                .catch(() => {
                    this.printTheme = printTheme(); // 兜底
                });
        },
        onRefresh() {
            this.loadGetPrintTheme(this.query.warehouse_id);
            this.loadSelectStockOrder(this.query.order_id);
            this.loadOrderDetails(this.query.order_id);
        },
    },
    created() {
        // 保存参数
        this.query.type = this.$route.query._type;
        this.query.warehouse_id = this.$route.query.warehouse_id;
        this.query.order_id = this.$route.query.order_id;
        // 加载请求
        this.loadGetPrintTheme(this.query.warehouse_id);
        this.loadSelectStockOrder(this.query.order_id);
        this.loadOrderDetails(this.query.order_id);
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

/* 主容器：添加顶部内边距 = 横条高度，避免内容被遮挡 */
.print-container {
    margin-top: 10px;
    min-width: 1024px;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    /* 横条高度(10px上下padding + 34px内容高度)，按需微调 */
    padding-top: 54px;
}

/* 顶部横条：固定定位 + 全屏宽度 */
.print-header {
    position: fixed; /* 核心：固定在顶部 */
    top: 0;
    left: 0;
    right: 0;
    /* 确保在最上层，不被其他内容遮挡 */
    z-index: 999;
    background-color: #f5f5f5;
    padding: 10px 15mm;
    box-sizing: border-box;
    border-bottom: 1px solid #ddd; /* 底部边框区分横条与内容 */
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

/* 内容容器 */
.print-content-wrapper {
    /* 上边距，防止打印出来太靠顶 */
    margin-top: 30px;
    display: flex;
    justify-content: center;
    width: 100%;
}

/* A4页面样式 */
.pdf-page {
    /* border: 1px solid #ddd; */
    width: 210mm;
    box-sizing: border-box;
    position: relative;
    background-color: white;
}

/* 打印样式：固定横条依然隐藏，不影响打印内容 */
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
