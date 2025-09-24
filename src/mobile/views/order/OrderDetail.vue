<template>
    <div class="detail-page" style="background-color: #f7f8fa; min-height: 100vh">
        <!-- 导航栏 -->
        <van-nav-bar title="单据详情" left-text="返回" left-arrow @click-left="goBack" fixed placeholder />

        <!-- 详情内容 -->
        <div v-if="!loading && !error" class="detail-content">
            <!-- 单据基本信息 -->

            <!-- 商品列表 -->
            <div v-if="particularsdata.length > 0">
                <div v-for="(val, index) in particularsdata" :key="index" class="item-container">
                    <van-cell-group>
                        <van-cell :title="val.item.name" :label="`规格: ${val.item.spec || '无'}`">
                            <template #extra>
                                <div class="item-extra">
                                    <div class="quantity">{{ val.detailedly.quantity }} {{ val.item.unit }}</div>
                                    <div :class="['type-tag', val.order.type === 'OUT' ? 'outbound' : 'inbound']">
                                        {{ val.order.type === "OUT" ? "出库" : "入库" }}
                                    </div>
                                </div>
                            </template>
                        </van-cell>
                    </van-cell-group>
                </div>
            </div>

            <!-- 空列表状态 -->
            <van-empty v-if="particularsdata.length === 0" description="暂无商品明细数据" class="empty-list" />
        </div>
    </div>
</template>

<script>
import { withDelay } from "../../../utils/common.js";
import { GetParticulars } from "../../../api/index.js";

export default {
    components: {},
    data() {
        return {
            particularsdata: [], // 单据详情商品列表
            orderInfo: {}, // 单据基本信息
            loading: true, // 加载状态
            error: false, // 错误状态
            errorMessage: "加载失败，请重试", // 错误信息
            oid: null, // 单据ID
        };
    },
    created() {
        // 从路由参数获取单据ID
        this.oid = this.$route.params.oid;
        if (!this.oid) {
            this.error = true;
            this.errorMessage = "未找到单据ID";
            this.loading = false;
            return;
        }

        // 加载单据详情
        this.loadGetParticulars(this.oid);
    },
    methods: {
        // 加载单据详情
        loadGetParticulars(oid) {
            this.loading = true;
            this.error = false;
            this.particularsdata = [];

            withDelay(() => GetParticulars({ oid }))
                .then((res) => {
                    if (res && res.payload) {
                        this.particularsdata = res.payload.items || [];
                        // 提取单据基本信息（从第一个商品项获取，根据实际接口调整）
                        if (this.particularsdata.length > 0) {
                            this.orderInfo = this.particularsdata[0].order || {};
                        }
                    }
                })
                .catch((err) => {
                    console.error("获取单据详情失败:", err);
                    this.error = true;
                    this.errorMessage = err.data?.metadata || "加载单据详情失败";
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        // 重新加载详情
        reloadDetail() {
            this.loadGetParticulars(this.oid);
        },

        // 格式化时间
        formatTime(timeStr) {
            if (!timeStr) return "未知时间";
            // 简单格式化，可根据实际需求完善
            const date = new Date(timeStr);
            return date.toLocaleString();
        },

        // 复制单据编号
        copySerial() {
            if (this.orderInfo.serial) {
                navigator.clipboard
                    .writeText(this.orderInfo.serial)
                    .then(() => {
                        this.$toast.success("单据编号已复制");
                    })
                    .catch(() => {
                        this.$toast.fail("复制失败，请手动复制");
                    });
            }
        },

        goBack() {
            this.$router.push({ name: "StockOrderList" });
        },
    },
};
</script>

<style scoped>
/* 类型标签样式 */
.type-tag {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.type-tag.outbound {
    background-color: #fff1f0;
    color: #cf1322;
}

.type-tag.inbound {
    background-color: #f6ffed;
    color: #52c41a;
}
</style>
