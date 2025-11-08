/**
 * 通知功能模块
 * 支持倒数日、清单、专注模式、事件等各种通知
 */
class NotificationManager {
    constructor() {
        this.isSupported = false;
        this.permission = 'default';
        this.init();
    }

    /**
     * 初始化通知功能
     */
    async init() {
        // 检查浏览器是否支持通知
        if ('Notification' in window) {
            this.isSupported = true;
            this.permission = Notification.permission;
        }
        
        // 检查是否在 uni-app 环境中
        if (typeof plus !== 'undefined') {
            this.isUniApp = true;
        }
    }

    /**
     * 请求通知权限
     */
    async requestPermission() {
        if (!this.isSupported) {
            console.warn('浏览器不支持通知功能');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('请求通知权限失败:', error);
            return false;
        }
    }

    /**
     * 发送通知
     * @param {Object} options 通知选项
     * @param {string} type 通知类型 ('event', 'todo', 'countdown', 'daka', 'pomodoro')
     */
    async sendNotification(options, type = 'general') {
        // 检查是否启用该类型的通知
        if (typeof isNotificationEnabled === 'function' && !isNotificationEnabled(type)) {
            console.log(`通知类型 "${type}" 已被用户禁用`);
            return false;
        }

        const {
            title = '提醒',
            body = '',
            icon = './img/icon.png',
            tag = '',
            requireInteraction = false,
            actions = [],
            data = {}
        } = options;

        // uni-app 环境使用 plus.runtime.notify
        if (this.isUniApp && typeof plus !== 'undefined') {
            try {
                plus.runtime.notify({
                    title: title,
                    content: body,
                    payload: JSON.stringify(data)
                });
                return true;
            } catch (error) {
                console.error('uni-app 通知发送失败:', error);
            }
        }

        // 浏览器环境使用 Notification API
        if (this.isSupported && this.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    body,
                    icon,
                    tag,
                    requireInteraction,
                    actions,
                    data
                });

