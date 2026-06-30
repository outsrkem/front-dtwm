<template>
    <el-card class="box-card">
        <template #header>
            <div class="my_refresh">
                <div>
                    <span>{{ title }}</span>
                </div>
            </div>
        </template>

        <div v-if="!result" v-loading="formData.loading">
            <el-form ref="formRef" label-position="left" :inline="isDesktop" :rules="rules" label-width="auto" :model="formData" class="form-inline">
                <!-- 业务类型选择 -->
                <el-form-item :label="labels.classification" prop="classification">
                    <el-select style="width: 200px" v-model="formData.classification" placeholder="选择类型" clearable filterable>
                        <el-option v-for="(item, inx) in classifications" :key="inx" :label="item.name" :value="item.id" />
                    </el-select>
                </el-form-item>

                <!-- 仓库选择 -->
                <el-form-item :label="labels.warehouse" prop="warehouses">
                    <el-select style="width: 260px" v-model="formData.warehouses" placeholder="选择仓库" clearable filterable>
                        <el-option v-for="(item, inx) in warehouses" :key="inx" :label="item.name" :value="item.id" />
                    </el-select>
                </el-form-item>

                <!-- 供应商/领用单位选择 -->
                <el-form-item :label="labels.supplier" prop="supplier">
                    <el-space>
                        <el-select style="width: 260px" v-model="formData.supplier" placeholder="选择往来单位" clearable filterable>
                            <el-option v-for="(item, inx) in suppliers" :key="inx" :label="item.name" :value="item.id">
                                <span style="float: left">{{ item.name }}</span>
                                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                                    {{ item.person }}
                                </span>
                            </el-option>
                        </el-select>
                        <el-button style="font-size: 19px; padding-left: 8px; padding-right: 8px" :icon="Refresh" @click="$emit('refresh')" />
                    </el-space>
                </el-form-item>

                <!-- 补历史单功能 -->
                <el-form-item label="补历史单">
                    <el-space>
                        <el-checkbox v-model="localHistorySupplement" @change="handleHistoryChange" />
                        <el-date-picker
                            :disabled="!localHistorySupplement"
                            :disabled-date="disabledFutureDate"
                            :show-now="false"
                            v-model="historyTime"
                            type="datetime"
                            placeholder="选择出入库时间"
                            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" />
                    </el-space>
                </el-form-item>
            </el-form>

            <!-- 物品列表 -->
            <div style="width: 100%">
                <table>
                    <thead>
                        <tr>
                            <th style="min-width: 20px"></th>
                            <th v-if="direction === 'out'">
                                <el-text>{{ labels.tableWarehouse }}</el-text>
                            </th>
                            <th>
                                <el-text>{{ labels.tableName }}</el-text>
                            </th>
                            <th>
                                <el-text>{{ labels.tableProperty }}</el-text>
                            </th>
                            <th>
                                <el-text>{{ labels.tableSpecification }}</el-text>
                            </th>
                            <th>
                                <el-text>{{ labels.tableUnit }}</el-text>
                            </th>
                            <template v-if="direction === 'out'">
                                <th>
                                    <el-text>{{ labels.tableTotalStock }}</el-text>
                                </th>
                                <th>
                                    <el-text>{{ labels.tableLockedStock }}</el-text>
                                </th>
                                <th>
                                    <el-text>{{ labels.tableAvailableStock }}</el-text>
                                </th>
                            </template>
                            <th>
                                <el-text>{{ labels.tableQuantity }}</el-text>
                            </th>
                            <th>
                                <el-text>{{ labels.tableOperation }}</el-text>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, inx) in formData.items" :key="inx">
                            <td>{{ inx + 1 }}</td>
                            <td v-if="direction === 'out'">{{ item.warehouse?.name }}</td>
                            <td>{{ item.name }}</td>
                            <td>{{ item.property }}</td>
                            <td>{{ item.specification }}</td>
                            <td>{{ item.unit }}</td>
                            <!-- 出库特有字段 -->
                            <template v-if="direction === 'out'">
                                <td>{{ item.current }}</td>
                                <td>{{ item.lock }}</td>
                                <td>{{ item.available }}</td>
                            </template>
                            <td>
                                <el-input
                                    v-model="formData.items[inx].quantity"
                                    placeholder="数据范围: (0, 999999.9999], 最大保留4位小数"
                                    @input="handleQuantityInput(inx)" />
                            </td>
                            <td>
                                <el-button link type="primary" @click="$emit('removeItem', inx)">
                                    {{ labels.removeButton }}
                                </el-button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div style="padding-top: 10px; padding-left: 10px">
                    <el-button type="primary" link :icon="Plus" @click="$emit('openAddItem')">
                        {{ labels.addItemButton }}
                    </el-button>
                </div>
            </div>

            <!-- 备注信息 -->
            <div style="padding-top: 10px">
                <el-form label-position="left" label-width="auto" :model="formData">
                    <el-form-item :label="labels.remark" label-position="left">
                        <el-input v-model="formData.remark" />
                    </el-form-item>
                </el-form>
            </div>

            <!-- 操作按钮 -->
            <div>
                <el-button bg text @click="$emit('cancel')" style="width: 120px">{{ labels.cancelButton }}</el-button>
                <el-button type="primary" @click="handleSubmit" style="width: 120px">{{ labels.submitButton }}</el-button>
            </div>
        </div>

        <!-- 提交结果 -->
        <div v-else>
            <el-result icon="success" :title="labels.successTitle">
                <template #extra>
                    <el-button style="width: 120px" type="primary" @click="$emit('cancel')">{{ labels.confirmButton }}</el-button>
                </template>
            </el-result>
        </div>

        <!-- 选择物品弹窗 -->
        <el-dialog v-model="selectItem.dialogVisible" width="1200" :title="labels.selectItemTitle" :draggable="isDesktop">
            <div>
                <el-space>
                    <el-input style="width: 340px" v-model="query.item.name" :placeholder="labels.searchPlaceholder" clearable @change="$emit('search')">
                        <template #prefix>
                            <el-icon class="el-input__icon"><Search /></el-icon>
                        </template>
                    </el-input>
                    <div class="warning-desc">
                        <p data-text="下架物品不允许出入库">下架物品不允许出入库</p>
                    </div>
                </el-space>
            </div>

            <el-table :data="items" style="width: 100%" @selection-change="$emit('selectionChange', $event)" v-loading="loading">
                <el-table-column type="selection" width="55" :selectable="(row) => !selectedItemIds.includes(row.id)" />
                <el-table-column v-if="direction === 'out'" prop="warehouse.name" :label="labels.tableWarehouse" show-overflow-tooltip />
                <el-table-column prop="name" :label="labels.tableName" show-overflow-tooltip />
                <el-table-column v-if="direction === 'out'" prop="available" :label="labels.tableAvailableStock" show-overflow-tooltip />
                <el-table-column prop="property" :label="labels.tableProperty" show-overflow-tooltip />
                <el-table-column prop="specification" :label="labels.tableSpecification" show-overflow-tooltip />
                <el-table-column prop="unit" :label="labels.tableUnit" show-overflow-tooltip />
                <el-table-column prop="status" :label="labels.tableStatus" show-overflow-tooltip>
                    <template #default="scope">
                        <span class="status-dot" :class="scope.row.status === 1 ? 'usable' : 'unusable'" />
                        <span v-if="scope.row.status === 1">上架</span>
                        <span v-else>下架</span>
                    </template>
                </el-table-column>
                <el-table-column v-if="direction === 'in'" prop="create_time" :label="labels.tableUpdateTime" show-overflow-tooltip>
                    <template #default="scope">{{ formatDate(scope.row.create_time) }}</template>
                </el-table-column>
            </el-table>

            <div class="pagination">
                <div style="display: flex; justify-content: space-between">
                    <pagination
                        :pageTotal="pageTotal"
                        :pageSize="pageSize"
                        @CurrentChange="$emit('pageChange', $event)"
                        @SizeChange="$emit('sizeChange', $event)" />
                    <span>
                        <el-button style="width: 120px" bg text @click="$emit('closeItem')">{{ labels.cancelButton }}</el-button>
                        <el-button style="width: 120px" type="primary" @click="$emit('addSelectedItems')">{{ labels.confirmButton }}</el-button>
                    </span>
                </div>
            </div>
        </el-dialog>
    </el-card>
