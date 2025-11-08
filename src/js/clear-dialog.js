/**
 * 清除数据对话框管理
 */

class ClearDialogManager {
    constructor() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            // 在独立页面中，不初始化对话框
            return;
        }
        
        this.overlay = document.getElementById('clear-dialog-overlay');
        this.step1 = document.getElementById('clear-step-1');
        this.step2 = document.getElementById('clear-step-2');
        this.confirmInput = document.getElementById('clear-confirm-input');
        this.finalBtn = document.getElementById('clear-final-btn');
        this.isVisible = false;
        this.originalBodyStyle = '';
        
        this.init();
    }

    init() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        this.bindEvents();
        this.showStep1();
    }

    bindEvents() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        // 清除按钮点击事件
        const clearBtn = document.getElementById('clear-all-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.show();
            });
        }

        // 关闭按钮
        const closeBtn = document.getElementById('clear-dialog-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hide();
                // 点击关闭按钮后重新加载设置页面
                window.location.reload();
            });
        }

        // 取消按钮
        const cancelBtn = document.getElementById('clear-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hide();
                // 点击取消按钮后重新加载设置页面
                window.location.reload();
            });
        }

        // 确认清除按钮
        const confirmBtn = document.getElementById('clear-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showStep2();
            });
        }

        // 返回按钮
        const backBtn = document.getElementById('clear-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showStep1();
            });
        }

        // 最终确认按钮
        if (this.finalBtn) {
            this.finalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.executeClear();
            });
        }

        // 确认输入框
        if (this.confirmInput) {
            this.confirmInput.addEventListener('input', (e) => {
                this.validateInput(e.target.value);
            });

            this.confirmInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.finalBtn.disabled) {
                    e.preventDefault();
                    this.executeClear();
                }
            });

            // 移动端输入优化
            this.confirmInput.addEventListener('focus', () => {
                // 延迟滚动到输入框位置
                setTimeout(() => {
                    this.scrollToInput();
                }, 300);
            });
        }

        // 点击遮罩层关闭
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                // 禁止点击遮罩层关闭对话框
                // 只有点击关闭按钮或取消按钮才能关闭对话框
                return false;
            });

            // 防止遮罩层滚动
            this.overlay.addEventListener('touchmove', (e) => {
                e.preventDefault();
            }, { passive: false });
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // 移动端返回键处理
        window.addEventListener('popstate', () => {
            if (this.isVisible) {
                this.hide();
            }
        });
    }

    show() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        if (this.overlay) {
            this.isVisible = true;
            this.overlay.classList.add('show');
            this.preventBodyScroll();
            this.showStep1();
            
            // 移动端优化：添加历史记录
            if (window.history && window.history.pushState) {
                window.history.pushState({ dialog: 'clear' }, '');
            }
        }
    }

    hide() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        if (this.overlay) {
            this.isVisible = false;
            this.overlay.classList.remove('show');
            this.restoreBodyScroll();
            this.reset();
            
            // 移动端优化：移除历史记录
            if (window.history && window.history.state && window.history.state.dialog === 'clear') {
                window.history.back();
            }
        }
    }

    isDialogVisible() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return false;
        }
        
        return this.isVisible;
    }

    showStep1() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        if (this.step1 && this.step2) {
            this.step1.classList.add('show');
            this.step2.classList.remove('show');
        }
    }

    showStep2() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        if (this.step1 && this.step2) {
            this.step1.classList.remove('show');
            this.step2.classList.add('show');
            
            // 聚焦到输入框
            if (this.confirmInput) {
                setTimeout(() => {
                    this.confirmInput.focus();
                }, 300);
            }
        }
    }

    validateInput(value) {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        const expectedText = '清除所有内容';
        const isValid = value.trim() === expectedText;
        
        if (this.finalBtn) {
            this.finalBtn.disabled = !isValid;
        }
        
        if (this.confirmInput) {
            if (isValid) {
                this.confirmInput.classList.remove('error');
            } else {
                this.confirmInput.classList.add('error');
            }
        }
    }

    reset() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        // 重置输入框
        if (this.confirmInput) {
            this.confirmInput.value = '';
            this.confirmInput.classList.remove('error');
        }
        
        // 重置按钮状态
        if (this.finalBtn) {
            this.finalBtn.disabled = true;
        }
        
        // 回到第一步
        this.showStep1();
    }

    // 防止body滚动
    preventBodyScroll() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        // 保存原始样式
        this.originalBodyStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            width: document.body.style.width,
            height: document.body.style.height,
            top: document.body.style.top,
            left: document.body.style.left
        };
        
        // 防止滚动
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = `-${window.scrollY}px`;
        document.body.style.left = `-${window.scrollX}px`;
    }

    // 恢复body滚动
    restoreBodyScroll() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        // 恢复原始样式
        if (this.originalBodyStyle) {
            document.body.style.overflow = this.originalBodyStyle.overflow || '';
            document.body.style.position = this.originalBodyStyle.position || '';
            document.body.style.width = this.originalBodyStyle.width || '';
            document.body.style.height = this.originalBodyStyle.height || '';
            document.body.style.top = this.originalBodyStyle.top || '';
            document.body.style.left = this.originalBodyStyle.left || '';
        } else {
            // 默认恢复
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            document.body.style.top = '';
            document.body.style.left = '';
        }
        
        // 恢复滚动位置
        const scrollY = parseInt(document.body.style.top || '0') * -1;
        const scrollX = parseInt(document.body.style.left || '0') * -1;
        window.scrollTo(scrollX, scrollY);
    }

    // 滚动到输入框位置（移动端优化）
    scrollToInput() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        if (this.confirmInput && this.isMobile()) {
            const rect = this.confirmInput.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const inputHeight = rect.height;
            const inputTop = rect.top;
            
            // 如果输入框在屏幕下半部分，滚动到合适位置
            if (inputTop > windowHeight * 0.6) {
                const scrollY = inputTop - windowHeight * 0.3;
                window.scrollTo({
                    top: window.scrollY + scrollY,
                    behavior: 'smooth'
                });
            }
        }
    }

    // 检测是否为移动设备
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    async executeClear() {
        // 检查是否在独立的清除页面中
        if (window.location.pathname.includes('clear-all-data.html')) {
            return;
        }
        
        try {
            // 禁用按钮，显示加载状态
            if (this.finalBtn) {
                this.finalBtn.disabled = true;
                this.finalBtn.innerHTML = '<span class="clear-loading"></span>正在清除...';
            }

            // 设置确认标记
            sessionStorage.setItem('clearDataConfirmed', 'true');
            
            // 延迟一下让用户看到加载状态
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 跳转到清除页面
            window.location.href = 'clear.html';
            
        } catch (error) {
            console.error('清除数据失败:', error);
            
            // 恢复按钮状态
            if (this.finalBtn) {
                this.finalBtn.disabled = false;
                this.finalBtn.innerHTML = '<i class="fas fa-trash"></i>最终确认';
            }
            
            // 显示错误提示
            if (window.UIManager && typeof UIManager.showNotification === 'function') {
                UIManager.showNotification('清除数据失败，请重试', 'error');
            }
        }
    }
}

// 全局清除数据函数（保持向后兼容）
function clearAllData() {
    // 检查是否在独立的清除页面中
    if (window.location.pathname.includes('clear-all-data.html')) {
        return;
    }
    
    if (window.clearDialogManager) {
        clearDialogManager.show();
    } else {
        // 如果对话框管理器未初始化，直接跳转到清除页面
        sessionStorage.setItem('clearDataConfirmed', 'true');
        window.location.href = 'clear.html';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否在独立的清除页面中
    if (window.location.pathname.includes('clear-all-data.html')) {
        return;
    }
    
    window.clearDialogManager = new ClearDialogManager();
});

// 导出
window.ClearDialogManager = ClearDialogManager;
window.clearAllData = clearAllData;