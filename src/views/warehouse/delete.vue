<template>
    <div>
        <el-dialog v-model="dialogVisible" title="是否删除下列仓库" width="850px">
            <div style="margin-left: 20px; margin-right: 20px">
                <el-table :data="vdata" style="width: 100%">
                    <el-table-column prop="name" label="仓库名称" show-overflow-tooltip />

                    <el-table-column prop="location" label="仓库地址" show-overflow-tooltip />
                    <el-table-column label="创建时间">
                        <template #default="scope">{{ formatDate(scope.row.create_time) }}</template>
                    </el-table-column>
                </el-table>
                <br />
                <div style="display: flex; justify-content: flex-end">
                    <el-button class="round-button" round @click="dialogVisible = false">取 消</el-button>
                    <el-button class="round-button" round type="danger" @click="onSubmit()">确 定</el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { formatTime } from "../../utils/date.js";
import { msgcon } from "../../utils/message.js";
import { DeleteWarehouses } from "../../api/index.js";
export default {
    name: "DeleteWarehouse",
    components: {},
    props: {
        vdata: Array,
    },
    setup() {
        return {};
    },
    data() {
        return {
            dialogVisible: false,
        };
    },
    methods: {
        formatDate(time) {
            return formatTime(time);
        },
        openDialog() {
            this.dialogVisible = true;
        },
        submitSuccess() {
            this.$message.success(msgcon("删除仓库成功"));
            this.dialogVisible = false;
            this.$parent.onRefresh();
        },
        onSubmit() {
            const paths = { id: this.vdata[0].id };
            DeleteWarehouses(paths)
                .then(() => {
                    this.submitSuccess();
                })
                .catch((err) => {
                    let msg = err.data.metadata.message;
                    this.$message.error(msgcon("删除仓库失败 " + msg));
                });
        },
    },
    created() {},
};
</script>

<style scoped>
.round-button {
    min-width: 100px;
}
</style>
