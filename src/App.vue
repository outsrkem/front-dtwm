<script>
import { Resume } from "./api/index.js";
export default {
    name: "App",
    data() {
        return { data: "" };
    },
    methods: {
        loadResume: async function () {
            await Resume();
        },
    },
    created() {
        this.loadResume();
    },
};
</script>

<template>
    <div>
        <router-view />
    </div>
</template>

<style scoped></style>
