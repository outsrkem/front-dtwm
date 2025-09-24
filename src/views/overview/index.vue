<template>
    <div>
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <el-row>
                        <span>库存数据总览</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </el-row>
                    <el-row>
                        <el-button type="primary" :icon="Refresh" @click="onRefresh" :loading="loading" style="margin-left: 10px">刷新</el-button>
                    </el-row>
                </div>
            </template>
            <el-row :gutter="20">
                <el-col :span="16" v-loading="loading">
                    <!-- 增加图表容器高度 -->
                    <div id="kcyj"></div>
                </el-col>
                <el-col :span="8">
                    <el-space direction="vertical">
                        <el-select
                            clearable
                            v-model="query.warehouses.id"
                            placeholder="选择仓库"
                            style="width: 240px"
                            @change="onRefresh"
                            filterable
                            remote
                            :remote-method="onRemoteSearch">
                            <el-option v-for="item in warehouses" :key="item.id" :label="item.name" :value="item.id" />
                        </el-select>
                    </el-space>
                </el-col>
            </el-row>
        </el-card>
    </div>
</template>

<script>
import { debounce } from "lodash-es"; // 或 'lodash'，取决于你的项目配置
import { StockEarly, GetWarehouses } from "../../api/index.js";
import { withDelay } from "../../utils/common.js";
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
    name: "HomeIndex",
    components: {},
    props: {},
    data() {
        return {
            loading: true,
            stock: [],
            warehouses: [],
            myChart: null,
            query: {
                warehouses: {
                    id: "",
                },
            },
            _isDestroyed: false, // 添加组件销毁标记
            loadingWarehouses: false, // 防止重复请求和提供用户反馈
        };
    },

    methods: {
        // 新增：处理过长文本的方法
        truncateText(text, maxLength = 8) {
            if (!text) return "未知物品";
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + "...";
        },

        onRefresh() {
            if (this._isDestroyed) return;
            this.loadStockEarly();
            this.loadGetWarehouses();
        },
        // 获取仓库
        loadGetWarehouses(query = "") {
            if (this.loadingWarehouses) return; // 防止重复请求

            this.loadingWarehouses = true;
            let params = { limit: 20 };

            // 仅在查询不为空且长度大于0时添加搜索参数
            if (typeof query === "string" && query.trim() !== "") {
                // 仅在查询不为空且长度大于0时添加搜索参数
                params = { name: query.trim(), ...params };
            }

            GetWarehouses(params)
                .then((res) => {
                    if (this._isDestroyed) return;
                    // 验证响应结构
                    if (res && res.payload && Array.isArray(res.payload.items)) {
                        this.warehouses = res.payload.items;
                    } else {
                        this.warehouses = [];
                        console.warn("获取仓库信息格式不正确", res);
                    }
                })
                .catch((err) => {
                    console.error("获取仓库信息失败:", err);
                    if (!this._isDestroyed) {
                        this.warehouses = [];
                        this.$message.error("获取仓库列表失败，请稍后重试");
                    }
                })
                .finally(() => {
                    if (!this._isDestroyed) {
                        this.loadingWarehouses = false;
                    }
                });
        },
        // 远程搜索300ms防抖延迟防抖处理，避免频繁请求
        onRemoteSearch: debounce(function (query = "") {
            const searchQuery = typeof query === "string" ? query.trim() : "";
            if (searchQuery === this.lastWarehouseQuery) return;
            this.lastWarehouseQuery = searchQuery;
            this.loadGetWarehouses(searchQuery);
        }, 300),
        // 获取库存
        loadStockEarly() {
            this.loading = true;
            let params = { limit: 20 };
            if (this.query.warehouses.id !== "") params = { wd: this.query.warehouses.id, ...params };
            withDelay(() => StockEarly(params))
                .then((res) => {
                    if (this._isDestroyed) return;
                    this.stock = res.payload?.items || [];
                    this.updateChart();
                })
                .catch(() => {
                    if (!this._isDestroyed) {
                        this.stock = [];
                        this.updateChart();
                    }
                })
                .finally(() => {
                    if (!this._isDestroyed) {
                        this.loading = false;
                    }
                });
        },
        initChart() {
            if (this._isDestroyed) return;

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
                    if (this._isDestroyed) return;

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
            if (this._isDestroyed || !this.myChart) {
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
            // 使用新增的截断方法处理物品名称
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
                    text: "库存预警",
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
                if (!this._isDestroyed && this.myChart) {
                    this.myChart.resize();
                }
            },
            { passive: true },
        );
    },
    created() {
        this._isDestroyed = false;
        this.$globalBus.emit("updateActivePath", "/overview");
        this.onRefresh();
    },
    beforeUnmount() {
        this._isDestroyed = true;
        this.$globalBus.off("updateActivePath");
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
        $route(to, from) {
            if (!this._isDestroyed && this.myChart) {
                this.myChart.resize();
            }
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
