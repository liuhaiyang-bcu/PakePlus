/**
 * 任务管理性能补丁
 * 为TaskManager添加性能优化方法
 */

// 扩展TaskManager的性能优化方法
if (window.TaskManager) {
    Object.assign(TaskManager, {
        
        /**
         * 渲染任务分组（优化版）
         */
        renderTaskGroups(events) {
            // 检查是否是本周筛选
            const isThisWeekFilter = this.isThisWeekFilterActive();
            
            // 如果是本周筛选且没有事件，显示特殊消息
            if (isThisWeekFilter && events.length === 0) {
                const fragment = document.createDocumentFragment();
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-task-message this-week-empty';
                emptyMessage.innerHTML = `
                    <div class="empty-icon">📅</div>
                    <h3>本周暂无事件</h3>
                    <p>本周（${this.getThisWeekDateRange()}）还没有安排任何事件</p>
                `;
                fragment.appendChild(emptyMessage);
                this.elements.taskList.appendChild(fragment);
                return;
            }
            
            // 按时间分组 - 修复时区和日期判断问题
            const now = new Date();
            // 使用本地时区创建今天的日期，避免时区偏移问题
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // 基于今天计算其他日期，确保使用本地时区
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(today.getDate() + 2);
            
            // 定义一周后的日期（用于区分最近要做和将来要做）
            const oneWeekLater = new Date(today);
            oneWeekLater.setDate(today.getDate() + 7);
            
            const groups = {
                yesterday: [],
                today: [],
                tomorrow: [],
                dayAfterTomorrow: [],
                nearFuture: [], // 最近要做的（3天到1周内）
                farFuture: [],  // 将来要做的（1周后）
                past: []        // 更早的
            };
            
            // 分组事件
            events.forEach(event => {
                // 检查事件ID
                if (!event.id) {
                    console.warn('发现没有ID的事件:', event);
                    event.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    StorageManager.saveEvent(event);
                }
                
                if (!event.startTime) {
                    groups.today.push(event);
                    return;
                }
                
                // 解析事件时间并转换为本地日期（只比较日期部分）
                const eventDateTime = new Date(event.startTime);
                const eventDate = new Date(eventDateTime.getFullYear(), eventDateTime.getMonth(), eventDateTime.getDate());
                
                // 使用getTime()进行精确的毫秒级比较
                const eventTime = eventDate.getTime();
                const todayTime = today.getTime();
                const yesterdayTime = yesterday.getTime();
                const tomorrowTime = tomorrow.getTime();
                const dayAfterTomorrowTime = dayAfterTomorrow.getTime();
                const oneWeekLaterTime = oneWeekLater.getTime();
                
                if (eventTime === todayTime) {
                    groups.today.push(event);
                } else if (eventTime === yesterdayTime) {
                    groups.yesterday.push(event);
                } else if (eventTime === tomorrowTime) {
                    groups.tomorrow.push(event);
                } else if (eventTime === dayAfterTomorrowTime) {
                    groups.dayAfterTomorrow.push(event);
                } else if (eventTime > dayAfterTomorrowTime && eventTime <= oneWeekLaterTime) {
                    groups.nearFuture.push(event);
                } else if (eventTime > oneWeekLaterTime) {
                    groups.farFuture.push(event);
                } else if (eventTime < yesterdayTime) {
                    groups.past.push(event);
                }
            });
            
            // 排序各组 - 将已完成的事件放在最后
            Object.keys(groups).forEach(key => {
                groups[key].sort((a, b) => {
                    // 已完成的事件排在后面
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
                    const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
                    return aTime - bTime;
                });
            });
            
            // 使用文档片段优化DOM操作
            const fragment = document.createDocumentFragment();
            
            // 检查是否处于筛选状态
            const isFiltered = this.isAnyFilterActive();
            
            // 渲染今天的事件 - 分别处理未完成和已完成的事件
            if (groups.today.length > 0) {
                // 分离今天的未完成和已完成事件
                const todayIncomplete = groups.today.filter(event => !event.completed);
                const todayCompleted = groups.today.filter(event => event.completed);
                
                // 先渲染未完成的事件
                todayIncomplete.forEach(event => {
                    const taskItem = this.createTaskItem(event);
                    if (isFiltered) taskItem.classList.add('search-match');
                    fragment.appendChild(taskItem);
                });
                
                // 如果有已完成的事件，添加分隔线和已完成事件
                if (todayCompleted.length > 0) {
                    // 创建已完成事件的分隔线
                    const completedSeparator = document.createElement('div');
                    completedSeparator.className = 'completed-separator';
                    completedSeparator.innerHTML = `
                        <div class="separator-line"></div>
                        <span class="separator-text">已完成 (${todayCompleted.length})</span>
                        <div class="separator-line"></div>
                    `;
                    fragment.appendChild(completedSeparator);
                    
                    // 渲染已完成的事件，添加动画效果
                    todayCompleted.forEach((event, index) => {
                        const taskItem = this.createTaskItem(event);
                        taskItem.classList.add('completed-task');
                        taskItem.style.animationDelay = `${index * 0.1}s`; // 错开动画时间
                        if (isFiltered) taskItem.classList.add('search-match');
                        fragment.appendChild(taskItem);
                    });
                }
            } else if (!isThisWeekFilter) {
                // 当今天没有事件时显示"今天暂无安排"
                const emptyToday = document.createElement('div');
                emptyToday.className = 'empty-task-message';
                emptyToday.innerHTML = `
                    <div class="empty-icon">📅</div>
                    <h3>今天暂无安排</h3>
                    <p>今天还没有安排任何事件</p>
                `;
                fragment.appendChild(emptyToday);
            }
            
            // 渲染明天事件
            if (groups.tomorrow.length > 0) {
                fragment.appendChild(this.createDateSeparator('明天'));
                groups.tomorrow.forEach(event => {
                    const taskItem = this.createTaskItem(event);
                    if (isFiltered) taskItem.classList.add('search-match');
                    fragment.appendChild(taskItem);
                });
            }
            
            // 渲染后天事件
            if (groups.dayAfterTomorrow.length > 0) {
                fragment.appendChild(this.createDateSeparator('后天'));
                groups.dayAfterTomorrow.forEach(event => {
                    const taskItem = this.createTaskItem(event);
                    if (isFiltered) taskItem.classList.add('search-match');
                    fragment.appendChild(taskItem);
                });
            }
            
            // 渲染最近要做的事件（3天到1周内）
            if (groups.nearFuture.length > 0) {
                fragment.appendChild(this.createDateSeparator('最近要做的'));
                groups.nearFuture.forEach(event => {
                    const taskItem = this.createTaskItem(event);
                    if (isFiltered) taskItem.classList.add('search-match');
                    fragment.appendChild(taskItem);
                });
            }
            
            // 渲染将来要做的事件（1周后）
            if (groups.farFuture.length > 0) {
                fragment.appendChild(this.createDateSeparator('将来要做的'));
                groups.farFuture.forEach(event => {
                    const taskItem = this.createTaskItem(event);
                    if (isFiltered) taskItem.classList.add('search-match');
                    fragment.appendChild(taskItem);
                });
            }
            
            // 将今天以前的事件（昨天及更早）放到最底下
            // 渲染昨天事件
            if (groups.yesterday.length > 0) {
                fragment.appendChild(this.createDateSeparator('昨天'));
                groups.yesterday.forEach(event => {
                    const taskItem = this.createTaskItem(event);
                    if (isFiltered) taskItem.classList.add('search-match');
                    fragment.appendChild(taskItem);
                });
            }
            
            // 渲染更早事件（可折叠）- 放在最底下
            if (groups.past.length > 0) {
                const pastHeader = this.createDateSeparator('更早');
                const pastContainer = this.createCollapsibleContainer('past', groups.past, isFiltered);
                
                fragment.appendChild(pastHeader);
                fragment.appendChild(pastContainer);
            }
            
            // 一次性添加到DOM
            this.elements.taskList.appendChild(fragment);
        },
        
        /**
         * 创建可折叠容器
         */
        createCollapsibleContainer(type, events, isFiltered = false) {
            const container = document.createElement('div');
            container.className = 'past-events-container collapsed';
            
            const fragment = document.createDocumentFragment();
            events.forEach(event => {
                const taskItem = this.createTaskItem(event);
                taskItem.classList.add('past-task');
                if (isFiltered) taskItem.classList.add('search-match');
                fragment.appendChild(taskItem);
            });
            
            container.appendChild(fragment);
            return container;
        },
        
        /**
         * 检查是否有任何筛选处于激活状态
         */
        isAnyFilterActive() {
            // 检查搜索筛选
            const searchInput = document.getElementById('search-input');
            if (searchInput && searchInput.value.trim()) {
                return true;
            }
            
            // 检查标签筛选
            const tagFilter = document.getElementById('tag-filter');
            if (tagFilter && tagFilter.value && tagFilter.value !== 'all') {
                return true;
            }
            
            // 检查项目筛选
            const projectFilter = document.getElementById('project-filter');
            if (projectFilter && projectFilter.value && projectFilter.value !== 'all') {
                return true;
            }
            
            // 检查日期筛选（除了本周筛选）
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            if (startDateInput && endDateInput && 
                (startDateInput.value || endDateInput.value)) {
                // 如果不是本周筛选，则认为是筛选状态
                return !this.isThisWeekFilterActive();
            }
            
            return false;
        },
        
        /**
         * 创建日期分隔符
         */
        createDateSeparator(title) {
            const separator = document.createElement('div');
            separator.className = 'date-separator';
            separator.textContent = title;
            separator.style.cursor = 'pointer';
            
            // 添加点击事件
            separator.addEventListener('click', () => {
                const nextElement = separator.nextElementSibling;
                if (nextElement && nextElement.classList.contains('past-events-container')) {
                    nextElement.classList.toggle('collapsed');
                }
            });
            
            return separator;
        },
        
        /**
         * 更新批量删除按钮可见性
         */
        updateBatchDeleteButtonVisibility(totalEvents) {
            const batchDeleteBtn = document.getElementById('batch-delete-btn');
            const selectAllBtn = document.getElementById('select-all-btn');
            const deselectAllBtn = document.getElementById('deselect-all-btn');
            
            if (totalEvents === 0) {
                if (batchDeleteBtn) batchDeleteBtn.style.display = 'none';
                if (selectAllBtn) selectAllBtn.style.display = 'none';
                if (deselectAllBtn) deselectAllBtn.style.display = 'none';
            } else {
                if (batchDeleteBtn) batchDeleteBtn.style.display = 'block';
                if (selectAllBtn) selectAllBtn.style.display = 'none';
                if (deselectAllBtn) deselectAllBtn.style.display = 'none';
            }
        },
        
        /**
         * 通知快速导航更新
         */
        notifyQuickNavUpdate() {
            if (window.QuickNavManager && typeof QuickNavManager.triggerDataUpdate === 'function') {
                QuickNavManager.triggerDataUpdate();
            }
        },
        
        /**
         * 高亮正在进行的事件
         */
        highlightOngoingEvents() {
            if (window.highlightOngoingEvents) {
                // 使用requestAnimationFrame优化性能
                requestAnimationFrame(() => {
                    window.highlightOngoingEvents();
                });
            }
        },
        
        /**
         * 优化的任务状态切换
         */
        toggleTaskCompletion(taskId) {
            // 防止重复处理
            if (this._processingTasks && this._processingTasks.has(taskId)) {
                return;
            }
            
            if (!this._processingTasks) {
                this._processingTasks = new Set();
            }
            
            this._processingTasks.add(taskId);
            
            try {
                // 获取任务项
                const taskItems = document.querySelectorAll(`.task-item[data-id="${taskId}"]`);
                if (taskItems.length === 0) {
                    console.error(`未找到任务项: ${taskId}`);
                    return;
                }
                
                // 获取任务对象
                const task = StorageManager.getEventById(taskId);
                if (!task) {
                    console.error(`任务ID ${taskId} 不存在`);
                    return;
                }
                
                // 获取当前状态
                const firstTask = taskItems[0];
                const checkbox = firstTask.querySelector('.task-checkbox');
                const isCompleted = checkbox ? checkbox.classList.contains('checked') : false;
                
                // 立即更新UI（乐观更新）
                taskItems.forEach(item => {
                    if (item.dataset.id === taskId) {
                        const itemCheckbox = item.querySelector('.task-checkbox');
                        if (itemCheckbox) {
                            itemCheckbox.classList.toggle('checked', !isCompleted);
                        }
                    }
                });
                
                // 异步更新数据
                setTimeout(() => {
                    const success = StorageManager.markEventCompleted(taskId, !isCompleted);
                    
                    if (!success) {
                        // 如果更新失败，回滚UI
                        taskItems.forEach(item => {
                            if (item.dataset.id === taskId) {
                                const itemCheckbox = item.querySelector('.task-checkbox');
                                if (itemCheckbox) {
                                    itemCheckbox.classList.toggle('checked', isCompleted);
                                }
                            }
                        });
                        UIManager.showNotification('更新失败，请重试', 'error');
                    } else {
                        UIManager.showNotification(!isCompleted ? '任务已完成' : '任务已取消完成');
                        
                        // 刷新相关视图
                        this.loadProjects();
                        
                        if (window.CalendarManager) {
                            window.CalendarManager.refreshCalendar();
                        }
                        
                        this.updateFocusTaskSelect();
                        
                        // 延迟刷新任务列表
                        setTimeout(() => {
                            this.refreshCurrentView();
                        }, 50);
                    }
                    
                    // 清除处理标记
                    this._processingTasks.delete(taskId);
                }, 0);
                
            } catch (error) {
                console.error('切换任务状态时出错:', error);
                this._processingTasks.delete(taskId);
            }
        },
        
        /**
         * 优化的删除事件
         */
        deleteEvent(eventId) {
            const event = StorageManager.getEvents().find(e => e.id === eventId);
            if (!event) return;

            // 使用性能优化器的删除对话框（如果可用）
            if (window.PerformanceOptimizer) {
                PerformanceOptimizer.handleTaskDelete(eventId);
            } else {
                // 降级到原始删除方法
                this.showDeleteConfirmDialog(event, () => {
                    StorageManager.deleteEvent(eventId);
                    
                    // 检查是否处于筛选状态
                    if (this.isAnyFilterActive()) {
                        // 如果处于筛选状态，重新应用筛选以保持筛选状态
                        this.applyAllFilters();
                    } else {
                        // 如果没有筛选，正常加载任务
                        this.loadTasks();
                    }
                    
                    this.loadProjects();
                    
                    if (window.CalendarManager) {
                        window.CalendarManager.refreshCalendar();
                    }
                    
                    UIManager.closeModal(this.elements.eventDetailsModal);
                    UIManager.showNotification('事件已删除');
                });
            }
        },
        
        /**
         * 检查是否启用了本周筛选
         * @returns {boolean} 是否是本周筛选
         */
        isThisWeekFilterActive() {
            // 检查快捷日期按钮
            const thisWeekBtn = document.querySelector('.quick-date-btn[data-range="this-week"]');
            if (thisWeekBtn && thisWeekBtn.classList.contains('active')) {
                return true;
            }
            
            // 检查日期筛选输入框是否设置为本周范围
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            
            if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
                const startDate = new Date(startDateInput.value);
                const endDate = new Date(endDateInput.value);
                
                // 获取本周的开始和结束日期
                const thisWeekRange = this.getThisWeekRange();
                
                // 检查是否匹配本周范围
                return startDate.getTime() === thisWeekRange.start.getTime() && 
                       endDate.getTime() === thisWeekRange.end.getTime();
            }
            
            return false;
        },
        
        /**
         * 获取本周的日期范围
         * @returns {Object} 包含start和end的日期对象
         */
        getThisWeekRange() {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0是周日，1是周一...
            
            // 计算本周周日（一周的开始）
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);
            
            // 计算本周周六（一周的结束）
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            return {
                start: startOfWeek,
                end: endOfWeek
            };
        },
        
        /**
         * 获取本周日期范围的文字描述
         * @returns {string} 本周日期范围描述
         */
        getThisWeekDateRange() {
            const range = this.getThisWeekRange();
            const startStr = range.start.toLocaleDateString('zh-CN', { 
                month: 'long', 
                day: 'numeric' 
            });
            const endStr = range.end.toLocaleDateString('zh-CN', { 
                month: 'long', 
                day: 'numeric' 
            });
            
            return `${startStr} - ${endStr}`;
        }
    });
}

// 在DOM加载完成后应用补丁
document.addEventListener('DOMContentLoaded', () => {
    console.log('任务管理性能补丁已加载');
});