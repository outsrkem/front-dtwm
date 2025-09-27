<template>
    <div>
        <el-dialog v-model="dialogVisible" title="更新仓库信息" width="600">
            <div v-loading="loading">
                <el-form :model="warehouse" label-width="auto" :rules="fromRules" ref="rules-from">
                    <el-form-item label="仓库名称" prop="name">
                        <el-input v-model="warehouse.name" />
                    </el-form-item>
                    <el-form-item label="仓库地址" prop="location">
                        <el-input v-model="warehouse.location" />
                    </el-form-item>
                </el-form>
                <div style="display: flex; justify-content: flex-end">
                    <el-button round class="round-button" @click="dialogVisible = false">取消</el-button>
                    <el-button round class="round-button" type="primary" @click="onSubmit">确定</el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { msgcon } from "../../utils/message.js";
import { GetWarehouseByID, UpdateWarehouse } from "../../api/index.js";
import { withDelay } from "../../utils/common.js";
export default {
    name: "UpdateWarehouse",
    components: {},
    props: {},
    setup() {
        return {};
    },
    data() {
        return {
            dialogVisible: false,
            loading: true,
            warehouse_id: "",
            warehouse: { name: "", location: "" },
            fromRules: {
                name: [
                    { required: true, message: "请输入仓库名称", trigger: "blur" },
                    { min: 1, max: 32, message: "长度为1到32个字符", trigger: ["blur", "change"] },
                ],
                location: [
                    { required: true, message: "请输入仓库地址", trigger: "blur" },
                    { min: 1, max: 64, message: "长度为1到64个字符", trigger: ["blur", "change"] },
                ],
            },
        };
    },
    methods: {
        openDialog(val) {
            this.loading = true;
            this.warehouse = { name: "", location: "" };
            this.warehouse_id = val.id;
            this.loadGetWarehouseByID(val.id);
            this.dialogVisible = true;
        },
        submitSuccess() {
            this.warehouse = { name: "", location: "" };
            this.$message.success(msgcon("更新仓库成功"));
            this.dialogVisible = false;
            this.$parent.onRefresh();
        },
        loadGetWarehouseByID: function (warehouse_id = this.warehouse_id) {
            const paths = { warehouse_id: warehouse_id };
            withDelay(() => GetWarehouseByID(paths))
                .then((res) => {
                    this.warehouse = res.payload.warehouse;
                    this.loading = false;
                })
                .catch((err) => {
                    let msg = err.data.metadata.message;
                    this.$message.error(msgcon("加载仓库失败 " + msg));
                });
        },
        onSubmit() {
            this.$refs["rules-from"].validate((valid) => {
                if (!valid) return;
                this.loading = true;
                const paths = { warehouse_id: this.warehouse_id };
                const data = { name: this.warehouse.name, location: this.warehouse.location };
                withDelay(() => UpdateWarehouse(paths, data))
                    .then(() => {
                        this.submitSuccess();
                    })
                    .catch((err) => {
                        let msg = err.data.metadata.message;
                        this.$message.error(msgcon("更新仓库失败 " + msg));
                    })
                    .finally(() => {
                        this.loading = false;
                    });
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
