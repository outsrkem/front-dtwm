<template>
    <div>
        <el-card>
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>冲销管理</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </div>
                    <div>
                        <el-space>
                            <el-button type="primary" :icon="Refresh" @click="onRefresh()" :loading="loading">刷新</el-button>
                        </el-space>
                    </div>
                </div>
            </template>

            <el-table :data="reversalList" style="width: 100%" v-loading="loading">
                <el-table-column label="提交时间">
                    <template #default="scope">{{ formatDate(scope.row.submit_time) }}</template>
                </el-table-column>
                <el-table-column prop="submit_user.username" label="提交人" />
                <el-table-column prop="submit_note" label="提交原因" show-overflow-tooltip />
                <el-table-column label="状态">
                    <template #default="scope">
                        <span
                            class="status-dot"
                            :class="getStatusConfig(scope.row.audit_status).class"
                            :title="getStatusConfig(scope.row.audit_status).label"></span>
                        <span class="status-text">
                            {{ getStatusConfig(scope.row.audit_status).label }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="auditor_user.username" label="审批人" />
                <el-table-column label="操作" width="200">
                    <template #default="scope">
                        <el-space>
                            <el-button link type="primary" @click="onOpenDisposeReversal(scope.row)">查看详情</el-button>
                        </el-space>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination">
                <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
            </div>
        </el-card>
        <DisposeReversal ref="DisposeReversal" />
    </div>
</template>

<script>
import { Refresh } from "@element-plus/icons-vue";
import pagination from "../../components/pagination/pagination.vue";
import DisposeReversal from "./dispose.vue";
import { formatTime } from "../../utils/date.js";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { ListReversal } from "../../api/index.js";
import { getStatusConfig } from "../../utils/status.js";
export default {
    name: "ReversalIndex",
    components: { pagination, DisposeReversal },
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
            reversalList: [],
        };
    },
    methods: {
        getStatusConfig,
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
        },
        onCurrentChange(p) {
            this.page = p;
            this.loadListReversal(this.pageSize, p);
        },
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadListReversal(s, 1);
        },
        onRefresh() {
            this.loadListReversal(this.pageSize, this.page);
        },
        loadListReversal: function (page_size = 10, page = 1) {
            this.loading = true;
            let params = convertToLimitOffset(page, page_size);

            withDelay(() => ListReversal(params))
                .then((res) => {
                    this.reversalList = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        onOpenDisposeReversal(val) {
            this.$refs.DisposeReversal.openDialog(val);
        },
    },
    created() {
        this.onRefresh();
        this.$globalBus.emit("updateActivePath", "/reversal");
    },
};
</script>

<style scoped></style>
