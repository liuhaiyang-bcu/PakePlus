/**
 * 系统级通知管理器
 * 负责发送系统级通知提醒
 */
class SystemNotificationManager {
    constructor() {
        this.isInitialized = false;
        this.notificationInterval = null;
        this.dailyReminderTimes = [
            { hour: 7, minute: 0, name: '早上' },
            { hour: 12, minute: 0, name: '中午' },
            { hour: 15, minute: 0, name: '下午' }
        ];
        this.isServiceWorkerSupported = 'serviceWorker' in navigator;
    }

    /**
     * 初始化系统通知管理器
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('初始化系统通知管理器...');
        
        // 请求通知权限
        this.requestNotificationPermission();
        
        // 启动定时检查
        this.startPeriodicCheck();
        
        // 监听Service Worker消息
        if (this.isServiceWorkerSupported) {
            navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        }
        
        this.isInitialized = true;
    }

    /**
     * 请求通知权限
     */
    async requestNotificationPermission() {
        // 检查是否在uni-app环境中
        if (typeof plus !== 'undefined') {
            console.log('在uni-app环境中，使用plus.push.requestPermission');
            // 在uni-app环境中请求推送权限
            try {
                plus.push.addEventListener("receive", (msg) => {
                    console.log("接收到推送消息: " + JSON.stringify(msg));
                }, false);
                
                // 检查客户端推送标识信息
                plus.push.getClientInfoAsync((info) => {
                    console.log("客户端推送标识信息: " + JSON.stringify(info));
                }, (e) => {
                    console.error("获取客户端推送标识信息失败: " + JSON.stringify(e));
                });
            } catch (error) {
                console.error('请求推送权限失败:', error);
            }
        } else {
            // 浏览器环境下使用Web Notifications API
            if ('Notification' in window) {
                try {
                    const permission = await Notification.requestPermission();
                    console.log('通知权限请求结果:', permission);
                    if (permission === 'granted') {
                        console.log('已获得通知权限');
                    } else {
                        console.warn('通知权限被拒绝');
                    }
                } catch (error) {
                    console.error('请求通知权限失败:', error);
                }
            } else {
                console.warn('浏览器不支持通知功能');
            }
        }
    }

    /**
     * 启动定时检查
     */
    startPeriodicCheck() {
        // 每分钟检查一次
        this.notificationInterval = setInterval(() => {
            this.checkScheduledNotifications();
        }, 60000); // 60秒 = 1分钟
        
        // 立即检查一次
        this.checkScheduledNotifications();
        
        // 如果支持Service Worker，注册后台同步
        if (this.isServiceWorkerSupported) {
            this.registerBackgroundSync();
        }
    }

