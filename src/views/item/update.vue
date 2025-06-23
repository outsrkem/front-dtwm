<template>
    <el-drawer title="编辑物品" v-model="dialogVisible" direction="rtl" size="800" :before-close="handleClose">
        <el-form :model="item" :rules="formRules" ref="itemForm" label-width="auto" label-position="top" :disabled="loading">
            <el-row :gutter="20">
                <el-col :span="24">
                    <el-form-item label="产品编码" prop="sku">
                        <el-input v-model="item.sku" placeholder="建议使用包含物品特征的编码" clearable disabled />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="名称" prop="name">
                        <el-input v-model="item.name" show-word-limit placeholder="输入物品名称" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="属性" prop="property">
                        <el-input v-model="item.property" placeholder="输入物品属性，如颜色、材质等" clearable />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="规格" prop="specification">
                        <el-input v-model="item.specification" show-word-limit placeholder="输入物品规格" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="单位" prop="unit">
                        <el-input v-model="item.unit" placeholder="输入计量单位，如个、kg等" clearable />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="6">
                    <el-form-item label="重量数值">
                        <el-input v-model="item.weival" placeholder="输入重量数值" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="6">
                    <el-form-item label="重量单位">
                        <el-select v-model="item.weiunit" placeholder="请选择单位" style="width: 100%" clearable>
                            <el-option label="克 (g)" value="g" />
                            <el-option label="千克 (kg)" value="Kg" />
                            <el-option label="吨 (t)" value="t" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="6">
                    <el-form-item label="体积数值">
                        <el-input v-model="item.volval" placeholder="输入体积数值" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="6">
                    <el-form-item label="体积单位">
                        <el-select v-model="item.volunit" placeholder="请选择单位" style="width: 100%" clearable>
                            <el-option label="立方厘米 (cm³)" value="cm³"></el-option>
                            <el-option label="立方米 (m³)" value="m³"></el-option>
                            <el-option label="毫升 (ml)" value="ml"></el-option>
                            <el-option label="升 (L)" value="L"></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="存储要求">
                <el-input v-model="item.store_req" placeholder="输入存储要求" clearable />
            </el-form-item>

            <el-form-item label="备注">
                <el-input v-model="item.remark" type="textarea" maxlength="128" show-word-limit placeholder="输入备注信息" :rows="3" />
            </el-form-item>

            <el-form-item>
                <el-space>
                    <el-button @click="onCancel" style="width: 120px">取消</el-button>
                    <el-button type="warning" @click="resetForm" style="width: 120px">恢复</el-button>
                    <el-button type="primary" @click="onUpdateItem" style="width: 120px">保存</el-button>
                </el-space>
            </el-form-item>
        </el-form>
    </el-drawer>
</template>

<script>
import { withDelay } from "../../utils/common.js";
import { msgcon } from "../../utils/message.js";
import { UpdateItem } from "../../api/index.js";

export default {
    name: "UpdateItem",
    components: {},
    props: {
        itemData: {
            type: Object,
            default: () => ({
                id: "",
                sku: "",
                name: "",
                property: "",
                specification: "",
                unit: "",
                status: 1,
                weival: null,
                weiunit: "",
                volval: null,
                volunit: "",
                store_req: "",
                remark: "",
            }),
        },
    },
    data() {
        return {
            dialogVisible: false,
            loading: false,
            item: {
                id: "",
                sku: "",
                name: "",
                property: "",
                specification: "",
                unit: "",
                status: 1,
                weival: null,
                weiunit: "",
                volval: null,
                volunit: "",
                store_req: "",
                remark: "",
            },
            formRules: {
                name: [
                    { required: true, message: "请输入物品名称", trigger: "blur" },
                    { max: 100, message: "名称长度不能超过100个字符", trigger: "blur" },
                ],
                property: [
                    { required: true, message: "请输入物品属性", trigger: "blur" },
                    { max: 100, message: "属性长度不能超过100个字符", trigger: "blur" },
                ],
                specification: [
                    { required: true, message: "请输入物品规格", trigger: "blur" },
                    { max: 100, message: "规格长度不能超过100个字符", trigger: "blur" },
                ],
                unit: [
                    { required: true, message: "请输入物品单位", trigger: "blur" },
                    { max: 20, message: "单位长度不能超过20个字符", trigger: "blur" },
                ],
                status: [{ required: true, message: "请选择是否上架", trigger: "change" }],
            },
        };
    },
    watch: {
        itemData: {
            deep: true,
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.item = { ...newVal };
                }
            },
        },
    },
    methods: {
        onOpenDialog() {
            this.dialogVisible = true;
        },

        handleClose() {
            this.dialogVisible = false;
            this.resetForm();
        },

        onCancel() {
            this.handleClose();
        },

        resetForm() {
            this.$nextTick(() => {
                if (this.$refs["itemForm"]) {
                    this.$refs["itemForm"].resetFields();
                }
            });
            this.item = { ...this.itemData };
        },

        onUpdateItem() {
            this.$refs["itemForm"].validate((valid) => {
                if (!valid) {
                    return false;
                }

                this.loading = true;

                withDelay(() => UpdateItem({ id: this.item.id }, this.item))
                    .then(() => {
                        this.$message.success(msgcon("更新成功"));
                        this.$globalBus.emit("onRefresh");
                        this.handleClose();
                    })
                    .catch((err) => {
                        const msg = err.data?.metadata?.message || "更新失败，请重试";
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
