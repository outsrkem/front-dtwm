<template>
    <div style="background-color: #f7f8fa">
        <van-nav-bar title="出入库单据" left-text="返回" left-arrow @click-left="goBack" fixed placeholder />
        <div style="display: flex; width: 100%">
            <van-search
                v-model="query.serial"
                placeholder="请输入但单据编号搜索"
                @search="onSearch"
                style="width: 100%"
                right-icon="scan"
                @click-right-icon="onSacn">
            </van-search>
        </div>
        <!-- 下拉刷新单据 -->
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
            <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
                <div v-for="val in items">
                    <div style="margin-top: 5px; margin-bottom: 5px" @click="loadGetParticulars(val.order_id)">
                        <van-cell-group>
                            <van-cell :title="val.type === 'OUT' ? '出库' : '入库'" :value="`${val.owner.username}`" :label="val.serial"> </van-cell>
                        </van-cell-group>
                    </div>
                </div>
            </van-list>
        </van-pull-refresh>
        <!-- 详情界面弹窗 -->
        <van-popup v-model:show="details" position="right" :style="{ width: '100%', height: '100%' }">
            <div style="background-color: #f7f8fa">
                <van-nav-bar title="单据详情" left-arrow @click-left="onCancel" fixed placeholder />
                <!-- 详情界面列表 -->
                <div v-for="val in particularsdata">
                    <div style="margin-top: 5px; margin-bottom: 5px">
                        <van-cell-group>
                            <van-cell
                                :title="val.item.name"
                                :label="`${val.detailedly.quantity}   ${val.item.unit}`"
                                :value="val.order.type === 'OUT' ? '出库' : '入库'"></van-cell>
                        </van-cell-group>
                    </div>
                </div>
            </div>
        </van-popup>
    </div>
</template>

<script>
import { withDelay, convertToLimitOffset } from "../../../utils/common.js";
import { SelectStockOrder, GetParticulars } from "../../../api/index.js";
export default {
    data() {
        return {
            active: null,
            pageTotal: 0,
            pageSize: 20,
            page: 1, // 初始页码为1（第一页）
            loading: false,
            finished: false,
            refreshing: false,
            items: [],
            particularsdata: [], // 单据详情
            //  查询参数
            query: { serial: "" },
            // 详情弹窗状态
            details: false,
        };
    },
    methods: {
        loadSelectStockOrder(page_size = 10, page = 1, isRefresh = false) {
            if (isRefresh) {
                this.refreshing = true;
            } else {
                this.loading = true;
            }

            let params = convertToLimitOffset(page, page_size);
            if (this.query.serial !== "") params = { serial: this.query, ...params };
            withDelay(() => SelectStockOrder(params))
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
        // 查询单据详情
        loadGetParticulars: function (oid) {
            this.details = true; // 打开弹出层
            this.particularsdata = [];
            GetParticulars({ oid: oid })
                .then((res) => {
                    this.particularsdata = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                })
                .catch((err) => {
                    let msg = err.data.metadata;
                    this.particularsdata = [];
                    this.$message.warning(msgcon(msg));
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        onLoad() {
            // 如果已加载完所有数据，不再请求
            if (this.finished) return;

            // 关键修复：先请求当前页，再递增页码
            this.loadSelectStockOrder(this.pageSize, this.page);
            this.page += 1; // 确保下次请求的是下一页
        },

        onRefresh() {
            // 刷新时重置页码为1，清空已有数据
            this.page = 1;
            this.finished = false;
            this.items = []; // 清空现有数据，避免刷新后新旧数据混合
            this.loadSelectStockOrder(this.pageSize, this.page, true);
            this.page += 1; // 准备下次加载的页码
        },
        onSearch(val) {
            this.items = [];
            this.loadSelectStockOrder(this.pageSize, this.page, false);
        },
        onSacn() {
            console.log("扫描");
        },
        onCancel() {
            this.details = false;
        },
        // 返回
        goBack() {
            this.$router.push({ name: "home" });
        },
    },
    created() {
        // 初始化时加载第一页
        this.loadSelectStockOrder(this.pageSize, this.page);
        this.page += 1; // 准备下一页
    },
};
</script>
<style scoped></style>
