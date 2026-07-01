<template>
    <StockForm
        direction="in"
        title="创建入库单"
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
        @submit="onSubmitInStock"
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
import { GetItems, InStock, GetClassification, GetWarehouses, ListSuppliers } from "../../api/index.js";
import StockForm from "../../components/stock/StockForm.vue";
import { msgcon } from "../../utils/message.js";

export default {
    name: "InWarehouseContainer",
    components: { StockForm },
    data() {
        return {
            result: false,
            loading: false,
            formLabels: {
                classification: "入库类型",
                warehouse: "入库仓库",
                supplier: "供应商",
                remark: "入库备注",
                tableQuantity: "本次入库数量",
                addItemButton: "添加入库物品",
                submitButton: "创建入库单",
                successTitle: "入库单创建成功",
                selectItemTitle: "选择入库物品",
                tableName: "物品名称",
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
                classification: [{ required: true, message: "请选择入库类型", trigger: "change" }],
                warehouses: [{ required: true, message: "请选择入库仓库", trigger: "change" }],
                supplier: [{ required: true, message: "请选择供应商", trigger: "change" }],
            },
            selectItem: {
                loading: true,
                dialogVisible: false,
            },
            pageTotal: 0,
            pageSize: 10,
            page: 1,
            items: [],
            basic: {
                loading: false,
                classification: "",
                warehouses: "",
                supplier: "",
                items: [],
                remark: "",
                // 添加history属性以存储补历史单相关信息
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
            formRef: "stockInForm",
        };
    },
    watch: {
        // 监听已选物品变化，刷新选择窗口
        "basic.items"() {
            if (this.selectItem.dialogVisible) {
                // 刷新物品列表以更新选择状态
                this.loadGetItems(this.pageSize, this.page);
            }
        },
    },
    mounted() {
        this.loadInitialData();
    },
    methods: {
        // 添加处理补历史单状态变化的方法
        handleHistorySupplementChange(checked) {
            // 确保history对象存在
            if (!this.basic.history) {
                this.basic.history = {
                    supplement: false,
                    operation_time: null,
                };
            }
            // 更新补历史单状态
            this.basic.history.supplement = checked;
        },

        loadInitialData() {
            this.loadGetClassification();
            this.loadGetWarehouses();
            this.loadListSuppliers();
            this.$globalBus.emit("updateActivePath", "/stockin");
        },

        // 获取已选物品ID列表
        getSelectedItemIds() {
            return this.basic.items.map((item) => item.id);
        },

        handleFormInstance(instance) {
            this.elFormInstance = instance;
            console.log("获取到 el-form 实例:", this.elFormInstance);
        },

        loadGetClassification() {
            GetClassification({ t: "in" })
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
                    console.error("加载供应商数据失败:", err);
                    this.$message.error(msgcon("加载供应商数据失败"));
                });
        },

        loadGetItems(page_size, page) {
            this.loading = true;
            const params = { ...convertToLimitOffset(page, page_size) };
            if (this.query.item.name) Object.assign(params, { name: this.query.item.name });

            withDelay(() => GetItems(params))
                .then((res) => {
                    this.items = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                })
                .catch((err) => {
                    console.error("加载物品数据失败:", err);
                    this.$message.error(msgcon("加载物品数据失败"));
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        onCurrentChange(p) {
            this.page = p;
            this.loadGetItems(this.pageSize, p);
        },

        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadGetItems(s, 1);
        },

        onOpenAdditem() {
            this.query.item.name = "";
            this.selectItem.dialogVisible = true;
            this.loadGetItems(this.pageSize, this.page);
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
                this.loadGetItems(this.pageSize, 1);
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

        async valiInStockForm() {
            return new Promise((resolve) => {
                if (!this.basic.items.length) {
                    this.$message.warning(msgcon("请添加物品"));
                    resolve(false);
                    return;
                }

                // 验证入库数量是否合理
                for (let i = 0; i < this.basic.items.length; i++) {
                    const item = this.basic.items[i];
                    const quantity = Number(item.quantity);

                    if (isNaN(quantity) || quantity <= 0) {
                        this.$message.warning(msgcon(`第${i + 1}个物品的入库数量必须是大于0的数字`));
                        resolve(false);
                        return;
                    }
                }

                resolve(true);
            });
        },

        async onSubmitInStock() {
            const basicValid = await this.valiBasicForm();
            if (!basicValid) return;
            const stockValid = await this.valiInStockForm();
            if (!stockValid) return;

            this.loadInStock();
        },

        loadInStock() {
            this.basic.loading = true;
            const items = this.basic.items.map((item) => ({ id: item.id, quantity: item.quantity }));
            const data = {
                warehouse: { id: this.basic.warehouses },
                classification: { id: this.basic.classification },
                supplier: { id: this.basic.supplier },
                item: items,
                remark: this.basic.remark,
                // 包含历史单相关数据
                history: this.basic.history,
            };

            withDelay(() => InStock(data))
                .then(() => {
                    this.result = true;
                })
                .catch((err) => {
                    let msg = err.data.metadata.message;
                    console.error("创建入库单失败:", err);
                    this.$message.error(msgcon("创建入库单失败" + msg));
                })
                .finally(() => {
                    this.basic.loading = false;
                });
        },

        onCancel() {
            this.$router.push({ name: "stockin" });
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
