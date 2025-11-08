/**
 * 视图状态管理器
 * 用于协调底部导航和侧边栏之间的视图状态同步
 */
class ViewStateManager {
    constructor() {
        this.currentView = 'recent';
        this.subscribers = [];
        this.isInitialized = false;
        this.lastWidth = window.innerWidth;
    }

    /**
     * 初始化视图状态管理器
     */
    init() {
        if (this.isInitialized) return;
        
        // 监听视图切换事件
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('视图状态管理器已初始化');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听自定义的视图切换事件
        document.addEventListener('viewChange', (event) => {
            this.onViewChange(event.detail.view, event.detail.source);
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.onResize();
        });
    }

    /**
     * 视图切换处理
     */
    onViewChange(view, source) {
        console.log(`视图切换事件: ${view} (来自: ${source})`);
        
        // 更新当前视图
        this.currentView = view;
        
        // 通知所有订阅者
        this.notifySubscribers(view, source);
    }

    /**
     * 窗口大小变化处理
     */
    onResize() {
        // 检查是否发生了从桌面端到移动端或从移动端到桌面端的切换
        const currentWidth = window.innerWidth;
        const wasDesktop = this.lastWidth > 1024;
        const isDesktop = currentWidth > 1024;
        
        // 确保在窗口大小变化时同步两个组件的状态
        if (window.BottomNavNewManager && window.SidebarNavManager) {
            // 如果是桌面端且侧边栏有当前视图，则同步到底部导航
            if (isDesktop && window.SidebarNavManager.currentView) {
                this.syncView(window.SidebarNavManager.currentView, 'SidebarNavManager');
            }
            // 如果是移动端且底部导航有当前视图，则同步到侧边栏
            else if (!isDesktop && window.BottomNavNewManager.currentView) {
                this.syncView(window.BottomNavNewManager.currentView, 'BottomNavNewManager');
            }
        }
        
        this.lastWidth = currentWidth;
    }

    /**
     * 同步视图状态
     */
    syncView(view, source) {
        console.log(`同步视图: ${view} (来自: ${source})`);
        
        // 更新当前视图
        this.currentView = view;
        
        // 通知所有订阅者
        this.notifySubscribers(view, source);
    }

    /**
     * 通知所有订阅者视图变化
     */
    notifySubscribers(view, source) {
        this.subscribers.forEach(callback => {
            try {
                callback(view, source);
            } catch (error) {
                console.error('通知订阅者时出错:', error);
            }
        });
    }

    /**
     * 订阅视图变化事件
     */
    subscribe(callback) {
        if (typeof callback === 'function') {
            this.subscribers.push(callback);
            console.log('已添加视图变化订阅者');
        }
    }

    /**
     * 取消订阅视图变化事件
     */
    unsubscribe(callback) {
        const index = this.subscribers.indexOf(callback);
        if (index > -1) {
            this.subscribers.splice(index, 1);
            console.log('已移除视图变化订阅者');
        }
    }

    /**
     * 发布视图切换事件
     */
    publishViewChange(view, source) {
        const event = new CustomEvent('viewChange', {
            detail: { view, source }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前视图
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * 设置当前视图并发布事件
     */
    setCurrentView(view, source) {
        this.currentView = view;
        this.publishViewChange(view, source);
    }
}

// 创建全局实例
window.ViewStateManager = new ViewStateManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (window.ViewStateManager) {
        window.ViewStateManager.init();
    }
});