</template>

<script lang="ts">
import { ElMessageBox } from "element-plus";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import pagination from "../../components/pagination/pagination.vue";
import { formatTime } from "../../utils/date.js";
import { msgcon } from "../../utils/message.js";

export default {
    name: "StockForm",
    components: { pagination },
    props: {
        result: {
            type: Boolean,
            default: false,
        },
        direction: {
            type: String,
            required: true,
            validator: (val) => ["in", "out"].includes(val),
        },
        title: {
            type: String,
            required: true,
        },
        labels: {
            type: Object,
            default: () => ({
                classification: "业务类型",
                warehouse: "仓库",
                supplier: "往来单位",
                remark: "备注",
                tableWarehouse: "仓库",
                tableName: "名称",
                tableProperty: "属性",
                tableSpecification: "规格",
                tableUnit: "单位",
                tableStatus: "状态",
                tableTotalStock: "总库存",
                tableLockedStock: "已锁定",
                tableAvailableStock: "可用库存",
                tableQuantity: "本次数量",
                tableOperation: "操作",
                tableUpdateTime: "更新时间",
                addItemButton: "添加物品",
                removeButton: "移除",
                submitButton: "提交",
                cancelButton: "取消",
                confirmButton: "确定",
                selectItemTitle: "选择物品",
                searchPlaceholder: "按名称搜索数据",
                successTitle: "创建成功",
            }),
        },
        isDesktop: {
            type: Boolean,
            default: true,
        },
        classifications: {
            type: Array,
            default: () => [],
        },
        warehouses: {
            type: Array,
            default: () => [],
        },
        suppliers: {
            type: Array,
            default: () => [],
        },
        items: {
            type: Array,
            default: () => [],
        },
        pageTotal: {
            type: Number,
            default: 0,
        },
        pageSize: {
            type: Number,
            default: 10,
        },
        currentPage: {
            type: Number,
            default: 1,
        },
        formData: {
            type: Object,
            default: () => ({
                loading: false,
                classification: "",
                warehouses: "",
                supplier: "",
                items: [],
                remark: "",
                isHistory: false,
                history: {
                    supplement: false,
                    operation_time: null,
                },
            }),
        },
        loading: {
            type: Boolean,
            default: false,
        },
        selectItem: {
            type: Object,
            default: () => ({
                dialogVisible: false,
                loading: true,
            }),
        },
        query: {
            type: Object,
            default: () => ({
                item: { name: "" },
            }),
        },
        // 移除 historyTime 的 rules 校验
        rules: {
            type: Object,
            default: () => ({
                classification: [{ required: true, message: "必选", trigger: "change" }],
                warehouses: [{ required: true, message: "必选", trigger: "change" }],
                supplier: [{ required: true, message: "必选", trigger: "change" }],
            }),
        },
        formRef: {
            type: String,
            default: "stockForm",
        },
        selectedItemIds: {
            type: Array,
            default: () => [],
        },
    },
    emits: [
        "submit",
        "cancel",
        "refresh",
        "removeItem",
        "openAddItem",
        "closeItem",
        "search",
        "pageChange",
        "sizeChange",
        "addSelectedItems",
        "selectionChange",
        "formInstance",
        "update:historySupplement",
    ],
    data() {
        return {
            historyTime: this.formData.history.operation_time || null,
            localHistorySupplement: this.formData?.history?.supplement || false,
        };
    },
    setup() {
        return { Plus, Refresh, Search };
    },
    watch: {
        "formData.history.supplement": {
            handler(newVal) {
                this.localHistorySupplement = newVal;
                this.historyTime = this.formData.history.operation_time;
            },
            immediate: true,
        },

        // 核心：监听 historyTime 自动补时间，不用change
        historyTime(newVal, oldVal) {
            // 清空时间时同步formData
            if (!newVal) {
                this.formData.history.operation_time = null;
                return;
            }
            if (!this.localHistorySupplement) return;
            // 避免循环监听：新旧值格式化后一样就不处理
            if (newVal === oldVal) return;

            const date = new Date(newVal);
            // 仅当时分秒都是0时，才填充当前时间
            if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
                const now = new Date();
                date.setHours(now.getHours());
                date.setMinutes(now.getMinutes());
                date.setSeconds(now.getSeconds());
                // 赋值会触发一次watch，靠上面newVal===oldVal拦截循环
                this.historyTime = date.toISOString();
            }

            // 同步到formData
            if (this.formData?.history) {
                this.formData.history.operation_time = this.historyTime;
            }
        },
    },
    mounted() {
        // 确保formData和history属性存在
        if (!this.formData) {
            this.formData = {
                loading: false,
                classification: "",
                warehouses: "",
                supplier: "",
                items: [],
                remark: "",
                isHistory: false,
                history: {
                    supplement: false,
                    operation_time: null,
                },
            };
        } else if (!this.formData.history) {
            this.formData.history = {
                supplement: false,
                operation_time: null,
            };
        }
        console.log("=====", this.formData.history);
        const a = this.formData.history;
        this.historyTime = a.operation_time;
        this.$emit("formInstance", this.$refs.formRef);
    },
    methods: {
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
        },
        disabledFutureDate(date) {
            // 今天及之前的日期可选，未来日期禁用
            return date && date > new Date(new Date().setHours(23, 59, 59, 999));
        },
        handleHistoryChange(checked) {
            if (!this.formData.history) {
                this.formData.history = {
                    supplement: false,
                    operation_time: null,
                };
            }

            this.localHistorySupplement = checked;
            this.$emit("update:historySupplement", checked);
            this.formData.isHistory = checked;
            this.formData.history.supplement = checked;

            if (!checked) {
                this.historyTime = null;
                this.formData.history.operation_time = null;
            }
            // 切换复选框后清除校验提示（如果有的话）
            if (this.$refs.formRef) {
                this.$refs.formRef.clearValidate();
            }
        },
        handleQuantityInput(index) {
            const value = this.formData.items[index].quantity;
            if (value) {
                const formatted = parseFloat(value.toString().match(/^\d*(\.?\d{0,4})/g)[0] || 0);
                this.formData.items[index].quantity = formatted;
            }
        },
        // 判断是否跨日
        isCrossDay(historyTime) {
            if (!historyTime) return false;
            const history = new Date(historyTime);
            const now = new Date();
            return history.getDate() !== now.getDate() || history.getMonth() !== now.getMonth() || history.getFullYear() !== now.getFullYear();
        },
        // 提交主逻辑
        handleSubmit() {
            // 先校验基础表单
            this.$refs.formRef.validate(async (valid) => {
                if (!valid) return;

                // 校验物品列表
                if (!this.formData.items || this.formData.items.length === 0) {
                    this.$message.warning(msgcon("请至少添加一个物品"));
                    return;
                }

                // 手动校验补历史单逻辑
                if (this.localHistorySupplement && !this.historyTime) {
                    this.$message.warning(msgcon("勾选补历史单必须选择出入库时间"));
                    return;
                }

                // 如果勾选了补历史单且选择了时间，但未跨日 → 弹窗提示
                if (this.localHistorySupplement && this.historyTime && !this.isCrossDay(this.historyTime)) {
                    try {
                        await ElMessageBox.confirm("历史单所选时间较近，不建议补历史单，是否继续？", "提示", {
                            confirmButtonText: "继续提交",
                            cancelButtonText: "返回修改",
                            type: "warning",
                            draggable: true,
                        });
                        // 用户选择继续提交
                        this.doRealSubmit();
                    } catch {
                        // 用户选择返回修改，不做任何操作
                        return;
                    }
                } else {
                    // 未启用补历史单 或 已跨日 → 直接提交
                    this.doRealSubmit();
                }
            });
        },

        // 执行提交
        doRealSubmit() {
            const submitData = {
                history: {
                    supplement: this.formData?.history?.supplement || false,
                    operation_time: this.historyTime || null,
                },
                warehouse: {
                    id: this.formData.warehouses,
                },
                classification: {
                    id: this.formData.classification,
                },
                supplier: {
                    id: this.formData.supplier,
                },
                item: this.formData.items.map((item) => ({
                    id: item.id,
                    quantity: item.quantity || 0,
                })),
                remark: this.formData.remark || "",
            };
            this.$emit("submit", submitData);
        },
    },
};
</script>

