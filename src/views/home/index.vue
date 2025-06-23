<template>
    <div class="settings-container">
        <el-card class="box-card">
            <h1>Home</h1>
        </el-card>
    </div>
</template>

<script>
export default {
    name: "HomeIndex",
    components: {},
    props: {},
    data() {
        return {
            userInfo: {},
        };
    },
    methods: {},
    created() {
        this.$router.push({ name: "overview" });
    },
};
</script>

<style scoped>
div {
    height: 70%;
}
</style>
