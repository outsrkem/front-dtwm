<template>
    <div id="kcyj" v-loading="loading"></div>
</template>

<script>
import { debounce } from "lodash-es";
import { PositiveStock } from "../../../api/index.js";
import { withDelay } from "../../../utils/common.js";
import * as echarts from "echarts/core";
import { ToolboxComponent, TooltipComponent, GridComponent, LegendComponent, BrushComponent, TitleComponent } from "echarts/components";
import { BarChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([ToolboxComponent, TooltipComponent, GridComponent, LegendComponent, BrushComponent, TitleComponent, BarChart, CanvasRenderer]);

import { Refresh } from "@element-plus/icons-vue";
export default {
    setup() {
        return {
            Refresh,
        };
    },
    name: "StockIndex",
    components: {},
    props: {
        vdata: {
            type: Object,
            default: () => ({
                warehouses: {
                    id: "",
                },
            }),
        },
    },
    data() {
        return {
            loading: true,
            stock: [], // 存储所有正库存数据
            warehouses: [],
            myChart: null,
            query: {
                warehouses: {
                    id: "",
                },
            },
            isDestroyed: false, // 组件销毁标记
            loadingWarehouses: false, // 防止重复请求和提供用户反馈
        };
    },

    methods: {
        // 处理过长文本的方法
        truncateText(text, maxLength = 8) {
            if (!text) return "未知物品";
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + "...";
        },

        onRefresh() {
            if (this.isDestroyed) return;
            this.loadPositiveStock();
        },

        // 远程搜索300ms防抖延迟处理
        onRemoteSearch: debounce(function (query = "") {
            const searchQuery = typeof query === "string" ? query.trim() : "";
            if (searchQuery === this.lastWarehouseQuery) return;
            this.lastWarehouseQuery = searchQuery;
            this.loadGetWarehouses(searchQuery);
        }, 300),

        // 获取正库存数据 - 修复了URL参数问题
        loadPositiveStock() {
            this.loading = true;
            // 初始化参数对象，确保不会引入多余的引号
            const params = { limit: 50 };

            // 仅在仓库ID存在且不为空字符串时添加wd参数
            if (this.query.warehouses?.id && typeof this.query.warehouses.id === "string" && this.query.warehouses.id.trim() !== "") {
                params.wd = this.query.warehouses.id.trim(); // 去除可能的前后空格
            }

            withDelay(() => PositiveStock(params))
                .then((res) => {
                    if (this.isDestroyed) return;
                    // PositiveStock返回的都是大于0的库存，直接赋值
                    this.stock = res.payload?.items || [];
                    this.updateChart();
                })
                .catch((error) => {
                    console.error("获取库存数据失败:", error);
                    if (!this.isDestroyed) {
                        this.stock = [];
                        this.updateChart();
                    }
                })
                .finally(() => {
                    if (!this.isDestroyed) {
                        this.loading = false;
                    }
                });
        },

        initChart() {
            if (this.isDestroyed) return;

            const chartDom = document.getElementById("kcyj");
            if (!chartDom) {
                console.error("图表容器不存在");
                return;
            }

            if (this.myChart) {
                this.myChart.dispose();
                this.myChart = null;
            }

            try {
                this.myChart = echarts.init(chartDom, null, {
                    renderer: "svg",
                    devicePixelRatio: window.devicePixelRatio || 1,
                    useDirtyRect: true,
                });

                // 移除鼠标滚轮事件监听
                if (this.myChart.getZr() && this.myChart.getZr().handler) {
                    const zr = this.myChart.getZr();
                    const handler = zr.handler;

                    if (handler._listeners) {
                        Object.keys(handler._listeners).forEach((key) => {
                            if (key === "mousewheel" || key === "wheel") {
                                delete handler._listeners[key];
                            }
                        });
                    }

                    zr.off("mousewheel");
                    zr.off("wheel");
                    zr.off("mousewheel", null, true);
                    zr.off("wheel", null, true);
                }

                const option = this.getChartOption([]);
                this.myChart.setOption(option);

                // 监听图表刷选事件
                this.myChart.on("brushSelected", (params) => {
                    if (this.isDestroyed) return;

                    if (!params || !Array.isArray(params.batch) || params.batch.length === 0) {
                        this.myChart.setOption({ title: { text: "" } });
                        return;
                    }

                    const brushed = [];
                    const brushComponent = params.batch[0];

                    if (brushComponent && Array.isArray(brushComponent.selected)) {
                        for (let sIdx = 0; sIdx < brushComponent.selected.length; sIdx++) {
                            const selectedItem = brushComponent.selected[sIdx];
                            if (selectedItem && selectedItem.dataIndex) {
                                brushed.push(`[系列 ${sIdx}] ${selectedItem.dataIndex.join(", ")}`);
                            }
                        }
                    }

                    this.myChart.setOption({
                        title: {
                            backgroundColor: "#333",
                            text: brushed.length > 0 ? `选中的数据索引: \n${brushed.join("\n")}` : "",
                            bottom: 0,
                            right: "10%",
                            width: 100,
                            textStyle: {
                                fontSize: 12,
                                color: "#fff",
                            },
                        },
                    });
                });
            } catch (error) {
                console.error("图表初始化失败:", error);
                this.myChart = null;
            }
        },

        updateChart() {
            if (this.isDestroyed || !this.myChart) {
                return;
            }

            const chartDom = document.getElementById("kcyj");
            if (!chartDom) {
                console.error("图表容器已被移除");
                this.myChart.dispose();
                this.myChart = null;
                return;
            }

            try {
                const option = this.getChartOption(this.stock);
                this.myChart.setOption(option);
            } catch (error) {
                console.error("图表更新失败:", error);
            }
        },

        getChartOption(stockData) {
            // 使用截断方法处理物品名称
            const xAxisData = stockData.map((item) => this.truncateText(item.name, 8));
            const availableData = stockData.map((item) => parseFloat(item.available || 0));
            const lockData = stockData.map((item) => parseFloat(item.lock || 0));

            // 保存原始名称用于tooltip显示
            const fullNames = stockData.map((item) => item.name || "未知物品");

            const emphasisStyle = {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: "rgba(0,0,0,0.3)",
                },
            };

            return {
                title: {
                    show: true,
                    text: "库存情况",
                    left: "left",
                    top: "auto",
                    textStyle: {
                        color: "#303133",
                    },
                },
                legend: {
                    data: ["可用库存", "锁定库存"],
                    left: "center",
                    top: 0,
                },
                tooltip: {
                    // 在tooltip中显示完整名称
                    formatter: function (params) {
                        const index = params.dataIndex;
                        const fullName = fullNames[index] || "";
                        return `${fullName}<br/>${params.seriesName}: ${params.value}`;
                    },
                },
                xAxis: {
                    type: "category",
                    data: xAxisData,
                    name: "物品名称",
                    axisLine: { onZero: true },
                    axisLabel: {
                        rotate: 50, // x轴名称增大旋转角度
                        interval: 0,
                    },
                },
                yAxis: {
                    type: "value",
                    name: "库存数量",
                    min: 0,
                    axisLabel: {
                        formatter: (value) => parseFloat(value).toFixed(2),
                    },
                },
                // 调整网格布局，增加底部空间
                grid: {
                    top: "22%", // 上
                    left: "5%", // 下
                    right: "14%", // 右边宽度
                    bottom: "5%", // 增加底部空间容纳长标签
                    containLabel: true,
                },
                series: [
                    {
                        name: "可用库存",
                        type: "bar",
                        stack: "total",
                        emphasis: emphasisStyle,
                        data: availableData,
                        itemStyle: {
                            color: "#409EFF",
                        },
                    },
                    {
                        name: "锁定库存",
                        type: "bar",
                        stack: "total",
                        emphasis: emphasisStyle,
                        data: lockData,
                        itemStyle: {
                            color: "#ff994d",
                        },
                    },
                ],
            };
        },
    },
    mounted() {
        this.$nextTick(() => {
            this.initChart();
        });

        window.addEventListener(
            "resize",
            () => {
                if (!this.isDestroyed && this.myChart) {
                    this.myChart.resize();
                }
            },
            { passive: true },
        );
    },
    created() {
        this.isDestroyed = false;
        this.$globalBus.emit("updateActivePath", "/overview/stock");
        this.onRefresh();
        this.$globalBus.on("onRefresh", () => {
            this.onRefresh();
        });
    },
    beforeUnmount() {
        this.isDestroyed = true;
        this.$globalBus.off("updateActivePath");
        this.$globalBus.off("onRefresh");
        window.removeEventListener(
            "resize",
            () => {
                if (this.myChart) this.myChart.resize();
            },
            { passive: true },
        );
        if (this.myChart) {
            this.myChart.dispose();
            this.myChart = null;
        }
    },
    watch: {
        $route() {
            if (!this.isDestroyed && this.myChart) {
                this.myChart.resize();
            }
        },
        vdata: {
            deep: true,
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.query = { ...newVal };
                    this.onRefresh();
                }
            },
        },
    },
};
</script>

<style scoped>
#kcyj {
    width: 100%;
    height: 400px;
}
</style>