<style scoped>
.form-inline .el-input {
    --el-input-width: 330px;
}
.form-inline .el-select {
    --el-select-width: 330px;
}
table {
    border-collapse: collapse;
    width: 100%;
    margin: 0px auto;
    border: 1px solid #ddd;
}
th,
td {
    border: 1px solid #ddd;
    padding: 5px;
    text-align: left;
}
th {
    height: 35px;
    background-color: #f2f2f2;
    font-weight: bold;
}
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
.warning-desc {
    width: 500px;
    padding-left: 10px;
    padding-right: 10px;
    border: 1px solid #ffb300e8;
    background-color: #fff3cd;
    border-radius: 5px;
    overflow: hidden;
    white-space: nowrap;
    position: relative;
    min-height: 28px;
}
.warning-desc p {
    margin: 4px 0;
    font-size: 14px;
    color: mediumblue;
    line-height: 1.5;
    display: inline-block;
    animation: scroll-left 15s linear infinite;
    animation-play-state: running;
}
.warning-desc p::after {
    content: attr(data-text);
    margin-left: 30px;
}
@keyframes scroll-left {
    0% {
        transform: translateX(100%);
    }
    100% {
        transform: translateX(calc(-100% - 30px));
    }
}
.warning-desc:hover p {
    animation-play-state: running !important;
}
</style>
