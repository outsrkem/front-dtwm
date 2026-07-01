<template>
    <div class="search-page" style="background-color: #f7f8fa; min-height: 100vh">
        <!-- 导航栏：标题 + 返回 -->
        <van-nav-bar title="搜索单据" left-text="返回列表" left-arrow @click-left="handleGoBackToList" fixed placeholder />

        <!-- 搜索框：固定在导航栏下方 -->
        <div class="search-container">
            <van-search
                v-model="searchQuery.serial"
                placeholder="请输入单据编号搜索"
                @search="handleSearch"
                @clear="handleClearSearch"
                right-icon="scan"
                @click-right-icon="handleScan"
                class="search-input" />
        </div>

        <!-- 扫码容器 (默认隐藏) -->
        <div v-if="isScanning" class="scan-container">
            <div class="scan-header">
                <van-icon name="close" @click="stopScan" class="close-btn" />
                <div class="scan-title">扫描单据二维码</div>
            </div>

            <!-- 视频预览区域 -->
            <div class="scan-preview">
                <video id="scanPreview" autoplay playsinline></video>

                <!-- 扫描框 -->
                <div class="scan-frame">
                    <div class="scan-line"></div>
                </div>
            </div>

            <div class="scan-tip">
                将单据二维码对准扫描框<br />
                支持快速识别单据编号
            </div>
        </div>

        <van-pull-refresh v-model="refreshing" @refresh="handleRefreshSearch" class="result-container">
            <div v-if="loading" class="loading-container">
                <van-loading size="24" color="#1989fa" />
                <span class="loading-text">搜索中...</span>
            </div>

            <!-- 搜索结果项 -->
            <div v-else>
                <div
                    v-for="(item, index) in searchResult"
                    :key="`search-${item.order_id}-${index}`"
                    class="result-item"
                    @click="handleGoToDetail(item.order_id)">
                    <van-cell-group>
                        <van-cell
                            :title="item.type === 'OUT' ? '出库' : '入库'"
                            :value="`操作人：${item.owner.username}`"
                            :label="`单据编号：${item.serial}`"
                            class="cell-item" />
                    </van-cell-group>
                </div>

                <!-- 搜索提示（未输入/无结果） -->
                <div class="search-tip">
                    <van-empty v-if="searchQuery.serial && searchResult.length === 0" description="未找到匹配的单据" />
                    <div v-else-if="!searchQuery.serial" class="empty-search">请输入单据编号进行搜索</div>
                </div>
            </div>
        </van-pull-refresh>
    </div>
</template>

<script>
import { withDelay, convertToLimitOffset } from "../../../utils/common.js";
import { SelectStockOrder } from "../../../api/index.js";
import { Empty, Loading, Icon, Toast } from "vant";
import QrCode from "jsqr"; // 引入jsqr库用于二维码解析

