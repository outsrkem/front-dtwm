<template>
    <div class="settings-container">
        <van-nav-bar title="物品" />
        <div>
            <!-- 添加下拉刷新功能 -->
            <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
                <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
                    <van-cell v-for="item in items" :key="item.id" :title="item.name" />
                </van-list>
            </van-pull-refresh>
        </div>
    </div>
</template>

<script>
import { withDelay, convertToLimitOffset } from "../../../utils/common.js";
import { GetItems } from "../../../api/index.js";

export default {
    data() {
        return {
            pageTotal: 0,
            pageSize: 20,
            page: 1, // 初始页码为1（第一页）
            loading: false,
            finished: false,
            refreshing: false,
            items: [],
        };
    },
    methods: {
        loadGetItems(page_size, page, isRefresh = false) {
            if (isRefresh) {
                this.refreshing = true;
            } else {
                this.loading = true;
            }

            const params = convertToLimitOffset(page, page_size);
            withDelay(() => GetItems(params))
                .then((res) => {
                    const newItems = res.payload.items || [];
                    this.pageTotal = res.payload.page_info?.total || 0;

                    if (isRefresh) {
                        // 刷新时直接替换数据（确保从第1页开始）
                        this.items = newItems;
                    } else {
                        // 加载更多时追加新数据（避免重复）
                        this.items = [...this.items, ...newItems];
                    }

                    // 判断是否为最后一页（修复重复加载）
                    const isLastPage = newItems.length < page_size || this.items.length >= this.pageTotal;
                    this.finished = isLastPage;
                })
                .finally(() => {
                    this.loading = false;
                    this.refreshing = false;
                });
        },

        onLoad() {
            // 如果已加载完所有数据，不再请求
            if (this.finished) return;

            // 关键修复：先请求当前页，再递增页码
            this.loadGetItems(this.pageSize, this.page);
            this.page += 1; // 确保下次请求的是下一页
        },

        onRefresh() {
            // 刷新时重置页码为1，清空已有数据
            this.page = 1;
            this.finished = false;
            this.items = []; // 清空现有数据，避免刷新后新旧数据混合
            this.loadGetItems(this.pageSize, this.page, true);
            this.page += 1; // 准备下次加载的页码
        },
    },
    created() {
        // 初始化时加载第一页
        this.loadGetItems(this.pageSize, this.page);
        this.page += 1; // 准备下一页
    },
};
</script>

<style scoped>
.settings-container {
    padding: 6px;
}
</style>
