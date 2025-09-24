<template>
    <div>
        <el-drawer v-model="dialogVisible" direction="rtl" size="800" :before-close="handleClose">
            <template #header>
                <h3 style="margin: 0">创建物品</h3>
            </template>
            <div>
                <el-form :model="item" :rules="formRules" ref="itemForm" label-width="auto" label-position="top" :disabled="loading">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="产品编码" prop="sku">
                                <el-input v-model="item.sku" placeholder="唯一不重复，建议使用物品条码" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="名称" prop="name">
                                <el-input v-model="item.name" show-word-limit placeholder="输入物品名称" clearable />
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="属性" prop="property">
                                <el-input v-model="item.property" placeholder="输入物品属性，如颜色、材质等" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="规格" prop="specification">
                                <el-input v-model="item.specification" show-word-limit placeholder="输入物品规格，如尺寸、容量等" clearable />
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="单位" prop="unit">
                                <el-input v-model="item.unit" placeholder="输入计量单位，如个、kg等" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="是否上架" prop="status">
                                <el-radio-group v-model="item.status">
                                    <el-radio :value="1" border>上架</el-radio>
                                    <el-radio :value="0" border>不上架</el-radio>
                                </el-radio-group>
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
                        <el-input v-model="item.store_req" placeholder="输入存储要求，如常温干、冷藏2-8℃等" clearable />
                    </el-form-item>

                    <el-form-item label="备注">
                        <el-input v-model="item.remark" type="textarea" maxlength="128" show-word-limit placeholder="输入备注信息" :rows="3" />
                    </el-form-item>
                    <el-form-item>
                        <el-checkbox v-model="continuous">连续创建（提交后继续添加）</el-checkbox>
                    </el-form-item>
                    <el-form-item>
                        <el-space>
                            <el-button bg text @click="onCancel" style="width: 120px">取消</el-button>
                            <el-button type="warning" @click="resetForm" style="width: 120px">重置</el-button>
                            <el-button type="primary" @click="onCreateItem" style="width: 120px">提交</el-button>
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
import { AddItems } from "../../api/index.js";

export default {
    name: "CreateItem",
    components: {},
    data() {
        return {
            dialogVisible: false,
            loading: false,
            continuous: false,
            item: {
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
                sku: [
                    { required: true, message: "请输入唯一物品编码", trigger: "blur" },
                    { max: 50, message: "编码长度不能超过50个字符", trigger: "blur" },
                ],
                name: [
                    { required: true, message: "请输入物品名称", trigger: "blur" },
                    { max: 100, message: "名称长度不能超过100个字符", trigger: "blur" },
                ],
                property: [
                    { required: true, message: "请输入物品属性", trigger: "blur" },
                    { max: 100, message: "属性长度不能超过100个字符", trigger: "blur" },
                ],
                specification: [
                    { required: true, message: "请输入物品规格，如尺寸、容量等", trigger: "blur" },
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
    methods: {
        onOpenDialog() {
            this.resetForm();
            this.dialogVisible = true;
        },
        handleClose(done) {
            done();
        },
        onCancel() {
            this.dialogVisible = false;
            this.continuous = false;
        },

        // 过滤空值字段：移除值为null、空字符串、空数组或空对象的字段
        filterEmptyFields(obj) {
            const newObj = { ...obj };
            Object.keys(newObj).forEach((key) => {
                const value = newObj[key];
                // 判断是否为空值
                if (value === null || value === undefined) {
                    delete newObj[key];
                } else if (typeof value === "string" && value.trim() === "") {
                    delete newObj[key];
                } else if (Array.isArray(value) && value.length === 0) {
                    delete newObj[key];
                } else if (value instanceof Object && Object.keys(value).length === 0) {
                    delete newObj[key];
                }
            });
            return newObj;
        },

        onCreateItem() {
            this.$refs["itemForm"].validate((valid) => {
                if (!valid) {
                    return;
                }

                // 过滤空值字段后再提交
                const formData = this.filterEmptyFields(this.item);

                this.loading = true;
                const data = { items: [formData] };

                withDelay(() => AddItems(data))
                    .then(() => {
                        this.$message.success(msgcon("创建成功"));
                        this.$globalBus.emit("onRefresh");

                        if (this.continuous) {
                            this.resetForm(true);
                        } else {
                            this.dialogVisible = false;
                        }
                    })
                    .catch((err) => {
                        let msg = err.data?.metadata?.message || "未知错误";
                        this.$message.error(msgcon(`创建失败：${msg}`));
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            });
        },

        resetForm(keepContinuous = false) {
            this.$nextTick(() => {
                if (this.$refs["itemForm"]) {
                    this.$refs["itemForm"].resetFields();
                }
            });

            const continuousState = this.continuous;

            Object.assign(this.item, {
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
            });

            if (keepContinuous) {
                this.continuous = continuousState;
            }
        },
    },
};
</script>

<style scoped lang="less"></style>
