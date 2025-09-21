<template>
    <div class="el-pagination">
        <!-- <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-size="pageSize"
            layout=""
            :total="pageTotal" /> -->
        <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            background
            size="small"
            layout="prev, pager, next"
            :total="pageTotal" />
    </div>
</template>

<script>
export default {
    name: "PaginationIndex",
    props: {
        pageTotal: { type: Number, default: 0 },
        pageSize: { type: Number, default: 15 },
    },
    data() {
        return {
            currentPage: 1,
        };
    },
    methods: {
        handleSizeChange(page_size) {
            this.currentPage = 1;
            this.$emit("SizeChange", page_size);
        },
        handleCurrentChange(current_page) {
            this.currentPage = current_page;
            this.$emit("CurrentChange", current_page, this.pageSize);
        },
    },
};
</script>

<style scoped>
.el-pagination {
    padding-top: 0px;
    padding-bottom: 0;
}
</style>
