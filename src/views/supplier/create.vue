<template>
    <div>
        <el-drawer v-model="dialogVisible" direction="rtl" size="800" :before-close="handleClose">
            <template #header>
                <h3 style="margin: 0">添加供应商/客户</h3>
            </template>
            <div>
                <el-form :model="supplier" :rules="formRules" ref="supplierForm" label-width="120px" label-position="top" :disabled="loading">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="供应商编码" prop="code">
                                <el-input v-model="supplier.code" placeholder="建议格式：SP2024001（唯一不重复）" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="供应商名称" prop="name">
                                <el-input v-model="supplier.name" show-word-limit max="100" placeholder="输入供应商全称" clearable />
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="联系人" prop="person">
                                <el-input v-model="supplier.person" placeholder="输入对接人姓名" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="联系电话" prop="phone">
                                <el-input v-model="supplier.phone" placeholder="支持手机号（11位）或固话（如010-12345678）" clearable />
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="邮箱" prop="email">
                                <el-input v-model="supplier.email" type="email" placeholder="输入联系邮箱（如xxx@xx.com）" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="是否启用" prop="status">
                                <el-radio-group v-model="supplier.status">
                                    <el-radio :value="1" border>启用</el-radio>
                                    <el-radio :value="0" border>禁用</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
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
                    </el-row>

                    <!-- 备注 + 连续创建勾选框 -->
                    <el-form-item label="备注">
                        <el-input
                            v-model="supplier.remark"
                            type="textarea"
                            maxlength="128"
                            show-word-limit
                            placeholder="输入供应商特殊说明（非必填）"
                            :rows="3" />
                    </el-form-item>
                    <!-- 补充“连续创建”勾选框（原逻辑缺失） -->
                    <el-form-item>
                        <el-checkbox v-model="continuous">连续创建（提交后继续添加）</el-checkbox>
                    </el-form-item>

                    <!-- 按钮区域 -->
                    <el-form-item>
                        <el-space>
                            <el-button @click="onCancel" style="width: 120px">取消</el-button>
                            <el-button type="warning" @click="resetForm" style="width: 120px">重置</el-button>
                            <el-button type="primary" @click="onCreateSupplier" style="width: 120px">提交</el-button>
                        </el-space>
                    </el-form-item>
                </el-form>
            </div>
        </el-drawer>
    </div>
</template>

<script>
import { withDelay } from "../../utils/common.js";
import { msgcon } from "../../utils/message.js";
import { CreateSupplier } from "../../api/index.js";

export default {
    name: "CreateSupplier",
    components: {},
    data() {
        return {
            dialogVisible: false,
            loading: false,
            continuous: false, // 控制连续创建（默认不勾选）
            // 2. 修复：supplier字段与后端ReqRawSupplier完全对齐
            supplier: {
                code: "", // 供应商编码（后端required）
                name: "", // 供应商名称（后端required）
                person: "", // 联系人（后端required）
                phone: "", // 联系电话（后端required）
                email: "", // 邮箱（后端非required，但建议填）
                province: "", // 省份（非required）
                city: "", // 城市（非required）
                district: "", // 区/县（非required）
                address: "", // 详细地址（后端required）
                status: 1, // 状态：1-启用，0-禁用（默认启用）
                remark: "", // 备注（非required）
            },
            // 3. 修复：表单规则对应供应商必填项
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
                    { required: true, message: "请输入联系人姓名", trigger: "blur" },
                    { max: 50, message: "联系人长度不能超过50个字符", trigger: "blur" },
                ],
                phone: [
                    { required: true, message: "请输入联系电话", trigger: "blur" },
                    {
                        pattern: /^(1\d{10}|0\d{2,3}-\d{7,8})$/, // 手机号或固话格式校验
                        message: "请输入正确的手机号（11位）或固话（如010-12345678）",
                        trigger: "blur",
                    },
                ],
                address: [
                    { required: true, message: "请输入详细地址", trigger: "blur" },
                    { max: 200, message: "地址长度不能超过200个字符", trigger: "blur" },
                ],
                status: [{ required: true, message: "请选择是否启用", trigger: "change" }],
                email: [
                    {
                        pattern: /^[\w.-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.]+$/, // 邮箱格式校验
                        message: "请输入正确的邮箱格式（如xxx@xx.com）",
                        trigger: "blur",
                    },
                ],
            },
        };
    },
    methods: {
        // 打开对话框：重置表单后显示
        onOpenDialog() {
            this.resetForm();
            this.dialogVisible = true;
        },

        // 关闭对话框：重置连续创建状态
        handleClose(done) {
            this.continuous = false;
            done();
        },

        // 取消按钮：关闭弹窗+重置状态
        onCancel() {
            this.dialogVisible = false;
            this.continuous = false;
        },

        // 提交创建：修复数据格式+逻辑
        onCreateSupplier() {
            this.$refs["supplierForm"].validate((valid) => {
                if (!valid) return;

                this.loading = true;
                // 4. 修复：提交数据格式与后端接口对齐（无需包裹items数组，直接传supplier对象）
                const submitData = { ...this.supplier };

                withDelay(() => CreateSupplier(submitData)) // 传参改为单个supplier对象
                    .then(() => {
                        this.$message.success(msgcon("供应商创建成功"));
                        this.$globalBus.emit("onRefresh"); // 通知列表页刷新

                        // 连续创建：重置表单；否则关闭弹窗
                        if (this.continuous) {
                            this.resetForm(true); // 保留连续创建状态
                        } else {
                            this.dialogVisible = false;
                            this.continuous = false;
                        }
                    })
                    .catch((err) => {
                        // 错误信息优化：兼容不同错误格式
                        const msg = err.data?.metadata?.message || err.message || "创建失败，请重试";
                        this.$message.error(msgcon(msg));
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            });
        },

        // 重置表单：修复保留连续创建状态的逻辑
        resetForm(keepContinuous = false) {
            this.$nextTick(() => {
                if (this.$refs["supplierForm"]) {
                    this.$refs["supplierForm"].resetFields(); // 重置表单值+校验状态
                }
            });

            // 保存连续创建状态（避免重置时丢失）
            const tempContinuous = this.continuous;

            // 重置为默认值
            Object.assign(this.supplier, {
                code: "",
                name: "",
                person: "",
                phone: "",
                email: "",
                province: "",
                city: "",
                district: "",
                address: "",
                status: 1, // 默认启用
                remark: "",
            });

            // 保留连续创建状态（仅当keepContinuous为true时）
            if (keepContinuous) {
                this.continuous = tempContinuous;
            } else {
                this.continuous = false;
            }
        },
    },
};
</script>

<style scoped lang="less">
/* 可选：优化按钮间距 */
.el-form-item .el-button {
    margin-right: 16px;
}
.el-form-item .el-checkbox {
    margin-bottom: 8px;
}
</style>
