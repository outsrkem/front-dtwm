<template>
    <div class="settings-container">
        <el-dialog v-model="dialogVisible" title="权限管理">
            <div v-loading="loading">
                <div class="warning-desc">
                    <p>
                        责任人：{{ placeholder.responsible }}。管理员：{{ placeholder.manager }}。审批卡点：{{ placeholder.approver }}。出入库卡点：{{
                            placeholder.executor
                        }}
                    </p>
                </div>
                <el-form :model="form" label-width="100px">
                    <!-- 责任人 -->
                    <el-form-item label="责任人：">
                        <el-select
                            v-model="form.responsible"
                            multiple
                            filterable
                            :placeholder="placeholder.responsible"
                            @change="handlePermissionChange('RESPONSIBLE', 'responsible')">
                            <el-option v-for="val in user" :key="val.user_id" :label="val.username" :value="val.user_id" />
                        </el-select>
                    </el-form-item>

                    <!-- 管理员 -->
                    <el-form-item label="管理员：">
                        <el-select
                            v-model="form.manager"
                            multiple
                            filterable
                            :placeholder="placeholder.manager"
                            @change="handlePermissionChange('MANAGER', 'manager')">
                            <el-option v-for="val in user" :key="val.user_id" :label="val.username" :value="val.user_id" />
                        </el-select>
                    </el-form-item>

                    <!-- 审批卡点 -->
                    <el-form-item label="审批卡点：">
                        <el-select
                            v-model="form.approver"
                            multiple
                            filterable
                            :placeholder="placeholder.approver"
                            @change="handlePermissionChange('APPROVER', 'approver')">
                            <el-option v-for="val in user" :key="val.user_id" :label="val.username" :value="val.user_id" />
                        </el-select>
                    </el-form-item>

                    <!-- 出入库卡点 -->
                    <el-form-item label="出入库卡点：">
                        <el-select
                            v-model="form.executor"
                            multiple
                            filterable
                            :placeholder="placeholder.executor"
                            @change="handlePermissionChange('EXECUTOR', 'executor')">
                            <el-option v-for="val in user" :key="val.user_id" :label="val.username" :value="val.user_id" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <el-button bg text style="width: 120px" @click="dialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { withDelay } from "../../utils/common.js";
