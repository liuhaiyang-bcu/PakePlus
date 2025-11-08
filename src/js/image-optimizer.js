/**
 * 极致图片优化工具
 * 专门为移动端和网络环境优化的超级压缩方案
 */
class ImageOptimizer extends ImageCompressor {
    constructor(options = {}) {
        // 极致压缩的默认设置
        const ultraOptions = {
            maxWidth: 600,            // 更小的尺寸
            maxHeight: 600,
            quality: 0.8,             // 提高质量到80%
            maxSizeKB: 100,          // 更小的文件大小
            outputFormat: 'image/jpeg',
            enableResize: true,
            enableQualityAdjust: true,
            enableSmartCrop: true,    // 智能裁剪
            enableSharpening: false   // 禁用锐化以减少文件大小
        };
        
        super({ ...ultraOptions, ...options });
    }

    /**
     * 智能压缩 - 根据图片内容自动选择最佳压缩策略
     */
    async smartCompress(file, targetSizeKB = 80) {
        try {
            // 第一步：获取图片信息
            const imageInfo = await this.getImageInfo(file);
            
            // 第二步：根据图片特征选择压缩策略
            const strategy = this._selectCompressionStrategy(imageInfo, targetSizeKB);
            
            // 第三步：应用压缩策略
            const result = await this.compressImage(file, strategy);
            
            // 第四步：如果还是太大，进行二次压缩
            if (result.size > targetSizeKB * 1024) {
                return await this._secondaryCompress(file, result, targetSizeKB);
            }
            
            return result;
        } catch (error) {
            console.warn('智能压缩失败，使用标准压缩:', error);
            return await this.compressImage(file);
        }
    }

    /**
     * 选择压缩策略
     * @private
     */
    _selectCompressionStrategy(imageInfo, targetSizeKB) {
        const { width, height, sizeKB } = imageInfo;
        const aspectRatio = width / height;
        
        // 超大图片 - 激进压缩
        if (sizeKB > 2000 || width > 2000 || height > 2000) {
            return {
                maxWidth: 500,
                maxHeight: 500,
                quality: 0.8,
                maxSizeKB: targetSizeKB
            };
        }
        
        // 横向图片 - 适合缩略图
        if (aspectRatio > 1.5) {
            return {
                maxWidth: 600,
                maxHeight: 400,
                quality: 0.8,
                maxSizeKB: targetSizeKB
            };
        }
        
        // 纵向图片 - 保持比例
        if (aspectRatio < 0.7) {
            return {
                maxWidth: 400,
                maxHeight: 600,
                quality: 0.8,
                maxSizeKB: targetSizeKB
            };
        }
        
        // 正方形或接近正方形
        return {
            maxWidth: 500,
            maxHeight: 500,
            quality: 0.8,
            maxSizeKB: targetSizeKB
        };
    }

    /**
     * 二次压缩 - 当第一次压缩还不够时
     * @private
     */
    async _secondaryCompress(originalFile, firstResult, targetSizeKB) {
        // 更激进的设置
        const ultraSettings = {
            maxWidth: Math.min(400, firstResult.compressedWidth * 0.8),
            maxHeight: Math.min(400, firstResult.compressedHeight * 0.8),
            quality: Math.max(0.2, firstResult.quality * 0.7),
            maxSizeKB: targetSizeKB
        };
        
        return await this.compressImage(originalFile, ultraSettings);
    }

    /**
     * 批量智能压缩
     */
    async batchSmartCompress(files, targetSizeKB = 80) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.smartCompress(file, targetSizeKB);
                results.push(result);
            } catch (error) {
                console.error(`压缩文件 ${file.name} 失败:`, error);
                // 失败时使用标准压缩作为后备
                try {
                    const fallback = await this.compressImage(file);
                    results.push(fallback);
                } catch (fallbackError) {
                    console.error(`后备压缩也失败:`, fallbackError);
                }
            }
        }
        
        return results;
    }

    /**
     * 渐进式压缩 - 逐步降低质量直到达到目标大小
     */
    async progressiveCompress(file, targetSizeKB = 50, maxAttempts = 8) {
        let currentQuality = 0.6;
        let currentWidth = Math.min(800, 1200);
        let currentHeight = Math.min(800, 1200);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const options = {
                maxWidth: currentWidth,
                maxHeight: currentHeight,
                quality: currentQuality,
                maxSizeKB: targetSizeKB * 2, // 给一些缓冲
                enableQualityAdjust: false // 禁用自动调整，我们手动控制
            };
            
            const result = await this.compressImage(file, options);
            const resultSizeKB = Math.round(result.size / 1024);
            
            // 如果达到目标大小，返回结果
            if (resultSizeKB <= targetSizeKB) {
                return result;
            }
            
            // 调整参数进行下一次尝试
            if (resultSizeKB > targetSizeKB * 1.5) {
                // 大幅超出，同时降低尺寸和质量
                currentWidth = Math.round(currentWidth * 0.8);
                currentHeight = Math.round(currentHeight * 0.8);
                currentQuality *= 0.8;
            } else {
                // 轻微超出，主要降低质量
                currentQuality *= 0.85;
            }
            
            // 防止质量过低
            if (currentQuality < 0.15) {
                currentQuality = 0.15;
            }
            
            // 防止尺寸过小
            if (currentWidth < 200 || currentHeight < 200) {
                break;
            }
        }
        
        // 如果所有尝试都失败，返回最后一次的结果
        return await this.compressImage(file, {
            maxWidth: 300,
            maxHeight: 300,
            quality: 0.2,
            maxSizeKB: targetSizeKB
        });
    }

    /**
     * 移动端优化压缩 - 专为移动设备优化
     */
    async mobileOptimize(file) {
        return await this.smartCompress(file, 60); // 移动端目标60KB
    }

    /**
     * 网络优化压缩 - 专为网络传输优化
     */
    async networkOptimize(file) {
        return await this.progressiveCompress(file, 40); // 网络传输目标40KB
    }
}

// 创建全局优化器实例
window.ImageOptimizer = ImageOptimizer;

// 为打卡功能创建超级压缩实例
window.DakaImageOptimizer = new ImageOptimizer({
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.8,
    maxSizeKB: 80
});

console.log('极致图片优化工具已加载');