/**
 * 定时通知管理器
 * 负责在特定时间点发送不同类型的通知提醒
 */
class ScheduledNotificationManager {
    constructor() {
        this.isInitialized = false;
        this.notificationInterval = null;
        this.dailyReminderTimes = [
            { hour: 7, minute: 0, name: '早上' },
            { hour: 12, minute: 0, name: '中午' },
            { hour: 15, minute: 0, name: '下午' }
        ];
    }

    /**
     * 初始化定时通知管理器
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('初始化定时通知管理器...');
        
        // 请求通知权限
        if (window.notificationManager) {
            notificationManager.requestPermission();
        }
        
        // 启动定时检查
        this.startPeriodicCheck();
        
        this.isInitialized = true;
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
            
            // 检查事件开始提醒
            await this.checkEventStartNotifications(now);
            
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
                    const reminderKey = `event_reminder_${event.id}_${eventStartTime.getTime()}`;
                    if (localStorage.getItem(reminderKey)) continue;
                    
                    // 发送提醒
                    await this.sendEventReminder(event);
                    
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
                    const reminderKey = `event_start_${event.id}_${eventStartTime.getTime()}`;
                    if (localStorage.getItem(reminderKey)) continue;
                    
                    // 发送提醒
                    await this.sendEventStartNotification(event);
                    
                    // 标记已发送提醒
                    localStorage.setItem(reminderKey, 'sent');
                }
            }
        } catch (error) {
            console.error('检查事件开始通知时出错:', error);
        }
    }

    /**
     * 发送事件即将开始提醒
     */
    async sendEventReminder(event) {
        if (!window.notificationManager) return;
        
        const eventStartTime = new Date(event.startTime);
        const timeString = eventStartTime.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const title = '事件即将开始';
        const body = `事件"${event.name}"将于${timeString}开始，请做好准备！`;
        
        await notificationManager.sendNotification({
            title,
            body,
            tag: `upcoming-event-${event.id}`,
            requireInteraction: true,
            data: { type: 'event', event },
            onClick: (data) => {
                // 切换到最近要做视图
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('recent');
                }
            }
        }, 'event');
    }

    /**
     * 发送事件开始通知
     */
    async sendEventStartNotification(event) {
        if (!window.notificationManager) return;
        
        const title = '事件开始提醒';
        const body = `事件"${event.name}"现在开始，请及时参与！`;
        
        await notificationManager.sendNotification({
            title,
            body,
            tag: `event-start-${event.id}`,
            requireInteraction: true,
            data: { type: 'event', event },
            onClick: (data) => {
                // 切换到最近要做视图
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('recent');
                }
            }
        }, 'event');
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
            const reminderKey = `todo_daily_reminder_${today}_${isReminderTime.hour}_${isReminderTime.minute}`;
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
                await this.sendTodoReminder(isReminderTime.name);
                
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
     * 发送清单提醒
     */
    async sendTodoReminder(timeName) {
        if (!window.notificationManager) return;
        
        const title = '清单提醒';
        const body = `您好，${timeName}好！您有未完成的清单事项，请及时处理。`;
        
        await notificationManager.sendNotification({
            title,
            body,
            tag: `todo-daily-${timeName}`,
            requireInteraction: true,
            data: { type: 'todo' },
            onClick: (data) => {
                // 切换到清单视图
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('todolist');
                }
            }
        }, 'todo');
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
            const reminderKey = `countdown_reminder_${todayStr}`;
            if (localStorage.getItem(reminderKey)) return;
            
            // 检查每个倒数日
            for (const countdown of countdowns) {
                // 解析倒数日日期
                const countdownDate = new Date(countdown.date);
                countdownDate.setHours(0, 0, 0, 0);
                
                // 检查是否是今天
                if (countdownDate.getTime() === today.getTime()) {
                    await this.sendCountdownReminder(countdown);
                    
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
     * 发送倒数日提醒
     */
    async sendCountdownReminder(countdown) {
        if (!window.notificationManager) return;
        
        const title = '倒数日提醒';
        const body = `今天是"${countdown.name}"的日子！`;
        
        await notificationManager.sendNotification({
            title,
            body,
            tag: `countdown-${countdown.id}`,
            requireInteraction: true,
            data: { type: 'countdown', countdown },
            onClick: (data) => {
                // 切换到倒数日视图
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('countdown');
                }
            }
        }, 'countdown');
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
            const reminderKey = `daka_reminder_${todayStr}`;
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
                await this.sendDakaReminder();
                
                // 标记已发送提醒
                localStorage.setItem(reminderKey, 'sent');
            }
        } catch (error) {
            console.error('检查打卡提醒时出错:', error);
        }
    }

    /**
     * 发送打卡提醒
     */
    async sendDakaReminder() {
        if (!window.notificationManager) return;
        
        const title = '打卡提醒';
        const body = '您好！请检查是否有需要打卡的项目。';
        
        await notificationManager.sendNotification({
            title,
            body,
            tag: 'daka-reminder',
            requireInteraction: true,
            data: { type: 'daka' },
            onClick: (data) => {
                // 切换到打卡视图
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('daka');
                }
            }
        }, 'daka');
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

// 创建全局定时通知管理器实例
const scheduledNotificationManager = new ScheduledNotificationManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户是否已登录
    const userNickname = localStorage.getItem('userNickname');
    if (userNickname) {
        // 延迟初始化，确保其他模块已加载
        setTimeout(() => {
            scheduledNotificationManager.init();
        }, 1000);
    }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScheduledNotificationManager;
} else if (typeof window !== 'undefined') {
    window.ScheduledNotificationManager = ScheduledNotificationManager;
    window.scheduledNotificationManager = scheduledNotificationManager;
}