<template>
    <div class="admin-layout">
        <div class="admin-main">
            <main class="admin-content">
                <router-view />
            </main>
            <!-- <div>
                <div>
                    <van-tabbar v-model="active">
                        <van-tabbar-item icon="home-o" @click="OnSwitchRoutes('/')">首页</van-tabbar-item>
                        <van-tabbar-item icon="shop-o" @click="OnSwitchRoutes('/items')">物品</van-tabbar-item>
                        <van-tabbar-item icon="points">仓库</van-tabbar-item>
                        <van-tabbar-item icon="manager-o" @click="OnSwitchRoutes('/user')">我的</van-tabbar-item>
                    </van-tabbar>
                </div>
            </div> -->
        </div>
    </div>
</template>

<script>
export default {
    name: "HomeIndex",
    components: {},
    props: {},
    data() {
        return {
            active: 0,
        };
    },
    methods: {
        OnSwitchRoutes(activePath) {
            this.$router.push({ path: activePath });
        },
    },
    created() {},
};
</script>

<style scoped></style>
