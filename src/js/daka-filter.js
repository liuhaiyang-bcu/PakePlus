/**
 * 打卡筛选器管理器
 * 负责打卡的标签筛选、时间筛选、收藏筛选等功能
 */

class DakaFilterManager {
    constructor() {
        this.filterState = {
            tags: [],
            dateRange: {
                start: '',
                end: ''
            },
            quickDate: '',
            starFilter: 'all', // 收藏筛选状态
            repeatType: 'all' // 打卡规则筛选
        };
        
        this.filteredDakas = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.initFilter();
    }

    bindEvents() {
        // 选项卡切换
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('daka-filter-tab')) {
                this.switchTab(e.target);
            }
        });

        // 折叠/展开功能
        const toggleBtn = document.getElementById('daka-filter-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleCollapse();
            });
        }

        // 清除所有筛选
        const clearAllBtn = document.getElementById('clear-daka-filters-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // 清除时间筛选
        const clearDateFilterBtn = document.getElementById('clear-daka-date-filter-btn');
        if (clearDateFilterBtn) {
            clearDateFilterBtn.addEventListener('click', () => {
                this.clearDateFilter();
            });
        }

        // 绑定快捷日期按钮事件
        this.bindQuickDateEvents();

        // 绑定日期输入事件
        this.bindDateInputEvents();
        
        // 绑定收藏筛选事件
        this.bindStarFilterEvents();

        // 绑定打卡规则筛选事件
        this.bindRepeatTypeFilterEvents();
    }

    /**
     * 初始化筛选功能
     */
    initFilter() {
        // 初始化标签筛选
        this.updateTagFilterButtons();
        
        // 初始化时间筛选
        this.initDateFilter();
        
        // 设置默认折叠状态
        this.initFilterCollapseState();
    }

    /**
     * 切换选项卡
     */
    switchTab(clickedTab) {
        // 移除所有活动状态
        document.querySelectorAll('.daka-filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.daka-filter-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // 激活点击的选项卡
        clickedTab.classList.add('active');
        const targetPanel = document.getElementById(clickedTab.dataset.tab + '-panel');
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    }

    /**
     * 切换折叠状态
     */
    toggleCollapse() {
        const content = document.getElementById('daka-filter-content');
        const toggleBtn = document.getElementById('daka-filter-toggle');
        const icon = toggleBtn.querySelector('i');

        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            icon.className = 'fas fa-chevron-down';
            toggleBtn.title = '折叠';
            this.saveFilterCollapseState(false);
        } else {
            content.classList.add('collapsed');
            icon.className = 'fas fa-chevron-up';
            toggleBtn.title = '展开';
            this.saveFilterCollapseState(true);
        }
    }

    /**
     * 初始化时间筛选
     */
    initDateFilter() {
        const startDateInput = document.getElementById('daka-start-date');
        const endDateInput = document.getElementById('daka-end-date');
        
        if (!startDateInput || !endDateInput) return;
        
        // 设置默认日期范围（最近30天）
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        startDateInput.value = this.formatDateForInput(thirtyDaysAgo);
        endDateInput.value = this.formatDateForInput(today);
    }

    /**
     * 绑定快捷日期事件
     */
    bindQuickDateEvents() {
        const quickDateButtons = document.getElementById('daka-quick-date-buttons');
        if (!quickDateButtons) return;
        
        quickDateButtons.addEventListener('click', (e) => {
            if (e.target.classList.contains('daka-quick-date-btn')) {
                this.handleQuickDateClick(e.target);
            }
        });
    }

    /**
     * 绑定日期输入事件
     */
    bindDateInputEvents() {
        const startDateInput = document.getElementById('daka-start-date');
        const endDateInput = document.getElementById('daka-end-date');
        
        if (startDateInput) {
            startDateInput.addEventListener('change', () => {
                this.filterState.dateRange.start = startDateInput.value;
                this.filterState.quickDate = ''; // 清除快捷日期选择
                this.applyFilters();
                this.updateDateFilterStatus();
                this.checkFilterStatus();
            });
        }

        if (endDateInput) {
            endDateInput.addEventListener('change', () => {
                this.filterState.dateRange.end = endDateInput.value;
                this.filterState.quickDate = ''; // 清除快捷日期选择
                this.applyFilters();
                this.updateDateFilterStatus();
                this.checkFilterStatus();
            });
        }
    }

    /**
     * 绑定收藏筛选事件
     */
    bindStarFilterEvents() {
        const starFilterInputs = document.querySelectorAll('input[name="daka-star-filter"]');
        
        starFilterInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.filterState.starFilter = e.target.value;
                this.applyFilters();
                this.updateStarFilterStatus();
                this.checkFilterStatus();
            });
        });
    }

    /**
     * 绑定打卡规则筛选事件
     */
    bindRepeatTypeFilterEvents() {
        const repeatTypeInputs = document.querySelectorAll('input[name="daka-repeat-filter"]');
        
        repeatTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.filterState.repeatType = e.target.value;
                this.applyFilters();
                this.updateRepeatTypeFilterStatus();
                this.checkFilterStatus();
            });
        });
    }

    /**
     * 处理快捷日期点击
     */
    handleQuickDateClick(button) {
        const type = button.dataset.type;
        
        // 移除其他按钮的激活状态
        const quickDateButtons = document.getElementById('daka-quick-date-buttons');
        if (quickDateButtons) {
            quickDateButtons.querySelectorAll('.daka-quick-date-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
        
        // 激活当前按钮
        button.classList.add('active');
        
        // 设置日期范围
        const { startDate, endDate } = this.getQuickDateRange(type);
        const startDateInput = document.getElementById('daka-start-date');
        const endDateInput = document.getElementById('daka-end-date');
        
        if (startDateInput) startDateInput.value = this.formatDateForInput(startDate);
        if (endDateInput) endDateInput.value = this.formatDateForInput(endDate);
        
        // 更新筛选状态
        this.filterState.quickDate = type;
        this.filterState.dateRange.start = this.formatDateForInput(startDate);
        this.filterState.dateRange.end = this.formatDateForInput(endDate);
        
        // 应用筛选
        this.applyFilters();
        
        // 更新状态显示
        this.updateDateFilterStatus();
    }

    /**
     * 获取快捷日期范围
     */
    getQuickDateRange(type) {
        // 修复时区问题 - 使用本地时区创建日期
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDate = new Date(today);
        const endDate = new Date(today);
        
        switch (type) {
            case 'today':
                return { startDate: today, endDate: today };
            case 'yesterday':
                startDate.setDate(today.getDate() - 1);
                endDate.setDate(today.getDate() - 1);
                return { startDate, endDate };
            case 'this-week':
                startDate.setDate(today.getDate() - today.getDay());
                return { startDate, endDate: today };
            case 'last-week':
                startDate.setDate(today.getDate() - today.getDay() - 7);
                endDate.setDate(today.getDate() - today.getDay() - 1);
                return { startDate, endDate };
            case 'this-month':
                startDate.setDate(1);
                return { startDate, endDate: today };
            case 'last-month':
                startDate.setMonth(today.getMonth() - 1, 1);
                endDate.setMonth(today.getMonth(), 0);
                return { startDate, endDate };
            default:
                return { startDate: today, endDate: today };
        }
    }

    /**
     * 格式化日期为input值
     */
    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * 初始化筛选器折叠状态
     */
    initFilterCollapseState() {
        const content = document.getElementById('daka-filter-content');
        const toggleBtn = document.getElementById('daka-filter-toggle');
        
        if (content && toggleBtn) {
            // 检查本地存储中的折叠状态
            const savedCollapsed = this.getFilterCollapseState();
            const shouldCollapse = savedCollapsed !== null ? savedCollapsed : true; // 默认折叠
            
            if (shouldCollapse) {
                content.classList.add('collapsed');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-chevron-up';
                }
                toggleBtn.title = '展开';
            } else {
                content.classList.remove('collapsed');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-chevron-down';
                }
                toggleBtn.title = '折叠';
            }
        }
    }

    /**
     * 保存筛选器折叠状态
     */
    saveFilterCollapseState(collapsed) {
        try {
            localStorage.setItem('daka_filter_collapsed', collapsed.toString());
        } catch (error) {
            console.warn('保存筛选器折叠状态失败:', error);
        }
    }

    /**
     * 获取筛选器折叠状态
     */
    getFilterCollapseState() {
        try {
            const value = localStorage.getItem('daka_filter_collapsed');
            return value === null ? null : value === 'true';
        } catch (error) {
            console.warn('获取筛选器折叠状态失败:', error);
            return null;
        }
    }

    /**
     * 更新标签筛选按钮
     */
    updateTagFilterButtons() {
        const tagFilterButtons = document.getElementById('daka-tag-filter-buttons');
        const tagCount = document.getElementById('daka-tag-count');
        
        if (!tagFilterButtons) return;
        
        const data = window.StorageManager ? window.StorageManager.getData() : { dakas: [] };
        const dakas = data.dakas || [];
        
        // 收集所有标签
        const allTags = new Set();
        dakas.forEach(daka => {
            if (daka.tags && daka.tags.length > 0) {
                daka.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        // 清空现有按钮
        tagFilterButtons.innerHTML = '';
        
        // 创建标签按钮
        allTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'daka-tag-filter-btn';
            button.textContent = tag;
            button.dataset.tag = tag;
            
            button.addEventListener('click', () => {
                this.toggleTagFilter(tag, button);
            });
            
            tagFilterButtons.appendChild(button);
        });
        
        // 更新标签计数
        if (tagCount) {
            tagCount.textContent = allTags.size;
        }
    }

    /**
     * 切换标签筛选
     */
    toggleTagFilter(tag, button) {
        button.classList.toggle('selected');
        
        // 更新筛选状态
        if (button.classList.contains('selected')) {
            if (!this.filterState.tags.includes(tag)) {
                this.filterState.tags.push(tag);
            }
        } else {
            this.filterState.tags = this.filterState.tags.filter(t => t !== tag);
        }
        
        // 应用筛选
        this.applyFilters();
        
        // 更新状态显示
        this.updateTagFilterStatus();
        this.checkFilterStatus();
    }

    /**
     * 更新标签筛选状态显示
     */
    updateTagFilterStatus() {
        const tagFilterStatus = document.getElementById('daka-tag-filter-status');
        if (!tagFilterStatus) return;
        
        if (this.filterState.tags.length > 0) {
            tagFilterStatus.style.display = 'flex';
            const statusText = tagFilterStatus.querySelector('span');
            if (statusText) {
                statusText.textContent = `已选择 ${this.filterState.tags.length} 个标签`;
            }
        } else {
            tagFilterStatus.style.display = 'none';
        }
    }

    /**
     * 更新时间筛选状态显示
     */
    updateDateFilterStatus() {
        const dateFilterStatus = document.getElementById('daka-date-filter-status');
        if (!dateFilterStatus) return;
        
        if (this.filterState.dateRange.start || this.filterState.dateRange.end || this.filterState.quickDate) {
            dateFilterStatus.style.display = 'flex';
            const statusText = dateFilterStatus.querySelector('span');
            if (statusText) {
                let status = '';
                if (this.filterState.quickDate) {
                    const quickDateLabels = {
                        'today': '今天',
                        'yesterday': '昨天',
                        'this-week': '本周',
                        'last-week': '上周',
                        'this-month': '本月',
                        'last-month': '上月'
                    };
                    status = `时间范围：${quickDateLabels[this.filterState.quickDate]}`;
                } else if (this.filterState.dateRange.start && this.filterState.dateRange.end) {
                    status = `时间范围：${this.filterState.dateRange.start} 至 ${this.filterState.dateRange.end}`;
                } else if (this.filterState.dateRange.start) {
                    status = `开始时间：${this.filterState.dateRange.start}`;
                } else if (this.filterState.dateRange.end) {
                    status = `结束时间：${this.filterState.dateRange.end}`;
                }
                statusText.textContent = status;
            }
        } else {
            dateFilterStatus.style.display = 'none';
        }
    }

    /**
     * 更新收藏筛选状态显示
     */
    updateStarFilterStatus() {
        const starFilterStatus = document.getElementById('daka-star-filter-status');
        if (!starFilterStatus) return;
        
        if (this.filterState.starFilter !== 'all') {
            starFilterStatus.style.display = 'flex';
            const statusText = starFilterStatus.querySelector('span');
            if (statusText) {
                const statusLabels = {
                    'starred': '只看收藏打卡',
                    'unstarred': '只看未收藏打卡'
                };
                statusText.textContent = statusLabels[this.filterState.starFilter] || '';
            }
        } else {
            starFilterStatus.style.display = 'none';
        }
    }

    /**
     * 更新打卡规则筛选状态显示
     */
    updateRepeatTypeFilterStatus() {
        const repeatTypeFilterStatus = document.getElementById('daka-repeat-filter-status');
        if (!repeatTypeFilterStatus) return;
        
        if (this.filterState.repeatType !== 'all') {
            repeatTypeFilterStatus.style.display = 'flex';
            const statusText = repeatTypeFilterStatus.querySelector('span');
            if (statusText) {
                const statusLabels = {
                    'daily': '每天打卡',
                    'monthly': '每月打卡',
                    'yearly': '每年打卡'
                };
                statusText.textContent = `打卡规则：${statusLabels[this.filterState.repeatType] || ''}`;
            }
        } else {
            repeatTypeFilterStatus.style.display = 'none';
        }
    }

    /**
     * 检查筛选状态
     */
    checkFilterStatus() {
        const hasActiveFilters = (
            this.filterState.tags.length > 0 ||
            this.filterState.dateRange.start ||
            this.filterState.dateRange.end ||
            this.filterState.quickDate ||
            this.filterState.starFilter !== 'all' ||
            this.filterState.repeatType !== 'all'
        );
        
        // 显示/隐藏清除按钮
        const clearAllBtn = document.getElementById('clear-daka-filters-btn');
        if (clearAllBtn) {
            clearAllBtn.style.display = hasActiveFilters ? 'flex' : 'none';
        }
    }

    /**
     * 应用筛选
     */
    applyFilters() {
        const data = window.StorageManager ? window.StorageManager.getData() : { dakas: [] };
        const allDakas = data.dakas || [];
        
        // 应用筛选条件
        this.filteredDakas = allDakas.filter(daka => {
            // 标签筛选
            if (this.filterState.tags.length > 0) {
                if (!daka.tags || daka.tags.length === 0) return false;
                const hasMatchingTag = this.filterState.tags.some(filterTag => 
                    daka.tags.includes(filterTag)
                );
                if (!hasMatchingTag) return false;
            }
            
            // 时间筛选
            if (this.filterState.dateRange.start || this.filterState.dateRange.end) {
                const dakaDate = new Date(daka.createTime);
                const startDate = this.filterState.dateRange.start ? new Date(this.filterState.dateRange.start) : null;
                const endDate = this.filterState.dateRange.end ? new Date(this.filterState.dateRange.end + 'T23:59:59') : null;
                
                if (startDate && dakaDate < startDate) return false;
                if (endDate && dakaDate > endDate) return false;
            }
            
            // 收藏筛选
            if (this.filterState.starFilter !== 'all') {
                if (this.filterState.starFilter === 'starred' && !daka.starred) return false;
                if (this.filterState.starFilter === 'unstarred' && daka.starred) return false;
            }

            // 打卡规则筛选
            if (this.filterState.repeatType !== 'all') {
                if (daka.repeatType !== this.filterState.repeatType) return false;
            }
            
            return true;
        });
        
        // 重新渲染打卡列表
        this.renderFilteredDakas();
    }

    /**
     * 渲染筛选后的打卡
     */
    renderFilteredDakas() {
        const dakasList = document.getElementById('daka-list');
        const emptyMessage = document.getElementById('empty-daka-message');
        
        if (!dakasList || !emptyMessage) return;
        
        if (this.filteredDakas.length === 0) {
            dakasList.style.display = 'none';
            emptyMessage.style.display = 'block';
            emptyMessage.innerHTML = `
                <div class="empty-icon">🔍</div>
                <p>没有找到符合条件的打卡</p>
                <p class="sub-text">请尝试调整筛选条件</p>
            `;
            return;
        }
        
        dakasList.style.display = 'grid';
        emptyMessage.style.display = 'none';
        
        // 清空列表
        dakasList.innerHTML = '';
        
        // 收藏优先，时间倒序
        this.filteredDakas.sort((a, b) => {
            if ((b.starred ? 1 : 0) !== (a.starred ? 1 : 0)) {
                return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
            }
            return new Date(b.createTime) - new Date(a.createTime);
        });
        
        // 使用DakaManager的方法创建打卡卡片
        if (window.DakaManager && typeof window.DakaManager.createDakaCard === 'function') {
            this.filteredDakas.forEach(daka => {
                const card = window.DakaManager.createDakaCard(daka);
                dakasList.appendChild(card);
            });
        } else {
            // 降级处理：使用简化版卡片创建
            this.filteredDakas.forEach(daka => {
                const card = this.createDakaCard(daka);
                dakasList.appendChild(card);
            });
        }
    }

    /**
     * 创建打卡卡片（简化版）
     */
    createDakaCard(daka) {
        const card = document.createElement('div');
        card.className = 'daka-card';
        card.setAttribute('data-daka-id', daka.id);
        
        // 格式化日期
        const createDate = new Date(daka.createTime);
        const dateText = createDate.toLocaleDateString('zh-CN');
        
        // 内容预览（去除HTML标签）
        const contentPreview = daka.content.replace(/<[^>]*>/g, '').substring(0, 150);
        
        // 标签HTML
        const tagsHTML = daka.tags && daka.tags.length > 0 
            ? daka.tags.map(tag => `<span class="daka-tag">${tag}</span>`).join('')
            : '';
        
        // 统计打卡
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        const totalCount = punchRecords.length;
        const uniqueDays = new Set(punchRecords.map(r => r.date)).size;
        
        card.innerHTML = `
            <div class="daka-checkbox"></div>
            <button class="daka-star${daka.starred ? ' active' : ''}" title="${daka.starred ? '取消收藏' : '收藏'}"><i class="fas fa-star"></i></button>
            <div class="daka-title">${this.escapeHtml(daka.title)}</div>
            <div class="daka-content-preview">${this.escapeHtml(contentPreview)}</div>
            <div class="daka-meta">
                <div class="daka-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${dateText}</span>
                </div>
                <div class="daka-tags">${tagsHTML}</div>
            </div>
            <div class="daka-stats">
                <span>累计打卡：<b>${totalCount}</b> 次</span>
                <span style="margin-left:16px;">总天数：<b>${uniqueDays}</b> 天</span>
            </div>
            <div class="daka-actions">
                <button class="daka-action-btn punch" title="今日打卡"><i class="fas fa-check"></i></button>
                <button class="daka-action-btn edit" title="编辑"><i class="fas fa-edit"></i></button>
                <button class="daka-action-btn share" title="分享"><i class="fas fa-share-alt"></i></button>
                <button class="daka-action-btn delete" title="删除"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // 绑定卡片事件
        this.bindDakaCardEvents(card, daka);
        
        return card;
    }

    /**
     * 绑定打卡卡片事件
     */
    bindDakaCardEvents(card, daka) {
        const editBtn = card.querySelector('.edit');
        const shareBtn = card.querySelector('.share');
        const deleteBtn = card.querySelector('.delete');
        const starBtn = card.querySelector('.daka-star');
        const punchBtn = card.querySelector('.punch');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.DakaManager && window.DakaManager.showModal) {
                    window.DakaManager.showModal(daka);
                }
            });
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.DakaManager && window.DakaManager.shareDaka) {
                    window.DakaManager.shareDaka(daka);
                }
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.DakaManager && window.DakaManager.deleteDaka) {
                    window.DakaManager.deleteDaka(daka.id);
                }
            });
        }
        
        if (starBtn) {
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.DakaManager && window.DakaManager.toggleStar) {
                    window.DakaManager.toggleStar(daka.id);
                }
            });
        }

        if (punchBtn) {
            punchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.DakaManager && window.DakaManager.handlePunch) {
                    window.DakaManager.handlePunch(daka);
                }
            });
        }
        
        // 点击卡片查看详情
        card.addEventListener('click', () => {
            if (window.DakaManager && window.DakaManager.showDetailModal) {
                window.DakaManager.showDetailModal(daka);
            }
        });
    }

    /**
     * 清除时间筛选
     */
    clearDateFilter() {
        // 清除时间筛选状态
        this.filterState.dateRange.start = '';
        this.filterState.dateRange.end = '';
        this.filterState.quickDate = '';
        
        // 清空日期输入框
        const startDateInput = document.getElementById('daka-start-date');
        const endDateInput = document.getElementById('daka-end-date');
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        
        // 清除快捷日期按钮状态
        const quickDateButtons = document.getElementById('daka-quick-date-buttons');
        if (quickDateButtons) {
            quickDateButtons.querySelectorAll('.daka-quick-date-btn.active').forEach(btn => {
                btn.classList.remove('active');
            });
        }
        
        // 重置为默认日期范围（最近30天）
        this.initDateFilter();
        
        // 应用筛选
        this.applyFilters();
        
        // 更新状态显示
        this.updateDateFilterStatus();
        this.updateStarFilterStatus();
        this.updateRepeatTypeFilterStatus();
        this.checkFilterStatus();
        
        // 通知DakaManager筛选已清除
        this.notifyDakaManagerCleared();
    }

    /**
     * 清除所有筛选
     */
    clearAllFilters() {
        // 清除标签筛选
        this.filterState.tags = [];
        const tagFilterButtons = document.getElementById('daka-tag-filter-buttons');
        if (tagFilterButtons) {
            tagFilterButtons.querySelectorAll('.daka-tag-filter-btn.selected').forEach(btn => {
                btn.classList.remove('selected');
            });
        }
        
        // 清除时间筛选
        this.filterState.dateRange.start = '';
        this.filterState.dateRange.end = '';
        this.filterState.quickDate = '';
        
        const startDateInput = document.getElementById('daka-start-date');
        const endDateInput = document.getElementById('daka-end-date');
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        
        const quickDateButtons = document.getElementById('daka-quick-date-buttons');
        if (quickDateButtons) {
            quickDateButtons.querySelectorAll('.daka-quick-date-btn.active').forEach(btn => {
                btn.classList.remove('active');
            });
        }
        
        // 清除收藏筛选
        this.filterState.starFilter = 'all';
        const starFilterInputs = document.querySelectorAll('input[name="daka-star-filter"]');
        starFilterInputs.forEach(input => {
            if (input.value === 'all') {
                input.checked = true;
            } else {
                input.checked = false;
            }
        });

        // 清除打卡规则筛选
        this.filterState.repeatType = 'all';
        const repeatTypeInputs = document.querySelectorAll('input[name="daka-repeat-filter"]');
        repeatTypeInputs.forEach(input => {
            if (input.value === 'all') {
                input.checked = true;
            } else {
                input.checked = false;
            }
        });
        
        // 重置为默认日期范围（最近30天）
        this.initDateFilter();
        
        // 应用筛选
        this.applyFilters();
        
        // 更新状态显示
        this.updateTagFilterStatus();
        this.updateDateFilterStatus();
        this.updateStarFilterStatus();
        this.updateRepeatTypeFilterStatus();
        this.checkFilterStatus();
        
        // 通知DakaManager筛选已清除
        this.notifyDakaManagerCleared();
    }

    /**
     * 通知DakaManager筛选已清除
     */
    notifyDakaManagerCleared() {
        if (window.DakaManager && typeof window.DakaManager.onFiltersCleared === 'function') {
            window.DakaManager.onFiltersCleared();
        } else {
            // 如果没有回调方法，直接重新加载打卡
            this.reloadAllDakas();
        }
    }

    /**
     * 重新加载所有打卡
     */
    reloadAllDakas() {
        if (window.DakaManager && typeof window.DakaManager.loadDakas === 'function') {
            window.DakaManager.loadDakas();
        }
    }

    /**
     * 转义HTML字符
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取筛选状态
     */
    getFilterState() {
        return { ...this.filterState };
    }

    /**
     * 应用筛选状态
     */
    applyFilterState(state) {
        this.filterState = { ...state };
        this.applyFilters();
        this.updateTagFilterStatus();
        this.updateDateFilterStatus();
        this.updateStarFilterStatus();
        this.updateRepeatTypeFilterStatus();
        this.checkFilterStatus();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待其他管理器初始化完成
    setTimeout(() => {
        window.dakaFilterManager = new DakaFilterManager();
    }, 500);
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DakaFilterManager;
}



