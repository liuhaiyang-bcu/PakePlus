/**
 * 自动图片优化服务
 * 在后台自动检测和优化图片，无需用户干预
 */
class AutoImageOptimizer {
    constructor() {
        this.isRunning = false;
        this.optimizationQueue = [];
        this.lastOptimizationTime = 0;
        this.optimizationInterval = 30000; // 30秒检查一次
        this.maxBatchSize = 5; // 每次最多优化5张图片
        
        this.init();
    }

    init() {
        // 页面加载完成后开始自动优化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startAutoOptimization();
            });
        } else {
            this.startAutoOptimization();
        }

        // 监听存储变化，新增图片时自动优化
        window.addEventListener('storage', (e) => {
            if (e.key === 'appData') {
                this.scheduleOptimization();
            }
        });
    }

    /**
     * 开始自动优化服务
     */
    startAutoOptimization() {
        // 延迟启动，避免影响页面加载
        setTimeout(() => {
            this.scheduleOptimization();
            
            // 检查并优化现有头像
            this.optimizeExistingAvatar();
            
            // 设置定期检查
            setInterval(() => {
                this.scheduleOptimization();
            }, this.optimizationInterval);
            
        }, 3000);
    }

    /**
     * 安排优化任务
     */
    scheduleOptimization() {
        if (this.isRunning) return;
        
        // 防止频繁优化
        const now = Date.now();
        if (now - this.lastOptimizationTime < 10000) return; // 10秒内不重复优化
        
        this.lastOptimizationTime = now;
        
        // 异步执行优化
        setTimeout(() => {
            this.performOptimization();
        }, 1000);
    }

    /**
     * 执行优化
     */
    async performOptimization() {
        if (this.isRunning || !window.dakaBatchOptimizer) return;
        
        this.isRunning = true;
        
        try {
            // 扫描需要优化的图片
            const images = window.dakaBatchOptimizer.scanAllDakaImages();
            const needOptimization = images.filter(img => {
                const sizeKB = Math.round(img.originalSize / 1024);
                return !img.file.optimized && sizeKB > 80; // 大于80KB且未优化
            });
            
            if (needOptimization.length === 0) {
                this.isRunning = false;
                return;
            }
            
            // 限制批量大小，避免影响性能
            const batchToOptimize = needOptimization.slice(0, this.maxBatchSize);
            
            console.log(`🔄 自动优化 ${batchToOptimize.length} 张图片...`);
            
            // 静默优化
            const result = await this.optimizeBatch(batchToOptimize);
            
            if (result.processedImages > 0) {
                console.log(`✅ 自动优化完成：${result.processedImages} 张图片，节省 ${Math.round(result.savedSpace / 1024)} KB`);
                
                // 刷新打卡列表（如果在打卡页面）
                if (window.DakaManager && document.getElementById('daka')) {
                    DakaManager.loadDakas();
                }
                
                // 显示简洁的通知
                if (window.UIManager && result.processedImages > 0) {
                    UIManager.showNotification(
                        `🚀 已自动优化 ${result.processedImages} 张图片`, 
                        'success'
                    );
                }
            }
            
        } catch (error) {
            console.warn('自动优化失败:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * 优化一批图片
     */
    async optimizeBatch(imagesToOptimize) {
        const data = StorageManager.getData();
        let processedCount = 0;
        let savedSpace = 0;
        let hasChanges = false;

        for (const imageInfo of imagesToOptimize) {
            try {
                // 压缩图片
                const compressedResult = await this._compressImageData(
                    imageInfo.file.data, 
                    60 // 目标60KB
                );

                if (compressedResult && compressedResult.size < imageInfo.originalSize) {
                    // 更新数据
                    const daka = data.dakas.find(d => d.id === imageInfo.dakaId);
                    if (daka && daka.punchRecords[imageInfo.recordIndex]) {
                        const record = daka.punchRecords[imageInfo.recordIndex];
                        if (record.files && record.files[imageInfo.fileIndex]) {
                            const oldSize = record.files[imageInfo.fileIndex].size || imageInfo.originalSize;
                            
                            // 更新文件信息
                            record.files[imageInfo.fileIndex] = {
                                ...record.files[imageInfo.fileIndex],
                                data: compressedResult.data,
                                size: compressedResult.size,
                                type: compressedResult.type,
                                optimized: true,
                                optimizedAt: new Date().toISOString(),
                                originalSize: oldSize,
                                compressionRatio: compressedResult.compressionRatio
                            };

                            savedSpace += (oldSize - compressedResult.size);
                            processedCount++;
                            hasChanges = true;
                        }
                    }
                }
            } catch (error) {
                console.warn(`压缩图片失败:`, error);
            }
        }

        // 保存更改
        if (hasChanges) {
            StorageManager.saveData(data);
        }

        return {
            processedImages: processedCount,
            savedSpace: savedSpace
        };
    }

    /**
     * 压缩单个图片数据
     * @private
     */
    async _compressImageData(dataUrl, targetSizeKB) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    // 创建临时文件对象
                    const blob = this._dataUrlToBlob(dataUrl);
                    const file = new File([blob], 'temp.jpg', { type: 'image/jpeg' });
                    
                    // 使用极致优化器压缩
                    const result = await window.DakaImageOptimizer.smartCompress(file, targetSizeKB);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = dataUrl;
        });
    }

    /**
     * DataURL 转 Blob
     * @private
     */
    _dataUrlToBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    /**
     * 手动触发优化（用于测试）
     */
    triggerOptimization() {
        this.scheduleOptimization();
    }

    /**
     * 获取优化统计
     */
    getOptimizationStats() {
        if (!window.dakaBatchOptimizer) return null;
        return window.dakaBatchOptimizer.getOptimizationStats();
    }

    /**
     * 优化现有头像
     */
    async optimizeExistingAvatar() {
        try {
            if (window.avatarOptimizer) {
                const result = await window.avatarOptimizer.optimizeExistingAvatar();
                if (result.optimized) {
                    console.log(`🖼️ 头像自动优化完成: ${result.originalSizeKB}KB → ${result.newSizeKB}KB`);
                    
                    if (window.UIManager) {
                        UIManager.showNotification(
                            `🖼️ 头像已自动优化，节省 ${result.originalSizeKB - result.newSizeKB}KB`, 
                            'success'
                        );
                    }
                }
            }
        } catch (error) {
            console.warn('头像自动优化失败:', error);
        }
    }

    /**
     * 停止自动优化
     */
    stop() {
        this.isRunning = false;
        console.log('自动图片优化服务已停止');
    }
}

// 创建全局自动优化实例
window.AutoImageOptimizer = AutoImageOptimizer;
window.autoImageOptimizer = new AutoImageOptimizer();

console.log('🤖 自动图片优化服务已启动');