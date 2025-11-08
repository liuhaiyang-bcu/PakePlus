// 当前分享的节假日信息
let currentShareData = {};

// 搜索相关变量

// 2025年节假日数据
const holidays2025 = [
    {
        name: "元旦",
        icon: '<i class="fas fa-star" style="color: #e74c3c;"></i>',
        startDate: "2025-01-01",
        endDate: "2025-01-01",
        days: 1,
        color: "#e74c3c",
        workDays: [],
        description: "元旦，即公历的1月1日，是世界多数国家通称的\"新年\"。元，谓\"始\"，凡数之始称为\"元\"；旦，谓\"日\"；\"元旦\"意即\"初始之日\"。",
        type: "holiday" // 添加类型标识
    },
    {
        name: "春节",
        icon: '<i class="fas fa-gift" style="color: #e74c3c;"></i>',
        startDate: "2025-01-28",
        endDate: "2025-02-04",
        days: 8,
        color: "#e74c3c",
        workDays: ["2025-01-26", "2025-02-08"],
        description: "春节，即农历新年，是一年之岁首、传统意义上的年节。俗称新春、新年、新岁、岁旦、年禧、大年等，口头上也叫过年、过大年。",
        type: "holiday"
    },
    {
        name: "清明节",
        icon: '<i class="fas fa-seedling" style="color: #27ae60;"></i>',
        startDate: "2025-04-04",
        endDate: "2025-04-06",
        days: 3,
        color: "#27ae60",
        workDays: [],
        description: "清明节，又称踏青节、行清节、三月节、祭祖节等，节期在仲春与暮春之交。清明节源自上古时代的祖先信仰与春祭礼俗，兼具自然与人文两大内涵，既是自然节气点，也是传统节日。",
        type: "holiday"
    },
    {
        name: "劳动节",
        icon: '<i class="fas fa-hammer" style="color: #f39c12;"></i>',
        startDate: "2025-05-01",
        endDate: "2025-05-05",
        days: 5,
        color: "#f39c12",
        workDays: ["2025-04-27"],
        description: "国际劳动节又称\"五一国际劳动节\"、\"国际示威游行日\"，是世界上80多个国家的全国性节日。定在每年的五月一日。它是全世界劳动人民共同拥有的节日。",
        type: "holiday"
    },
    {
        name: "端午节",
        icon: '<i class="fas fa-water" style="color: #9b59b6;"></i>',
        startDate: "2025-05-31",
        endDate: "2025-06-02",
        days: 3,
        color: "#9b59b6",
        workDays: [],
        description: "端午节，又称端阳节、龙舟节、重午节、重五节、天中节等，日期在农历五月初五，是中国民间的传统节日。端午节源自天象崇拜，由上古时代龙图腾祭祀演变而来。",
        type: "holiday"
    },
    {
        name: "中秋节",
        icon: '<i class="fas fa-moon" style="color: #3498db;"></i>',
        startDate: "2025-10-01",
        endDate: "2025-10-08",
        days: 8,
        color: "#3498db",
        workDays: ["2025-09-28", "2025-10-11"],
        description: "中秋节，又称祭月节、月光诞、月夕、秋节、仲秋节、拜月节、月娘节、月亮节、团圆节等，是中国民间的传统节日。中秋节源自天象崇拜，由上古时代秋夕祭月演变而来。",
        type: "holiday"
    },
    {
        name: "国庆节",
        icon: '<i class="fas fa-flag" style="color: #e74c3c;"></i>',
        startDate: "2025-10-01",
        endDate: "2025-10-08",
        days: 8,
        color: "#e74c3c",
        workDays: ["2025-09-28", "2025-10-11"],
        description: "国庆节是中华人民共和国成立的纪念日，定于每年十月一日。1949年的这一天，毛泽东主席在天安门城楼上庄严宣告新中国成立，标志着中国人民从此站起来了。国庆节不仅是庆祝国家诞生的日子，也是展示国家成就、弘扬民族精神的重要时刻。节日期间，全国各地会举行盛大的庆祝活动，包括阅兵、群众游行、文艺演出等，共同祝愿祖国繁荣昌盛。",
        type: "holiday"
    }
];

