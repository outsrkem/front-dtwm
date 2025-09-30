<template>
    <div class="settings-container">
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>报表主题设置</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </div>
                    <div>
                        <el-space>
                            <el-button type="success" :icon="ArrowLeft" @click="goBack()">返回</el-button>
                            <el-button type="warning" :icon="Select" @click="onSubmit()" :loading="loading">提交</el-button>
                            <el-button type="primary" :icon="Refresh" @click="onRefresh()" :loading="loading">刷新</el-button>
                        </el-space>
                    </div>
                </div>
            </template>
            <div v-loading="loading" style="margin-bottom: 35px">
                <el-row :gutter="100" justify="center">
                    <el-col :span="11">
                        <div class="title">
                            <p>入库报表主题</p>
                        </div>
                        <div>
                            <el-form :model="formIn" label-width="auto" ref="formInRef">
                                <div class="sborder" style="margin-bottom: 12px">
                                    <p>标题</p>
                                    <el-form-item label="主标题">
                                        <el-input v-model="formIn.title.main" :placeholder="placeholder.title.main" />
                                    </el-form-item>
                                    <el-form-item label="副标题">
                                        <el-input v-model="formIn.title.sub" :placeholder="placeholder.title.sub" />
                                    </el-form-item>
                                </div>
                                <div class="title sborder">
                                    <p>签名（最多5个）</p>
                                    <el-form-item label="是否启用">
                                        <el-radio-group v-model="formIn.signature.enabled">
                                            <el-radio :value="true">启用</el-radio>
                                            <el-radio :value="false">禁用</el-radio>
                                        </el-radio-group>
                                    </el-form-item>
                                    <el-row :gutter="20" v-for="(sight, inx) in formIn.signature.items" :key="inx">
                                        <el-col :span="20">
                                            <el-form-item :label="`签名${inx + 1}`">
                                                <el-input v-model="sight.label" :placeholder="placeholder.signature.label" />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :span="2">
                                            <el-form-item>
                                                <el-checkbox v-model="sight.required" label="必选" />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :span="2">
                                            <el-form-item>
                                                <el-button :icon="Remove" text @click="onRemoveInSignRow(inx)"></el-button>
                                            </el-form-item>
                                        </el-col>
                                    </el-row>
                                    <el-form-item>
                                        <div style="width: 100%; border: 1px dashed #d9d9d9; border-radius: 6px">
                                            <el-button :icon="Plus" text style="width: 100%" @click="onAddInSignRow">添加签名</el-button>
                                        </div>
                                    </el-form-item>
                                </div>
                            </el-form>
                        </div>
                    </el-col>
                    <el-col :span="11">
                        <div class="title">
                            <p>出库报表主题</p>
                        </div>
                        <div>
                            <el-form :model="formOut" label-width="auto" ref="formOutRef">
                                <div class="sborder" style="margin-bottom: 12px">
                                    <p>标题</p>
                                    <el-form-item label="主标题">
                                        <el-input v-model="formOut.title.main" :placeholder="placeholder.title.main" />
                                    </el-form-item>
                                    <el-form-item label="副标题">
                                        <el-input v-model="formOut.title.sub" :placeholder="placeholder.title.sub" />
                                    </el-form-item>
                                </div>

                                <div class="title sborder">
                                    <p>签名（最多5个）</p>
                                    <el-form-item label="是否启用">
                                        <el-radio-group v-model="formOut.signature.enabled">
                                            <el-radio :value="true">启用</el-radio>
                                            <el-radio :value="false">禁用</el-radio>
                                        </el-radio-group>
                                    </el-form-item>
                                    <el-row :gutter="20" v-for="(sight, inx) in formOut.signature.items" :key="inx">
                                        <el-col :span="20">
                                            <el-form-item :label="`签名${inx + 1}`">
                                                <el-input v-model="sight.label" :placeholder="placeholder.signature.label" />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :span="2">
                                            <el-form-item>
                                                <el-checkbox v-model="sight.required" label="必选" />
                                            </el-form-item>
                                        </el-col>
                                        <el-col :span="2">
                                            <el-form-item>
                                                <el-button :icon="Remove" text @click="onRemoveOutSignRow(inx)"></el-button>
                                            </el-form-item>
                                        </el-col>
                                    </el-row>
                                    <el-form-item>
                                        <div style="width: 100%; border: 1px dashed #d9d9d9; border-radius: 6px">
                                            <el-button :icon="Plus" text style="width: 100%" @click="onAddOutSignRow">添加签名</el-button>
                                        </div>
                                    </el-form-item>
                                </div>
                            </el-form>
                        </div>
                    </el-col>
                </el-row>
            </div>
        </el-card>
    </div>
