<template>
    <StockForm
        direction="in"
        title="修改入库单"
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
        @selectionChange="handleSelectionChange" />
</template>

<script lang="ts">
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { GetOrderDetails, UpdateOrder, GetParticulars, GetItems, InStock, GetClassification, GetWarehouses, ListSuppliers } from "../../api/index.js";
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
                submitButton: "提交更新",
                successTitle: "更新入库单成功",
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
            },
            classification: [],
            warehouses: [],
            selectedRows: [],
            supplier: [],
            query: {
                item: { name: "" },
                order_id: "",
            },
            elFormInstance: null,
            formRef: "stockInForm",
        };
    },
    mounted() {
        this.loadInitialData();
    },
    created() {
        this.query.order_id = this.$route.query.order_id;
    },
    methods: {
        /** 加载初始数据：分类、仓库、供应商 */
        loadInitialData() {
            this.loadGetOrderDetails();
            this.loadGetParticulars();
            this.loadGetClassification();
            this.loadGetWarehouses();
            this.loadListSuppliers();
            this.$globalBus.emit("updateActivePath", "/stockin");
        },

        /** 处理表单实例 */
        handleFormInstance(instance) {
            this.elFormInstance = instance;
            console.log("获取到 el-form 实例:", this.elFormInstance);
        },

        /** 加载单据信息 */
        loadGetOrderDetails() {
            GetOrderDetails({ order_id: this.query.order_id }).then((res) => {
                this.basic.classification = res.payload.classification.id;
                this.basic.warehouses = res.payload.warehouse.id;
                this.basic.supplier = res.payload.supplier.id;
                this.basic.remark = res.payload.remark;
            });
        },

        /** 加载单据的物品明细 */
        loadGetParticulars() {
            GetParticulars({ oid: this.query.order_id })
                .then((res) => {
                    // 检查响应结构的完整性
                    if (!res || !res.payload || !Array.isArray(res.payload.items)) {
                        console.error("接口返回格式不符合预期", res);
                        return;
                    }
                    // 清空现有列表，避免重复加载
                    this.basic.items = [];
                    // 遍历items数组并提取所需字段
                    res.payload.items.forEach((item) => {
                        // 提取物品详情并添加到数组
                        this.basic.items.push({
                            id: item.item?.id || "",
                            name: item.item?.name || "",
                            sku: item.item?.sku || "",
                            property: item.item?.property || "",
                            specification: item.item?.specification || "",
                            unit: item.item?.unit || "",
                            quantity: item.detailedly?.quantity || "0",
                            warehouseId: item.warehouse?.id || "",
                            warehouseName: item.warehouse?.name || "",
                        });
                    });
                })
                .catch((err) => {
                    let msg = err.data?.metadata?.message || "未知错误";
                    this.$message.error("加载详情数据失败：" + msg);
                });
        },

        /** 加载入库类型数据 */
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

        /** 加载仓库数据 */
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

        /** 加载供应商数据 */
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

        /** 加载物品数据列表 - 包含已选物品禁用判断 */
        loadGetItems(page_size, page) {
            this.loading = true;
            const params = { ...convertToLimitOffset(page, page_size) };
            if (this.query.item.name) Object.assign(params, { name: this.query.item.name });

            withDelay(() => GetItems(params))
                .then((res) => {
                    // 获取当前已选择的物品ID列表
                    const selectedIds = this.basic.items.map((item) => item.id);

                    // 为每个物品添加isDisabled属性，标记是否已选择
                    this.items = res.payload.items.map((item) => ({
                        ...item,
                        isDisabled: selectedIds.includes(item.id),
                    }));

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

        /** 处理页码变化 */
        onCurrentChange(p) {
            this.page = p;
            this.loadGetItems(this.pageSize, p);
        },

        /** 处理每页条数变化 */
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadGetItems(s, 1);
        },

        /** 打开添加物品弹窗 - 刷新物品列表确保禁用状态正确 */
        onOpenAdditem() {
            this.query.item.name = "";
            this.selectItem.dialogVisible = true;
            // 每次打开弹窗时重新加载物品列表
            this.loadGetItems(this.pageSize, this.page);
        },

        /** 关闭添加物品弹窗 */
        onCloseItem() {
            this.selectItem.dialogVisible = false;
        },

        /** 处理选择项变化 */
        handleSelectionChange(rows) {
            this.selectedRows = rows;
        },

        /** 添加选中的物品到列表 - 添加后刷新列表 */
        onAddItemTolist() {
            if (!this.selectedRows.length) {
                this.$message.warning(msgcon("请选择物品"));
                return;
            }

            const existingIds = this.basic.items.map((item) => item.id);
            const newItems = this.selectedRows.filter((item) => !existingIds.includes(item.id)).map((item) => ({ ...item, quantity: "" }));

            this.basic.items.push(...newItems);
            this.selectItem.dialogVisible = false;

            // 添加完成后刷新物品列表，更新禁用状态
            this.loadGetItems(this.pageSize, this.page);
        },

        /** 从列表中移除物品 - 移除后刷新列表（如果弹窗打开） */
        onRemoveItemlist(index) {
            this.basic.items.splice(index, 1);
            // 如果弹窗是打开状态，刷新物品列表以更新禁用状态
            if (this.selectItem.dialogVisible) {
                this.loadGetItems(this.pageSize, this.page);
            }
        },

        /** 搜索物品 */
        onSearch() {
            this.page = 1;
            if (this.query.item.name) {
                this.loadGetItems(this.pageSize, 1);
            } else {
                this.$message.warning(msgcon("请输入检索条件"));
            }
        },

        /** 验证基础表单 */
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

        /** 验证入库单表单 */
        async valiInStockForm() {
            return new Promise((resolve) => {
                if (!this.basic.items.length) {
                    this.$message.warning(msgcon("请添加物品"));
                    resolve(false);
                    return;
                }

                // 验证数量是否为有效数字
                for (const item of this.basic.items) {
                    if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
                        this.$message.warning(`物品"${item.name}"的数量必须为正数`);
                        resolve(false);
                        return;
                    }
                }

                resolve(true);
            });
        },

        /** 提交入库单 */
        async onSubmitInStock() {
            const basicValid = await this.valiBasicForm();
            if (!basicValid) return;

            const stockValid = await this.valiInStockForm();
            if (!stockValid) return;

            this.loadUpdateOrder(this.query.order_id);
        },

        /** 执行更新操作 */
        loadUpdateOrder(order_id) {
            this.basic.loading = true;
            const items = this.basic.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
            }));
            const data = {
                warehouse: { id: this.basic.warehouses },
                classification: { id: this.basic.classification },
                supplier: { id: this.basic.supplier },
                item: items,
                remark: this.basic.remark,
            };
            const paths = { order_id: order_id };

            withDelay(() => UpdateOrder(paths, data))
                .then(() => {
                    this.result = true;
                })
                .catch((err) => {
                    console.error("更新入库单失败:", err);
                    let msg = err.data.metadata.message;
                    this.$message.error(msgcon(msg));
                })
                .finally(() => {
                    this.basic.loading = false;
                });
        },

        /** 取消操作，返回列表页 */
        onCancel() {
            this.$router.push({ name: "stockin" });
        },

        /** 刷新基础数据 */
        onRefreshBasicData() {
            this.loadGetClassification();
            this.loadGetWarehouses();
            this.loadListSuppliers();
            this.$message.success(msgcon("数据已刷新"));
        },
    },
};
</script>