// 2025年节气数据
const solarTerms2025 = [
    {
        name: "立春",
        icon: '<i class="fas fa-seedling" style="color: #27ae60;"></i>',
        date: "2025-02-03",
        color: "#27ae60",
        description: "立春是二十四节气中的第一个节气，标志着春季的开始。立春意味着风和日暖，万物生长，农家开始播种。",
        type: "solar"
    },
    {
        name: "雨水",
        icon: '<i class="fas fa-cloud-rain" style="color: #3498db;"></i>',
        date: "2025-02-19",
        color: "#3498db",
        description: "雨水是二十四节气中的第二个节气，此时气温回升，冰雪融化，降水增多，故名雨水。",
        type: "solar"
    },
    {
        name: "惊蛰",
        icon: '<i class="fas fa-bug" style="color: #f39c12;"></i>',
        date: "2025-03-05",
        color: "#f39c12",
        description: "惊蛰是二十四节气中的第三个节气，标志着仲春时节的开始。此时春雷始鸣，惊醒蛰伏于地下越冬的蛰虫。",
        type: "solar"
    },
    {
        name: "春分",
        icon: '<i class="fas fa-sun" style="color: #f1c40f;"></i>',
        date: "2025-03-20",
        color: "#f1c40f",
        description: "春分是二十四节气中的第四个节气，这一天太阳直射地球赤道，昼夜等长。春分之后，北半球开始昼长夜短。",
        type: "solar"
    },
    {
        name: "清明",
        icon: '<i class="fas fa-wind" style="color: #2ecc71;"></i>',
        date: "2025-04-04",
        color: "#2ecc71",
        description: "清明是二十四节气中的第五个节气，也是最重要的祭祀节日之一。此时气温升高，正是春耕春种的大好时节。",
        type: "solar"
    },
    {
        name: "谷雨",
        icon: '<i class="fas fa-cloud-showers-heavy" style="color: #3498db;"></i>',
        date: "2025-04-20",
        color: "#3498db",
        description: "谷雨是二十四节气中的第六个节气，也是春季的最后一个节气。此时降雨量增加，谷类作物茁壮成长。",
        type: "solar"
    },
    {
        name: "立夏",
        icon: '<i class="fas fa-sun" style="color: #e74c3c;"></i>',
        date: "2025-05-05",
        color: "#e74c3c",
        description: "立夏是二十四节气中的第七个节气，标志着夏季的开始。万物至此皆长大，故名立夏。",
        type: "solar"
    },
    {
        name: "小满",
        icon: '<i class="fas fa-seedling" style="color: #f1c40f;"></i>',
        date: "2025-05-21",
        color: "#f1c40f",
        description: "小满是二十四节气中的第八个节气，此时夏熟作物的籽粒开始灌浆饱满，但还未成熟，只是小满，还未大满。",
        type: "solar"
    },
    {
        name: "芒种",
        icon: '<i class="fas fa-wheat" style="color: #f39c12;"></i>',
        date: "2025-06-05",
        color: "#f39c12",
        description: "芒种是二十四节气中的第九个节气，此时正值仲夏，气温显著升高，雨量充沛，正是晚稻等有芒作物播种的季节。",
        type: "solar"
    },
    {
        name: "夏至",
        icon: '<i class="fas fa-sun" style="color: #e74c3c;"></i>',
        date: "2025-06-21",
        color: "#e74c3c",
        description: "夏至是二十四节气中的第十个节气，此时太阳直射北回归线，北半球白昼最长，黑夜最短。",
        type: "solar"
    },
    {
        name: "小暑",
        icon: '<i class="fas fa-sun" style="color: #e67e22;"></i>',
        date: "2025-07-07",
        color: "#e67e22",
        description: "小暑是二十四节气中的第十一个节气，标志着盛夏的开始。此时天气开始炎热，但还未到最热的时候。",
        type: "solar"
    },
    {
        name: "大暑",
        icon: '<i class="fas fa-fire" style="color: #e74c3c;"></i>',
        date: "2025-07-22",
        color: "#e74c3c",
        description: "大暑是二十四节气中的第十二个节气，也是一年中最热的时期。此时高温酷热，雷阵雨较多。",
        type: "solar"
    },
    {
        name: "立秋",
        icon: '<i class="fas fa-leaf" style="color: #27ae60;"></i>',
        date: "2025-08-07",
        color: "#27ae60",
        description: "立秋是二十四节气中的第十三个节气，标志着秋季的开始。此时暑去凉来，禾谷开始成熟。",
        type: "solar"
    },
    {
        name: "处暑",
        icon: '<i class="fas fa-wind" style="color: #3498db;"></i>',
        date: "2025-08-23",
        color: "#3498db",
        description: "处暑是二十四节气中的第十四个节气，\"处\"是终止的意思，处暑表示炎热即将过去，暑气将于这一天结束。",
        type: "solar"
    },
    {
        name: "白露",
        icon: '<i class="fas fa-cloud-rain" style="color: #3498db;"></i>',
        date: "2025-09-07",
        color: "#3498db",
        description: "白露是二十四节气中的第十五个节气，此时天气转凉，近地面水汽在草木等物体上凝结成白色露珠。",
        type: "solar"
    },
    {
        name: "秋分",
        icon: '<i class="fas fa-sun" style="color: #f1c40f;"></i>',
        date: "2025-09-23",
        color: "#f1c40f",
        description: "秋分是二十四节气中的第十六个节气，此时太阳直射赤道，昼夜等长。秋分之后，北半球开始昼短夜长。",
        type: "solar"
    },
    {
        name: "寒露",
        icon: '<i class="fas fa-snowflake" style="color: #3498db;"></i>',
        date: "2025-10-08",
        color: "#3498db",
        description: "寒露是二十四节气中的第十七个节气，此时气温比白露时更低，地面的露水更冷，快要凝结成霜了。",
        type: "solar"
    },
    {
        name: "霜降",
        icon: '<i class="fas fa-snowflake" style="color: #95a5a6;"></i>',
        date: "2025-10-23",
        color: "#95a5a6",
        description: "霜降是二十四节气中的第十八个节气，也是秋季的最后一个节气。此时天气渐冷，开始有霜。",
        type: "solar"
    },
    {
        name: "立冬",
        icon: '<i class="fas fa-snowflake" style="color: #3498db;"></i>',
        date: "2025-11-07",
        color: "#3498db",
        description: "立冬是二十四节气中的第十九个节气，标志着冬季的开始。万物收藏，规避寒冷。",
        type: "solar"
    },
    {
        name: "小雪",
        icon: '<i class="fas fa-snowflake" style="color: #95a5a6;"></i>',
        date: "2025-11-22",
        color: "#95a5a6",
        description: "小雪是二十四节气中的第二十个节气，此时气温下降，开始降雪，但雪量不大，故称小雪。",
        type: "solar"
    },
    {
        name: "大雪",
        icon: '<i class="fas fa-snowflake" style="color: #3498db;"></i>',
        date: "2025-12-07",
        color: "#3498db",
        description: "大雪是二十四节气中的第二十一个节气，此时天气更冷，降雪的可能性比小雪时更大，雪量也更大。",
        type: "solar"
    },
    {
        name: "冬至",
        icon: '<i class="fas fa-sun" style="color: #3498db;"></i>',
        date: "2025-12-21",
        color: "#3498db",
        description: "冬至是二十四节气中的第二十二个节气，此时太阳直射南回归线，北半球白昼最短，黑夜最长。",
        type: "solar"
    },
    {
        name: "小寒",
        icon: '<i class="fas fa-snowflake" style="color: #95a5a6;"></i>',
        date: "2025-01-05",
        color: "#95a5a6",
        description: "小寒是二十四节气中的第二十三个节气，标志着开始进入一年中最寒冷的日子。此时正值\"三九\"前后。",
        type: "solar"
    },
    {
        name: "大寒",
        icon: '<i class="fas fa-snowflake" style="color: #34495e;"></i>',
        date: "2025-01-20",
        color: "#34495e",
        description: "大寒是二十四节气中的最后一个节气，也是一年中最寒冷的时期。大寒过后，又将迎来新一年的轮回。",
        type: "solar"
    }
];

