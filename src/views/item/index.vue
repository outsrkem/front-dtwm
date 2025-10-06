<template>
    <div class="settings-container">
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <el-row>
                        <span>物品管理</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </el-row>
                    <el-row>
                        <el-space>
                            <el-input
                                v-model="query.name"
                                style="width: 220px"
                                placeholder="物品名称(模糊搜索)"
                                clearable
                                @clear="onRefresh()"
                                @change="onSearch()" />
                            <el-button type="success" @click="onCreateItem">新增物品</el-button>
                            <el-button type="primary" :icon="Refresh" @click="onRefresh" :loading="loading">刷新</el-button>
                        </el-space>
                    </el-row>
                </div>
            </template>
            <!-- <el-table :data="items" style="width: 100%; overflow-x: auto" v-loading="loading">
                <el-table-column prop="sku" label="物品编码" show-overflow-tooltip />
                <el-table-column prop="name" label="名称" show-overflow-tooltip sortable min-width="150px" />
                <el-table-column prop="property" label="属性" show-overflow-tooltip />
                <el-table-column prop="specification" label="规格" />
                <el-table-column prop="unit" label="单位" />
                <el-table-column label="状态">
                    <template #default="scope">
                        <span class="status-dot" :class="scope.row.status === 1 ? 'usable' : 'unusable'" />
                        <span v-if="scope.row.status === 1">上架</span>
                        <span v-else>下架</span>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="说明" show-overflow-tooltip />
                <el-table-column prop="update_time" label="更新时间" min-width="120">
                    <template #default="scope">{{ formatDate(scope.row.update_time) }}</template>
                </el-table-column>
                <el-table-column label="操作" min-width="120">
                    <template #default="scope">
                        <el-button link type="primary" @click="onEditItem(scope.row)">编辑</el-button>
                        <el-button link type="danger" v-if="scope.row.status === 1" @click="onDownItem(scope.row)">下架</el-button>
                        <el-button link type="primary" v-if="scope.row.status === 0" @click="onUpItem(scope.row)">上架</el-button>
                    </template>
                </el-table-column>
            </el-table> -->
            <MyTable :data="items" :columns="columns" v-loading="loading">
                <template #status="{ row }">
                    <span class="status-dot" :class="row.status === 1 ? 'usable' : 'unusable'" />
                    <span v-if="row.status === 1">上架</span>
                    <span v-else>下架</span>
                </template>
                <template #update_time="{ row }">
                    {{ formatDate(row.update_time) }}
                </template>
                <template #operation="{ row }">
                    <el-button link type="primary" @click="onEditItem(row)">编辑</el-button>
                    <el-button link type="danger" v-if="row.status === 1" @click="onDownItem(row)">下架</el-button>
                    <el-button link type="primary" v-if="row.status === 0" @click="onUpItem(row)">上架</el-button>
                </template>
            </MyTable>
            <div class="pagination">
                <div>
                    <!--分页开始-->
                    <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
                    <!--分页结束-->
                </div>
            </div>
        </el-card>
        <CreateItem ref="CreateItem"></CreateItem>
        <UpdateItem ref="UpdateItem" :item-data="currentItem"></UpdateItem>
    </div>
</template>
<script>
import MyTable from "../../components/MyTable/MyTable.vue";
import { Refresh } from "@element-plus/icons-vue";
import pagination from "../../components/pagination/pagination.vue";
import { formatTime } from "../../utils/date.js";
import { msgcon } from "../../utils/message.js";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { GetItems, UpItems, DownItems } from "../../api/index.js";
import CreateItem from "./create.vue";
import UpdateItem from "./update.vue";
export default {
    name: "HomeIndex",
    components: { pagination, CreateItem, UpdateItem, MyTable },
    setup() {
        return {
            Refresh,
        };
    },
    data() {
        return {
            pageTotal: 0,
            pageSize: 10,
            page: 1,
            loading: true,
            items: [],
            loading: true,
            currentItem: null, // 存储当前编辑的物品数据
            query: { name: "" }, // 物品检索
            columns: [
                { label: "物品编码", prop: "sku" },
                { label: "名称", prop: "name" },
                { label: "属性", prop: "property" },
                { label: "规格", prop: "specification" },
                { label: "单位", prop: "unit" },
                { label: "状态", slot: "status" },
                { label: "更新时间", slot: "update_time" },
                { label: "操作", slot: "operation" },
            ],
        };
    },
    methods: {
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
        },
        // 新增编辑方法
        onEditItem(row) {
            this.currentItem = { ...row };
            this.$refs.UpdateItem.onOpenDialog();
        },
        loadGetItems: function (page_size = 10, page = 1) {
            this.loading = true;
            let params = convertToLimitOffset(page, page_size);
            if (this.query.name !== "") params = { ...params, name: this.query.name };
            withDelay(() => GetItems(params))
                .then((res) => {
                    this.items = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                    this.loading = false;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        loadUpItems: function (id) {
            const data = { ids: [id] };
            UpItems(data)
                .then(() => {
                    this.$message.success(msgcon("上架成功"));
                    this.onRefresh();
                })
                .catch((err) => {
                    let msg = err.data.metadata.message;
                    this.$message.error(msgcon("上架失败" + msg));
                });
        },
        LoadDownItems: function (id) {
            const data = { ids: [id] };
            DownItems(data)
                .then(() => {
                    this.$message.success(msgcon("下架成功"));
                    this.onRefresh();
                })
                .catch((err) => {
                    let msg = err.data.metadata.message;
                    this.$message.error(msgcon("下架失败" + msg));
                });
        },
        onRefresh() {
            this.loading = true;
            this.loadGetItems(this.pageSize, this.page);
        },
        onSearch() {
            if (this.query.name === "") return;
            this.loadGetItems(this.pageSize, this.page);
        },
        onCurrentChange(p) {
            this.page = p;
            this.loadGetItems(this.pageSize, p);
        },
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadGetItems(s, 1);
        },
        onUpItem(val) {
            this.loadUpItems(val.id);
        },
        onDownItem(val) {
            this.LoadDownItems(val.id);
        },
        onCreateItem() {
            this.$refs.CreateItem.onOpenDialog();
        },
    },
    created() {
        this.onRefresh();
        this.$globalBus.on("onRefresh", () => {
            this.onRefresh();
        });
        this.$globalBus.emit("updateActivePath", "/items");
    },
    beforeUnmount() {
        this.$globalBus.off("onRefresh");
        this.$globalBus.off("updateActivePath");
    },
};
</script>

<style scoped>
.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
}
.usable {
    background-color: #50d4ab;
}
.unusable {
    background-color: #ffb700;
}
</style>
