/**
 * 中华人民共和国2025年纪念日与节日数据库
 */
class MemorialDaysManager {
    constructor() {
        this.memorialDays = this.initMemorialDays();
    }

    /**
     * 初始化纪念日数据
     */
    initMemorialDays() {
        return {
            // 全体公民放假的节日（法定节假日）
            legalHolidays: [
                {
                    name: '元旦',
                    date: '2025-01-01',
                    type: 'legal',
                    description: '新年第一天',
                    vacationDays: ['2025-01-01'],
                    isWorkDay: false
                },
                {
                    name: '春节',
                    date: '2025-01-29', // 农历正月初一
                    type: 'legal',
                    description: '中华民族最重要的传统节日',
                    vacationDays: ['2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04'],
                    workDays: ['2025-01-26', '2025-02-08'],
                    isWorkDay: false
                },
                {
                    name: '清明节',
                    date: '2025-04-05', // 清明节
                    type: 'legal',
                    description: '祭祖扫墓的传统节日',
                    vacationDays: ['2025-04-04', '2025-04-05', '2025-04-06'],
                    isWorkDay: false
                },
                {
                    name: '劳动节',
                    date: '2025-05-01',
                    type: 'legal',
                    description: '国际劳动节',
                    vacationDays: ['2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05'],
                    workDays: ['2025-04-27'],
                    isWorkDay: false
                },
                {
                    name: '端午节',
                    date: '2025-05-31', // 农历五月初五
                    type: 'legal',
                    description: '纪念屈原的传统节日',
                    vacationDays: ['2025-05-31', '2025-06-01', '2025-06-02'],
                    isWorkDay: false
                },
                {
                    name: '中秋节',
                    date: '2025-10-06', // 农历八月十五
                    type: 'legal',
                    description: '团圆节',
                    vacationDays: ['2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08'],
                    workDays: ['2025-09-28', '2025-10-11'],
                    isWorkDay: false
                },
                {
                    name: '国庆节',
                    date: '2025-10-01',
                    type: 'legal',
                    description: '中华人民共和国成立纪念日',
                    vacationDays: ['2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08'],
                    workDays: ['2025-09-28', '2025-10-11'],
                    isWorkDay: false
                },
            ],

            // 部分公民放假的节日
            partialHolidays: [
                {
                    name: '妇女节',
                    date: '2025-03-08',
                    type: 'partial',
                    description: '国际妇女节',
                    target: '妇女',
                    vacationTime: '半天',
                    isWorkDay: true
                },
                {
                    name: '青年节',
                    date: '2025-05-04',
                    type: 'partial',
                    description: '五四青年节',
                    target: '14周岁以上青年',
                    vacationTime: '半天',
                    isWorkDay: true
                },
                {
                    name: '儿童节',
                    date: '2025-06-01',
                    type: 'partial',
                    description: '国际儿童节',
                    target: '不满14周岁少年儿童',
                    vacationTime: '1天',
                    isWorkDay: true
                },
                {
                    name: '建军节',
                    date: '2025-08-01',
                    type: 'partial',
                    description: '中国人民解放军建军节',
                    target: '现役军人',
                    vacationTime: '半天',
                    isWorkDay: true
                }
            ],

            // 重要纪念日（不放假）
            memorialDays: [
                {
                    name: '二七纪念日',
                    date: '2025-02-07',
                    type: 'memorial',
                    description: '纪念京汉铁路工人大罢工',
                    isWorkDay: true
                },
                {
                    name: '植树节',
                    date: '2025-03-12',
                    type: 'memorial',
                    description: '全民植树造林的节日',
                    isWorkDay: true
                },
                {
                    name: '护士节',
                    date: '2025-05-12',
                    type: 'memorial',
                    description: '国际护士节',
                    isWorkDay: true
                },
                {
                    name: '五卅纪念日',
                    date: '2025-05-30',
                    type: 'memorial',
                    description: '纪念五卅运动',
                    isWorkDay: true
                },
                {
                    name: '七七抗战纪念日',
                    date: '2025-07-07',
                    type: 'memorial',
                    description: '纪念全面抗战爆发',
                    isWorkDay: true
                },
                {
                    name: '教师节',
                    date: '2025-09-10',
                    type: 'memorial',
                    description: '尊师重教的节日',
                    isWorkDay: true
                },
                {
                    name: '九一八纪念日',
                    date: '2025-09-18',
                    type: 'memorial',
                    description: '勿忘国耻纪念日',
                    isWorkDay: true
                },
                {
                    name: '九三抗战胜利纪念日',
                    date: '2025-09-03',
                    type: 'memorial',
                    description: '中国人民抗日战争胜利纪念日',
                    isWorkDay: true
                },
                {
                    name: '记者节',
                    date: '2025-11-08',
                    type: 'memorial',
                    description: '中国记者节',
                    isWorkDay: true
                }
            ],

            // 调休工作日
            workDays: [
                {
                    name: '春节调休',
                    dates: ['2025-01-26', '2025-02-08'],
                    reason: '春节假期调休'
                },
                {
                    name: '劳动节调休',
                    dates: ['2025-04-27'],
                    reason: '劳动节假期调休'
                },
                {
                    name: '国庆节调休',
                    dates: ['2025-09-28', '2025-10-11'],
                    reason: '国庆节假期调休'
                }
            ]
        };
    }

