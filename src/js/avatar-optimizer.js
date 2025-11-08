/**
 * 头像自动优化工具
 * 专门用于头像的压缩和管理
 */
class AvatarOptimizer {
    constructor() {
        this.maxSizeKB = 30; // 头像目标大小30KB
        this.maxDimension = 300; // 头像最大尺寸300x300
        this.quality = 0.8; // 初始质量
        this.minQuality = 0.3; // 最低质量
        
        this.init();
    }

    init() {
        console.log('🖼️ 头像优化器已初始化');
    }

    /**
     * 压缩头像文件
     * @param {File} file - 原始头像文件
     * @returns {Promise<Object>} 压缩结果
     */
    async compressAvatar(file) {
        try {
            console.log(`🔄 开始压缩头像: ${file.name} (${Math.round(file.size / 1024)}KB)`);
            
            // 创建图片对象
            const img = await this._loadImage(file);
            
            // 计算最佳尺寸
            const { width, height } = this._calculateOptimalSize(img.width, img.height);
            
            // 创建画布并绘制
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            
            // 绘制图片
            ctx.drawImage(img, 0, 0, width, height);
            
            // 逐步压缩直到达到目标大小
            let quality = this.quality;
            let compressedData;
            let attempts = 0;
            const maxAttempts = 10;
            
            do {
                compressedData = canvas.toDataURL('image/jpeg', quality);
                const sizeKB = Math.round((compressedData.length * 3) / 4 / 1024);
                
                console.log(`压缩尝试 ${attempts + 1}: 质量=${quality.toFixed(2)}, 大小=${sizeKB}KB`);
                
                if (sizeKB <= this.maxSizeKB || quality <= this.minQuality) {
                    break;
                }
                
                // 根据当前大小调整质量
                const ratio = this.maxSizeKB / sizeKB;
                quality = Math.max(quality * ratio * 0.9, this.minQuality);
                attempts++;
                
            } while (attempts < maxAttempts);
            
            const finalSizeKB = Math.round((compressedData.length * 3) / 4 / 1024);
            const originalSizeKB = Math.round(file.size / 1024);
            const compressionRatio = ((originalSizeKB - finalSizeKB) / originalSizeKB * 100).toFixed(1);
            
            console.log(`✅ 头像压缩完成: ${originalSizeKB}KB → ${finalSizeKB}KB (压缩率: ${compressionRatio}%)`);
            
            return {
                data: compressedData,
                size: Math.round((compressedData.length * 3) / 4),
                type: 'image/jpeg',
                width: width,
                height: height,
                quality: quality,
                originalSize: file.size,
                compressionRatio: parseFloat(compressionRatio),
                optimized: true,
                optimizedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('头像压缩失败:', error);
            throw error;
        }
    }

    /**
     * 加载图片
     * @private
     */
    _loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * 计算最佳尺寸
     * @private
     */
    _calculateOptimalSize(originalWidth, originalHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        // 如果图片过大，按比例缩放
        if (width > this.maxDimension || height > this.maxDimension) {
            const ratio = Math.min(this.maxDimension / width, this.maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        return { width, height };
    }

    /**
     * 清理旧头像数据
     * @param {string} newAvatarData - 新头像数据
     */
    cleanupOldAvatar(newAvatarData) {
        try {
            // 获取当前用户信息
            const userInfo = StorageManager.getUserInfo();
            const oldAvatar = userInfo.avatar;
            
            // 如果旧头像是base64数据且不是默认头像，则清理
            if (oldAvatar && 
                oldAvatar.startsWith('data:image/') && 
                oldAvatar !== newAvatarData &&
                !oldAvatar.includes('avatar-default') &&
                !oldAvatar.includes('img/1.png')) {
                
                console.log('🗑️ 清理旧头像数据');
                
                // 计算释放的空间
                const oldSizeKB = Math.round((oldAvatar.length * 3) / 4 / 1024);
                const newSizeKB = Math.round((newAvatarData.length * 3) / 4 / 1024);
                
                console.log(`头像更新: ${oldSizeKB}KB → ${newSizeKB}KB`);
                
                // 清理localStorage中可能存在的临时头像数据
                this._cleanupTempAvatarData();
                
                return {
                    cleaned: true,
                    freedSpaceKB: oldSizeKB,
                    newSizeKB: newSizeKB
                };
            }
            
            return { cleaned: false };
            
        } catch (error) {
            console.warn('清理旧头像失败:', error);
            return { cleaned: false };
        }
    }

    /**
     * 清理临时头像数据
     * @private
     */
    _cleanupTempAvatarData() {
        const tempKeys = [
            'tempUserAvatar',
            'avatarPreviewData',
            'uploadedAvatarData'
        ];
        
        tempKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`清理临时数据: ${key}`);
            }
        });
    }

    /**
     * 获取头像优化统计
     */
    getOptimizationStats() {
        const userInfo = StorageManager.getUserInfo();
        const avatar = userInfo.avatar;
        
        if (!avatar || !avatar.startsWith('data:image/')) {
            return {
                hasAvatar: false,
                isOptimized: false
            };
        }
        
        const sizeKB = Math.round((avatar.length * 3) / 4 / 1024);
        const isOptimized = sizeKB <= this.maxSizeKB;
        
        return {
            hasAvatar: true,
            isOptimized: isOptimized,
            currentSizeKB: sizeKB,
            targetSizeKB: this.maxSizeKB,
            needsOptimization: !isOptimized
        };
    }

    /**
     * 自动优化现有头像
     */
    async optimizeExistingAvatar() {
        try {
            const stats = this.getOptimizationStats();
            
            if (!stats.hasAvatar || stats.isOptimized) {
                return { optimized: false, reason: '无需优化' };
            }
            
            console.log(`🔄 优化现有头像 (当前: ${stats.currentSizeKB}KB)`);
            
            const userInfo = StorageManager.getUserInfo();
            const avatarData = userInfo.avatar;
            
            // 将base64转换为File对象
            const blob = this._dataUrlToBlob(avatarData);
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            
            // 压缩头像
            const compressedResult = await this.compressAvatar(file);
            
            // 更新用户信息
            StorageManager.updateUserInfo({
                avatar: compressedResult.data
            });
            
            // 更新所有头像显示
            this._updateAllAvatarElements(compressedResult.data);
            
            console.log(`✅ 现有头像优化完成: ${stats.currentSizeKB}KB → ${Math.round(compressedResult.size / 1024)}KB`);
            
            return {
                optimized: true,
                originalSizeKB: stats.currentSizeKB,
                newSizeKB: Math.round(compressedResult.size / 1024),
                compressionRatio: compressedResult.compressionRatio
            };
            
        } catch (error) {
            console.error('优化现有头像失败:', error);
            return { optimized: false, reason: error.message };
        }
    }

    /**
     * DataURL转Blob
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
     * 更新所有头像元素
     * @private
     */
    _updateAllAvatarElements(avatarData) {
        const avatarElements = document.querySelectorAll('.user-avatar, #user-avatar, #avatar-preview, #user-info-avatar');
        avatarElements.forEach(element => {
            if (element) {
                element.src = avatarData;
            }
        });
    }
}

// 创建全局实例
window.AvatarOptimizer = AvatarOptimizer;
window.avatarOptimizer = new AvatarOptimizer();

console.log('🖼️ 头像优化器已加载');