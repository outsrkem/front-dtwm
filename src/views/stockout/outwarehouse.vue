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
        @selectionChange="handleSelectionChange" />
</template>

<script lang="ts">
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
            // 表单内所有文本标签的定义，便于国际化和统一修改
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
            // 表单验证规则
            rules: {
                classification: [{ required: true, message: "请选择出库类型", trigger: "change" }],
                warehouses: [{ required: true, message: "请选择出库仓库", trigger: "change" }],
                supplier: [{ required: true, message: "请选择领用单位/人", trigger: "change" }],
            },
            // 选择物品弹窗的状态
            selectItem: {
                loading: true, // 弹窗内加载状态
                dialogVisible: false, // 弹窗显示/隐藏
            },
            pageTotal: 0, // 分页总条数
            pageSize: 10, // 每页显示条数
            page: 1, // 当前页码
            items: [], // 可选物品列表（从接口获取）
            // 表单核心数据
            basic: {
                loading: false, // 表单提交加载状态
                classification: "", // 选中的出库类型ID
                warehouses: "", // 选中的仓库ID
                supplier: "", // 选中的领用单位/人ID
                items: [], // 已选择的出库物品列表
                remark: "", // 出库备注
            },
            classification: [], // 出库类型数据列表
            warehouses: [], // 仓库数据列表
            selectedRows: [], // 弹窗中选中的物品行
            supplier: [], // 领用单位/人数据列表
            // 查询条件
            query: {
                item: { name: "" }, // 物品名称搜索
            },
            elFormInstance: null, // 表单实例引用
            formRef: "stockOutForm", // 表单引用标识
        };
    },
    watch: {
        // 监听仓库变化，当仓库改变且弹窗打开时，重新加载库存物品
        "basic.warehouses"(newVal) {
            if (newVal && this.selectItem.dialogVisible) {
                this.loadSelectInventory(this.pageSize, this.page);
            }
        },
        // 监听已选物品变化，当物品列表变化且弹窗打开时，刷新禁用状态
        "basic.items"(newVal) {
            if (this.selectItem.dialogVisible) {
                // 通过解构赋值触发列表重新渲染，更新禁用状态
                this.items = [...this.items];
            }
        },
    },
    mounted() {
        // 组件挂载后加载初始数据
        this.loadInitialData();
    },
    methods: {
        // 获取已选物品的ID列表，用于子组件判断是否禁用已选物品
        getSelectedItemIds() {
            return this.basic.items.map((item) => item.id);
        },

        // 加载初始数据：分类、仓库、领用单位/人
        loadInitialData() {
            this.loadGetClassification();
            this.loadGetWarehouses();
            this.loadListSuppliers();
            // 通知全局总线更新当前活跃路径
            this.$globalBus.emit("updateActivePath", "/stockout");
        },

        // 处理表单实例，保存到本地变量
        handleFormInstance(instance) {
            this.elFormInstance = instance;
            console.log("获取到 el-form 实例:", this.elFormInstance);
        },

        // 加载出库类型数据
        loadGetClassification() {
            GetClassification()
                .then((res) => {
                    this.classification = res.payload.items;
                })
                .catch((err) => {
                    console.error("加载分类数据失败:", err);
                    this.$message.error(msgcon("加载分类数据失败"));
                });
        },

        // 加载仓库数据
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

        // 加载领用单位/人数据（复用了supplier变量名）
        loadListSuppliers() {
            // 调用接口，获取第1页，100条数据
            ListSuppliers(convertToLimitOffset(1, 100))
                .then((res) => {
                    this.supplier = res.payload.items;
                })
                .catch((err) => {
                    console.error("加载客户数据失败:", err);
                    this.$message.error(msgcon("加载客户数据失败"));
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
                    this.items = res.payload.items;
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

        // 处理页码变化
        onCurrentChange(p) {
            this.page = p;
            this.loadSelectInventory(this.pageSize, p);
        },

        // 处理每页条数变化
        onSizeChange(s) {
            this.pageSize = s;
            this.page = 1; // 重置到第1页
            this.loadSelectInventory(s, 1);
        },

        // 打开添加物品弹窗
        onOpenAdditem() {
            // 验证仓库是否已选择，未选择则提示
            if (!this.basic.warehouses) {
                this.$message.warning(msgcon("请先选择出库仓库"));
                return;
            }
            // 重置搜索条件，显示弹窗，加载物品列表
            this.query.item.name = "";
            this.selectItem.dialogVisible = true;
            this.loadSelectInventory(this.pageSize, this.page);
        },

        // 关闭添加物品弹窗
        onCloseItem() {
            this.selectItem.dialogVisible = false;
        },

        // 处理选择项变化，保存选中的行
        handleSelectionChange(rows) {
            this.selectedRows = rows;
        },

        // 添加选中的物品到已选列表
        onAddItemTolist() {
            // 验证是否有选中物品
            if (!this.selectedRows.length) {
                this.$message.warning(msgcon("请选择物品"));
                return;
            }

            // 过滤掉已存在的物品，避免重复添加
            const existingIds = this.basic.items.map((item) => item.id);
            const newItems = this.selectedRows.filter((item) => !existingIds.includes(item.id)).map((item) => ({ ...item, quantity: "" })); // 初始化数量为空

            // 添加新物品到已选列表，关闭弹窗
            this.basic.items.push(...newItems);
            this.selectItem.dialogVisible = false;
        },

        // 从已选列表中移除物品
        onRemoveItemlist(index) {
            this.basic.items.splice(index, 1);
        },

        // 搜索物品
        onSearch() {
            this.page = 1; // 搜索时重置到第1页
            if (this.query.item.name) {
                this.loadSelectInventory(this.pageSize, 1);
            } else {
                this.$message.warning(msgcon("请输入检索条件"));
            }
        },

        // 验证基础表单（出库类型、仓库、领用单位）
        async valiBasicForm() {
            // 验证表单实例是否存在
            if (!this.elFormInstance) {
                this.$message.error(msgcon("表单实例未加载，请稍后重试"));
                console.error("valiBasicForm: elFormInstance 为 null");
                return false;
            }

            try {
                // 调用表单验证方法
                await this.elFormInstance.validate();
                console.log("表单验证通过");
                return true;
            } catch (error) {
                console.log("表单验证失败:", error);
                return false;
            }
        },

        // 验证出库物品表单（数量合理性等）
        async valiItemOutWarehouseForm() {
            return new Promise((resolve) => {
                // 验证是否添加了物品
                if (!this.basic.items.length) {
                    this.$message.warning(msgcon("请添加物品"));
                    resolve(false);
                    return;
                }

                // 验证每个物品的出库数量是否合理
                for (let i = 0; i < this.basic.items.length; i++) {
                    const item = this.basic.items[i];
                    const quantity = Number(item.quantity);

                    // 验证是否为有效正数
                    if (isNaN(quantity) || quantity <= 0) {
                        this.$message.warning(msgcon(`第${i + 1}个物品的出库数量必须是大于0的数字`));
                        resolve(false);
                        return;
                    }

                    // 验证是否超过可用库存
                    if (quantity > item.available) {
                        this.$message.warning(msgcon(`第${i + 1}个物品的出库数量超过可用库存`));
                        resolve(false);
                        return;
                    }
                }

                // 所有验证通过
                resolve(true);
            });
        },

        // 提交出库单
        async onSubmitItemOutWarehouse() {
            // 先验证基础表单
            const basicValid = await this.valiBasicForm();
            if (!basicValid) return;

            // 再验证物品和数量
            const stockValid = await this.valiItemOutWarehouseForm();
            if (!stockValid) return;

            // 所有验证通过，执行出库操作
            if (basicValid && stockValid) {
                this.loadItemOutWarehouse();
            }
        },

        // 执行出库操作（调用接口）
        loadItemOutWarehouse() {
            this.basic.loading = true; // 显示提交加载状态
            // 构建请求数据格式
            const items = this.basic.items.map((item) => ({ id: item.id, quantity: item.quantity }));
            const data = {
                warehouse: { id: this.basic.warehouses },
                classification: { id: this.basic.classification },
                supplier: { id: this.basic.supplier }, // 实际是领用单位/人ID
                item: items,
                remark: this.basic.remark,
            };

            // 调用出库接口
            withDelay(() => ItemOutWarehouse(data))
                .then(() => {
                    this.result = true; // 标记操作成功
                })
                .catch((err) => {
                    // 提取错误信息并显示
                    let msg = err.data.metadata.message;
                    this.$message.error(msgcon("创建出库单失败" + msg));
                })
                .finally(() => {
                    this.basic.loading = false; // 无论成功失败，结束加载状态
                });
        },

        // 取消操作，返回出库单列表页
        onCancel() {
            this.$router.push({ name: "stockout" });
        },

        // 刷新基础数据（分类、仓库、领用单位）
        onRefreshBasicData() {
            this.loadGetClassification();
            this.loadGetWarehouses();
            this.loadListSuppliers();
            this.$message.success(msgcon("数据已刷新"));
        },
    },
};
</script>
