<template>
    <StockForm
        direction="out"
        title="修改出库单"
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
        @submit="onSubmitOutStock"
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
import { GetOrderDetails, UpdateOrder, GetParticulars, SelectInventory, GetClassification, GetWarehouses, ListSuppliers } from "../../api/index.js";
import StockForm from "../../components/stock/StockForm.vue";
import { msgcon } from "../../utils/message.js";
import { formatTime } from "../../utils/date.js";

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
                submitButton: "提交更新",
                successTitle: "更新出库单成功",
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
            basic: {
                loading: false,
                classification: "",
                warehouses: "",
                supplier: "",
                items: [],
                remark: "",
                // 新增历史单相关字段
                isHistory: false,
                history: {
                    supplement: false, // 是否为历史单（对应接口supplement字段）
                    operation_time: null, // 历史单操作时间（对应接口operation_time字段）
                },
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
            formRef: "stockOutForm",
        };
    },
    mounted() {
        this.loadInitialData();
    },
    created() {
        this.query.order_id = this.$route.query.order_id;
    },
    methods: {
        /** 处理历史单状态变更 */
        handleHistorySupplementChange(checked) {
            this.basic.history.supplement = checked;
            this.basic.isHistory = checked;
        },

        /** 加载初始数据：分类、仓库、供应商、订单详情 */
        loadInitialData() {
            this.loadGetOrderDetails();
            this.loadGetParticulars();
            this.loadGetClassification();
            this.loadGetWarehouses();
            this.loadListSuppliers();
            this.$globalBus.emit("updateActivePath", "/stockout");
        },

        /** 处理表单实例 */
        handleFormInstance(instance) {
            this.elFormInstance = instance;
            console.log("获取到 el-form 实例:", this.elFormInstance);
        },

        /** 加载单据信息 - 包含历史单状态和时间 */
        loadGetOrderDetails() {
            GetOrderDetails({ order_id: this.query.order_id }).then((res) => {
                const payload = res.payload;

                // 基础订单信息
                this.basic.classification = payload.classification.id;
                this.basic.warehouses = payload.warehouse.id;
                this.basic.supplier = payload.supplier.id;
                this.basic.remark = payload.remark;

                // 历史单信息处理
                // supplement: 0代表正常单，1代表历史单
                this.basic.history.supplement = payload.supplement === 1;
                this.basic.isHistory = payload.supplement === 1;

                // 处理历史时间（operation_time是毫秒时间戳）
                if (payload.operation_time) {
                    // 转换时间戳为ISO格式字符串，适配日期选择器
                    this.basic.history.operation_time = formatTime(payload.operation_time).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
                }
            });
        },

        /** 加载单据的物品明细 */
        loadGetParticulars() {
            GetParticulars({ limit: 100, oid: this.query.order_id })
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
                            warehouse: {
                                id: item.warehouseId || item.warehouse?.id || "",
                                name: item.warehouseName || item.warehouse?.name || "",
                            },
                            // 出库特有字段
                            current: item.item.current || 0,
                            lock: item.item.lock || 0,
                            available: item.item.available || 0,
                        });
                    });
                })
                .catch((err) => {
                    let msg = err.data?.metadata?.message || "未知错误";
                    this.$message.error("加载详情数据失败：" + msg);
                });
        },

        /** 加载出库类型数据 */
        loadGetClassification() {
            GetClassification({ t: "out" }) // 改为"out"获取出库类型
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

        /** 加载领用单位/人数据 */
        loadListSuppliers() {
            ListSuppliers(convertToLimitOffset(1, 100))
                .then((res) => {
                    this.supplier = res.payload.items;
                })
                .catch((err) => {
                    console.error("加载领用单位数据失败:", err);
                    this.$message.error(msgcon("加载领用单位数据失败"));
                });
        },

        // 加载库存物品数据（出库特有，需要关联仓库）
        loadSelectInventory(page_size, page) {
            // 验证仓库是否已选择，未选择则清空列表
            if (!this.basic.warehouses) {
                this.items = [];
                this.pageTotal = 0;
                return;
            }

            this.loading = true;
            // 构建请求参数：分页信息 + 仓库ID
            const params = {
                ...convertToLimitOffset(page, page_size),
                wd: this.basic.warehouses,
            };

            // 如果有搜索关键词，添加到参数中
            if (this.query.item.name) Object.assign(params, { name: this.query.item.name });

            // 调用接口获取库存物品列表，withDelay用于添加延迟避免频繁请求
            withDelay(() => SelectInventory(params))
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
                    console.error("加载库存物品数据失败:", err);
                    this.$message.error(msgcon("加载库存物品数据失败"));
                })
                .finally(() => {
                    this.loading = false; // 无论成功失败，结束加载状态
                });
        },

        /** 处理页码变化 */
        onCurrentChange(p) {
            this.page = p;
            this.loadSelectInventory(this.pageSize, p);
        },

        /** 处理每页条数变化 */
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1;
            this.loadSelectInventory(s, 1);
        },

        /** 打开添加物品弹窗 - 刷新物品列表确保禁用状态正确 */
        onOpenAdditem() {
            this.query.item.name = "";
            this.selectItem.dialogVisible = true;
            // 每次打开弹窗时重新加载物品列表
            this.loadSelectInventory(this.pageSize, this.page);
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
            const newItems = this.selectedRows
                .filter((item) => !existingIds.includes(item.id))
                .map((item) => ({
                    ...item,
                    quantity: "",
                }));

            this.basic.items.push(...newItems);
            this.selectItem.dialogVisible = false;

            // 添加完成后刷新物品列表，更新禁用状态
            this.loadSelectInventory(this.pageSize, this.page);
        },

        /** 从列表中移除物品 - 移除后刷新列表（如果弹窗打开） */
        onRemoveItemlist(index) {
            this.basic.items.splice(index, 1);
            // 如果弹窗是打开状态，刷新物品列表以更新禁用状态
            if (this.selectItem.dialogVisible) {
                this.loadSelectInventory(this.pageSize, this.page);
            }
        },

        /** 搜索物品 */
        onSearch() {
            this.page = 1;
            if (this.query.item.name) {
                this.loadSelectInventory(this.pageSize, 1);
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

        /** 验证出库单表单 */
        async valiOutStockForm() {
            return new Promise((resolve) => {
                if (!this.basic.items.length) {
                    this.$message.warning(msgcon("请添加物品"));
                    resolve(false);
                    return;
                }

                // 验证数量是否为有效数字且不超过可用库存
                for (const item of this.basic.items) {
                    if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
                        this.$message.warning(`物品"${item.name}"的数量必须为正数`);
                        resolve(false);
                        return;
                    }

                    // 出库特有验证：检查是否超过可用库存
                    if (Number(item.quantity) > Number(item.available)) {
                        this.$message.warning(`物品"${item.name}"的出库数量不能超过可用库存(${item.available})`);
                        resolve(false);
                        return;
                    }
                }

                // 历史单验证：如果是历史单，必须选择历史时间
                if (this.basic.history.supplement && !this.basic.history.operation_time) {
                    this.$message.warning(msgcon("请选择历史单操作时间"));
                    resolve(false);
                    return;
                }

                resolve(true);
            });
        },

        /** 提交出库单 */
        async onSubmitOutStock() {
            const basicValid = await this.valiBasicForm();
            if (!basicValid) return;

            const stockValid = await this.valiOutStockForm();
            if (!stockValid) return;

            this.loadUpdateOrder(this.query.order_id);
        },

        /** 执行更新操作 - 包含历史单数据 */
        loadUpdateOrder(order_id) {
            this.basic.loading = true;
            const items = this.basic.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
            }));

            // 处理历史单数据
            let historyData = {
                supplement: this.basic.history.supplement ? 1 : 0, // 转换为0/1格式
                operation_time: null,
            };

            // 如果是历史单且有时间，转换为时间戳
            if (this.basic.history.supplement && this.basic.history.operation_time) {
                historyData.operation_time = new Date(this.basic.history.operation_time).getTime();
            }

            const data = {
                warehouse: { id: this.basic.warehouses },
                classification: { id: this.basic.classification },
                supplier: { id: this.basic.supplier },
                item: items,
                remark: this.basic.remark,
                // 包含历史单数据
                history: this.basic.history,
            };
            const paths = { order_id: order_id };

            withDelay(() => UpdateOrder(paths, data))
                .then(() => {
                    this.result = true;
                })
                .catch((err) => {
                    console.error("更新出库单失败:", err);
                    let msg = err.data.metadata.message;
                    this.$message.error(msgcon(msg));
                })
                .finally(() => {
                    this.basic.loading = false;
                });
        },

        /** 取消操作，返回列表页 */
        onCancel() {
            this.$router.push({ name: "stockout" });
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
