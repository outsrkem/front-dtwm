<template>
    <StockForm
        direction="out"
        title="创建出库单"
        :labels="formLabels"
        :classifications="classification"
        :warehouses="warehouses"
        :suppliers="supplier"
        :items="items"
        :pageTotal="pageTotal"
        :pageSize="pageSize"
        :currentPage="page"
        :formData="basic"
        :loading="loading"
        :selectItem="selectItem"
        :query="query"
        :rules="rules"
        :result="result"
        :formRef="formRef"
        :selectedItemIds="getSelectedItemIds()"
        @formInstance="handleFormInstance"
        @submit="onSubmitItemOutWarehouse"
        @cancel="onCancel"
        @refresh="onRefreshBasicData"
        @removeItem="onRemoveItemlist"
        @openAddItem="onOpenAdditem"
        @closeItem="onCloseItem"
        @search="onSearch"
        @pageChange="onCurrentChange"
        @sizeChange="onSizeChange"
        @addSelectedItems="onAddItemTolist"
        @selectionChange="handleSelectionChange"
        @update:historySupplement="handleHistorySupplementChange" />
</template>

<script>
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { SelectInventory, ItemOutWarehouse, GetClassification, GetWarehouses, ListSuppliers } from "../../api/index.js";
import StockForm from "../../components/stock/StockForm.vue";
import { msgcon } from "../../utils/message.js";