    /**
     * 注册后台同步
     */
    async registerBackgroundSync() {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('check-notifications');
            console.log('后台同步注册成功');
        } catch (error) {
            console.error('后台同步注册失败:', error);
        }
    }

    /**
     * 处理Service Worker消息
     */
    handleServiceWorkerMessage(event) {
        console.log('收到来自Service Worker的消息:', event.data);
        // 可以在这里处理来自Service Worker的消息
    }

    /**
     * 检查预定的通知
     */
    async checkScheduledNotifications() {
        try {
            // 获取当前时间
            const now = new Date();
            
            // 检查事件即将开始提醒
            await this.checkUpcomingEvents(now);
            
            // 检查事件开始通知
            await this.checkEventStartNotifications(now);
            
            // 检查事件正在进行中通知
            await this.checkOngoingEvents(now);
            
            // 检查清单每日提醒
            await this.checkDailyTodoReminders(now);
            
            // 检查倒数日当天提醒
            await this.checkCountdownReminders(now);
            
            // 检查打卡提醒
            await this.checkDakaReminders(now);
            
        } catch (error) {
            console.error('检查预定通知时出错:', error);
        }
    }

    /**
     * 检查即将开始的事件提醒（提前10分钟）
     */
    async checkUpcomingEvents(now) {
        // 检查是否启用事件通知
        if (typeof isNotificationEnabled === 'function' && !isNotificationEnabled('event')) {
            return;
        }
        
        try {
            const data = StorageManager.getData();
            const events = data.events || [];
            
            // 计算10分钟后的时间
            const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
            
            // 检查每个事件
            for (const event of events) {
                // 跳过已完成的事件
                if (event.completed) continue;
                
                // 检查是否有开始时间
                if (!event.startTime) continue;
                
                const eventStartTime = new Date(event.startTime);
                
                // 检查事件是否在10分钟内开始
                if (eventStartTime > now && eventStartTime <= tenMinutesLater) {
                    // 检查是否已经发送过提醒（避免重复提醒）
                    const reminderKey = `system_event_reminder_${event.id}_${eventStartTime.getTime()}`;
                    if (localStorage.getItem(reminderKey)) continue;
                    
                    console.log('准备发送事件即将开始提醒:', event.name);
                    
                    // 发送系统级提醒
                    await this.sendSystemEventReminder(event);
                    
                    // 标记已发送提醒
                    localStorage.setItem(reminderKey, 'sent');
                }
            }
        } catch (error) {
            console.error('检查事件提醒时出错:', error);
        }
    }

    /**
     * 检查事件开始通知（事件开始时发送通知）
     */
    async checkEventStartNotifications(now) {
        // 检查是否启用事件通知
        if (typeof isNotificationEnabled === 'function' && !isNotificationEnabled('event')) {
            return;
        }
        
        try {
            const data = StorageManager.getData();
            const events = data.events || [];
            
            // 获取当前时间范围（前后30秒）
            const startTime = new Date(now.getTime() - 30 * 1000);
            const endTime = new Date(now.getTime() + 30 * 1000);
            
            // 检查每个事件
            for (const event of events) {
                // 跳过已完成的事件
                if (event.completed) continue;
                
                // 检查是否有开始时间
                if (!event.startTime) continue;
                
                const eventStartTime = new Date(event.startTime);
                
                // 检查事件是否在当前时间范围内开始
                if (eventStartTime >= startTime && eventStartTime <= endTime) {
                    // 检查是否已经发送过提醒（避免重复提醒）
                    const reminderKey = `system_event_start_${event.id}_${eventStartTime.getTime()}`;
                    if (localStorage.getItem(reminderKey)) continue;
                    
                    console.log('准备发送事件开始通知:', event.name);
                    
                    // 发送系统级提醒
                    await this.sendSystemEventStartNotification(event);
                    
                    // 标记已发送提醒
                    localStorage.setItem(reminderKey, 'sent');
                }
            }
        } catch (error) {
            console.error('检查事件开始通知时出错:', error);
        }
    }

    /**
     * 检查正在进行中的事件通知
     */
    async checkOngoingEvents(now) {
        // 检查是否启用事件通知
        if (typeof isNotificationEnabled === 'function' && !isNotificationEnabled('event')) {
            return;
        }
        
        try {
            const data = StorageManager.getData();
            const events = data.events || [];
            
            // 获取当前时间范围（前后30秒）
            const startTime = new Date(now.getTime() - 30 * 1000);
            const endTime = new Date(now.getTime() + 30 * 1000);
            
            // 检查每个事件
            for (const event of events) {
                // 跳过已完成的事件
                if (event.completed) continue;
                
                // 检查是否有开始和结束时间
                if (!event.startTime || !event.endTime) continue;
                
                const eventStartTime = new Date(event.startTime);
                const eventEndTime = new Date(event.endTime);
                
                // 检查事件是否正在进行中（当前时间在事件开始和结束时间之间）
                if (now >= eventStartTime && now <= eventEndTime) {
                    // 检查是否已经发送过提醒（避免重复提醒）
                    const reminderKey = `system_event_ongoing_${event.id}_${eventStartTime.getTime()}_${eventEndTime.getTime()}`;
                    if (localStorage.getItem(reminderKey)) continue;
                    
                    console.log('准备发送事件正在进行中通知:', event.name);
                    
                    // 发送系统级提醒
                    await this.sendSystemEventOngoingNotification(event);
                    
                    // 标记已发送提醒
                    localStorage.setItem(reminderKey, 'sent');
                }
            }
        } catch (error) {
            console.error('检查正在进行中的事件通知时出错:', error);
        }
    }

    /**
     * 发送系统级事件即将开始提醒
     */
    async sendSystemEventReminder(event) {
        const eventStartTime = new Date(event.startTime);
        const timeString = eventStartTime.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const title = '事件即将开始';
        const body = `事件"${event.name}"将于${timeString}开始，请做好准备！`;
        
        console.log('发送事件即将开始提醒:', title, body);
        
        // 发送系统级通知
        this.sendSystemNotification(title, body, `event_${event.id}`);
    }

    /**
     * 发送系统级事件开始通知
     */
    async sendSystemEventStartNotification(event) {
        const title = '事件开始提醒';
        const body = `事件"${event.name}"现在开始，请及时参与！`;
        
        console.log('发送事件开始通知:', title, body);
        
        // 发送系统级通知
        this.sendSystemNotification(title, body, `event_start_${event.id}`);
    }

    /**
     * 发送系统级事件正在进行中通知
     */
    async sendSystemEventOngoingNotification(event) {
        const title = '事件进行中';
        const body = `事件"${event.name}"正在进行中，请注意参与！`;
        
        console.log('发送事件正在进行中通知:', title, body);
        
        // 发送系统级通知
        this.sendSystemNotification(title, body, `event_ongoing_${event.id}`);
        
        // 如果支持Service Worker，也发送到Service Worker
        if (this.isServiceWorkerSupported) {
            this.sendToServiceWorker({
                type: 'ONGOING_EVENT',
                title: title,
                body: body,
                eventId: event.id
            });
        }
    }

    /**
     * 发送消息到Service Worker
     */
    async sendToServiceWorker(data) {
        try {
            const registration = await navigator.serviceWorker.ready;
            registration.active.postMessage(data);
            console.log('消息发送到Service Worker:', data);
        } catch (error) {
            console.error('发送消息到Service Worker失败:', error);
        }
    }

    /**
     * 检查清单每日提醒
     */
    async checkDailyTodoReminders(now) {
        // 检查是否启用清单通知
        if (typeof isNotificationEnabled === 'function' && !isNotificationEnabled('todo')) {
            return;
        }
        
        try {
            // 检查是否是提醒时间点
            const isReminderTime = this.isDailyReminderTime(now);
            if (!isReminderTime) return;
            
            // 检查是否已经发送过今天的提醒
            const today = now.toISOString().slice(0, 10);
            const reminderKey = `system_todo_daily_reminder_${today}_${isReminderTime.hour}_${isReminderTime.minute}`;
            if (localStorage.getItem(reminderKey)) return;
            
            const data = StorageManager.getData();
            const lists = data.lists || [];
            
            // 检查是否有未完成的清单项
            let hasIncompleteItems = false;
            for (const list of lists) {
                if (list.items && Array.isArray(list.items)) {
                    const incompleteItems = list.items.filter(item => !item.completed);
                    if (incompleteItems.length > 0) {
                        hasIncompleteItems = true;
                        break;
                    }
                }
            }
            
            // 如果有未完成的清单项，发送提醒
            if (hasIncompleteItems) {
                console.log('准备发送清单每日提醒');
                await this.sendSystemTodoReminder(isReminderTime.name);
                
                // 标记已发送提醒
                localStorage.setItem(reminderKey, 'sent');
            }
        } catch (error) {
            console.error('检查清单提醒时出错:', error);
        }
    }

    /**
     * 判断当前时间是否是每日提醒时间点
     */
    isDailyReminderTime(now) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        for (const time of this.dailyReminderTimes) {
            if (currentHour === time.hour && currentMinute === time.minute) {
                return time;
            }
        }
        
        return null;
    }

    /**
     * 发送系统级清单提醒
     */
    async sendSystemTodoReminder(timeName) {
        const title = '清单提醒';
        const body = `您好，${timeName}好！您有未完成的清单事项，请及时处理。`;
        
        console.log('发送清单提醒:', title, body);
        
        // 发送系统级通知
        this.sendSystemNotification(title, body, `todo_daily_${timeName}`);
    }

    /**
     * 检查倒数日当天提醒
     */
    async checkCountdownReminders(now) {
        // 检查是否启用倒数日通知
        if (typeof isNotificationEnabled === 'function' && !isNotificationEnabled('countdown')) {
            return;
        }
        
        try {
            const data = StorageManager.getData();
            const countdowns = data.countdowns || [];
            
            // 获取今天的日期（只比较日期部分）
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 检查是否已经发送过今天的倒数日提醒
            const todayStr = today.toISOString().slice(0, 10);
            const reminderKey = `system_countdown_reminder_${todayStr}`;
            if (localStorage.getItem(reminderKey)) return;
            
            // 检查每个倒数日
            for (const countdown of countdowns) {
                // 解析倒数日日期
                const countdownDate = new Date(countdown.date);
                countdownDate.setHours(0, 0, 0, 0);
                
                // 检查是否是今天
                if (countdownDate.getTime() === today.getTime()) {
                    console.log('准备发送倒数日当天提醒:', countdown.name);
                    await this.sendSystemCountdownReminder(countdown);
                    
                    // 标记已发送提醒
                    localStorage.setItem(reminderKey, 'sent');
                    break; // 一天只需要发送一次倒数日提醒
                }
            }
        } catch (error) {
            console.error('检查倒数日提醒时出错:', error);
        }
    }

    /**
     * 发送系统级倒数日提醒
     */
    async sendSystemCountdownReminder(countdown) {
        const title = '倒数日提醒';
        const body = `今天是"${countdown.name}"的日子！`;
        
        console.log('发送倒数日提醒:', title, body);
        
        // 发送系统级通知
        this.sendSystemNotification(title, body, `countdown_${countdown.id}`);
    }

    /**
     * 检查打卡提醒
     */
    async checkDakaReminders(now) {
        // 检查是否启用打卡通知
        if (typeof isNotificationEnabled === 'function' && !isNotificationEnabled('daka')) {
            return;
        }
        
        try {
            const data = StorageManager.getData();
            const dakas = data.dakas || [];
            
            // 检查是否已经发送过今天的打卡提醒
            const todayStr = now.toISOString().slice(0, 10);
            const reminderKey = `system_daka_reminder_${todayStr}`;
            if (localStorage.getItem(reminderKey)) return;
            
            // 检查是否有需要打卡的项目
            let hasDakaToPunch = false;
            for (const daka of dakas) {
                // 检查今日是否已打卡
                const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
                const hasToday = punchRecords.some(r => r.date === todayStr);
                
                if (!hasToday) {
                    hasDakaToPunch = true;
                    break;
                }
            }
            
            // 如果有需要打卡的项目，发送提醒
            if (hasDakaToPunch) {
                console.log('准备发送打卡提醒');
                await this.sendSystemDakaReminder();
                
                // 标记已发送提醒
                localStorage.setItem(reminderKey, 'sent');
            }
        } catch (error) {
            console.error('检查打卡提醒时出错:', error);
        }
    }

    /**
     * 发送系统级打卡提醒
     */
    async sendSystemDakaReminder() {
        const title = '打卡提醒';
        const body = '您好！请检查是否有需要打卡的项目。';
        
        console.log('发送打卡提醒:', title, body);
        
        // 发送系统级通知
        this.sendSystemNotification(title, body, 'daka_reminder');
    }

    /**
     * 发送系统级通知（使用plus.push.createMessage）
     * 参考自: c:\Users\Lmy13\Desktop\www - 副本 (3)\偷偷发\plus\push.html
     */
    sendSystemNotification(title, content, payload) {
        // 检查是否在uni-app环境中
        if (typeof plus !== 'undefined') {
            try {
                console.log('在uni-app环境中发送系统通知:', title, content, payload);
                // 使用plus.push.createMessage发送系统级通知
                // 参考push.html中的实现方式
                var options = {
                    cover: false,
                    title: title,  // 添加标题
                    sound: "system"  // 添加声音
                };
                plus.push.createMessage(content, payload, options);
                console.log('系统级通知发送成功:', title, content);
            } catch (error) {
                console.error('发送系统级通知失败:', error);
            }
        } else {
            // 浏览器环境下使用Web Notifications API
            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification(title, {
                        body: content,
                        icon: './img/icon.png',
                        tag: payload
                    });
                    console.log('Web通知发送成功:', title, content);
                } catch (error) {
                    console.error('发送Web通知失败:', error);
                }
            } else {
                console.warn('浏览器不支持通知或未获得权限');
            }
        }
    }

    /**
     * 测试通知功能
     */
    testNotification() {
        const title = '测试通知';
        const body = '这是一条测试通知消息';
        const payload = 'test_notification';
        
        console.log('发送测试通知:', title, body);
        this.sendSystemNotification(title, body, payload);
    }

    /**
     * 停止定时检查
     */
    stopPeriodicCheck() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
        }
    }
}

// 创建全局系统通知管理器实例
const systemNotificationManager = new SystemNotificationManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户是否已登录
    const userNickname = localStorage.getItem('userNickname');
    if (userNickname) {
        // 延迟初始化，确保其他模块已加载
        setTimeout(() => {
            systemNotificationManager.init();
        }, 1000);
    }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemNotificationManager;
} else if (typeof window !== 'undefined') {
    window.SystemNotificationManager = SystemNotificationManager;
    window.systemNotificationManager = systemNotificationManager;
}
