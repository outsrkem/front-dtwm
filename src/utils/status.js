// 状态配置映射（与后端状态一一对应）
const statusConfig = {
    DRAFT: {
        label: "待提交",
        color: "#bfbfbf",
        class: "status-draft",
    },
    PENDING: {
        label: "待审批",
        color: "#faad14",
        class: "status-pending",
    },
    APPROVED: {
        label: "已审批",
        color: "#52c41a",
        class: "status-approved",
    },
    REJECTED: {
        label: "已拒绝",
        color: "#ff7a45",
        class: "status-rejected",
    },
    CANCELLED: {
        label: "已撤销",
        color: "#ff4d4f",
        class: "status-cancelled",
    },
    EXECUTED: {
        label: "已执行",
        color: "#40a9ff",
        class: "status-executed",
    },
    COMPLETED: {
        label: "已完成",
        color: "#1890ff",
        class: "status-completed",
    },
};

/**
 * 公共函数：根据状态值获取状态配置
 * @param {string} statusValue - 后端返回的状态值（如"DRAFT"、"APPROVED"）
 * @returns {object} 状态配置（包含label、color、class）
 */
export function getStatusConfig(statusValue) {
    // 处理未知状态（默认返回"未知状态"配置）
    return (
        statusConfig[statusValue] || {
            label: "未知状态",
            color: "#999",
            class: "status-unknown",
        }
    );
}

// getSuatusOption 获取状态，用于select选择器渲染
export function getSuatusOption() {
    return [
        {
            value: "Pending",
            label: "待确认",
        },
        {
            value: "Approved",
            label: "已确认",
        },
        {
            value: "Cancelled",
            label: "已撤销",
        },
        {
            value: "Executed",
            label: "已执行",
        },
        {
            value: "Completed",
            label: "已完成",
        },
    ];
}
