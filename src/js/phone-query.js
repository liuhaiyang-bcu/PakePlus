/**
 * 电话查询管理器
 * 提供手机号码归属地查询功能
 */
const PhoneQueryManager = {
    // API端点
    apiUrl: 'https://uapis.cn/api/v1/misc/phoneinfo',
    
    // 当前查询状态
    isQuerying: false,
    
    /**
     * 初始化电话查询功能
     */
    init() {
        console.log('初始化电话查询功能');
        this.bindEvents();
        this.setupInputValidation();
    },
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        const queryBtn = document.getElementById('phone-query-btn');
        const phoneInput = document.getElementById('phone-input');
        const copyBtn = document.getElementById('phone-copy-btn');
        const shareBtn = document.getElementById('phone-share-btn');
        
        // 查询按钮点击事件
        if (queryBtn) {
            queryBtn.addEventListener('click', () => {
                this.handleQuery();
            });
        }
        
        // 输入框回车事件
        if (phoneInput) {
            phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleQuery();
                }
            });
            
            // 输入框输入事件（实时验证）
            phoneInput.addEventListener('input', (e) => {
                this.validatePhoneInput(e.target);
            });
        }
        
        // 复制按钮事件
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyPhoneInfo();
            });
        }
        
        // 分享按钮事件
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.sharePhoneInfo();
            });
        }
    },
    
    /**
     * 设置输入验证
     */
    setupInputValidation() {
        const phoneInput = document.getElementById('phone-input');
        if (!phoneInput) return;
        
        // 只允许输入数字
        phoneInput.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value;
        });
        
        // 限制最大长度为11位
        phoneInput.addEventListener('input', (e) => {
            if (e.target.value.length > 11) {
                e.target.value = e.target.value.slice(0, 11);
            }
        });
    },
    
    /**
     * 验证手机号输入
     */
    validatePhoneInput(input) {
        const value = input.value;
        const queryBtn = document.getElementById('phone-query-btn');
        
        if (value.length === 11) {
            // 验证手机号格式
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (phoneRegex.test(value)) {
                input.style.borderColor = '#4CAF50';
                if (queryBtn) queryBtn.disabled = false;
            } else {
                input.style.borderColor = '#f44336';
                if (queryBtn) queryBtn.disabled = true;
            }
        } else {
            input.style.borderColor = '#e0e0e0';
            if (queryBtn) queryBtn.disabled = value.length === 0;
        }
    },
    
    /**
     * 处理查询请求
     */
    async handleQuery() {
        const phoneInput = document.getElementById('phone-input');
        const queryBtn = document.getElementById('phone-query-btn');
        const phoneResult = document.getElementById('phone-result');
        const phoneError = document.getElementById('phone-error');
        
        if (!phoneInput || !queryBtn) return;
        
        const phoneNumber = phoneInput.value.trim();
        
        // 验证手机号
        if (!this.isValidPhoneNumber(phoneNumber)) {
            this.showError('请输入有效的11位手机号码');
            return;
        }
        
        // 防止重复查询
        if (this.isQuerying) return;
        
        this.isQuerying = true;
        this.setLoadingState(true);
        this.hideResults();
        
        try {
            const result = await this.queryPhoneInfo(phoneNumber);
            this.showResult(result);
        } catch (error) {
            console.error('查询手机号信息失败:', error);
            this.showError(error.message);
        } finally {
            this.isQuerying = false;
            this.setLoadingState(false);
        }
    },
    
    /**
     * 验证手机号格式
     */
    isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phoneNumber);
    },
    
    /**
     * 查询手机号信息
     */
    async queryPhoneInfo(phoneNumber) {
        const url = `${this.apiUrl}?phone=${encodeURIComponent(phoneNumber)}`;
        
        const response = await fetch(url);
        
        if (response.status === 200) {
            const data = await response.json();
            return {
                phone: phoneNumber,
                city: data.city || '未知',
                province: data.province || '未知',
                sp: data.sp || '未知'
            };
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error('请求参数错误：' + (errorData.message || '请检查手机号格式'));
        } else if (response.status === 500) {
            const errorData = await response.json();
            throw new Error('查询失败：' + (errorData.message || '服务器内部错误'));
        } else {
            throw new Error('查询失败，请稍后重试');
        }
    },
    
    /**
     * 设置加载状态
     */
    setLoadingState(loading) {
        const queryBtn = document.getElementById('phone-query-btn');
        if (!queryBtn) return;
        
        if (loading) {
            queryBtn.disabled = true;
            queryBtn.classList.add('loading');
            queryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 查询中...';
        } else {
            queryBtn.disabled = false;
            queryBtn.classList.remove('loading');
            queryBtn.innerHTML = '<i class="fas fa-search"></i> 查询';
        }
    },
    
    /**
     * 显示查询结果
     */
    showResult(result) {
        const phoneResult = document.getElementById('phone-result');
        const phoneNumber = document.getElementById('phone-number');
        const phoneLocation = document.getElementById('phone-location');
        const phoneProvider = document.getElementById('phone-provider');
        
        if (!phoneResult || !phoneNumber || !phoneLocation || !phoneProvider) return;
        
        // 更新显示内容
        phoneNumber.textContent = this.formatPhoneNumber(result.phone);
        phoneLocation.textContent = `${result.province} ${result.city}`;
        phoneProvider.textContent = result.sp;
        
        // 显示结果区域
        phoneResult.style.display = 'block';
        
        // 添加提示文字
        let disclaimer = document.getElementById('phone-query-disclaimer');
        if (!disclaimer) {
            disclaimer = document.createElement('div');
            disclaimer.id = 'phone-query-disclaimer';
            disclaimer.style.cssText = 'font-size: 0.9em; color: #888; text-align: center; margin-top: 10px;';
            disclaimer.textContent = '相关内容来自网络，相关数据仅供参考';
            phoneResult.appendChild(disclaimer);
        }
        
        // 存储结果用于复制和分享
        this.lastQueryResult = result;
    },
    
    /**
     * 显示错误信息
     */
    showError(message) {
        const phoneError = document.getElementById('phone-error');
        const errorMessage = document.getElementById('phone-error-message');
        
        if (!phoneError || !errorMessage) return;
        
        errorMessage.textContent = message;
        phoneError.style.display = 'block';
        
        // 3秒后自动隐藏错误信息
        setTimeout(() => {
            phoneError.style.display = 'none';
        }, 3000);
    },
    
    /**
     * 隐藏所有结果
     */
    hideResults() {
        const phoneResult = document.getElementById('phone-result');
        const phoneError = document.getElementById('phone-error');
        
        if (phoneResult) phoneResult.style.display = 'none';
        if (phoneError) phoneError.style.display = 'none';
    },
    
    /**
     * 格式化手机号显示
     */
    formatPhoneNumber(phoneNumber) {
        if (phoneNumber.length === 11) {
            return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 7)} ${phoneNumber.slice(7)}`;
        }
        return phoneNumber;
    },
    
    /**
     * 复制手机号信息
     */
    copyPhoneInfo() {
        if (!this.lastQueryResult) return;
        
        const text = `手机号码：${this.lastQueryResult.phone}
