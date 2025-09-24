<template>
    <div>
        <el-dialog v-model="dialogVisible" width="1000" @close="closeDialog">
            <template #header="{ titleId }">
                <span :id="titleId" style="color: red">新建红字冲销单</span>
            </template>
            <div class="reminder">
                <p class="warning-desc">冲销操作说明：</p>
                <p class="warning-desc">（1）入库：用负数冲销；出库：用正数冲销</p>
                <p class="warning-desc">（2）原始单据项数目为0时不允许冲销。</p>
                <p class="warning-desc">（3）冲销数额绝对值大于0且小于原始项数目之和的绝对值。</p>
            </div>
            <div style="margin-bottom: 12px">
                <el-descriptions border>
                    <el-descriptions-item label="仓库">{{ detail.warehouse.name || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="单据编号">{{ detail.order.serial || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="状态">{{ detail.order.status || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="物品编码">{{ detail.item.sku || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="物品名称">{{ detail.item.name || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="物品属性">{{ detail.item.property || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="物品规格">{{ detail.item.specification || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="物品单位">{{ detail.item.unit || "-" }}</el-descriptions-item>
                    <el-descriptions-item label="上次数目">{{ detail.detailedly.quantity || "-" }}</el-descriptions-item>
                </el-descriptions>
            </div>
            <div>
                <p>原因示例：录入错误：原录100件，实际收80件，冲销-20</p>
            </div>
            <!-- 冲销表单 -->
            <el-form :model="fromdata" label-width="auto" :rules="fromRules" ref="rules-from">
                <el-row :gutter="20">
                    <el-col :span="17">
                        <el-form-item label="冲销原因" prop="submit_note">
                            <el-input v-model="fromdata.submit_note" show-word-limit placeholder="示例：录入错误：原录100件，实际收80件，冲销-20" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="7">
                        <el-form-item label="冲销数额" prop="quantity">
                            <el-input v-model="fromdata.quantity" show-word-limit placeholder="输入冲销数额" clearable />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <div style="display: flex; justify-content: center; margin-top: 20px">
                <el-button round class="round-button" style="width: 120px" @click="closeDialog()">取消</el-button>
                <el-button round class="round-button" style="width: 120px" type="warning" @click="onSubmit">提交</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { formatTime } from "../../utils/date.js";
import { msgcon } from "../../utils/message.js";
import { CreateReversal } from "../../api/index.js";
export default {
    name: "CreateReversal",
    components: {},
    props: {},
    setup() {
        return {};
    },
    data() {
        return {
            dialogVisible: false,
            detail: { warehouse: { name: null }, order: {}, item: {}, detailedly: {} }, // 原始单信息
            fromdata: {
                submit_note: "", // 冲销原因
                quantity: "", // 冲销数额
            },
            emptydetaildata: { warehouse: { name: null }, order: {}, item: {}, detailedly: {} },
            fromRules: {
                submit_note: [{ required: true, message: "请输入冲销原因", trigger: "blur" }],
                quantity: [{ required: true, message: "请输冲销数额", trigger: "blur" }],
            },
        };
    },
    methods: {
        formatDate(time) {
            return formatTime(time);
        },
        openDialog(val) {
            this.detail = null;
            this.detail = val;
            this.dialogVisible = true;
        },
        closeDialog() {
            this.dialogVisible = false;
            this.detail = this.emptydetaildata;
        },
        submitSuccess() {
            this.data = { submit_note: "", quantity: "" }; // 创建成功置空表单
            this.$message.success(msgcon("提交成功"));
            this.dialogVisible = false;
            this.$parent.onRefresh();
        },
        onSubmit() {
            this.$refs["rules-from"].validate((valid) => {
                if (!valid) return;
                const paths = { order_id: this.detail.order.id, detail_id: this.detail.detailedly.id };
                const data = { submit_note: this.fromdata.submit_note, quantity: this.fromdata.quantity };
                CreateReversal(paths, data)
                    .then(() => {
                        this.submitSuccess();
                    })
                    .catch((err) => {
                        let msg = err.data.metadata.message;
                        this.$message.error(msgcon("提交失败 " + msg));
                    });
            });
        },
    },
    created() {},
};
</script>

<style scoped>
.warning-desc {
    font-size: 14px;
    /* display: inline; */
    line-height: 1.5;
}
.reminder {
    width: auto;
    padding-left: 10px;
    padding-right: 10px;
    border: 1px solid #ffb300e8;
    margin-bottom: 20px;
    background-color: #fff3cd;
    border-radius: 5px;
    p {
        /* margin-bottom: 5px; */
        /* margin-top: 5px; */
        margin: 2px 0 2px;
        font-size: 14px;
        color: mediumblue;
        /* color: #856404; */
    }
}
</style>
