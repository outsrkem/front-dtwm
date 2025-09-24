<template>
    <div class="settings-container">
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <el-row>
                        <span>客户管理</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </el-row>
                    <el-row>
                        <el-button type="success" @click="onCreateSupplier">添加客户</el-button>
                        <el-button type="primary" :icon="Refresh" @click="onRefresh" :loading="loading" style="margin-left: 10px"> 刷新 </el-button>
                    </el-row>
                </div>
            </template>
            <!-- 表格：删除按钮关联loading状态 -->
            <el-table :data="items" style="width: 100%" v-loading="loading">
                <el-table-column prop="name" label="名称" show-overflow-tooltip />
                <el-table-column prop="person" label="联系人" show-overflow-tooltip />
                <el-table-column label="状态">
                    <template #default="scope">
                        <span class="status-dot" :class="scope.row.status === 1 ? 'usable' : 'unusable'" />
                        <span v-if="scope.row.status === 1">启用</span>
                        <span v-else>禁用</span>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" show-overflow-tooltip />
                <el-table-column prop="update_time" label="更新时间" width="180">
                    <template #default="scope">{{ formatDate(scope.row.update_time) }}</template>
                </el-table-column>

                <!-- 在表格的操作列中添加编辑按钮 -->
                <el-table-column label="操作" min-width="120">
                    <template #default="scope">
                        <el-space>
                            <el-button link type="primary" @click="onEditSupplier(scope.row)"> 编辑 </el-button>
                            <el-button link type="danger" v-if="scope.row.status === 1" @click="onDisableSupplier(scope.row)"> 禁用 </el-button>
                            <el-button link type="primary" v-if="scope.row.status === 0" @click="onEnableSupplier(scope.row)"> 启用 </el-button>
                            <el-button link type="danger" @click="onDeleteSupplier(scope.row)"> 删除 </el-button>
                        </el-space>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页组件 -->
            <div class="pagination">
                <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
            </div>
        </el-card>

        <!-- 新增客户弹窗（子组件）：保留原逻辑 -->
        <CreateSupplier ref="CreateSupplier"></CreateSupplier>
        <UpdateSupplier ref="UpdateSupplier" :supplier-data="currentSupplier"></UpdateSupplier>
    </div>
</template>

<script>
import { Refresh } from "@element-plus/icons-vue";
import pagination from "../../components/pagination/pagination.vue";
import { formatTime } from "../../utils/date.js";
import { msgcon } from "../../utils/message.js";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { ListSuppliers, EnableSupplier, DisableSupplier, DeleteSupplier } from "../../api/index.js";
import CreateSupplier from "./create.vue";
import UpdateSupplier from "./update.vue";

export default {
    name: "CreateSupplierIndex",
    components: { pagination, CreateSupplier, UpdateSupplier },
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
            loading: true, // 列表加载状态
            items: [], // 客户列表数据

            // 删除相关状态：仅保留loading（无需弹窗状态）
            deleteLoading: {}, // 按客户ID存储删除按钮loading状态
            currentSupplier: null, // 存储当前要编辑的客户数据
        };
    },
    methods: {
        // 时间格式化
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
        },
        // 添加编辑按钮点击事件处理方法
        onEditSupplier(row) {
            this.currentSupplier = { ...row };
            this.$refs.UpdateSupplier.onOpenDialog();
        },
        // 加载客户列表
        loadListSuppliers(page_size, page) {
            this.loading = true;
            const params = convertToLimitOffset(page, page_size);

            withDelay(() => ListSuppliers(params))
                .then((res) => {
                    this.items = res.payload?.items || [];
                    this.pageTotal = res.payload?.page_info?.total || 0;
                })
                .catch((err) => {
                    const msg = err.data?.metadata?.message || "列表加载失败";
                    this.$message.error(msgcon(msg));
                    this.items = [];
                    this.pageTotal = 0;
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        // 启用客户
        loadEnableSupplier(id) {
            this.deleteLoading[id] = true;
            const paths = { id: id };

            EnableSupplier(paths)
                .then(() => {
                    this.$message.success(msgcon("启用成功"));
                    this.onRefresh();
                })
                .catch((err) => {
                    const msg = err.data?.metadata?.message || "启用失败";
                    this.$message.error(msgcon(msg));
                })
                .finally(() => {
                    delete this.deleteLoading[id];
                });
        },

        // 禁用客户
        loadDisableSupplier(id) {
            this.deleteLoading[id] = true;
            const paths = { id: id };

            DisableSupplier(paths)
                .then(() => {
                    this.$message.success(msgcon("禁用成功"));
                    this.onRefresh();
                })
                .catch((err) => {
                    const msg = err.data?.metadata?.message || "禁用失败";
                    this.$message.error(msgcon(msg));
                })
                .finally(() => {
                    delete this.deleteLoading[id];
                });
        },

        // 核心修改：用$confirm替换dialog，点击删除直接触发确认
        onDeleteSupplier(row) {
            // 1. 显示原生confirm确认框：自定义标题、内容和按钮
            this.$confirm(`您确定要删除客户【${row.name}】吗？<br/>提示：删除后数据将无法恢复，请谨慎操作！`, "确认删除", {
                confirmButtonText: "确认删除",
                cancelButtonText: "取消",
                type: "warning", // 警告类型：黄色图标
                dangerouslyUseHTMLString: true, // 允许内容使用HTML（换行<br/>）
                center: true, // 弹窗居中
            }).then(() => {
                // 2. 用户点击“确认删除”：执行删除逻辑
                this.deleteLoading[row.id] = true; // 禁用当前删除按钮
                const paths = { id: row.id };

                DeleteSupplier(paths)
                    .then(() => {
                        this.$message.success(msgcon(`客户【${row.name}】删除成功`));
                        this.onRefresh(); // 刷新列表
                    })
                    .catch((err) => {
                        const msg = err.data?.metadata?.message || "删除失败";
                        this.$message.error(msgcon(msg));
                    })
                    .finally(() => {
                        delete this.deleteLoading[row.id]; // 恢复按钮状态
                    });
            });
        },

        // 刷新列表
        onRefresh() {
            this.loading = true;
            this.loadListSuppliers(this.pageSize, this.page);
        },

        // 分页-页码变化
        onCurrentChange(p) {
            this.page = p;
            this.loadListSuppliers(this.pageSize, p);
        },

        // 分页-每页条数变化
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadListSuppliers(s, 1);
        },

        // 启用客户触发
        onEnableSupplier(val) {
            this.loadEnableSupplier(val.id);
        },

        // 禁用客户触发
        onDisableSupplier(val) {
            this.loadDisableSupplier(val.id);
        },

        // 打开新增客户弹窗
        onCreateSupplier() {
            this.$refs.CreateSupplier.onOpenDialog();
        },
    },
    created() {
        this.onRefresh();
        this.$globalBus.on("onRefresh", () => {
            this.onRefresh();
        });
        this.$globalBus.emit("updateActivePath", "/supplier");
    },
    beforeUnmount() {
        this.$globalBus.off("onRefresh");
        this.$globalBus.off("updateActivePath");
    },
};
</script>

<style scoped>
/* 状态点样式 */
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
