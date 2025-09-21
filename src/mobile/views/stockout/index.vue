<template>
    <div style="margin: 10px">
        <van-nav-bar title="新增出库单" left-arrow @click-left="onCancel" fixed placeholder right-text="提交" @click-right="onSubmitItemOutWarehouse" />
        <div v-if="!result" v-loading="basic.loading">
            <el-form label-position="top" ref="basic" :rules="rules" label-width="auto" :model="basic">
                <el-form-item label="出库类型" prop="classification">
                    <el-select v-model="basic.classification" placeholder="选择出库类型">
                        <el-option v-for="(item, inx) in classification" :id="inx" :label="item.name" :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="出库仓库" prop="warehouses">
                    <el-select v-model="basic.warehouses" placeholder="选择仓库">
                        <el-option v-for="(item, inx) in warehouses" :id="inx" :label="item.name" :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="供应商" prop="supplier">
                    <el-select v-model="basic.supplier" placeholder="选择供应商">
                        <el-option v-for="(item, inx) in supplier" :id="inx" :label="item.name" :value="item.id">
                            <span style="float: left">{{ item.name }}（{{ item.person }}）</span>
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <!-- 物品选择按钮 -->
            <van-cell title="选择物品" is-link value="点击选择" @click="onOpenAdditem()" />
            <!-- 弹出选择物品 -->
            <van-popup v-model:show="selectItem.dialogVisible" :style="{ width: '100%', height: '100%' }" position="right">
                <van-nav-bar title="选择物品" left-arrow @click-left="onCloseItem" fixed placeholder right-text="确定" @click-right="onAddItemTolist" />
                <el-checkbox-group v-model="selectedRows">
                    <van-cell-group inset>
                        <van-cell v-for="(item, inx) in items" :title="item.name" :label="`可用：${item.available}${item.unit}`">
                            <div style="width: 100%">
                                <el-checkbox :value="item" />
                            </div>
                        </van-cell>
                    </van-cell-group>
                </el-checkbox-group>
                <!-- 分页 -->
                <div style="margin-top: 20px; margin-bottom: 20px">
                    <mpagination :pageTotal="pageTotal" :pageSize="pageSize" @CurrentChange="onCurrentChange" @SizeChange="onSizeChange" />
                </div>
            </van-popup>

            <!-- 物品数目 -->
            <div v-for="(val, inx) in basic.items">
                <van-swipe-cell>
                    <van-cell border="false" :title="val.name">
                        <input
                            type="text"
                            v-model="basic.items[inx].quantity"
                            style="padding: 0; width: 100px; outline: none; border: none; background: none"
                            :placeholder="`剩余：${val.available}`" />
                    </van-cell>
                    <template #right>
                        <van-button square type="danger" @click="onRemoveItemlist(inx)" text="删除" />
                    </template>
                </van-swipe-cell>
            </div>
            <!-- 物品数目结束 -->
            <div style="padding-top: 10px">
                <el-form label-position="left" label-width="auto" :model="basic">
                    <el-form-item label="" label-position="left">
                        <el-input v-model="basic.remark" placeholder="请输出备注" />
                    </el-form-item>
                </el-form>
            </div>
        </div>
        <!-- 提交成功后展示 -->
        <div v-else>
            <el-result icon="success" title="创建成功">
                <template #extra>
                    <el-button style="width: 120px" type="primary" @click="onCancel">确定</el-button>
                </template>
            </el-result>
        </div>
    </div>
</template>

<script lang="ts">
import { formatTime } from "../../../utils/date.js";
import { msgcon } from "../../../utils/message.js";
import mpagination from "../../components/pagination.vue";
import { withDelay, convertToLimitOffset } from "../../../utils/common.js";
import { SelectInventory, ItemOutWarehouse, GetClassification, GetWarehouses, ListSuppliers } from "../../../api/index.js";
import { Plus, Refresh } from "@element-plus/icons-vue";
export default {
    name: "OutWarehouseIndex",
    components: { mpagination },
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
            this.loadGetstockorder(this.pageSize, p);
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
        loadGetstockorder: function (page_size = 10, page = 1) {
            this.loading = true;
            let params = { direction: "out", ...convertToLimitOffset(page, page_size) };
            if (this.query.item.name !== "") params = { name: this.query.item.name, ...params };
            if (this.basic.warehouses !== "") params = { wd: this.basic.warehouses, ...params };
            SelectInventory(params)
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
            this.$router.push({ name: "home" });
        },
        onRefreshBasicData() {
            this.$message.success(msgcon("刷新数据"));
            this.loadGetstockorder();
            this.loadGetWarehouses();
            this.loadListSuppliers();
        },
    },
    created() {
        this.loadGetClassification();
        this.loadGetstockorder();
        this.loadGetWarehouses();
        this.loadListSuppliers();
        this.$globalBus.emit("updateActivePath", "/stockout");
    },
};
</script>

<style scoped>
.content {
    padding: 16px 16px 0px;
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
/*/////////////////// */
body {
    background-color: #f5f7fa;
    color: #333;
    padding: 15px;
    max-width: 500px;
    margin: 0 auto;
    padding-bottom: 80px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: linear-gradient(135deg, #3498db, #2c3e50);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.back-btn {
    color: white;
    font-size: 1.2rem;
    text-decoration: none;
}

.header h1 {
    font-size: 1.4rem;
    font-weight: 600;
}

.header .icons {
    display: flex;
    gap: 15px;
}

.card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 15px;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.form-group {
    margin-bottom: 20px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2c3e50;
}

.form-input {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
}

.form-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.input-with-icon {
    position: relative;
}

.input-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #3498db;
    font-size: 1.2rem;
}

.product-type-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
}

.product-type {
    flex: 1;
    min-width: 120px;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.product-type:hover {
    border-color: #3498db;
    background-color: #f0f8ff;
}

.product-type.selected {
    border-color: #3498db;
    background-color: #e3f2fd;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.product-icon {
    font-size: 1.8rem;
    margin-bottom: 8px;
    color: #3498db;
}

.product-name {
    font-size: 0.9rem;
    font-weight: 600;
}

.quantity-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 15px 0;
}

.quantity-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f0f0f0;
    border: none;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.quantity-input {
    width: 80px;
    height: 40px;
    text-align: center;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin: 0 10px;
    font-size: 1.1rem;
    font-weight: 600;
}

.action-buttons {
    display: flex;
    gap: 15px;
    margin-top: 30px;
}

.btn {
    flex: 1;
    padding: 15px;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    text-decoration: none;
    text-align: center;
}

.btn-primary {
    background: linear-gradient(135deg, #3498db, #2c3e50);
    color: white;
}

.btn-outline {
    background: transparent;
    border: 1px solid #3498db;
    color: #3498db;
}

.btn:active {
    transform: scale(0.98);
}

.summary {
    background-color: #e8f4ff;
    border-radius: 8px;
    padding: 15px;
    margin-top: 20px;
}

.summary-title {
    font-weight: 600;
    margin-bottom: 10px;
    color: #2c3e50;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.9rem;
}

.footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 15px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    margin: 0 auto;
}

.scan-hint {
    text-align: center;
    margin: 10px 0;
    color: #666;
    font-size: 0.9rem;
}

.scan-hint i {
    color: #3498db;
    margin-right: 5px;
}
</style>
