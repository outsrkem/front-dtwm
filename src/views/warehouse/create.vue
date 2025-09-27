<template>
    <div>
        <el-dialog v-model="dialogVisible" title="创建仓库" width="600">
            <el-form :model="data" label-width="auto" :rules="fromRules" ref="rules-from">
                <el-form-item label="仓库名称" prop="name">
                    <el-input v-model="data.name" />
                </el-form-item>
                <el-form-item label="仓库地址" prop="location">
                    <el-input v-model="data.location" />
                </el-form-item>
            </el-form>
            <div style="display: flex; justify-content: flex-end">
                <el-button round class="round-button" @click="dialogVisible = false">取消</el-button>
                <el-button round class="round-button" type="primary" @click="onSubmit">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { msgcon } from "../../utils/message.js";
import { CreateWarehouses } from "../../api/index.js";
export default {
    name: "CreateWarehouse",
    components: {},
    props: {},
    setup() {
        return {};
    },
    data() {
        return {
            dialogVisible: false,
            data: {
                name: "",
                location: "",
            },
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
        openDialog() {
            this.dialogVisible = true;
        },
        submitSuccess() {
            this.data = { name: "", location: "" }; // 创建成功置空表单
            this.$message.success(msgcon("创建仓库成功"));
            this.dialogVisible = false;
            this.$parent.onRefresh();
        },
        onSubmit() {
            this.$refs["rules-from"].validate((valid) => {
                if (!valid) {
                    return;
                }
                const data = { name: this.data.name, location: this.data.location };
                CreateWarehouses(data)
                    .then(() => {
                        this.submitSuccess();
                    })
                    .catch((err) => {
                        let msg = err.data.metadata.message;
                        this.$message.error(msgcon("创建仓库失败 " + msg));
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
