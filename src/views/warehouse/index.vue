<template>
    <div class="settings-container">
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <el-row>
                        <span>仓库信息</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </el-row>
                    <el-row>
                        <el-button type="success" style="margin-left: 10px" @click="onCreateWarehouse">创建仓库</el-button>
                        <el-button type="primary" :icon="Refresh" @click="onRefresh" :loading="loading" style="margin-left: 10px">刷新</el-button>
                    </el-row>
                </div>
            </template>
            <el-table :data="items" v-loading="loading">
                <el-table-column prop="id" label="仓库ID" width="330" />
                <el-table-column prop="name" label="仓库名称" />
                <el-table-column prop="location" label="仓库地址" />
                <el-table-column prop="update_time" label="更新时间" width="200">
                    <template #default="scope">{{ formatDate(scope.row.update_time) }}</template>
                </el-table-column>
                <el-table-column prop="create_time" label="创建时间" width="200">
                    <template #default="scope">{{ formatDate(scope.row.create_time) }}</template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #default="scope">
                        <el-button link type="primary">编辑</el-button>
                        <el-button link type="primary" @click="onPurview(scope.row)">授权</el-button>
                        <el-button link type="danger" @click="onDeleteWarehouse(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination">
                <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
            </div>
        </el-card>
        <CreateWarehouse ref="CreateWarehouse" />
        <DeleteWarehouses ref="DeleteWarehouses" :vdata="deletearray" />
        <Purview ref="Purview" />
    </div>
</template>

<script>
import CreateWarehouse from "./create.vue";
import DeleteWarehouses from "./delete.vue";
import Purview from "./purview.vue";
import pagination from "../../components/pagination/pagination.vue";
import { Refresh } from "@element-plus/icons-vue";
import { formatTime } from "../../utils/date.js";
import { GetWarehouses } from "../../api/index.js";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
export default {
    name: "HomeIndex",
    components: { pagination, CreateWarehouse, DeleteWarehouses, Purview },
    props: {},
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
            deletearray: [],
        };
    },
    methods: {
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
        },
        onCurrentChange(p) {
            this.page = p;
            this.loadGetWarehouses(this.pageSize, p);
        },
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadGetWarehouses(s, 1);
        },
        loadGetWarehouses: function (page_size, page) {
            this.loading = true;
            const params = convertToLimitOffset(page, page_size);
            withDelay(() => GetWarehouses(params))
                .then((res) => {
                    this.items = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        onRefresh() {
            this.loading = true;
            this.loadGetWarehouses(this.pageSize, this.page);
        },
        onCreateWarehouse() {
            this.$refs.CreateWarehouse.openDialog();
        },
        onDeleteWarehouse(val) {
            this.deletearray = [];
            this.deletearray.push(val);
            this.$refs.DeleteWarehouses.openDialog();
        },
        onPurview(val) {
            this.$refs.Purview.openDialog(val);
        },
    },
    created() {
        this.$globalBus.emit("updateActivePath", "/warehouse");
        this.onRefresh();
        this.$globalBus.on("onRefresh", () => {
            this.onRefresh();
        });
    },
    beforeUnmount() {
        this.$globalBus.off("onRefresh");
        this.$globalBus.off("updateActivePath");
    },
};
</script>

<style scoped></style>