                // 设置点击事件
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    if (options.onClick) {
                        options.onClick(data);
                    }
                };

                // 自动关闭
                setTimeout(() => {
                    notification.close();
                }, options.duration || 5000);

                return true;
            } catch (error) {
                console.error('浏览器通知发送失败:', error);
            }
        }

        // 降级到 toast 提示
        this.showToast(title + (body ? ': ' + body : ''));
        return false;
    }

    /**
     * 显示 Toast 提示（降级方案）
     */
    showToast(message, duration = 3000) {
        // uni-app 环境
        if (typeof uni !== 'undefined') {
            uni.showToast({
                title: message,
                duration: duration,
                icon: 'none'
            });
            return;
        }

        // 浏览器环境创建自定义 toast
        const toast = document.createElement('div');
        toast.className = 'custom-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            text-align: center;
            animation: fadeInOut ${duration}ms ease-in-out;
        `;

        // 添加动画样式
        if (!document.querySelector('#toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);
    }

    /**
     * 倒数日通知
     */
    async sendCountdownNotification(event) {
        const now = new Date();
        const eventDate = new Date(event.date);
        const diffTime = eventDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let title, body;
        if (diffDays > 0) {
            title = `倒数日提醒`;
            body = `距离"${event.name}"还有 ${diffDays} 天`;
        } else if (diffDays === 0) {
            title = `今日事件`;
            body = `今天是"${event.name}"的日子！`;
        } else {
            title = `事件已过`;
            body = `"${event.name}"已经过去 ${Math.abs(diffDays)} 天了`;
        }

        return await this.sendNotification({
            title,
            body,
            tag: `countdown-${event.id}`,
            data: { type: 'countdown', event },
            onClick: (data) => {
                // 跳转到倒数日页面
                if (typeof uni !== 'undefined') {
                    uni.navigateTo({
                        url: '/pages/countdown/countdown'
                    });
                }
            }
        }, 'countdown');
    }

    /**
     * 清单提醒通知
     */
    async sendTodoNotification(todo) {
        const title = '清单提醒';
        const body = `别忘了完成："${todo.title}"`;

        return await this.sendNotification({
            title,
            body,
            tag: `todo-${todo.id}`,
            requireInteraction: true,
            data: { type: 'todo', todo },
            onClick: (data) => {
                // 跳转到清单页面
                if (typeof uni !== 'undefined') {
                    uni.navigateTo({
                        url: '/pages/todo/todo'
                    });
                }
            }
        }, 'todo');
    }

    /**
     * 专注模式结束通知
     */
    async sendFocusEndNotification(focusSession) {
        const title = '专注模式结束';
        const body = `恭喜！您已完成 ${focusSession.duration} 分钟的专注时间`;

        return await this.sendNotification({
            title,
            body,
            tag: 'focus-end',
            requireInteraction: true,
            data: { type: 'focus', session: focusSession },
            onClick: (data) => {
                // 跳转到专注页面或显示统计
                if (typeof uni !== 'undefined') {
                    uni.navigateTo({
                        url: '/pages/focus/focus'
                    });
                }
            }
        }, 'pomodoro');
    }

    /**
     * 事件通知
     */
    async sendEventNotification(event) {
        const title = event.title || '事件提醒';
        const body = event.description || '您有一个重要事件需要处理';

        return await this.sendNotification({
            title,
            body,
            tag: `event-${event.id}`,
            requireInteraction: event.important || false,
            data: { type: 'event', event },
            onClick: (data) => {
                // 根据事件类型跳转到相应页面
                if (typeof uni !== 'undefined') {
                    uni.navigateTo({
                        url: event.url || '/pages/index/index'
                    });
                }
            }
        }, 'event');
    }

    /**
     * 打卡通知
     */
    async sendDakaNotification(daka) {
        const title = '打卡提醒';
        const body = `别忘了完成打卡："${daka.title}"`;

        return await this.sendNotification({
            title,
            body,
            tag: `daka-${daka.id}`,
            requireInteraction: true,
            data: { type: 'daka', daka },
            onClick: (data) => {
                // 跳转到打卡页面
                if (typeof uni !== 'undefined') {
                    uni.navigateTo({
                        url: '/pages/daka/daka'
                    });
                }
            }
        }, 'daka');
    }

    /**
     * 定时检查并发送通知
     */
    startPeriodicCheck() {
        // 每分钟检查一次
        setInterval(() => {
            this.checkScheduledNotifications();
        }, 60000);
    }

    /**
     * 检查预定的通知
     */
    async checkScheduledNotifications() {
        try {
            // 从本地存储获取数据
            const countdowns = this.getStorageData('countdowns') || [];
            const todos = this.getStorageData('todos') || [];
            const events = this.getStorageData('events') || [];
            const dakas = this.getStorageData('dakas') || [];

            // 检查倒数日通知
            for (const countdown of countdowns) {
                if (countdown.notifyEnabled && this.shouldNotify(countdown.notifyTime)) {
                    await this.sendCountdownNotification(countdown);
                }
            }

            // 检查清单提醒
            for (const todo of todos) {
                if (todo.notifyEnabled && !todo.completed && this.shouldNotify(todo.notifyTime)) {
                    await this.sendTodoNotification(todo);
                }
            }

            // 检查事件通知
            for (const event of events) {
                if (event.notifyEnabled && this.shouldNotify(event.notifyTime)) {
                    await this.sendEventNotification(event);
                }
            }

            // 检查打卡提醒
            for (const daka of dakas) {
                if (daka.notifyEnabled && this.shouldNotify(daka.notifyTime)) {
                    await this.sendDakaNotification(daka);
                }
            }
        } catch (error) {
            console.error('检查预定通知时出错:', error);
        }
    }

    /**
     * 判断是否应该发送通知
     */
    shouldNotify(notifyTime) {
        if (!notifyTime) return false;
        
        const now = new Date();
        const notify = new Date(notifyTime);
        
        // 允许1分钟的误差
        const diff = Math.abs(now - notify);
        return diff < 60000;
    }

    /**
     * 获取本地存储数据
     */
    getStorageData(key) {
        try {
            if (typeof uni !== 'undefined') {
                return uni.getStorageSync(key);
            } else {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            }
        } catch (error) {
            console.error('获取存储数据失败:', error);
            return null;
        }
    }

    /**
     * 设置本地存储数据
     */
    setStorageData(key, data) {
        try {
            if (typeof uni !== 'undefined') {
                uni.setStorageSync(key, data);
            } else {
                localStorage.setItem(key, JSON.stringify(data));
            }
        } catch (error) {
            console.error('设置存储数据失败:', error);
        }
    }
}

// 创建全局通知管理器实例
const notificationManager = new NotificationManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
} else if (typeof window !== 'undefined') {
    window.NotificationManager = NotificationManager;
    window.notificationManager = notificationManager;
}