/**
 * 日期工具函数 - 修复时区问题的统一日期处理
 * 解决事件日期和时间判断错误的问题
 */

/**
 * 获取本地时区的今天日期（0点0分0秒）
 * @returns {Date} 今天的日期对象
 */
function getTodayLocal() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * 获取本地时区的昨天日期
 * @returns {Date} 昨天的日期对象
 */
function getYesterdayLocal() {
    const today = getTodayLocal();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday;
}

/**
 * 获取本地时区的明天日期
 * @returns {Date} 明天的日期对象
 */
function getTomorrowLocal() {
    const today = getTodayLocal();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
}

/**
 * 将任意日期转换为本地时区的日期（只保留日期部分）
 * @param {Date|string} date 输入的日期
 * @returns {Date} 本地时区的日期对象
 */
function toLocalDate(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * 判断两个日期是否是同一天（忽略时间部分）
 * @param {Date|string} date1 第一个日期
 * @param {Date|string} date2 第二个日期
 * @returns {boolean} 是否是同一天
 */
function isSameDay(date1, date2) {
    const d1 = toLocalDate(date1);
    const d2 = toLocalDate(date2);
    return d1.getTime() === d2.getTime();
}

/**
 * 判断日期是否是今天
 * @param {Date|string} date 要判断的日期
 * @returns {boolean} 是否是今天
 */
function isToday(date) {
    return isSameDay(date, getTodayLocal());
}

/**
 * 判断日期是否是昨天
 * @param {Date|string} date 要判断的日期
 * @returns {boolean} 是否是昨天
 */
function isYesterday(date) {
    return isSameDay(date, getYesterdayLocal());
}

/**
 * 判断日期是否是明天
 * @param {Date|string} date 要判断的日期
 * @returns {boolean} 是否是明天
 */
function isTomorrow(date) {
    return isSameDay(date, getTomorrowLocal());
}

/**
 * 获取日期的中文描述（今天、昨天、明天或具体日期）
 * @param {Date|string} date 要描述的日期
 * @returns {string} 日期描述
 */
function getDateDescription(date) {
    if (isToday(date)) {
        return '今天';
    } else if (isYesterday(date)) {
        return '昨天';
    } else if (isTomorrow(date)) {
        return '明天';
    } else {
        const d = new Date(date);
        return d.toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric'
        });
    }
}

/**
 * 获取事件分组的时间范围
 * @returns {Object} 包含各个时间节点的对象
 */
function getEventTimeRanges() {
    const today = getTodayLocal();
    const yesterday = getYesterdayLocal();
    const tomorrow = getTomorrowLocal();
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);
    
    return {
        today,
        yesterday,
        tomorrow,
        dayAfterTomorrow,
        oneWeekLater
    };
}

// 将工具函数暴露到全局作用域
if (typeof window !== 'undefined') {
    window.DateUtils = {
        getTodayLocal,
        getYesterdayLocal,
        getTomorrowLocal,
        toLocalDate,
        isSameDay,
        isToday,
        isYesterday,
        isTomorrow,
        getDateDescription,
        getEventTimeRanges
    };
}

// 兼容 Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getTodayLocal,
        getYesterdayLocal,
        getTomorrowLocal,
        toLocalDate,
        isSameDay,
        isToday,
        isYesterday,
        isTomorrow,
        getDateDescription,
        getEventTimeRanges
    };
}