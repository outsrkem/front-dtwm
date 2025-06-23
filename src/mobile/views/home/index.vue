<template>
    <div class="index-container" style="padding: 18px">
        <!-- <van-nav-bar title="仓库管理系统" right-text="控制台" @click-left="toConsole" /> -->
        <div class="header">
            <h1>仓库管理系统</h1>
            <div class="icons">
                <i class="fas fa-bell"></i>
                <i class="fas fa-user-circle"></i>
            </div>
            <van-button plain round type="warning" @click="onConsole">控制台</van-button>
        </div>
        <div>
            <div class="card">
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-value">128</div>
                        <div class="stat-label">今日入库</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">76</div>
                        <div class="stat-label">今日出库</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">12</div>
                        <div class="stat-label">待处理</div>
                    </div>
                </div>
            </div>

            <div class="card operation-card">
                <div class="card-title"><i class="fas fa-cube"></i>仓库操作</div>

                <div class="operation-item">
                    <div class="operation-icon in-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                    <div class="operation-content">
                        <div class="operation-name">开始入库</div>
                        <div class="operation-desc">登记新的入库物品</div>
                    </div>
                    <div class="arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>

                <div class="operation-item">
                    <div class="operation-icon out-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                    <div class="operation-content">
                        <div class="operation-name">开始出库</div>
                        <div class="operation-desc">处理出库请求</div>
                    </div>
                    <div class="arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">仓库管理系统 | 手机端</div>
    </div>
</template>

<script>
import { toConsole } from "../../../utils/common.js";
export default {
    name: "HomeIndex",
    components: {},
    props: {},
    data() {
        return {
            // toConsole,
        };
    },
    methods: {
        onConsole() {
            toConsole();
        },
    },
    created() {},
};
</script>

<style scoped>
.background {
    background-color: blueviolet;
}
.index-container {
    /* height: 100%; */
    /* background-color: #fbfbfb; */
}

/* 
 */

/* * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
} */

body {
    background-color: #f5f7fa;
    color: #333;
    padding: 15px;
    max-width: 500px;
    margin: 0 auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: linear-gradient(135deg, #3498db, #2c3e50);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header h1 {
    font-size: 1.4rem;
    font-weight: 600;
}

.header .icons {
    display: flex;
    gap: 15px;
}

.card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 15px;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 10px;
}

.operation-card {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.operation-item {
    display: flex;
    align-items: center;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.operation-item:active {
    background-color: #e9ecef;
    transform: scale(0.98);
}

.operation-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    flex-shrink: 0;
}

.in-icon {
    background-color: #e3f2fd;
    color: #1976d2;
}

.out-icon {
    background-color: #ffebee;
    color: #d32f2f;
}

.transfer-icon {
    background-color: #f3e5f5;
    color: #7b1fa2;
}

.operation-content {
    flex-grow: 1;
}

.operation-name {
    font-weight: 600;
    margin-bottom: 4px;
}

.operation-desc {
    font-size: 0.85rem;
    color: #666;
}

.arrow {
    color: #999;
}

.stats {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
}

.stat-item {
    text-align: center;
    padding: 10px;
    flex: 1;
}

.stat-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: #3498db;
}

.stat-label {
    font-size: 0.8rem;
    color: #666;
    margin-top: 5px;
}

.list-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
}

.list-item:last-child {
    border-bottom: none;
}

.list-title {
    font-weight: 600;
}

.list-detail {
    color: #666;
    font-size: 0.9rem;
}

.badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
}

.badge-success {
    background-color: #e8f5e9;
    color: #2e7d32;
}

.badge-warning {
    background-color: #fff8e1;
    color: #f57c00;
}

.footer {
    text-align: center;
    margin-top: 30px;
    color: #999;
    font-size: 0.8rem;
}
</style>
