<!-- src/views/supplier/update.vue -->
<template>
    <el-drawer title="编辑客户" v-model="dialogVisible" direction="rtl" size="800" :before-close="handleClose">
        <el-form ref="supplierForm" :model="supplier" :rules="formRules" label-width="100px" label-position="top" class="demo-ruleForm">
            <el-row :gutter="20">
                <el-col :span="24">
                    <el-form-item label="供应商编码" prop="code">
                        <el-input v-model="supplier.code" placeholder="输入供应商编码（唯一不重复）" clearable disabled />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="供应商名称" prop="name">
                        <el-input v-model="supplier.name" placeholder="输入供应商名称" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="联系人" prop="person">
                        <el-input v-model="supplier.person" placeholder="输入联系人姓名" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="联系电话" prop="phone">
                        <el-input v-model="supplier.phone" placeholder="支持手机号（11位）或固话（如010-12345678）" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="邮箱" prop="email">
                        <el-input v-model="supplier.email" type="email" placeholder="输入联系邮箱（如xxx@xx.com）" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="4">
                    <el-form-item label="省份">
                        <el-input v-model="supplier.province" placeholder="如：广东省" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="4">
                    <el-form-item label="城市">
                        <el-input v-model="supplier.city" placeholder="如：深圳市" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="4">
                    <el-form-item label="区/县">
                        <el-input v-model="supplier.district" placeholder="如：南山区" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="详细地址" prop="address">
                        <el-input v-model="supplier.address" placeholder="如：科技园软件大厦23层" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="备注">
                        <el-input
                            v-model="supplier.remark"
                            type="textarea"
                            maxlength="128"
                            show-word-limit
                            placeholder="输入供应商特殊说明（非必填）"
                            :rows="3" />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item>
                        <el-space>
                            <el-button @click="onCancel" style="width: 120px">取消</el-button>
                            <el-button type="warning" @click="resetForm" style="width: 120px">恢复</el-button>
                            <el-button type="primary" @click="onUpdateSupplier" style="width: 120px">保存</el-button>
                        </el-space>
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>
    </el-drawer>
</template>

<script>
import { withDelay } from "../../utils/common.js";
import { msgcon } from "../../utils/message.js";
import { UpdateSupplier } from "../../api/index.js";

export default {
    name: "UpdateSupplier",
    components: {},
    props: {
        // 接收要编辑的客户数据
        supplierData: {
            type: Object,
            default: () => ({
                id: "",
                code: "",
                name: "",
                person: "",
                phone: "",
                email: "",
                province: "",
                city: "",
                district: "",
                address: "",
                remark: "",
            }),
        },
    },
    data() {
        return {
            dialogVisible: false,
            loading: false,
            // 供应商表单数据
            supplier: {
                id: "",
                code: "",
                name: "",
                person: "",
                phone: "",
                email: "",
                province: "",
                city: "",
                district: "",
                address: "",
                remark: "",
            },
            // 表单验证规则（与创建保持一致，但去掉状态验证）
            formRules: {
                code: [
                    { required: true, message: "请输入供应商编码（唯一不重复）", trigger: "blur" },
                    { max: 50, message: "编码长度不能超过50个字符", trigger: "blur" },
                ],
                name: [
                    { required: true, message: "请输入供应商名称", trigger: "blur" },
                    { max: 100, message: "名称长度不能超过100个字符", trigger: "blur" },
                ],
                person: [
                    { required: true, message: "请输入联系人", trigger: "blur" },
                    { max: 50, message: "联系人长度不能超过50个字符", trigger: "blur" },
                ],
                phone: [
                    { required: true, message: "请输入联系电话", trigger: "blur" },
                    { max: 20, message: "电话长度不能超过20个字符", trigger: "blur" },
                ],
                address: [
                    { required: true, message: "请输入详细地址", trigger: "blur" },
                    { max: 200, message: "地址长度不能超过200个字符", trigger: "blur" },
                ],
                email: [
                    { type: "email", message: "请输入正确的邮箱格式", trigger: ["blur", "change"] },
                    { max: 100, message: "邮箱长度不能超过100个字符", trigger: "blur" },
                ],
            },
        };
    },
    watch: {
        supplierData: {
            deep: true,
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.supplier = { ...newVal };
                }
            },
        },
    },
    methods: {
        // 打开编辑弹窗
        onOpenDialog() {
            this.dialogVisible = true;
        },

        // 关闭弹窗
        handleClose() {
            this.dialogVisible = false;
            this.resetForm();
        },

        // 取消
        onCancel() {
            this.handleClose();
        },

        // 重置表单
        resetForm() {
            this.$nextTick(() => {
                if (this.$refs["supplierForm"]) {
                    this.$refs["supplierForm"].resetFields();
                }
            });
            // 恢复原始数据
            this.supplier = { ...this.supplierData };
        },

        // 更新供应商
        onUpdateSupplier() {
            this.$refs["supplierForm"].validate((valid) => {
                if (!valid) {
                    return false;
                }

                this.loading = true;

                // 调用更新API
                withDelay(() => UpdateSupplier({ id: this.supplier.id }, this.supplier))
                    .then(() => {
                        this.$message.success(msgcon("更新成功"));
                        this.$globalBus.emit("onRefresh"); // 触发列表刷新
                        this.handleClose(); // 关闭弹窗
                    })
                    .catch((err) => {
                        // 错误信息处理
                        const msg = err.data?.metadata?.message || err.message || "更新失败，请重试";
                        this.$message.error(msgcon(msg));
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            });
        },
    },
};
</script>

<style scoped></style>