    /**
     * 获取指定日期的纪念日信息
     * @param {Date|string} date 日期
     * @returns {Array} 纪念日信息数组
     */
    getMemorialDaysForDate(date) {
        const dateStr = this.formatDate(date);
        const memorialInfo = [];

        // 检查法定节假日
        this.memorialDays.legalHolidays.forEach(holiday => {
            if (holiday.date === dateStr) {
                memorialInfo.push({
                    ...holiday,
                    category: '法定节假日',
                    icon: '🎉',
                    priority: 1
                });
            }
            // 检查是否在假期范围内
            if (holiday.vacationDays && holiday.vacationDays.includes(dateStr)) {
                memorialInfo.push({
                    name: `${holiday.name}假期`,
                    type: 'vacation',
                    description: `${holiday.name}法定假期`,
                    category: '法定假期',
                    icon: '🏖️',
                    priority: 2
                });
            }
            // 检查是否为调休工作日
            if (holiday.workDays && holiday.workDays.includes(dateStr)) {
                memorialInfo.push({
                    name: `${holiday.name}调休`,
                    type: 'workday',
                    description: `因${holiday.name}假期调休上班`,
                    category: '调休工作日',
                    icon: '💼',
                    priority: 3
                });
            }
        });

        // 检查部分公民放假的节日
        this.memorialDays.partialHolidays.forEach(holiday => {
            if (holiday.date === dateStr) {
                memorialInfo.push({
                    ...holiday,
                    category: '部分放假节日',
                    icon: '🎊',
                    priority: 4
                });
            }
        });

        // 检查纪念日
        this.memorialDays.memorialDays.forEach(memorial => {
            if (memorial.date === dateStr) {
                memorialInfo.push({
                    ...memorial,
                    category: '重要纪念日',
                    icon: '📅',
                    priority: 5
                });
            }
        });

        // 按优先级排序
        return memorialInfo.sort((a, b) => a.priority - b.priority);
    }

    /**
     * 检查指定日期是否为工作日
     * @param {Date|string} date 日期
     * @returns {boolean} 是否为工作日
     */
    isWorkDay(date) {
        const dateStr = this.formatDate(date);
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay(); // 0=周日, 6=周六

        // 检查是否为法定假期
        for (const holiday of this.memorialDays.legalHolidays) {
            if (holiday.vacationDays && holiday.vacationDays.includes(dateStr)) {
                return false;
            }
        }

        // 检查是否为调休工作日
        for (const holiday of this.memorialDays.legalHolidays) {
            if (holiday.workDays && holiday.workDays.includes(dateStr)) {
                return true;
            }
        }

        // 正常情况下，周一到周五为工作日
        return dayOfWeek >= 1 && dayOfWeek <= 5;
    }

    /**
     * 格式化日期为YYYY-MM-DD格式
     * @param {Date|string} date 日期
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date) {
        if (typeof date === 'string') {
            return date.split('T')[0]; // 处理ISO字符串
        }
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * 获取纪念日的HTML显示内容
     * @param {Array} memorialInfo 纪念日信息数组
     * @returns {string} HTML内容
     */
    getMemorialDaysHTML(memorialInfo) {
        if (!memorialInfo || memorialInfo.length === 0) {
            return '';
        }

        let html = '<div class="memorial-days-section">';
        html += '<div class="memorial-days-title"><i class="fas fa-calendar-star"></i> 纪念日信息</div>';
        html += '<div class="memorial-days-list">';

        memorialInfo.forEach(info => {
            let statusClass = '';
            let statusText = '';

            switch (info.type) {
                case 'legal':
                    statusClass = 'legal-holiday';
                    statusText = '法定节假日';
                    break;
                case 'vacation':
                    statusClass = 'vacation-day';
                    statusText = '假期';
                    break;
                case 'workday':
                    statusClass = 'work-day';
                    statusText = '调休上班';
                    break;
                case 'partial':
                    statusClass = 'partial-holiday';
                    statusText = `${info.target}${info.vacationTime}`;
                    break;
                case 'memorial':
                    statusClass = 'memorial-day';
                    statusText = '纪念日';
                    break;
            }

            html += `
                <div class="memorial-day-item ${statusClass}">
                    <div class="memorial-icon">${info.icon}</div>
                    <div class="memorial-content">
                        <div class="memorial-name">${info.name}</div>
                        <div class="memorial-description">${info.description}</div>
                        <div class="memorial-status">${statusText}</div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
        return html;
    }
}

// 创建全局实例
window.MemorialDaysManager = new MemorialDaysManager();

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemorialDaysManager;
}