export default {
    components: {
        VanEmpty: Empty,
        VanLoading: Loading,
        VanIcon: Icon,
    },
    data() {
        return {
            searchQuery: { serial: "" }, // 搜索参数（单据编号）
            searchResult: [], // 搜索结果列表
            loading: false, // 搜索加载状态
            refreshing: false, // 下拉刷新状态
            isScanning: false, // 是否正在扫描
            stream: null, // 摄像头数据流
            canvasElement: null, // 用于处理图像的canvas
            scanning: false, // 扫描状态标记
        };
    },
    methods: {
        /** 加载搜索结果 */
        async fetchSearchResult() {
            // 显示加载状态
            this.loading = true;

            try {
                // 构建参数：精确搜索单据编号
                const params = convertToLimitOffset(1, 100); // 一次加载所有匹配结果
                if (this.searchQuery.serial.trim()) {
                    params.serial = this.searchQuery.serial.trim();
                }

                // 执行搜索请求
                const res = await withDelay(() => SelectStockOrder(params));
                const { items = [] } = res.payload || {};

                // 更新搜索结果
                this.searchResult = items;
            } catch (err) {
                this.$message.error("搜索失败，请重试");
                console.error("Fetch search result error:", err);
            } finally {
                // 关闭加载状态
                this.loading = false;
                this.refreshing = false;
            }
        },

        /** 触发搜索（精确搜索） */
        handleSearch() {
            if (!this.searchQuery.serial.trim()) {
                this.$message.warning("请输入单据编号");
                return;
            }
            this.fetchSearchResult();
        },

        /** 清除搜索词 */
        handleClearSearch() {
            this.searchQuery.serial = "";
            this.searchResult = [];
        },

        /** 下拉刷新搜索结果 */
        handleRefreshSearch() {
            // 只有输入了搜索词才刷新
            if (this.searchQuery.serial.trim()) {
                this.fetchSearchResult();
            } else {
                this.refreshing = false;
            }
        },

        /** 开始扫码 */
        async handleScan() {
            // 检查浏览器是否支持媒体设备
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.$message.error("当前浏览器不支持扫码功能，请更换浏览器");
                return;
            }

            try {
                // 显示扫码界面
                this.isScanning = true;
                this.scanning = true;

                // 延迟初始化，确保DOM已渲染
                setTimeout(() => this.initScanner(), 300);
            } catch (err) {
                console.error("扫码初始化失败:", err);
                this.$message.error("扫码功能启动失败");
                this.isScanning = false;
            }
        },

        /** 初始化扫描器 */
        async initScanner() {
            try {
                // 获取视频元素
                const video = document.getElementById("scanPreview");

                // 请求摄像头权限
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }, // 使用后置摄像头
                });

                video.srcObject = this.stream;

                // 创建canvas用于图像处理
                this.canvasElement = document.createElement("canvas");
                const canvas = this.canvasElement;
                const canvasContext = canvas.getContext("2d");

                // 开始扫描循环
                const tick = () => {
                    if (!this.scanning) return;

                    if (video.readyState === video.HAVE_ENOUGH_DATA) {
                        // 设置canvas尺寸与视频一致
                        canvas.height = video.videoHeight;
                        canvas.width = video.videoWidth;

                        // 绘制视频帧到canvas
                        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

                        // 获取图像数据并解析二维码
                        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                        const code = QrCode(imageData.data, imageData.width, imageData.height);

                        if (code) {
                            // 识别到二维码
                            this.handleQrCodeResult(code.data);
                            return;
                        }
                    }

                    // 继续下一帧扫描
                    requestAnimationFrame(tick);
                };

                // 开始扫描
                tick();
            } catch (err) {
                console.error("扫描初始化失败:", err);
                this.$message.error("无法访问摄像头，请检查权限设置");
                this.stopScan();
            }
        },

        /** 处理二维码识别结果 */
        handleQrCodeResult(result) {
            if (!result) return;

            // 停止扫描
            this.stopScan();

            // 显示识别结果
            Toast.success(`识别成功: ${result}`);

            // 填充到搜索框并执行搜索
            this.searchQuery.serial = result;
            this.handleSearch();
        },

        /** 停止扫码 */
        stopScan() {
            this.scanning = false;
            this.isScanning = false;

            // 关闭摄像头流
            if (this.stream) {
                this.stream.getTracks().forEach((track) => track.stop());
                this.stream = null;
            }

            // 清除canvas
            if (this.canvasElement) {
                this.canvasElement = null;
            }
        },

        /** 跳转至详情页 */
        handleGoToDetail(oid) {
            this.$router.push({
                name: "StockOrderDetail",
                params: { oid },
            });
        },

        /** 返回订单列表页 */
        handleGoBackToList() {
            this.$router.push({ name: "StockOrderList" });
        },
    },
    // 页面离开时确保关闭摄像头
    beforeUnmount() {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
        }
        this.scanning = false;
    },
};
</script>

<style scoped>
/* 搜索提示样式 */
.search-tip {
    padding: 50px 20px;
    text-align: center;
}

.empty-search {
    color: #999;
    font-size: 14px;
}

/* 加载状态样式 */
.loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px 0;
    color: #666;
    font-size: 14px;
}

/* 扫码相关样式 */
.scan-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    color: white;
}

.scan-header {
    padding: 20px 15px;
    display: flex;
    align-items: center;
}

.close-btn {
    font-size: 24px;
    color: white;
}

.scan-title {
    flex: 1;
    text-align: center;
    font-size: 18px;
}

.scan-preview {
    position: relative;
    width: 100%;
    height: 60vh;
    overflow: hidden;
}

#scanPreview {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.scan-frame {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 260px;
    height: 260px;
    transform: translate(-50%, -50%);
    border: 2px solid #00e4ff;
    box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.5);
}

.scan-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #00e4ff;
    animation: scanLine 2s infinite;
}

@keyframes scanLine {
    0% {
        top: 0;
    }
    50% {
        top: calc(100% - 2px);
    }
    100% {
        top: 0;
    }
}

.scan-tip {
    text-align: center;
    padding: 20px;
    font-size: 14px;
    color: #ccc;
}

/* 搜索框样式 */
.search-input {
    background-color: #fff;
}

/* 结果容器 */
.result-container {
    padding: 10px;
}

/* 结果项间距 */
.result-item {
    margin: 5px 0;
}

/* 列表项样式 */
.cell-item {
    background-color: #fff;
}
</style>
