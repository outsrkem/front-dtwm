<template>
    <div>
        <!-- 固定顶部的横条 -->
        <div class="print-header">
            <el-space>
                <button @click="goBack()">返回</button>
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
                        <p>{{ currentTheme.title.main }}</p>
                    </div>

                    <div style="margin-bottom: 5px; display: flex; justify-content: space-between">
                        <div style="display: flex; flex-direction: column; justify-content: flex-end">
                            <div style="display: flex; align-items: flex-end">
                                <p>提交人：{{ stockorder.owner.username }}</p>
                                <p style="margin-left: 15px">提交时间：{{ formatDate(stockorder.create_time) }}</p>
                            </div>
                            <!-- <div style="display: flex; align-items: flex-end; margin-top: 5px">
                                <p>供应商：{{ stockorder.serial }}</p>
                            </div> -->
                            <div style="display: flex; align-items: flex-end; margin-top: 5px">
                                <p>单据编号：{{ stockorder.serial }}</p>
                                <p style="margin-left: 15px">状态：{{ getStatusConfig(stockorder.status).label }}</p>
                                <p style="margin-left: 15px">
                                    出库日期：
                                    <!-- 当状态为 EXECUTED 或 COMPLETED 时显示实际日期 -->
                                    <span v-if="['EXECUTED', 'COMPLETED'].includes(stockorder.status)">
                                        {{ dayjs(stockorder.update_time).format("YYYY-MM-DD") }}
                                    </span>
                                    <!-- 其他状态显示固定文本 -->
                                    <span v-else>{{ currentTheme.statusText.pending }}</span>
                                </p>
                            </div>
                        </div>
                        <div>
                            <vue-qr :text="stockorder.serial" :correctLevel="1" :size="100" :margin="8"></vue-qr>
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
                                    <th colspan="5" style="padding: 8px 12px">{{ currentTheme.table.title.details }}</th>
                                </tr>
                                <tr>
                                    <th style="padding: 8px 12px">No.</th>
                                    <th style="padding: 8px 12px">物品名称</th>
                                    <th style="padding: 8px 12px">单位</th>
                                    <th style="padding: 8px 12px">规格</th>
                                    <th style="padding: 8px 12px">{{ currentTheme.table.column.quantity }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(val, inx) in OrderDetails" :key="inx">
                                    <td style="text-align: center">{{ inx + 1 }}</td>
                                    <td style="text-align: center">{{ val.item.name }}</td>
                                    <td style="text-align: center">{{ val.item.unit }}</td>
                                    <td style="text-align: center">{{ val.item.specification }}</td>
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
                    <div style="margin-right: 20px">
                        <div style="display: flex; flex-direction: column; align-items: flex-end; width: 100%">
                            <p style="padding-top: 30px">{{ currentTheme.signature.keeper }}：______________________</p>
                            <p style="padding-top: 30px">{{ currentTheme.signature.receiver }}：______________________</p>
                            <p style="padding-top: 30px">{{ currentTheme.signature.safetyOfficer }}：______________________</p>
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
import vueQr from "vue-qr/src/packages/vue-qr.vue";
import { formatTime } from "../../utils/date.js";
import { withDelay } from "../../utils/common.js";
import { getStatusConfig } from "../../utils/status.js";
import { SelectStockOrder, GetParticulars } from "../../api/index.js";
export default {
    name: "PrintPageIndex",
    components: { vueQr },
    props: {},
    data() {
        return {
            dayjs,
            getStatusConfig,
            loading: false,
            theme: {
                in: {
                    title: {
                        main: "康县阳坝镇中心小学食堂原材料入库记录表",
                    },
                    statusText: {
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
                    signature: {
                        keeper: "库管员",
                        receiver: "送货人", // 入库场景为"送货人"
                        safetyOfficer: "食品卫生安全员",
                    },
                },
                out: {
                    title: {
                        main: "康县阳坝镇中心小学食堂原材料出库记录表",
                    },
                    statusText: {
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
                    signature: {
                        keeper: "库管员",
                        receiver: "领用人", // 出库场景为"领用人"
                        safetyOfficer: "食品卫生安全员",
                    },
                },
            },
            // 当前使用的主题（根据类型动态切换）
            currentTheme: {
                title: { main: "" },
                table: { title: { type: "", details: "" }, column: { quantity: "" } },
                signature: { keeper: "", receiver: "", safetyOfficer: "" },
            },
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
                serial: "",
            }, // 单据信息
            OrderDetails: [],
            query: {
                serial: "",
                id: "",
            },
            resTime: null,
        };
    },
    // watch: {
    //     query: {
    //         deep: true,
    //         immediate: true,
    //         handler(newVal) {
    //             if (newVal) {
    //                 this.loadSelectStockOrder(newVal.serial);
    //             }
    //         },
    //     },
    // },
    methods: {
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
        },
        isTimestampOver(timestamp) {
            // 判断毫秒时间戳是否超过当前时间5分钟,超过输出：true

            return dayjs().diff(dayjs(timestamp), "minute") > 5;
        },
        eprint() {
            this.loading = true;
        },
        goBack() {
            window.history.back();
        },
        handlePrint() {
            if (this.isTimestampOver(this.resTime)) {
                // 如果数据时5分钟前加载的，就拒绝打印
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
            withDelay(() => SelectStockOrder({ id: id }))
                .then((res) => {
                    this.resTime = res.metadata.time;
                    this.stockorder = res.payload.items[0];
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
        onRefresh() {
            this.loadSelectStockOrder(this.query.id);
            this.loadOrderDetails(this.query.id);
        },
    },
    created() {
        this.query.id = this.$route.query.id;
        this.loadSelectStockOrder(this.query.id);
        this.loadOrderDetails(this.query.id);
    },
};
</script>

<style scoped>
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
.head-title {
    p {
        font-size: 18px;
        text-align: center;
        font-weight: bold;
    }
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