// 合并节假日和节气数据
const allEvents = [...holidays2025, ...solarTerms2025];

// 去重处理（中秋节和国庆节合并）
const uniqueHolidays = holidays2025.filter((holiday, index, self) => {
    if (holiday.name === "中秋节") return false; // 移除单独的中秋节
    if (holiday.name === "国庆节") {
        holiday.name = "国庆节+中秋节";
        holiday.description = "国庆节与中秋节合并放假，是庆祝中华人民共和国成立和家人团圆的日子。";
    }
    return true;
});

// 合并去重后的节假日和节气数据
const allEventsCombined = [...uniqueHolidays, ...solarTerms2025];

// 轻量级页面内通知（非打断式）
function showInlineNotification(message, type = 'success') {
    try {
        let container = document.getElementById('hs-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'hs-toast-container';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            document.body.appendChild(container);
        }
        const item = document.createElement('div');
        item.style.minWidth = '200px';
        item.style.maxWidth = '320px';
        item.style.padding = '10px 14px';
        item.style.borderRadius = '8px';
        item.style.color = '#fff';
        item.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
        item.style.fontSize = '14px';
        item.style.lineHeight = '1.4';
        item.style.transition = 'transform .2s ease, opacity .2s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateY(-8px)';
        const bg = type === 'error' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#10b981');
        item.style.background = bg;
        item.textContent = message;
        container.appendChild(item);
        requestAnimationFrame(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        });
        setTimeout(() => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(-8px)';
            setTimeout(() => {
                if (item.parentNode) item.parentNode.removeChild(item);
                if (container && container.children.length === 0 && container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }, 200);
        }, 2500);
    } catch (e) {
        console.warn('通知渲染失败', e);
    }
}

// 检查某个节日/节气是否已存在于倒数日
function isEventInCountdowns(event) {
    try {
        if (typeof StorageManager === 'undefined' || typeof StorageManager.getData !== 'function') {
            return false;
        }
        const data = StorageManager.getData();
        const list = Array.isArray(data.countdowns) ? data.countdowns : [];
        const name = event.name;
        const date = event.type === 'solar' ? event.date : event.startDate;
        const type = event.type === 'solar' ? 'once' : 'yearly';
        return list.some(item => item.name === name && item.date === date && item.type === type);
    } catch (e) {
        console.warn('检查倒数日重复时出错:', e);
        return false;
    }
}

