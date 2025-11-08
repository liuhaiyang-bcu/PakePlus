/**
 * 图片压缩工具类
 * 用于自动压缩上传的图片，减少存储空间和加载时间
 */
class ImageCompressor {
    constructor(options = {}) {
        this.defaultOptions = {
            maxWidth: 800,            // 最大宽度 (降低)
            maxHeight: 800,           // 最大高度 (降低)
            quality: 0.6,             // 压缩质量 (降低)
            maxSizeKB: 200,          // 最大文件大小 (降低)
            outputFormat: 'image/jpeg', // 输出格式
            enableResize: true,       // 是否启用尺寸调整
            enableQualityAdjust: true // 是否启用质量自适应调整
        };
        
        this.options = { ...this.defaultOptions, ...options };
    }

    /**
     * 压缩单个图片文件
     * @param {File} file 原始图片文件
     * @param {Object} customOptions 自定义选项
     * @returns {Promise<Object>} 压缩后的图片信息
     */
    async compressImage(file, customOptions = {}) {
        const options = { ...this.options, ...customOptions };
        
        return new Promise((resolve, reject) => {
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                reject(new Error('文件不是图片格式'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const result = this._processImage(img, file, options);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error('图片加载失败'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * 批量压缩图片
     * @param {FileList|Array} files 图片文件列表
     * @param {Object} customOptions 自定义选项
     * @returns {Promise<Array>} 压缩后的图片信息数组
     */
    async compressImages(files, customOptions = {}) {
        const fileArray = Array.from(files);
        const promises = fileArray.map(file => this.compressImage(file, customOptions));
        
        try {
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            throw new Error(`批量压缩失败: ${error.message}`);
        }
    }

    /**
     * 处理图片压缩的核心方法
     * @private
     */
    _processImage(img, originalFile, options) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 计算新的尺寸
        const { width, height } = this._calculateDimensions(
            img.width, 
            img.height, 
            options.maxWidth, 
            options.maxHeight,
            options.enableResize
        );

        canvas.width = width;
        canvas.height = height;

        // 绘制图片
        ctx.fillStyle = '#FFFFFF'; // 白色背景，避免透明背景变黑
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // 获取压缩后的数据
        let quality = options.quality;
        let compressedDataUrl;
        let attempts = 0;
        const maxAttempts = 5;

        // 自适应质量调整，确保文件大小符合要求 - 更激进的压缩
        do {
            compressedDataUrl = canvas.toDataURL(options.outputFormat, quality);
            const sizeKB = this._getDataUrlSizeKB(compressedDataUrl);
            
            if (sizeKB <= options.maxSizeKB || !options.enableQualityAdjust || attempts >= maxAttempts) {
                break;
            }
            
            // 更激进地降低质量
            quality *= 0.7;  // 从0.8改为0.7，降低更快
            attempts++;
        } while (quality > 0.05);  // 从0.1改为0.05，允许更低质量

        // 计算压缩信息
        const originalSizeKB = Math.round(originalFile.size / 1024);
        const compressedSizeKB = this._getDataUrlSizeKB(compressedDataUrl);
        const compressionRatio = ((originalSizeKB - compressedSizeKB) / originalSizeKB * 100).toFixed(1);

        return {
            name: originalFile.name,
            type: options.outputFormat,
            size: compressedSizeKB * 1024,
            data: compressedDataUrl,
            originalSize: originalFile.size,
            originalWidth: img.width,
            originalHeight: img.height,
            compressedWidth: width,
            compressedHeight: height,
            compressionRatio: parseFloat(compressionRatio),
            quality: quality
        };
    }

    /**
     * 计算压缩后的尺寸
     * @private
     */
    _calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight, enableResize) {
        if (!enableResize) {
            return { width: originalWidth, height: originalHeight };
        }

        let { width, height } = { width: originalWidth, height: originalHeight };

        // 如果图片尺寸超过限制，按比例缩放
        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
                width = Math.min(width, maxWidth);
                height = width / aspectRatio;
            } else {
                height = Math.min(height, maxHeight);
                width = height * aspectRatio;
            }
        }

        return {
            width: Math.round(width),
            height: Math.round(height)
        };
    }

    /**
     * 计算 DataURL 的文件大小（KB）
     * @private
     */
    _getDataUrlSizeKB(dataUrl) {
        // Base64 编码的数据大小约为原始数据的 4/3
        const base64Data = dataUrl.split(',')[1];
        const sizeBytes = (base64Data.length * 3) / 4;
        return Math.round(sizeBytes / 1024);
    }

    /**
     * 获取图片的基本信息
     * @param {File} file 图片文件
     * @returns {Promise<Object>} 图片信息
     */
    async getImageInfo(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('文件不是图片格式'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        sizeKB: Math.round(file.size / 1024),
                        width: img.width,
                        height: img.height,
                        aspectRatio: (img.width / img.height).toFixed(2)
                    });
                };
                img.onerror = () => reject(new Error('图片加载失败'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * 设置压缩选项
     * @param {Object} newOptions 新的选项
     */
    setOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }

    /**
     * 重置为默认选项
     */
    resetOptions() {
        this.options = { ...this.defaultOptions };
    }

    /**
     * 预设压缩配置
     */
    static presets = {
        // 高质量 - 适合重要图片
        high: {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.75,
            maxSizeKB: 400
        },
        // 中等质量 - 平衡质量和大小
        medium: {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.6,
            maxSizeKB: 200
        },
        // 低质量 - 最小文件大小
        low: {
            maxWidth: 600,
            maxHeight: 600,
            quality: 0.45,
            maxSizeKB: 100
        },
        // 缩略图
        thumbnail: {
            maxWidth: 300,
            maxHeight: 300,
            quality: 0.5,
            maxSizeKB: 30
        },
        // 超级压缩 - 极致压缩
        ultra: {
            maxWidth: 500,
            maxHeight: 500,
            quality: 0.3,
            maxSizeKB: 50
        }
    };
}

// 创建全局实例
window.ImageCompressor = ImageCompressor;

// 为打卡功能创建专用的压缩器实例 - 高质量压缩设置
window.DakaImageCompressor = new ImageCompressor({
    maxWidth: 800,            // 降低最大宽度
    maxHeight: 800,           // 降低最大高度
    quality: 0.8,             // 提高质量到80%
    maxSizeKB: 150,          // 降低最大文件大小到150KB
    outputFormat: 'image/jpeg',
    enableResize: true,
    enableQualityAdjust: true
});

console.log('图片压缩工具已加载');