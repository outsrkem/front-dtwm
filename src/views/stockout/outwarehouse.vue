<template>
    <div>
        <el-card class="box-card">
            <template #header>
                <div class="my_refresh">
                    <div>
                        <span>创建出库单</span>
                        <span style="padding-left: 5px; padding-right: 5px"></span>
                    </div>
                </div>
            </template>
            <div v-if="!result" v-loading="basic.loading">
                <el-form label-position="left" :inline="true" ref="basic" :rules="rules" label-width="auto" :model="basic" class="form-inline">
                    <el-form-item label="出库类型" prop="classification">
                        <el-select v-model="basic.classification" placeholder="选择出库类型" clearable filterable>
                            <el-option v-for="(item, inx) in classification" :id="inx" :label="item.name" :value="item.id" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="出库仓库" prop="warehouses">
                        <el-select v-model="basic.warehouses" placeholder="选择仓库" clearable filterable>
                            <el-option v-for="(item, inx) in warehouses" :id="inx" :label="item.name" :value="item.id" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="领用单位/人" prop="supplier">
                        <el-space>
                            <el-select v-model="basic.supplier" placeholder="请选择" clearable filterable>
                                <el-option v-for="(item, inx) in supplier" :id="inx" :label="item.name" :value="item.id">
                                    <span style="float: left">{{ item.name }}</span>
                                    <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px"> {{ item.person }}</span>
                                </el-option>
                            </el-select>
                            <el-button style="font-size: 19px; padding-left: 8px; padding-right: 8px" :icon="Refresh" @click="onRefreshBasicData" />
                        </el-space>
                    </el-form-item>
                </el-form>

                <div style="width: 100%">
                    <table>
                        <thead>
                            <tr>
                                <th style="min-width: 20px"></th>
                                <th><el-text>仓库</el-text></th>
                                <th><el-text>名称</el-text></th>
                                <th><el-text>属性</el-text></th>
                                <th><el-text>规格</el-text></th>
                                <th><el-text>单位</el-text></th>
                                <th><el-text>总库存</el-text></th>
                                <th><el-text>已锁定</el-text></th>
                                <th><el-text>可用库存</el-text></th>
                                <th><el-text>本次出库数量</el-text></th>
                                <th><el-text>操作</el-text></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, inx) in basic.items">
                                <td>{{ inx + 1 }}</td>
                                <td>{{ item.warehouse.name }}</td>
                                <td>{{ item.name }}</td>
                                <td>{{ item.property }}</td>
                                <td>{{ item.specification }}</td>
                                <td>{{ item.unit }}</td>
                                <td>{{ item.current }}</td>
                                <td>{{ item.lock }}</td>
                                <td>{{ item.available }}</td>
                                <td><el-input v-model="basic.items[inx].quantity" placeholder="数据范围: (0, 999999.9999], 最大保留4位小数" /></td>
                                <td><el-button link type="primary" @click="onRemoveItemlist(inx)">移除</el-button></td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="padding-top: 10px; padding-left: 10px">
                        <el-button type="primary" link :icon="Plus" @click="onOpenAdditem">添加物品</el-button>
                    </div>
                </div>
                <div style="padding-top: 10px">
                    <el-form label-position="left" label-width="auto" :model="basic">
                        <el-form-item label="备注" label-position="left">
                            <el-input v-model="basic.remark" maxlength="128" show-word-limit />
                        </el-form-item>
                    </el-form>
                </div>
                <div>
                    <el-button bg text @click="onCancel" style="width: 120px">取消</el-button>
                    <el-button type="primary" @click="onSubmitItemOutWarehouse" style="width: 120px">提交</el-button>
                </div>
            </div>
            <div v-else>
                <el-result icon="success" title="创建成功">
                    <template #extra>
                        <el-button style="width: 120px" type="primary" @click="onCancel">确定</el-button>
                    </template>
                </el-result>
            </div>

            <!--选择物品  -->
            <el-dialog v-model="selectItem.dialogVisible" width="1200" title="选择物品" draggable>
                <div>
                    <div>
                        <el-input style="width: 340px" v-model="query.item.name" placeholder="按名称搜索数据" clearable @change="onSearch()">
                            <template #prefix>
                                <el-icon class="el-input__icon"><search /></el-icon>
                            </template>
                        </el-input>
                    </div>
                </div>
                <div>
                    <el-table :data="items" style="width: 100%" @selection-change="handleSelectionChange" v-loading="loading">
                        <el-table-column type="selection" :selectable="selectable" width="55" />
                        <el-table-column prop="warehouse.name" label="仓库" show-overflow-tooltip />
                        <el-table-column prop="name" label="名称" show-overflow-tooltip />
                        <el-table-column prop="available" label="可用库存" show-overflow-tooltip />
                        <el-table-column prop="property" label="属性" show-overflow-tooltip />
                        <el-table-column prop="specification" label="规格" show-overflow-tooltip />
                        <el-table-column prop="unit" label="规格" show-overflow-tooltip />
                    </el-table>
                </div>
                <div class="pagination">
                    <div style="display: flex; justify-content: space-between">
                        <pagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
                        <span>
                            <el-button style="width: 120px" bg text @click="onCloseItem">取消</el-button>
                            <el-button style="width: 120px" type="primary" @click="onAddItemTolist">确定</el-button>
                        </span>
                    </div>
                </div>
            </el-dialog>
        </el-card>
    </div>