归属地：${this.lastQueryResult.province} ${this.lastQueryResult.city}
运营商：${this.lastQueryResult.sp}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCopySuccess();
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    },
    
    /**
     * 降级复制方法
     */
    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess();
        } catch (err) {
            console.error('复制失败:', err);
            this.showCopyError();
        }
        
        document.body.removeChild(textarea);
    },
    
    /**
     * 显示复制成功提示
     */
    showCopySuccess() {
        const copyBtn = document.getElementById('phone-copy-btn');
        if (!copyBtn) return;
        
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
        copyBtn.style.background = '#4CAF50';
        copyBtn.style.color = 'white';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
        }, 2000);
    },
    
    /**
     * 显示复制失败提示
     */
    showCopyError() {
        const copyBtn = document.getElementById('phone-copy-btn');
        if (!copyBtn) return;
        
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-times"></i> 复制失败';
        copyBtn.style.background = '#f44336';
        copyBtn.style.color = 'white';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
        }, 2000);
    },
    
    /**
     * 分享手机号信息
     */
    sharePhoneInfo() {
        if (!this.lastQueryResult) return;
        
        const text = `📱 手机号码查询结果
号码：${this.lastQueryResult.phone}
归属地：${this.lastQueryResult.province} ${this.lastQueryResult.city}
运营商：${this.lastQueryResult.sp}

✨ 来自有数规划 ✨`;
        
        if (navigator.share) {
            navigator.share({
                title: '手机号码查询结果',
                text: text
            }).catch((error) => {
                console.log('分享失败:', error);
                this.fallbackShare(text);
            });
        } else {
            this.fallbackShare(text);
        }
    },
    
    /**
     * 降级分享方法
     */
    fallbackShare(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showShareSuccess();
            }).catch(() => {
                this.showShareError();
            });
        } else {
            this.showShareError();
        }
    },
    
    /**
     * 显示分享成功提示
     */
    showShareSuccess() {
        const shareBtn = document.getElementById('phone-share-btn');
        if (!shareBtn) return;
        
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
        shareBtn.style.background = '#4CAF50';
        shareBtn.style.color = 'white';
        
        setTimeout(() => {
            shareBtn.innerHTML = originalText;
            shareBtn.style.background = '';
            shareBtn.style.color = '';
        }, 2000);
    },
    
    /**
     * 显示分享失败提示
     */
    showShareError() {
        const shareBtn = document.getElementById('phone-share-btn');
        if (!shareBtn) return;
        
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="fas fa-times"></i> 分享失败';
        shareBtn.style.background = '#f44336';
        shareBtn.style.color = 'white';
        
        setTimeout(() => {
            shareBtn.innerHTML = originalText;
            shareBtn.style.background = '';
            shareBtn.style.color = '';
        }, 2000);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    PhoneQueryManager.init();
});

// 导出到全局作用域
window.PhoneQueryManager = PhoneQueryManager;




