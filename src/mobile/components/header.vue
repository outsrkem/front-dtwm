<template>
    <el-page-header @back="onBack()">
        <template #content>
            <div class="flex-container">
                <el-text class="flex-item">{{ title }}</el-text>
            </div>
        </template>
        <template #extra>
            <div class="flex items-center">
                <!-- <el-text class="flex-item">控制台</el-text> -->
                <el-button class="flex-item" link @click="toConsole()">
                    <el-text>控制台</el-text>
                </el-button>
            </div>
        </template>
    </el-page-header>
    <el-divider style="margin-top: 10px; margin-bottom: 10px" />
</template>

<script>
export default {
    name: "MyHeader",
    components: {},
    props: {
        title: String,
        router: String,
    },
    data() {
        return {};
    },
    methods: {
        onBack() {
            this.$router.push({ name: "home" });
            // 返回上一次路由
            // this.$router.go(-1);
        },
        toConsole() {
            let url = `/console`;
            window.location.href = url;
        },
    },
    created() {},
};
</script>

<style scoped lang="less">
.flex-container {
    // display: flex;
    // justify-content: space-between;
    // padding: 10px; /* 示例：添加一些内边距 */
    // width: 100%;
    width: 100%;
    display: flex;
    justify-content: flex-end;
}
.flex-item {
    /* 这里可以根据需要为.flex-item添加样式，但通常不需要特别设置 */
    margin-right: 15px;
}
</style>
