<template>
    <div v-loading="loading">
        <div v-if="zeroStock.length > 0" class="zero-stock-section">
            <h3>零库存物品 ({{ zeroStock.length }})</h3>
            <div class="zero-stock-list">
                <div v-for="(item, index) in zeroStock" :key="item.id || index" class="zero-stock-item" :title="item.name">
                    {{ truncateText(item.name) }}
                </div>
            </div>
        </div>

        <!-- 无数据状态 -->
        <div v-else-if="!loading" class="no-data-section">
            <div class="empty-icon">✓</div>
            <p class="empty-text">当前没有零库存物品</p>
        </div>
    </div>
</template>

<script>
import { ZeroStock } from "../../../api/index.js";
import { withDelay } from "../../../utils/common.js";

export default {
    name: "ZeroStockSimplified",
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
            zeroStock: [], // 存储所有零库存数据
            query: {
                warehouses: {
                    id: "",
                },
            },
            _isDestroyed: false, // 组件销毁标记
        };
    },

    methods: {
        // 处理过长文本的方法
        truncateText(text, maxLength = 12) {
            if (!text) return "未知物品";
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + "...";
        },

        // 获取零库存数据
        loadZeroStock() {
            this.loading = true;
            const params = { limit: 100 };

            // 仅在仓库ID存在且不为空字符串时添加wd参数
            if (this.query.warehouses?.id && typeof this.query.warehouses.id === "string" && this.query.warehouses.id.trim() !== "") {
                params.wd = this.query.warehouses.id.trim();
            }

            withDelay(() => ZeroStock(params))
                .then((res) => {
                    if (this._isDestroyed) return;
                    this.zeroStock = res.payload?.items || [];
                })
                .catch((error) => {
                    console.error("获取零库存数据失败:", error);
                    if (!this._isDestroyed) {
                        this.zeroStock = [];
                    }
                })
                .finally(() => {
                    if (!this._isDestroyed) {
                        this.loading = false;
                    }
                });
        },
    },
    created() {
        this._isDestroyed = false;
        this.$globalBus.emit("updateActivePath", "/overview/zero-stock");
        this.loadZeroStock();
        // 保留全局刷新事件监听
        this.$globalBus.on("onRefresh", () => {
            this.loadZeroStock();
        });
    },
    beforeUnmount() {
        this._isDestroyed = true;
        this.$globalBus.off("updateActivePath");
        this.$globalBus.off("onRefresh");
    },
    watch: {
        vdata: {
            deep: true,
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.query = { ...newVal };
                    this.loadZeroStock();
                }
            },
        },
    },
};
</script>

<style scoped>
.zero-stock-section {
    margin: 16px 0;
    padding: 16px;
    background-color: #fff8f8;
    border-radius: 4px;
    border-left: 4px solid #ff4d4f;
}

.zero-stock-section h3 {
    margin: 0 0 12px 0;
    color: #f5222d;
    font-size: 16px;
}

.zero-stock-list {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.zero-stock-item {
    padding: 4px 8px;
    background-color: #fff;
    border: 1px solid #ffccc7;
    border-radius: 4px;
    color: #8c0000;
    display: inline-flex;
    align-items: center;
}

/* 无数据状态样式 */
.no-data-section {
    text-align: center;
    padding: 40px 0;
    color: #909399;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #c0c4cc;
}
</style>