</template>

<script lang="ts">
import { Plus, Refresh } from "@element-plus/icons-vue";
import { formatTime } from "../../utils/date.js";
import { msgcon } from "../../utils/message.js";
import pagination from "../../components/pagination/pagination.vue";
import { withDelay, convertToLimitOffset } from "../../utils/common.js";
import { SelectInventory, ItemOutWarehouse, GetClassification, GetWarehouses, ListSuppliers } from "../../api/index.js";
export default {
    name: "OutWarehouseIndex",
    components: { pagination },
    props: {},
    setup() {
        return {
            Plus,
            Refresh,
        };
    },
    data() {
        return {
            result: false, // 控制展示页面
            loading: false,
            selectItem: {
                loading: true,
                dialogVisible: false,
            },
            initem: [],
            pageTotal: 0,
            pageSize: 10,
            page: 1,
            items: [] as Item[],
            basic: {
                loading: false, // 创建时置为true
                classification: "", // 选择的类型
                warehouses: "", // 选择的仓库
                items: [], // 选择的物品
                remark: "", // 备注信息
            },
            data: [],
            classification: [], // 出库类型数据
            warehouses: [], // 仓库数据
            selectedRows: [] as Item[],
            supplier: [], // 供应商
            query: {
                item: {
                    name: "",
                },
                warehouse: {
                    id: "",
                },
            },
            rules: {
                classification: [{ required: true, message: "必选", trigger: "change" }],
                warehouses: [{ required: true, message: "必选", trigger: "change" }],
                supplier: [{ required: true, message: "必选", trigger: "change" }],
            },
        };
    },
    methods: {
        formatDate(time) {
            return formatTime(time).format("YYYY-MM-DD HH:mm:ss");
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
        // 打开选择物品弹窗
        onOpenAdditem() {
            this.query.item.name = "";
            this.selectItem.dialogVisible = true;
            this.loadSelectInventory(this.pageSize, this.page);
        },
        // 关闭选择物品弹窗
        onCloseItem() {
            this.selectItem.dialogVisible = false;
        },
        // 将选择的物品添加到表格
        onAddItemTolist() {
            this.basic.items = this.basic.items.concat(this.selectedRows);
            this.selectItem.dialogVisible = false;
        },
        onRemoveItemlist(inx) {
            if (inx >= 0 && inx < this.basic.items.length) {
                this.basic.items.splice(inx, 1);
            } else {
                console.warn(`无效的索引：${inx}，无法移除元素`);
            }
        },
        // 控制多选框否可以勾选 boolean
        selectable(row: Item) {
            const isExist = this.basic.items.some((item) => item.id === row.id);
            return !isExist;
        },
        // 暂存选择的数据
        handleSelectionChange(selection) {
            this.selectedRows = selection; // 更新选中项
        },
        // 获取出库类型
        loadGetClassification: function () {
            GetClassification({ t: "out" }).then((res) => {
                this.classification = res.payload.items;
            });
        },
        // 获取仓库
        loadGetWarehouses: function () {
            let params = { ...convertToLimitOffset(1, 100) };
            GetWarehouses(params).then((res) => {
                this.warehouses = res.payload.items;
            });
        },
        // 获取供应商
        loadListSuppliers: function () {
            let params = convertToLimitOffset(1, 100);
            ListSuppliers(params).then((res) => {
                this.supplier = res.payload.items;
            });
        },
        // 加载物品库存
        loadSelectInventory: function (page_size, page) {
            this.loading = true;
            let params = { ...convertToLimitOffset(page, page_size) };
            if (this.query.item.name !== "") params = { name: this.query.item.name, ...params };
            if (this.basic.warehouses !== "") params = { wd: this.basic.warehouses, ...params };
            withDelay(() => SelectInventory(params))
                .then((res) => {
                    this.items = res.payload.items;
                    this.pageTotal = res.payload.page_info.total;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        // 搜索物品
        onSearch() {
            this.page = 1;
            if (this.query.serial != "") this.loadSelectInventory(this.pageSize, 1);
            else this.$message.warning(msgcon("请输出检索条件"));
        },
        // 出库操作
        loadOutStock: function () {
            this.basic.loading = true;
            const items = this.basic.items.map((item) => ({ id: item.id, quantity: item.quantity }));
            // 将处理后的数组赋值
            const data = {
                warehouse: { id: this.basic.warehouses },
                classification: { id: this.basic.classification },
                supplier: { id: this.basic.supplier },
                item: items,
                remark: this.basic.remark,
            };
            withDelay(() => ItemOutWarehouse(data))
                .then(() => {
                    this.result = true;
                })
                .catch((err) => {
                    this.$message.warning(msgcon("创建失败" + err.data));
                })
                .finally(() => {
                    this.basic.loading = false;
                });
        },
        // 验证基本表单
        async valiBasicForm() {
            return new Promise((resolve) => {
                this.$refs["basic"].validate((valid) => {
                    resolve(valid);
                });
            });
        },
        // 验证出库表单
        async valiItemOutWarehouseForm() {
            return new Promise((resolve) => {
                // 检查是否添加了物品
                if (this.basic.items.length === 0) {
                    this.$message.warning(msgcon("请至少添加一个物品"));
                    resolve(false);
                    return;
                }

                // 检查每个物品的出库数量是否有效
                for (let i = 0; i < this.basic.items.length; i++) {
                    const item = this.basic.items[i];
                    // 验证数量是否为空
                    if (item.quantity === undefined || item.quantity === null || item.quantity === "") {
                        this.$message.warning(msgcon(`第${i + 1}个物品的出库数量不能为空`));
                        resolve(false);
                        return;
                    }

                    // 验证数量是否为有效数字
                    const quantity = Number(item.quantity);
                    if (isNaN(quantity) || quantity <= 0) {
                        this.$message.warning(msgcon(`第${i + 1}个物品的出库数量必须是大于0的数字`));
                        resolve(false);
                        return;
                    }
                    const available = Number(item.available);
                    if (quantity > available) {
                        this.$message.warning(msgcon(`第${i + 1}个物品的出库数量超过现有库存`));
                        resolve(false);
                        return;
                    }
                }
                resolve(true);
            });
        },
        // 提交出库
        async onSubmitItemOutWarehouse() {
            const basic = await this.valiBasicForm();
            if (!basic) return;
            const stockValid = await this.valiItemOutWarehouseForm();
            if (!stockValid) return;
            this.loadOutStock();
        },
        // 取消出库
        onCancel() {
            this.$router.push({ name: "stockout" });
        },
        onRefreshBasicData() {
            this.$message.success(msgcon("刷新数据"));
            this.loadGetClassification();
            this.loadGetWarehouses();
            this.loadListSuppliers();
        },
    },
    created() {
        this.loadGetClassification();
        this.loadGetWarehouses();
        this.loadListSuppliers();
        this.$globalBus.emit("updateActivePath", "/stockout");
    },
};
</script>

<style scoped>
.form-inline .el-input {
    --el-input-width: 230px;
}

.form-inline .el-select {
    --el-select-width: 230px;
}
.subform-row {
    display: flex;
    background: #f0f1f4;
    height: 30px;
    border: 1px solid #d9dadb;
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

tr:nth-child(even) {
    background-color: #f9f9f9;
}

tr:hover {
    background-color: #edf9f1;
}
</style>
