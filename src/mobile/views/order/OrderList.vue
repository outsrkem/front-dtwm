<template>
    <div class="order-list-page" style="background-color: #f7f8fa">
        <!-- 导航栏：标题 + 返回 + 搜索入口 -->
        <van-nav-bar title="出入库单据" left-text="返回" left-arrow @click-left="handleGoBack" fixed placeholder>
            <template #right>
                <van-icon name="search" size="18" @click="handleGoToSearch" style="cursor: pointer" />
            </template>
        </van-nav-bar>

        <!-- 下拉刷新 + 上拉加载列表 -->
        <van-pull-refresh v-model="refreshing" @refresh="handleRefresh" class="list-container">
            <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多单据了" @load="handleLoadMore" class="order-list">
                <!-- 单据列表项 -->
                <div v-for="(item, index) in orderList" :key="`order-${item.order_id}-${index}`" class="order-item" @click="handleGoToDetail(item.order_id)">
                    <van-cell-group>
                        <van-cell
                            :title="item.type === 'OUT' ? '出库' : '入库'"
                            :value="`提交人：${item.owner.username}`"
                            :label="`${item.serial}`"
                            class="cell-item" />
                    </van-cell-group>
                </div>

                <!-- 空列表提示 -->
                <div v-if="orderList.length === 0 && !loading && !refreshing" class="empty-tip">
                    <van-empty description="暂无出入库单据" />
                </div>
            </van-list>
        </van-pull-refresh>
    </div>
</template>

<script>
import { withDelay, convertToLimitOffset } from "../../../utils/common.js";
import { SelectStockOrder } from "../../../api/index.js";

export default {
    components: {},
    data() {
        return {
            orderList: [], // 单据列表数据
            pageParams: {
                page: 1, // 当前页码
                pageSize: 20, // 每页条数
                total: 0, // 总条数
            },
            loading: false, // 上拉加载状态
            finished: false, // 是否加载完毕
            refreshing: false, // 下拉刷新状态
        };
    },
    methods: {
        /** 加载单据列表数据 */
        async fetchOrderList(isRefresh = false) {
            // 控制加载状态
            if (isRefresh) this.refreshing = true;
            else this.loading = true;

            // 构建请求参数
            const params = convertToLimitOffset(this.pageParams.page, this.pageParams.pageSize);

            // 正确调用方式：直接传入请求的Promise结果
            // const res = await withDelay(SelectStockOrder(params));
            withDelay(() =>
                SelectStockOrder(params)
                    .then((res) => {
                        const { items = [], page_info = {} } = res.payload || {};
                        // 更新数据和分页信息
                        this.pageParams.total = page_info.total || 0;
                        this.orderList = isRefresh ? items : [...this.orderList, ...items];
                        // 判断是否加载完毕
                        const isLastPage = items.length < this.pageParams.pageSize || this.orderList.length >= this.pageParams.total;
                        this.finished = isLastPage;
                    })
                    .catch((err) => {
                        this.$message.error("单据列表加载失败，请重试");
                        console.error("Fetch order list error:", err);
                    })
                    .finally(() => {
                        // 重置加载状态
                        this.loading = false;
                        this.refreshing = false;
                    }),
            );
        },

        /** 上拉加载更多 */
        handleLoadMore() {
            if (this.finished) return; // 已加载完，终止请求
            this.fetchOrderList();
            this.pageParams.page += 1; // 页码递增（下次请求下一页）
        },

        /** 下拉刷新 */
        handleRefresh() {
            // 重置分页和数据
            this.pageParams.page = 1;
            this.finished = false;
            this.orderList = [];
            this.fetchOrderList(true); // 刷新时标记isRefresh=true
            this.pageParams.page += 1;
        },

        /** 跳转至搜索页 */
        handleGoToSearch() {
            this.$router.push({ name: "StockOrderSearch" });
        },

        /** 跳转至详情页 */
        handleGoToDetail(oid) {
            this.$router.push({
                name: "StockOrderDetail",
                params: { oid }, // 传递单据ID
            });
        },

        /** 返回首页 */
        handleGoBack() {
            this.$router.push({ name: "home" });
        },
    },
    /** 页面创建时加载初始数据 */
    created() {
        this.fetchOrderList();
        this.pageParams.page += 1;
    },
};
</script>

<style scoped>
/* 列表容器：避开导航栏 */

/* 单据项间距 */
.order-item {
    margin: 5px 0;
}

/* 列表项样式优化 */
.cell-item {
    background-color: #fff;
}

/* 空列表提示样式 */
.empty-tip {
    padding: 50px 20px;
    text-align: center;
}
</style>
