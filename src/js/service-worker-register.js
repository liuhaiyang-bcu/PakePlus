/**
 * Service Worker 注册模块
 */
const ServiceWorkerRegister = {
    /**
     * 检查是否支持Service Worker
     */
    isSupported() {
        return 'serviceWorker' in navigator;
    },
    
    /**
     * 注册Service Worker
     */
    async register() {
        if (!this.isSupported()) {
            console.log('当前浏览器不支持Service Worker');
            return false;
        }
        
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('Service Worker 注册成功:', registration);
            
            // 监听Service Worker状态变化
            registration.addEventListener('updatefound', () => {
                console.log('发现新的Service Worker版本');
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    console.log('Service Worker 状态变化:', newWorker.state);
                });
            });
            
            // 请求通知权限
            await this.requestNotificationPermission();
            
            // 注册后台同步
            await this.registerBackgroundSync();
            
            return true;
        } catch (error) {
            console.error('Service Worker 注册失败:', error);
            return false;
        }
    },
    
    /**
     * 请求通知权限
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('当前浏览器不支持通知');
            return false;
        }
        
        try {
            const permission = await Notification.requestPermission();
            console.log('通知权限请求结果:', permission);
            return permission === 'granted';
        } catch (error) {
            console.error('请求通知权限失败:', error);
            return false;
        }
    },
    
    /**
     * 注册后台同步
     */
    async registerBackgroundSync() {
        if (!('serviceWorker' in navigator) || !('sync' in registration)) {
            console.log('当前浏览器不支持后台同步');
            return false;
        }
        
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('check-notifications');
            console.log('后台同步注册成功');
            return true;
        } catch (error) {
            console.error('后台同步注册失败:', error);
            return false;
        }
    },
    
    /**
     * 发送推送消息到Service Worker
     */
    async sendPushMessage(data) {
        if (!this.isSupported()) return;
        
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.active.postMessage({
                type: 'PUSH_NOTIFICATION',
                data: data
            });
            console.log('推送消息发送成功');
        } catch (error) {
            console.error('发送推送消息失败:', error);
        }
    },
    
    /**
     * 检查Service Worker状态
     */
    async checkStatus() {
        if (!this.isSupported()) return null;
        
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            return registration ? registration.active.state : null;
        } catch (error) {
            console.error('检查Service Worker状态失败:', error);
            return null;
        }
    }
};

// 页面加载完成后自动注册
document.addEventListener('DOMContentLoaded', async () => {
    // 仅在生产环境中注册Service Worker
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        await ServiceWorkerRegister.register();
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceWorkerRegister;
} else if (typeof window !== 'undefined') {
    window.ServiceWorkerRegister = ServiceWorkerRegister;
}