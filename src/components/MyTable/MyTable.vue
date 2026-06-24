<template>
    <div class="table-container">
        <!-- Table Main Body -->
        <table class="custom-table">
            <!-- Table Header -->
            <thead>
                <tr>
                    <th v-for="(column, index) in columns" :key="index">
                        <el-text>{{ column.label }}</el-text>
                    </th>
                </tr>
            </thead>

            <!-- Table Content Body -->
            <tbody>
                <tr v-for="(row, rowIndex) in data" :key="rowIndex" :style="getRowStyle(row, rowIndex)">
                    <td v-for="(column, colIndex) in columns" :key="colIndex">
                        <!-- Custom Slot Render -->
                        <template v-if="column.slot">
                            <el-text>
                                <slot :name="column.slot" :row="row" :index="rowIndex"></slot>
                            </el-text>
                        </template>
                        <!-- Default Value Render -->
                        <template v-else>
                            <el-text>
                                {{ getNestedValue(row, column.prop) }}
                            </el-text>
                        </template>
                    </td>
                </tr>

                <!-- Empty Data Placeholder -->
                <tr v-if="data.length === 0">
                    <td :colspan="columns.length" class="empty-row">
                        {{ emptyText }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
export default {
    name: "MyTable",
    props: {
        // Table source data
        data: {
            type: Array,
            default: () => [],
        },
        // Column configuration list
        columns: {
            type: Array,
            required: true,
        },
        // Empty data prompt text
        emptyText: {
            type: String,
            default: "No data available",
        },
        // Custom row style callback function
        rowStyle: {
            type: Function,
            default: () => ({}),
        },
    },

    methods: {
        // Get custom style for current table row
        getRowStyle(row, index) {
            return this.rowStyle(row, index) || {};
        },

        // Get nested object value by dot-separated path e.g. a.b.c
        getNestedValue(obj, path) {
            return path.split(".").reduce((current, key) => {
                return current && typeof current === "object" ? current[key] : "";
            }, obj);
        },
    },
};
</script>

<style scoped>
table {
    width: 100%;
    border-collapse: collapse;
}

th {
    font-weight: bold;
    white-space: nowrap;
}

th,
td {
    padding: 8px 12px;
    text-align: left;
    border: none;
    border-bottom: 1px solid #ddd;
}

tr:hover {
    background-color: #f5f7fa;
}

tr[style] {
    transition:
        background-color 0.2s,
        color 0.2s;
}

.empty-row {
    text-align: center;
    color: #9ca3af;
    padding: 32px;
}

tr[style*="color"] td :deep(.el-text),
tr[style*="color"] td :deep(.el-text__inner) {
    color: inherit !important;
}
</style>
