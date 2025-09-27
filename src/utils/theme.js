export function printTheme() {
    // 兜底配置
    return {
        title: {
            main: "出入库单据表",
            sub: "",
        },
        signature: {
            enabled: false,
            items: [{ label: "仓库管理员", required: true }],
        },
    };
}