</template>

<script>
import { Refresh, Plus, Remove, Select, ArrowLeft } from "@element-plus/icons-vue";
import { withDelay } from "../../utils/common.js";
import { msgcon } from "../../utils/message.js";
import { GetPrintTheme, UpdateTheme } from "../../api/index.js";
export default {
    name: "WarehousePrintTheme",
    components: {},
    setup() {
        return {
            Refresh,
            Plus,
            Remove,
            Select,
            ArrowLeft,
        };
    },
    data() {
        return {
            loading: false,
            formIn: {
                title: { main: "", sub: "" },
                signature: { enabled: true, items: [] },
            },
            formOut: {
                title: { main: "", sub: "" },
                signature: { enabled: true, items: [] },
            },
            placeholder: {
                title: {
                    main: "输入打印时的单据主标题",
                    sub: "输入打印时的单据副标题",
                },
                signature: {
                    label: "请输入签名人职位，如：仓库管理员，出库员等",
                },
            },
            query: {
                warehouse_id: "",
            },
        };
    },
    methods: {
        loadGetPrintTheme() {
            this.loading = true;
            const paths = { warehouse_id: this.query.warehouse_id };
            withDelay(() => GetPrintTheme(paths))
                .then((res) => {
                    this.formIn = res.payload.theme.in;
                    this.formOut = res.payload.theme.out;
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                });
        },
        loadUpdateTheme() {
            this.loading = true;
            const paths = { warehouse_id: this.query.warehouse_id };
            const data = { in: this.formIn, out: this.formOut };
            withDelay(() => UpdateTheme(paths, data))
                .then(() => {
                    this.$message.success(msgcon("更新成功"));
                })
                .catch((err) => {
                    let msg = err.data?.metadata?.message || "更新失败";
                    this.$message.error(msgcon(msg));
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        onAddInSignRow() {
            if (this.formIn.signature.items.length < 5) {
                this.formIn.signature.items.push({ label: "", required: true });
            }
        },
        onRemoveInSignRow(inx) {
            this.formIn.signature.items.splice(inx, 1);
        },
        onAddOutSignRow() {
            if (this.formOut.signature.items.length < 5) {
                this.formOut.signature.items.push({ label: "", required: true });
            }
        },
        onRemoveOutSignRow(inx) {
            this.formOut.signature.items.splice(inx, 1);
        },
        onRefresh() {
            this.loadGetPrintTheme();
        },
        goBack() {
            const encodedOriginalPath = this.$route.query._s;
            if (encodedOriginalPath) {
                try {
                    // 关键修复：使用replace确保页面重新加载
                    this.$router.replace(encodedOriginalPath);
                } catch (err) {
                    // 降级处理：强制刷新页面
                    window.location.href = this.$router.resolve({
                        path: encodedOriginalPath,
                    }).href;
                }
            } else {
                this.$router.go(-1);
            }
        },
        onSubmit() {
            this.loadUpdateTheme();
        },
    },
    created() {
        this.query.warehouse_id = this.$route.query.warehouse_id;
        this.$globalBus.emit("updateActivePath", "/warehouse");
        this.onRefresh();
    },
};
</script>

<style scoped>
.title p {
    text-align: center;
    width: 100%;
}
.sborder {
    border: 1px dashed #b1b1b1;
    border-radius: 7px;
    padding: 8px 12px;
    text-align: center;
    margin-bottom: 15px;
}
</style>