import { msgcon } from "../../utils/message.js";
import { ListUser, ListPermission, AddPermission, DeletePermission } from "../../api/index.js";
export default {
    name: "PurviewIndex",
    components: {},
    props: {},
    data() {
        return {
            loading: false,
            dialogVisible: false,
            warehouse_id: "",
            user: [],
            form: {
                responsible: [],
                manager: [],
                approver: [],
                executor: [],
            },
            placeholder: {
                responsible: "具有仓库所有权限",
                manager: "具有仓库管理权限，不可审批红字冲销单",
                approver: "具备审批卡点权限",
                executor: "具备执行入库权限",
            },
            // 存储初始数据用于对比
            initialForm: {
                responsible: [],
                manager: [],
                approver: [],
                executor: [],
            },
        };
    },
    methods: {
        openDialog(val) {
            this.warehouse_id = val.id;
            this.loadListUser();
            this.loadListPermission();
            this.dialogVisible = true;
        },
        // 加载权限列表
        loadListPermission() {
            if (this.warehouse_id === "") {
                this.$message.error(msgcon("没有获取到仓库ID，加载权限失败"));
                return;
            }
            this.loading = true;
            const paths = { warehouse_id: this.warehouse_id };
            withDelay(() => ListPermission(paths))
                .then((res) => {
                    if (res?.metadata?.ecode !== "DTWM.0000" || !res?.payload?.items) {
                        return;
                    }

                    const roleMap = {
                        RESPONSIBLE: "responsible",
                        MANAGER: "manager",
                        APPROVER: "approver",
                        EXECUTOR: "executor",
                    };

                    // 清空表单
                    Object.keys(this.form).forEach((key) => {
                        this.form[key] = [];
                    });

                    // 填充数据
                    res.payload.items.forEach((item) => {
                        const currentRole = (item.role || "").toUpperCase();
                        const targetFormKey = roleMap[currentRole];
                        if (targetFormKey) {
                            this.form[targetFormKey].push(item.user_id);
                        }
                    });

                    // 深拷贝初始数据用于后续对比
                    this.initialForm = JSON.parse(JSON.stringify(this.form));
                })
                .catch((err) => {
                    console.error("加载权限失败", err);
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        // 加载用户列表
        loadListUser() {
            ListUser()
                .then((res) => {
                    if (res?.metadata?.ecode === "DTWM.0000" && res?.payload?.items) {
                        this.user = res.payload.items;
                    } else {
                        console.error("用户列表获取失败", res);
                    }
                })
                .catch((err) => {
                    console.error("加载用户失败", err);
                });
        },

        // 处理权限变更
        handlePermissionChange(roleType, formKey) {
            // 原始数据
            const originalValues = this.initialForm[formKey] || [];
            // 新数据
            const newValues = this.form[formKey] || [];

            // 需要添加的用户ID
            const addIds = newValues.filter((id) => !originalValues.includes(id));
            // 需要删除的用户ID
            const deleteIds = originalValues.filter((id) => !newValues.includes(id));

            // 批量添加
            addIds.forEach((userId) => {
                this.addPermission(roleType, userId);
            });

            // 批量删除
            deleteIds.forEach((userId) => {
                this.deletePermission(roleType, userId);
            });

            // 更新初始数据为当前数据
            this.initialForm[formKey] = [...newValues];
        },

        // 添加权限
        addPermission(role, userId) {
            const paths = { warehouse_id: this.warehouse_id };
            const data = {
                role: role,
                user_id: userId,
            };

            withDelay(() => AddPermission(paths, data))
                .then(() => {
                    this.$message.success(msgcon("添加成功"));
                })
                .catch((err) => {
                    console.error(`添加${role}权限异常`, err);
                    this.revertPermissionChange(role, userId, "add");
                });
        },

        // 删除权限
        deletePermission(role, userId) {
            const paths = { warehouse_id: this.warehouse_id };
            const data = {
                role: role,
                user_id: userId,
            };

            DeletePermission(paths, data)
                .then(() => {
                    this.$message.success(msgcon("移除成功"));
                })
                .catch((err) => {
                    console.error(`删除${role}权限异常`, err);
                    this.revertPermissionChange(role, userId, "delete");
                });
        },

        // 权限变更回滚（当接口调用失败时）
        revertPermissionChange(role, userId, action) {
            const roleMap = {
                RESPONSIBLE: "responsible",
                MANAGER: "manager",
                APPROVER: "approver",
                EXECUTOR: "executor",
            };
            const formKey = roleMap[role];

            if (!formKey) return;

            // 找到当前值的索引
            const index = this.form[formKey].indexOf(userId);

            if (action === "add" && index !== -1) {
                // 添加失败，从数组中移除
                this.form[formKey].splice(index, 1);
            } else if (action === "delete" && index === -1) {
                // 删除失败，重新添加到数组
                this.form[formKey].push(userId);
            }

            // 同步更新初始数据
            this.initialForm[formKey] = [...this.form[formKey]];
        },
    },
    created() {},
};
</script>

<style scoped>
.settings-container {
    padding: 20px;
}
.el-select {
    width: 100%;
}
.el-form-item {
    margin-bottom: 20px;
}

.warning-desc {
    width: auto;
    padding-left: 10px;
    padding-right: 10px;
    border: 1px solid #ffb300e8;
    margin-bottom: 20px;
    background-color: #fff3cd;
    border-radius: 5px;
    p {
        margin: 10px 0 10px;
        font-size: 14px;
        color: mediumblue;
        line-height: 1.5;
    }
}
</style>