function calculateDaysUntil(dateString) {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function getHolidayStatus(startDate, endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (today >= start && today <= end) {
        return 'current';
    } else if (today < start) {
        return 'upcoming';
    } else {
        return 'passed';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateRange(startDate, endDate) {
    if (startDate === endDate) {
        return formatDate(startDate);
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function getStatusText(status, type = 'holiday', daysUntil = 0) {
    switch (status) {
        case 'current':
            return type === 'solar' ? '正在过节气' : '正在放假';
        case 'upcoming':
            // 根据距离天数判定详细状态
            if (daysUntil === 0) {
                return '今天';
            } else if (daysUntil <= 3) {
                return '即将到来';
            } else if (daysUntil <= 7) {
                return '快要到来';
            } else if (daysUntil <= 30) {
                return '还有一段时间';
            } else {
                return '时间尚早';
            }
        case 'passed':
            // 根据已过天数判定详细状态
            const daysPassed = Math.abs(daysUntil);
            if (daysPassed <= 3) {
                return '刚刚过去';
            } else if (daysPassed <= 7) {
                return '过去不久';
            } else if (daysPassed <= 30) {
                return '过去一段时间';
            } else {
                return '过去很久';
            }
        default:
            return '';
    }
}

// 分享功能 - 直接复制到剪贴板
function shareHoliday(event, name, dateRange, days, countdownText, countdownNumber) {
    // 确保传入的参数是正确的
    const shareText = `🎉 ${name} 节假日提醒 🎉
🗓️ 时间：${dateRange}
⏰ ${countdownText}：${countdownNumber}天
${event.type === "holiday" ? `🎯 假期天数：${days}天` : ""}
📖 节日介绍：
${event.description}

----------------------
✨ 内容来自有数规划 ✨`;
    
    copyTextToClipboard(shareText);
    alert('节假日信息已复制到剪贴板，可以分享给朋友啦！🌟');
}

function copyTextToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // 兼容旧浏览器
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

function debounce(fn, delay = 200) {
    let t = null;
    return function(...args) {
        clearTimeout(t);
        const ctx = this;
        t = setTimeout(() => fn.apply(ctx, args), delay);
    };
}

function createHolidayCard(event) {
    const daysUntil = event.type === "solar" ? 
        calculateDaysUntil(event.date) : 
        calculateDaysUntil(event.startDate);
    
    const status = event.type === "solar" ? 
        getHolidayStatus(event.date, event.date) : 
        getHolidayStatus(event.startDate, event.endDate);
    
    let countdownText = '';
    let countdownNumber = '';
    
    if (status === 'current') {
        const daysLeft = event.type === "solar" ? 
            0 : 
            calculateDaysUntil(event.endDate);
        countdownNumber = Math.max(0, daysLeft);
        countdownText = '剩余天数';
    } else if (status === 'upcoming') {
        countdownNumber = Math.max(0, daysUntil);
        countdownText = '倒数天数';
    } else {
        countdownNumber = Math.abs(daysUntil);
        countdownText = '已过天数';
    }

    const dateRange = event.type === "solar" ? 
        formatDate(event.date) : 
        formatDateRange(event.startDate, event.endDate);

    const card = document.createElement('div');
    card.className = 'holiday-card';
    card.style.setProperty('--card-color', event.color);
    card.setAttribute('data-status', status);
    card.innerHTML = `
        <div class="holiday-header">
            <div class="holiday-icon">${event.icon}</div>
            <div class="holiday-title">
                <div class="holiday-name">${event.name}</div>
                <div class="holiday-date">${dateRange}</div>
            </div>
        </div>
        
        <div class="countdown-display">
            <div class="countdown-number">${countdownNumber}</div>
            <div class="countdown-label">${countdownText}</div>
        </div>
        
        <div class="holiday-details">
            <div class="detail-row">
                <span class="detail-label">类型</span>
                <span class="detail-value">${event.type === "holiday" ? "法定假日" : "节气"}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">状态</span>
                <span class="holiday-status status-${status}">${getStatusText(status, event.type, daysUntil)}</span>
            </div>
            ${event.workDays && event.workDays.length > 0 ? `
            <div class="detail-row">
                <span class="detail-label">调休上班</span>
                <span class="detail-value">${event.workDays.map(formatDate).join(', ')}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="holiday-actions">
            <button class="add-countdown-btn" title="添加到倒数日">
                <i class="fas fa-calendar-plus"></i>
                添加倒数日
            </button>
            <button class="share-btn" data-name="${event.name}" data-type="${event.type}" data-date-range="${dateRange}" data-days="${event.days || 1}" data-countdown-text="${countdownText}" data-countdown-number="${countdownNumber}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                分享
            </button>
        </div>
    `;

    // 添加到倒数日按钮事件
    const addBtn = card.querySelector('.add-countdown-btn');

    // 初始禁用状态：若已存在，则置灰并修改文案
    if (isEventInCountdowns(event)) {
        addBtn.disabled = true;
        addBtn.title = '已添加到倒数日';
        addBtn.innerHTML = '<i class="fas fa-check"></i> 已添加';
    }

    addBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到卡片点击事件
        // 二次校验，避免重复添加
        if (isEventInCountdowns(event)) {
            addBtn.disabled = true;
            addBtn.title = '已添加到倒数日';
            addBtn.innerHTML = '<i class="fas fa-check"></i> 已添加';
            showInlineNotification('已存在相同的倒数日', 'warning');
            return;
        }
        addToCountdown(event, addBtn);
    });

    // 分享按钮事件
    card.querySelector('.share-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到卡片点击事件
        const name = e.target.closest('.share-btn').getAttribute('data-name');
        const type = e.target.closest('.share-btn').getAttribute('data-type');
        const dateRange = e.target.closest('.share-btn').getAttribute('data-date-range');
        const days = e.target.closest('.share-btn').getAttribute('data-days');
        const countdownText = e.target.closest('.share-btn').getAttribute('data-countdown-text');
        const countdownNumber = e.target.closest('.share-btn').getAttribute('data-countdown-number');
        
        // 获取事件的完整信息
        const eventData = allEventsCombined.find(item => item.name === name && item.type === type);
        
        shareHoliday(eventData, name, dateRange, days, countdownText, countdownNumber);
    });

    card.addEventListener('click', () => {
        openHolidayModal(event);
    });

    // 正在进行：插入右上角微型标签
    if (status === 'current') {
        const badge = document.createElement('span');
        badge.className = 'current-badge';
        badge.textContent = '正在进行中';
        card.appendChild(badge);
    }
    return card;
}

function findNextEvent() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 合并节假日和节气数据，找到下一个事件
    const allEvents = [...uniqueHolidays, ...solarTerms2025];
    
    // 按日期排序
    allEvents.sort((a, b) => {
        const dateA = a.type === "solar" ? new Date(a.date) : new Date(a.startDate);
        const dateB = b.type === "solar" ? new Date(b.date) : new Date(b.startDate);
        return dateA - dateB;
    });
    
    // 找到第一个未来的事件
    for (const event of allEvents) {
        const eventDate = event.type === "solar" ? new Date(event.date) : new Date(event.startDate);
        eventDate.setHours(0, 0, 0, 0);
        
        if (eventDate >= today) {
            return event;
        }
    }
    
    // 如果今年没有剩余事件，返回明年元旦
    return {
        name: "元旦",
        icon: '<i class="fas fa-star" style="color: #e74c3c;"></i>',
        startDate: "2026-01-01",
        color: "#e74c3c",
        type: "holiday"
    };
}

function findCurrentEvent() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 检查所有事件，找到正在进行的
    const allEvents = [...uniqueHolidays, ...solarTerms2025];
    
    for (const event of allEvents) {
        if (event.type === "solar") {
            // 节气：检查是否是今天
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            if (eventDate.getTime() === today.getTime()) {
                return event;
            }
        } else {
            // 节假日：检查是否在假期范围内
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            if (today >= startDate && today <= endDate) {
                return event;
            }
        }
    }
    
    return null;
}

function updateCurrentEvent() {
    const currentEvent = findCurrentEvent();
    const currentEventDiv = document.getElementById('current-event');
    
    if (currentEvent) {
        currentEventDiv.style.display = 'block';
        
        let eventInfo = '';
        if (currentEvent.type === "solar") {
            eventInfo = '今日节气';
        } else {
            // 计算假期剩余天数
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = new Date(currentEvent.endDate);
            endDate.setHours(0, 0, 0, 0);
            const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) + 1;
            
            if (remainingDays > 1) {
                eventInfo = `假期进行中，还剩 ${remainingDays} 天`;
            } else {
                eventInfo = '假期最后一天';
            }
        }
        
        currentEventDiv.innerHTML = `
            <h3><i class="fas fa-calendar-check" style="margin-right: 8px;"></i>正在过的${currentEvent.type === "solar" ? "节气" : "节日"}</h3>
            <div class="current-event-name">${currentEvent.icon} ${currentEvent.name}</div>
            <div class="current-event-info">${eventInfo}</div>
            <div class="current-event-description">${currentEvent.description}</div>
        `;
        currentEventDiv.style.cursor = 'pointer';
        currentEventDiv.onclick = () => openHolidayModal(currentEvent);
    } else {
        currentEventDiv.style.display = 'none';
    }
}

function updateNextHoliday() {
    const nextEvent = findNextEvent();
    const daysUntil = nextEvent.type === "solar" ? 
        calculateDaysUntil(nextEvent.date) : 
        calculateDaysUntil(nextEvent.startDate);
    
    const eventTypeText = nextEvent.type === "solar" ? "节气" : "假期";
    
    const nextHolidayDiv = document.getElementById('next-holiday');
    const countdownText = daysUntil === 0 ? '今天' : `${Math.max(0, daysUntil)}天后开始`;
    nextHolidayDiv.innerHTML = `
        <h3><i class="fas fa-bullseye" style="margin-right: 8px;"></i>下一个${eventTypeText}</h3>
        <div class="next-holiday-name">${nextEvent.icon} ${nextEvent.name}</div>
        <div class="next-holiday-countdown">${daysUntil === 0 ? '' : Math.max(0, daysUntil)}</div>
        <div>${countdownText}</div>
    `;
    
    // 添加点击事件以打开详情窗
    nextHolidayDiv.style.cursor = 'pointer';
    nextHolidayDiv.onclick = () => openHolidayModal(nextEvent);
}

function updateStatistics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let remainingHolidays = 0;
    let remainingDays = 0;
    let remainingSolarTerms = 0;
    
    // 统计剩余节假日
    uniqueHolidays.forEach(holiday => {
        const startDate = new Date(holiday.startDate);
        const endDate = new Date(holiday.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        if (endDate >= today) {
            // 如果假期还没有完全结束
            remainingHolidays++;
            
            if (startDate > today) {
                // 假期还没开始，计算整个假期天数
                remainingDays += holiday.days;
            } else {
                // 假期正在进行中，计算剩余天数
                const remainingHolidayDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) + 1;
                remainingDays += remainingHolidayDays;
            }
        }
    });
    
    // 统计剩余节气
    solarTerms2025.forEach(solarTerm => {
        const solarTermDate = new Date(solarTerm.date);
        solarTermDate.setHours(0, 0, 0, 0);
        
        if (solarTermDate >= today) {
            remainingSolarTerms++;
        }
    });
    
    document.getElementById('remaining-holidays').textContent = remainingHolidays;
    document.getElementById('remaining-days').textContent = remainingDays;
    
    // 更新统计摘要部分
    document.getElementById('total-holidays').textContent = uniqueHolidays.length;
    document.getElementById('total-days').textContent = uniqueHolidays.reduce((total, holiday) => total + holiday.days, 0);
    
    // 添加节气统计信息
    const summaryStats = document.querySelector('.summary-stats');
    if (summaryStats) {
        // 查找是否已存在节气统计项
        let solarTermStat = document.getElementById('solar-term-stat');
        if (!solarTermStat) {
            // 如果不存在，则创建新的节气统计项
            solarTermStat = document.createElement('div');
            solarTermStat.className = 'stat-item';
            solarTermStat.id = 'solar-term-stat';
            solarTermStat.innerHTML = `
                <div class="stat-number" id="total-solar-terms">${solarTerms2025.length}</div>
                <div class="stat-label">个节气</div>
            `;
            summaryStats.appendChild(solarTermStat);
        } else {
            // 如果存在，则更新数值
            document.getElementById('total-solar-terms').textContent = solarTerms2025.length;
        }
        
        // 查找是否已存在剩余节气统计项
        let remainingSolarTermStat = document.getElementById('remaining-solar-term-stat');
        if (!remainingSolarTermStat) {
            // 如果不存在，则创建新的剩余节气统计项
            remainingSolarTermStat = document.createElement('div');
            remainingSolarTermStat.className = 'stat-item';
            remainingSolarTermStat.id = 'remaining-solar-term-stat';
            remainingSolarTermStat.innerHTML = `
                <div class="stat-number" id="remaining-solar-terms">${remainingSolarTerms}</div>
                <div class="stat-label">剩余节气</div>
            `;
            summaryStats.appendChild(remainingSolarTermStat);
        } else {
            // 如果存在，则更新数值
            document.getElementById('remaining-solar-terms').textContent = remainingSolarTerms;
        }
    }
}

// 筛选功能
let currentFilter = 'all';
let currentStatus = 'upcoming';
let currentSearchTerm = '';

function filterEvents() {
    const grid = document.getElementById('holiday-grid');
    grid.innerHTML = ''; // 清空
    
    let filteredEvents = [...allEventsCombined];
    
    // 按搜索词筛选
    if (currentSearchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            event.name.toLowerCase().includes(currentSearchTerm.toLowerCase())
        );
    }
    
    // 按类型筛选
    if (currentFilter !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.type === currentFilter);
    }
    
    // 按状态筛选
    if (currentStatus !== 'all') {
        filteredEvents = filteredEvents.filter(event => {
            const status = event.type === "solar" ? 
                getHolidayStatus(event.date, event.date) : 
                getHolidayStatus(event.startDate, event.endDate);
            return status === currentStatus;
        });
    }
    
    // 按日期排序
    filteredEvents.sort((a, b) => {
        const dateA = a.type === "solar" ? new Date(a.date) : new Date(a.startDate);
        const dateB = b.type === "solar" ? new Date(b.date) : new Date(b.startDate);
        return dateA - dateB;
    });
    
    // 如果没有匹配的事件，显示提示信息
    if (filteredEvents.length === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.innerHTML = `
            <div class="no-results-content">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; color: #ccc;"></i>
                <h3>暂无内容</h3>
                <p>没有找到匹配的节假日或节气</p>
            </div>
        `;
        grid.appendChild(noResultsDiv);
    } else {
        // 否则显示筛选结果
        filteredEvents.forEach(event => {
            const card = createHolidayCard(event);
            grid.appendChild(card);
        });
    }
}

// 设置筛选按钮事件
function setupFilterButtons() {
    // 类型筛选按钮
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除同组按钮的active类
            const groupButtons = this.parentElement.querySelectorAll('.filter-btn[data-filter]');
            groupButtons.forEach(btn => btn.classList.remove('active'));
            // 为当前按钮添加active类
            this.classList.add('active');
            // 更新筛选类型
            currentFilter = this.getAttribute('data-filter');
            // 应用筛选
            filterEvents();
        });
    });
    
    // 状态筛选按钮
    const statusButtons = document.querySelectorAll('.filter-btn[data-status]');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除同组按钮的active类
            const groupButtons = this.parentElement.querySelectorAll('.filter-btn[data-status]');
            groupButtons.forEach(btn => btn.classList.remove('active'));
            // 为当前按钮添加active类
            this.classList.add('active');
            // 更新状态类型
            currentStatus = this.getAttribute('data-status');
            // 应用筛选
            filterEvents();
        });
    });
}

// 设置搜索功能
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    
    // 监听输入事件（防抖）
    const onSearchInput = debounce(function() {
        currentSearchTerm = searchInput.value.trim();
        searchClear.style.display = currentSearchTerm ? 'flex' : 'none';
        filterEvents();
    }, 200);
    searchInput.addEventListener('input', onSearchInput);
    
    // 清除搜索
    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        currentSearchTerm = '';
        searchClear.style.display = 'none';
        filterEvents();
    });
}

function renderHolidays() {
    const grid = document.getElementById('holiday-grid');
    grid.innerHTML = ''; // 清空
    
    // 按日期排序所有事件
    const sortedEvents = [...allEventsCombined].sort((a, b) => {
        const dateA = a.type === "solar" ? new Date(a.date) : new Date(a.startDate);
        const dateB = b.type === "solar" ? new Date(b.date) : new Date(b.startDate);
        return dateA - dateB;
    });
    
    sortedEvents.forEach(event => {
        const card = createHolidayCard(event);
        grid.appendChild(card);
    });
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

// 深色模式控制
function checkTimeAndSetTheme() {
    const now = new Date();
    const hour = now.getHours();
    
    // 晚上18点到早上6点为深色模式
    if (hour >= 18 || hour < 6) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// 动态注入“正在进行”卡片高亮样式，避免修改全局CSS文件
function injectCurrentHighlightStyle() {
    try {
        if (document.getElementById('hs-current-highlight-style')) return;
        const style = document.createElement('style');
        style.id = 'hs-current-highlight-style';
        style.textContent = `
/* 正在进行卡片：增加黄色外圈 + 保留内阴影高亮 */
.holiday-card[data-status="current"]{
  /* 外圈（黄色） */
  box-shadow: 0 0 0 2px #FFD700, 
              0 0 0 2px var(--card-color, #4285f4) inset, 
              0 8px 24px rgba(66,133,244,.25);
  animation: hsGlow 1.8s ease-in-out infinite alternate;
  position: relative;
}
/* 轻微内层高光描边 */
.holiday-card[data-status="current"]::after{
  content:'';
  position:absolute;
  inset:0;
  pointer-events:none;
  border-radius:12px;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.05) inset;
}
/* 右上角状态微型标签 */
.holiday-card .current-badge{
  position:absolute;
  top:8px;
  right:8px;
  background:#FFD700;
  color:#222;
  font-size:10px;
  line-height:1;
  padding:2px 6px;
  border-radius:10px;
  box-shadow:0 1px 3px rgba(0,0,0,0.2);
  z-index:2;
  opacity:0.95;
}
/* 深色模式下微调对比度 */
body.dark-mode .holiday-card .current-badge{
  color:#111;
}

@keyframes hsGlow {
  from { box-shadow: 0 0 0 2px #FFD700, 0 0 0 2px var(--card-color, #4285f4) inset, 0 4px 16px rgba(66,133,244,.2); }
  to { box-shadow: 0 0 0 2px #FFD700, 0 0 0 2px var(--card-color, #4285f4) inset, 0 12px 28px rgba(66,133,244,.35); }
}
        `;
        document.head.appendChild(style);
    } catch(e) { console.warn('样式注入失败', e); }
}

// 节日详情弹窗功能
function openHolidayModal(event) {
    const modalOverlay = document.getElementById('holiday-modal-overlay');
    const modalTitle = document.getElementById('holiday-modal-title');
    const modalDescription = document.getElementById('holiday-modal-description');
    const modal = modalOverlay.querySelector('.holiday-modal');

    // 计算状态与文案
    const status = event.type === "solar" ? 
        getHolidayStatus(event.date, event.date) : 
        getHolidayStatus(event.startDate, event.endDate);

    const dateRange = event.type === "solar" ? 
        formatDate(event.date) : 
        formatDateRange(event.startDate, event.endDate);

    let countdownText = '';
    let countdownNumber = '';
    if (status === 'current') {
        const daysLeft = event.type === "solar" ? 0 : calculateDaysUntil(event.endDate);
        countdownNumber = Math.max(0, daysLeft);
        countdownText = '剩余天数';
    } else if (status === 'upcoming') {
        const daysUntil = event.type === "solar" ? calculateDaysUntil(event.date) : calculateDaysUntil(event.startDate);
        countdownNumber = Math.max(0, daysUntil);
        countdownText = '倒数天数';
    } else {
        const daysUntil = event.type === "solar" ? calculateDaysUntil(event.date) : calculateDaysUntil(event.startDate);
        countdownNumber = Math.abs(daysUntil);
        countdownText = '已过天数';
    }

    // 标题与主题色
    modalTitle.textContent = event.name;
    modal.style.setProperty('--card-color', event.color);

    // 详情内容（日期/类型/状态/天数与调休/介绍 + 操作）
    const typeText = event.type === "holiday" ? "法定假日" : "节气";
    const workDaysHtml = (event.workDays && event.workDays.length > 0) 
        ? `<div class="detail-row"><span class="detail-label">调休上班</span><span class="detail-value">${event.workDays.map(formatDate).join(', ')}</span></div>`
        : '';

    const holidayDaysHtml = event.type === "holiday" && event.days 
        ? `<div class="detail-row"><span class="detail-label">假期天数</span><span class="detail-value">${event.days}天</span></div>`
        : '';

    // 设置弹窗副标题
    const modalSubtitle = document.getElementById('holiday-modal-subtitle');
    modalSubtitle.textContent = event.type === "solar" ? "节气详情" : "节日介绍";
    
    // 当倒数天数为0时，显示"就在今天"
    const displayCountdownNumber = countdownNumber === 0 ? '就在今天' : countdownNumber;
    const displayCountdownText = countdownNumber === 0 ? '' : countdownText;
    
    modalDescription.innerHTML = `
        <div class="modal-meta">
            <div class="detail-row">
                <span class="detail-label">日期</span>
                <span class="detail-value">${dateRange}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">类型</span>
                <span class="detail-value">${typeText}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">状态</span>
                <span class="holiday-status status-${status}">${getStatusText(status, event.type, countdownNumber)}</span>
            </div>
            ${holidayDaysHtml}
            ${workDaysHtml}
        </div>
        <div class="modal-countdown" style="text-align:center;margin:12px 0;">
            <div class="countdown-number" style="font-size:2rem;">${displayCountdownNumber}</div>
            <div class="countdown-label">${displayCountdownText}</div>
        </div>
        <div class="modal-description" style="margin-top:8px;line-height:1.7;">${event.description || ''}</div>
        <div class="modal-actions" style="display:flex;gap:10px;margin-top:14px;">
            <button id="modal-add-btn" class="add-countdown-btn" style="flex:1;min-height:36px;">
                <i class="fas fa-calendar-plus"></i> 添加倒数日
            </button>
            <button id="modal-share-btn" class="share-btn" style="flex:1;min-height:36px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                分享
            </button>
        </div>
    `;

    // 绑定操作
    const addBtn = document.getElementById('modal-add-btn');
    if (addBtn) {
        addBtn.onclick = () => addToCountdown(event, addBtn);
        if (isEventInCountdowns(event)) {
            addBtn.disabled = true;
            addBtn.title = '已添加到倒数日';
            addBtn.innerHTML = '<i class="fas fa-check"></i> 已添加';
        }
    }
    const shareBtn = document.getElementById('modal-share-btn');
    if (shareBtn) {
        shareBtn.onclick = () => {
            const name = event.name;
            const days = event.days || 1;
            shareHoliday(event, name, dateRange, days, countdownText, countdownNumber);
        };
    }

    modalOverlay.classList.add('visible');
    document.body.classList.add('modal-open');
}

function closeHolidayModal() {
    const modalOverlay = document.getElementById('holiday-modal-overlay');
    modalOverlay.classList.remove('visible');
    document.body.classList.remove('modal-open');
}

// 初始化页面
function init() {
    // 设置主题
    checkTimeAndSetTheme();
    
    setTimeout(() => {
        updateCurrentEvent(); // 更新正在过的节日/节气
        updateNextHoliday();
        updateStatistics();
        // 注入“正在进行”卡片高亮样式
        injectCurrentHighlightStyle();
        // 注入移动端交互优化样式
        (function(){
            if (document.getElementById('hs-mobile-ux-style')) return;
            const s = document.createElement('style');
            s.id = 'hs-mobile-ux-style';
            s.textContent = `
html, body { -webkit-tap-highlight-color: transparent; }
body.modal-open { overflow: hidden; }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
@media (max-width: 480px) {
  .filter-btn { min-height: 36px; }
  .holiday-modal { width: 94%; }
  .holiday-actions { flex-direction: column; }
}
            `;
            document.head.appendChild(s);
        })();
        // 默认状态筛选：即将到来（同步按钮高亮）
        try {
            const statusButtons = document.querySelectorAll('.filter-btn[data-status]');
            statusButtons.forEach(btn => btn.classList.remove('active'));
            const upcomingBtn = document.querySelector('.filter-btn[data-status="upcoming"]');
            if (upcomingBtn) upcomingBtn.classList.add('active');
        } catch (e) { console.warn('状态按钮初始化失败', e); }
        // 首次按筛选渲染（避免先全量再二次筛选）
        filterEvents();
        setupFilterButtons(); // 设置筛选按钮
        setupSearch(); // 设置搜索功能
        
        // 添加淡入动画效果
        document.getElementById('loading').style.display = 'none';
        const content = document.getElementById('content');
        content.style.display = 'block';
        
        // 为内容区域添加淡入效果
        content.style.opacity = '0';
        content.style.transition = 'opacity 0.5s ease-out';
        
        // 触发动画
        setTimeout(() => {
            content.style.opacity = '1';
        }, 50);
    }, 1000);

    // 弹窗事件监听
    const modalOverlay = document.getElementById('holiday-modal-overlay');
    const closeModalBtn = document.getElementById('holiday-modal-close');
    
    closeModalBtn.addEventListener('click', closeHolidayModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeHolidayModal();
        }
    });
}

/* 页面加载完成后初始化 */
document.addEventListener('DOMContentLoaded', init);
// 支持 Esc 关闭弹窗
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeHolidayModal();
    }
});

// 每分钟检查一次时间，自动切换主题
setInterval(checkTimeAndSetTheme, 60000);

// ==================== 防复制功能 ====================
// 禁用右键菜单
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});
// 禁用选择文本
document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
});
// 禁用拖拽
document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
});
// 禁用复制相关快捷键
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'a' || e.key === 'u' || e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        return false;
    }
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'J')) {
        e.preventDefault();
        return false;
    }
});
// 监听复制事件
document.addEventListener('copy', function(e) {
    e.clipboardData.setData('text/plain', '内容受保护，无法复制！');
    e.preventDefault();
});

// 添加到倒数日功能
function addToCountdown(event, addBtnRef = null) {
    // 创建倒数日对象
    const countdown = {
        name: event.name,
        date: event.type === "solar" ? event.date : event.startDate,
        type: event.type === "solar" ? "once" : "yearly", // 节气作为单次事件，节假日每年重复
        icon: event.icon.replace(/<[^>]*>/g, '').trim() || '📅', // 提取图标文本
        color: event.color || "#4285f4",
        notes: event.description || "",
        participants: [],
        favorite: false
    };
    
    // 保存前进行重复校验
    try {
        if (typeof StorageManager !== 'undefined' && typeof StorageManager.getData === 'function') {
            const data = StorageManager.getData();
            const list = Array.isArray(data.countdowns) ? data.countdowns : [];
            const duplicate = list.some(item => item.name === countdown.name && item.date === countdown.date && item.type === countdown.type);
            if (duplicate) {
                if (addBtnRef) {
                    addBtnRef.disabled = true;
                    addBtnRef.title = '已添加到倒数日';
                    addBtnRef.innerHTML = '<i class="fas fa-check"></i> 已添加';
                }
                showInlineNotification('已存在相同的倒数日', 'warning');
                return;
            }
        }
    } catch (e) {
        console.warn('保存前重复校验失败:', e);
    }

    // 保存到本地存储
    if (typeof StorageManager !== 'undefined' && typeof StorageManager.saveCountdown === 'function') {
        try {
            const savedCountdown = StorageManager.saveCountdown(countdown);
            showInlineNotification(`已添加到倒数日：${event.name}`);
            // 即时置灰按钮，避免再次添加
            if (addBtnRef) {
                addBtnRef.disabled = true;
                addBtnRef.title = '已添加到倒数日';
                addBtnRef.innerHTML = '<i class="fas fa-check"></i> 已添加';
            }
        } catch (error) {
            console.error('添加倒数日失败:', error);
            showInlineNotification('添加倒数日失败，请重试', 'error');
        }
    } else {
        showInlineNotification('存储管理器不可用，无法添加', 'error');
    }
}
