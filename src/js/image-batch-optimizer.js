/**
 * 批量图片优化工具
 * 用于压缩已存储的打卡图片，释放存储空间
 */
class ImageBatchOptimizer {
    constructor() {
        this.isProcessing = false;
        this.processedCount = 0;
        this.totalCount = 0;
        this.savedSpace = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    /**
     * 扫描所有打卡记录中的图片
     */
    scanAllDakaImages() {
        const data = StorageManager.getData();
        const dakas = data.dakas || [];
        const allImages = [];

        dakas.forEach(daka => {
            if (Array.isArray(daka.punchRecords)) {
                daka.punchRecords.forEach((record, recordIndex) => {
                    if (Array.isArray(record.files)) {
                        record.files.forEach((file, fileIndex) => {
                            if (file.type && file.type.startsWith('image/') && file.data) {
                                allImages.push({
                                    dakaId: daka.id,
                                    dakaTitle: daka.title,
                                    recordIndex,
                                    fileIndex,
                                    file,
                                    originalSize: file.size || this._estimateDataUrlSize(file.data)
                                });
                            }
                        });
                    }
                });
            }
        });

        return allImages;
    }

    /**
     * 批量优化所有打卡图片
     */
    async optimizeAllDakaImages(options = {}) {
        if (this.isProcessing) {
            throw new Error('正在处理中，请稍候...');
        }

        const {
            targetSizeKB = 60,
            skipIfSmaller = true,
            createBackup = false
        } = options;

        this.isProcessing = true;
        this.processedCount = 0;
        this.savedSpace = 0;

        try {
            const allImages = this.scanAllDakaImages();
            this.totalCount = allImages.length;

            if (this.totalCount === 0) {
                throw new Error('没有找到需要优化的图片');
            }

            // 创建备份（如果需要）
            if (createBackup) {
                this._createBackup();
            }

            const data = StorageManager.getData();
            let hasChanges = false;

            for (let i = 0; i < allImages.length; i++) {
                const imageInfo = allImages[i];
                
                // 更新进度
                if (this.onProgress) {
                    this.onProgress({
                        current: i + 1,
                        total: this.totalCount,
                        currentImage: imageInfo.dakaTitle,
                        processed: this.processedCount,
                        savedSpace: this.savedSpace
                    });
                }

                try {
                    // 检查是否需要压缩
                    const currentSizeKB = Math.round(imageInfo.originalSize / 1024);
                    if (skipIfSmaller && currentSizeKB <= targetSizeKB) {
                        continue; // 跳过已经足够小的图片
                    }

                    // 压缩图片
                    const compressedResult = await this._compressImageData(
                        imageInfo.file.data, 
                        targetSizeKB
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

                                this.savedSpace += (oldSize - compressedResult.size);
                                this.processedCount++;
                                hasChanges = true;
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`压缩图片失败 (${imageInfo.dakaTitle}):`, error);
                }
            }

            // 保存更改
            if (hasChanges) {
                StorageManager.saveData(data);
            }

            // 完成回调
            if (this.onComplete) {
                this.onComplete({
                    totalImages: this.totalCount,
                    processedImages: this.processedCount,
                    savedSpaceKB: Math.round(this.savedSpace / 1024),
                    savedSpaceMB: Math.round(this.savedSpace / (1024 * 1024) * 100) / 100
                });
            }

            return {
                success: true,
                totalImages: this.totalCount,
                processedImages: this.processedCount,
                savedSpace: this.savedSpace
            };

        } finally {
            this.isProcessing = false;
        }
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
     * 估算 DataURL 的大小
     * @private
     */
    _estimateDataUrlSize(dataUrl) {
        if (!dataUrl) return 0;
        const base64Data = dataUrl.split(',')[1] || '';
        return Math.round((base64Data.length * 3) / 4);
    }

    /**
     * 创建数据备份
     * @private
     */
    _createBackup() {
        const data = StorageManager.getData();
        const backupKey = `backup_before_optimization_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(data));
        console.log(`数据备份已创建: ${backupKey}`);
    }

    /**
     * 获取优化统计信息
     */
    getOptimizationStats() {
        const allImages = this.scanAllDakaImages();
        let totalSize = 0;
        let optimizedCount = 0;
        let optimizedSize = 0;

        allImages.forEach(imageInfo => {
            totalSize += imageInfo.originalSize;
            if (imageInfo.file.optimized) {
                optimizedCount++;
                optimizedSize += imageInfo.file.size || 0;
            }
        });

        return {
            totalImages: allImages.length,
            totalSizeKB: Math.round(totalSize / 1024),
            totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
            optimizedImages: optimizedCount,
            optimizedSizeKB: Math.round(optimizedSize / 1024),
            optimizedSizeMB: Math.round(optimizedSize / (1024 * 1024) * 100) / 100,
            potentialSavings: Math.round((totalSize - optimizedSize) / 1024)
        };
    }

    /**
     * 显示优化进度弹窗
     */
    showOptimizationModal() {
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.id = 'image-optimization-modal';
        
        const stats = this.getOptimizationStats();
        
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>📸 图片批量优化</h3>
                    <button class="daka-modal-close" id="optimization-modal-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="optimization-stats">
                        <div class="stat-item">
                            <div class="stat-label">总图片数量</div>
                            <div class="stat-value">${stats.totalImages} 张</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">当前总大小</div>
                            <div class="stat-value">${stats.totalSizeMB} MB</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">已优化图片</div>
                            <div class="stat-value">${stats.optimizedImages} 张</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">预计可节省</div>
                            <div class="stat-value">${stats.potentialSavings} KB</div>
                        </div>
                    </div>
                    
                    <div class="optimization-options">
                        <div class="option-group">
                            <label>
                                <input type="checkbox" id="skip-small-images" checked>
                                跳过已经较小的图片 (< 60KB)
                            </label>
                        </div>
                        <div class="option-group">
                            <label>
                                <input type="checkbox" id="create-backup">
                                创建数据备份 (推荐)
                            </label>
                        </div>
                        <div class="option-group">
                            <label for="target-size">目标大小 (KB):</label>
                            <input type="number" id="target-size" value="60" min="20" max="200">
                        </div>
                    </div>

                    <div id="optimization-progress" style="display: none;">
                        <div class="progress-info">
                            <div id="progress-text">准备开始...</div>
                            <div id="progress-details"></div>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" id="optimization-progress-bar"></div>
                        </div>
                    </div>

                    <div id="optimization-result" style="display: none;">
                        <div class="result-success">
                            <h4>✅ 优化完成！</h4>
                            <div id="result-details"></div>
                        </div>
                    </div>
                </div>
                <div class="daka-modal-actions">
                    <button class="daka-modal-btn secondary" id="optimization-cancel">取消</button>
                    <button class="daka-modal-btn primary" id="optimization-start">开始优化</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        this._bindOptimizationModalEvents(modal);
    }

    /**
     * 绑定优化弹窗事件
     * @private
     */
    _bindOptimizationModalEvents(modal) {
        const closeBtn = modal.querySelector('#optimization-modal-close');
        const cancelBtn = modal.querySelector('#optimization-cancel');
        const startBtn = modal.querySelector('#optimization-start');
        const progressDiv = modal.querySelector('#optimization-progress');
        const resultDiv = modal.querySelector('#optimization-result');

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        startBtn.addEventListener('click', async () => {
            const skipSmall = modal.querySelector('#skip-small-images').checked;
            const createBackup = modal.querySelector('#create-backup').checked;
            const targetSize = parseInt(modal.querySelector('#target-size').value);

            startBtn.disabled = true;
            startBtn.textContent = '优化中...';
            progressDiv.style.display = 'block';

            // 设置进度回调
            this.onProgress = (progress) => {
                const progressBar = modal.querySelector('#optimization-progress-bar');
                const progressText = modal.querySelector('#progress-text');
                const progressDetails = modal.querySelector('#progress-details');

                const percent = Math.round((progress.current / progress.total) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `正在处理: ${progress.currentImage}`;
                progressDetails.textContent = `${progress.current}/${progress.total} - 已处理: ${progress.processed} 张，节省: ${Math.round(progress.savedSpace / 1024)} KB`;
            };

            // 设置完成回调
            this.onComplete = (result) => {
                progressDiv.style.display = 'none';
                resultDiv.style.display = 'block';
                
                const resultDetails = modal.querySelector('#result-details');
                resultDetails.innerHTML = `
                    <p>📊 处理了 ${result.processedImages}/${result.totalImages} 张图片</p>
                    <p>💾 节省空间: ${result.savedSpaceMB} MB</p>
                    <p>🚀 加载速度将显著提升！</p>
                `;

                startBtn.textContent = '完成';
                cancelBtn.textContent = '关闭';
                
                // 刷新打卡列表
                if (window.DakaManager) {
                    DakaManager.loadDakas();
                }
            };

            try {
                await this.optimizeAllDakaImages({
                    targetSizeKB: targetSize,
                    skipIfSmaller: skipSmall,
                    createBackup: createBackup
                });
            } catch (error) {
                console.error('优化失败:', error);
                progressDiv.style.display = 'none';
                alert(`优化失败: ${error.message}`);
                startBtn.disabled = false;
                startBtn.textContent = '开始优化';
            }
        });
    }
}

// 创建全局实例
window.ImageBatchOptimizer = ImageBatchOptimizer;
window.dakaBatchOptimizer = new ImageBatchOptimizer();

console.log('批量图片优化工具已加载');