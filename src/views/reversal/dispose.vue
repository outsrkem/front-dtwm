<template>
    <div>
        <el-dialog v-model="dialogVisible" width="1200" @close="closeDialog">
            <template #header="{ titleId }">
                <span :id="titleId" style="color: red">审批红字冲销单</span>
            </template>
            <div v-loading="loading">
                <div style="margin-bottom: 12px">
                    <el-descriptions border>
                        <el-descriptions-item label="提交人">{{ reversal.submit_user?.username || "-" }}</el-descriptions-item>
                        <el-descriptions-item label="提交时间">{{ reversal.submit_time || "-" }}</el-descriptions-item>
                        <el-descriptions-item label="当前状态">
                            <span v-if="reversal.audit_status === 'REJECTED'"> 已拒绝 </span>
                            <span v-if="reversal.audit_status === 'APPROVED'"> 已审批 </span>
                            <span v-if="reversal.audit_status === 'PENDING'"> 待审批 </span>
                        </el-descriptions-item>
                        <el-descriptions-item label="提交原因">{{ reversal.submit_note || "-" }}</el-descriptions-item>
                    </el-descriptions>
                </div>
                <div style="margin-bottom: 12px">
                    <el-table :data="particulars" style="min-height: 150px">
                        <el-table-column prop="item.sku" label="物品编码" show-overflow-tooltip />
                        <el-table-column prop="item.name" label="物品 名称" />
                        <el-table-column prop="item.property" label="属性" />
                        <el-table-column prop="item.specification" label="规格" />
                        <el-table-column prop="item.unit" label="单位" width="100" />
                        <el-table-column prop="detailedly.quantity" label="出入库数目" width="200" />
                        <el-table-column label="类型" width="100">
                            <template #default="scope">
                                <span v-if="scope.row.detailedly.correct_type === 'ORIGINAL'">原始记录</span>
                                <span v-if="scope.row.detailedly.correct_type === 'REVERSAL'" style="color: red">红冲修正</span>
                                <span v-if="scope.row.detailedly.correct_type === 'SUPPLEMENT'">补充修正</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <!-- 冲销表单 -->
                <div v-if="reversal.audit_status === 'PENDING'">
                    <el-form :model="fromdata" label-width="auto" :rules="fromRules" ref="rules-from">
                        <el-row :gutter="20">
                            <el-col :span="15">
                                <el-form-item label="审批意见" prop="reason">
                                    <el-input v-model="fromdata.reason" show-word-limit placeholder="输入意见，如拒绝原因" clearable />
                                </el-form-item>
                            </el-col>
                            <el-col :span="9">
                                <el-form-item prop="action">
                                    <el-radio-group v-model="fromdata.action">
                                        <el-radio value="approve" border>通过</el-radio>
                                        <el-radio value="reject" border>拒绝</el-radio>
                                    </el-radio-group>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </el-form>
                    <div style="display: flex; justify-content: center; margin-top: 20px">
                        <el-button round class="round-button" style="width: 120px" @click="closeDialog()">取消</el-button>
                        <el-button round class="round-button" style="width: 120px" type="warning" @click="onSubmit">提交</el-button>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { formatTime } from "../../utils/date.js";
import { msgcon } from "../../utils/message.js";
import { withDelay } from "../../utils/common.js";
import { GetParticulars, ExamineReversal } from "../../api/index.js";
export default {
    name: "DisposeReversal",
    components: {},
    props: {},
    setup() {
        return {};
    },
    data() {
        return {
            loading: false,
            dialogVisible: false,
            reversal: { warehouse: { name: null }, order: {}, item: {}, detailedly: {} }, // 原始单信息
            fromdata: {
                reason: "", // 冲销原因
                action: "", // 冲销数额
            },
            particulars: [],
            emptydetaildata: { warehouse: { name: null }, order: {}, item: {}, detailedly: {} },
            fromRules: {
                reason: [{ required: true, message: "必填", trigger: "blur" }],
                action: [{ required: true, message: "必选", trigger: "blur" }],
            },
        };
    },
    methods: {
        formatDate(time) {
            return formatTime(time);
        },
        openDialog(val) {
            this.reversal = val;
            this.fromdata.action = "";
            this.fromdata.reason = "";
            this.dialogVisible = true;
            this.particulars = [];
            this.loadGetParticulars(val.source_detail_id); // 获取原始单
            this.loadGetParticulars(val.detail_id); // 获取冲销单
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
        // 加载订单流水信息
        async loadGetParticulars(id) {
            this.loading = true;
            withDelay(() => GetParticulars({ id }))
                .then((res) => {
                    this.particulars.push(...res.payload.items);
                })
                .catch((err) => {
                    this.error = true;
                    this.errorMessage = err.data?.metadata || "加载单据详情失败";
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        onSubmit() {
            this.$refs["rules-from"].validate((valid) => {
                if (!valid) return;
                if (this.fromdata.action === "") return;
                const paths = { detail_id: this.reversal.detail_id };
                const data = { reversal: { action: this.fromdata.action, reason: this.fromdata.reason } };
                ExamineReversal(paths, data)
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