export default {
    name: "OutWarehouseContainer",
    components: { StockForm },
    data() {
        return {
            result: false,
            loading: false,
            formLabels: {
                classification: "出库类型",
                warehouse: "出库仓库",
                supplier: "领用单位/人",
                remark: "出库备注",
                tableTotalStock: "总库存",
                tableLockedStock: "已锁定",
                tableQuantity: "本次出库数量",
                addItemButton: "添加出库物品",
                submitButton: "创建出库单",
                successTitle: "出库单创建成功",
                selectItemTitle: "选择出库物品",
                tableWarehouse: "仓库",
                tableName: "物品名称",
                tableAvailableStock: "可用库存",
                tableProperty: "属性",
                tableSpecification: "规格",
                tableUnit: "单位",
                tableStatus: "状态",
                tableOperation: "操作",
                removeButton: "移除",
                tableUpdateTime: "更新时间",
                searchPlaceholder: "输入物品名称搜索",
                cancelButton: "取消",
                confirmButton: "确定",
            },
            rules: {
                classification: [{ required: true, message: "请选择出库类型", trigger: "change" }],
                warehouses: [{ required: true, message: "请选择出库仓库", trigger: "change" }],
                supplier: [{ required: true, message: "请选择领用单位/人", trigger: "change" }],
            },
            selectItem: {
                loading: true,
                dialogVisible: false,
            },
            pageTotal: 0,
            pageSize: 10,
            page: 1,
            items: [],
            // 在基础数据中添加历史单相关字段
            basic: {
                loading: false,
                classification: "",
                warehouses: "",
                supplier: "",
                items: [],
                remark: "",
                // 历史单标记
                isHistory: false,
                // 历史单信息
                history: {
                    supplement: false,
                    operation_time: null,
                },
            },
            classification: [],
            warehouses: [],
            selectedRows: [],
            supplier: [],
            query: {
                item: { name: "" },
            },
            elFormInstance: null,
            formRef: "stockOutForm",
        };
    },
    watch: {
        "basic.warehouses"(newVal) {
            if (newVal && this.selectItem.dialogVisible) {
                this.loadSelectInventory(this.pageSize, this.page);
            }
        },
        "basic.items"() {
            if (this.selectItem.dialogVisible) {
                this.items = [...this.items];
            }
        },
    },
    mounted() {
        this.loadInitialData();
    },
    methods: {
        // 添加历史单状态变更处理
        handleHistorySupplementChange(checked) {
            if (!this.basic.history) {
                this.basic.history = {
                    supplement: false,
                    operation_time: null,
                };
            }
            this.basic.history.supplement = checked;
            this.basic.isHistory = checked;
        },

        getSelectedItemIds() {
            return this.basic.items.map((item) => item.id);
        },

        loadInitialData() {
            this.loadGetClassification();
            this.loadGetWarehouses();
            this.loadListSuppliers();
            this.$globalBus.emit("updateActivePath", "/stockout");
        },

        handleFormInstance(instance) {
            this.elFormInstance = instance;
            console.log("获取到 el-form 实例:", this.elFormInstance);
        },

        loadGetClassification() {
            GetClassification({ t: "out" })
                .then((res) => {
                    this.classification = res.payload.items;
                })
                .catch((err) => {
                    console.error("加载分类数据失败:", err);
                    this.$message.error(msgcon("加载分类数据失败"));
                });
        },

        loadGetWarehouses() {
            GetWarehouses()
                .then((res) => {
                    this.warehouses = res.payload.items;
                })
                .catch((err) => {
                    console.error("加载仓库数据失败:", err);
                    this.$message.error(msgcon("加载仓库数据失败"));
                });
        },

        loadListSuppliers() {
            ListSuppliers(convertToLimitOffset(1, 100))
                .then((res) => {
                    this.supplier = res.payload.items;
                })
                .catch((err) => {
                    console.error("加载客户数据失败:", err);
                    this.$message.error(msgcon("加载客户数据失败"));
                });
        },

        loadSelectInventory(page_size, page) {
            if (!this.basic.warehouses) {
                this.items = [];
                this.pageTotal = 0;
                return;
            }

            this.loading = true;
            const params = {
                ...convertToLimitOffset(page, page_size),
                wd: this.basic.warehouses,
            };

            if (this.query.item.name) Object.assign(params, { name: this.query.item.name });

            withDelay(() => SelectInventory(params))
                .then((res) => {
                    this.items = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                })
                .catch((err) => {
                    console.error("加载库存物品数据失败:", err);
                    this.$message.error(msgcon("加载库存物品数据失败"));
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        onCurrentChange(p) {
            this.page = p;
            this.loadSelectInventory(this.pageSize, p);
        },

        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadSelectInventory(s, 1);
        },

        onOpenAdditem() {
            if (!this.basic.warehouses) {
                this.$message.warning(msgcon("请先选择出库仓库"));
                return;
            }
            this.query.item.name = "";
            this.selectItem.dialogVisible = true;
            this.loadSelectInventory(this.pageSize, this.page);
        },

        onCloseItem() {
            this.selectItem.dialogVisible = false;
        },

        handleSelectionChange(rows) {
            this.selectedRows = rows;
        },

        onAddItemTolist() {
            if (!this.selectedRows.length) {
                this.$message.warning(msgcon("请选择物品"));
                return;
            }

            const existingIds = this.basic.items.map((item) => item.id);
            const newItems = this.selectedRows.filter((item) => !existingIds.includes(item.id)).map((item) => ({ ...item, quantity: "" }));

            this.basic.items.push(...newItems);
            this.selectItem.dialogVisible = false;
        },

        onRemoveItemlist(index) {
            this.basic.items.splice(index, 1);
        },

        onSearch() {
            this.page = 1;
            if (this.query.item.name) {
                this.loadSelectInventory(this.pageSize, 1);
            } else {
                this.$message.warning(msgcon("请输入检索条件"));
            }
        },

        async valiBasicForm() {
            if (!this.elFormInstance) {
                this.$message.error(msgcon("表单实例未加载，请稍后重试"));
                console.error("valiBasicForm: elFormInstance 为 null");
                return false;
            }

            try {
                await this.elFormInstance.validate();
                console.log("表单验证通过");
                return true;
            } catch (error) {
                console.log("表单验证失败:", error);
                return false;
            }
        },

        async valiItemOutWarehouseForm() {
            return new Promise((resolve) => {
                if (!this.basic.items.length) {
                    this.$message.warning(msgcon("请添加物品"));
                    resolve(false);
                    return;
                }

                for (let i = 0; i < this.basic.items.length; i++) {
                    const item = this.basic.items[i];
                    const quantity = Number(item.quantity);

                    if (isNaN(quantity) || quantity <= 0) {
                        this.$message.warning(msgcon(`第${i + 1}个物品的出库数量必须是大于0的数字`));
                        resolve(false);
                        return;
                    }

                    if (quantity > item.available) {
                        this.$message.warning(msgcon(`第${i + 1}个物品的出库数量超过可用库存`));
                        resolve(false);
                        return;
                    }
                }

                resolve(true);
            });
        },

        async onSubmitItemOutWarehouse() {
            const basicValid = await this.valiBasicForm();
            if (!basicValid) return;

            const stockValid = await this.valiItemOutWarehouseForm();
            if (!stockValid) return;

            if (basicValid && stockValid) {
                this.loadItemOutWarehouse();
            }
        },

        loadItemOutWarehouse() {
            this.basic.loading = true;
            const items = this.basic.items.map((item) => ({ id: item.id, quantity: item.quantity }));
            const data = {
                warehouse: { id: this.basic.warehouses },
                classification: { id: this.basic.classification },
                supplier: { id: this.basic.supplier },
                item: items,
                remark: this.basic.remark,
                // 包含历史单数据
                history: this.basic.history,
            };

            withDelay(() => ItemOutWarehouse(data))
                .then(() => {
                    this.result = true;
                })
                .catch((err) => {
                    let msg = err.data.metadata.message;
                    this.$message.error(msgcon("创建出库单失败" + msg));
                })
                .finally(() => {
                    this.basic.loading = false;
                });
        },

        onCancel() {
            this.$router.push({ name: "stockout" });
        },

        onRefreshBasicData() {
            this.loadGetClassification();
            this.loadGetWarehouses();
            this.loadListSuppliers();
            this.$message.success(msgcon("数据已刷新"));
        },
    },
};
</script>
