/**
 * 事件详细窗口管理器
 */
class EventDetailWindow {
    constructor() {
        this.window = null;
        this.currentEvent = null;
        this.isOpen = false;
        this.init();
    }

    /**
     * 初始化详细窗口
     */
    init() {
        this.createWindow();
        this.bindEvents();
        this.applyTheme();
    }

    /**
     * 创建详细窗口DOM结构
     */
    createWindow() {
        // 创建窗口容器
        this.window = document.createElement('div');
        this.window.className = 'event-detail-window';
        this.window.id = 'event-detail-window';
        
        // 创建窗口HTML结构
        this.window.innerHTML = `
            <div class="event-detail-header">
                <div class="event-status"></div>
                <div class="event-color-indicator" id="event-color-indicator"></div>
                <button class="share-event-btn" id="share-event-btn" title="分享日程">
                    <i class="fas fa-share-alt"></i>
                </button>
                <h2 id="detail-event-title">事件详情</h2>
                <div class="header-actions">
                    <button class="close-detail-btn" id="close-detail-window">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="event-detail-content" id="detail-content">
                <div class="loading-spinner" style="display: none;"></div>
                
                <!-- 项目信息 -->
                <div class="detail-section" id="project-section">
                    <div class="detail-section-title">
                        <i class="fas fa-project-diagram"></i>
                        项目
                    </div>
                    <div class="detail-section-content" id="detail-project">
                        <span class="empty">未设置项目</span>
                    </div>
                </div>
                
                <!-- 时间信息 -->
                <div class="detail-section" id="time-section">
                    <div class="detail-section-title">
                        <i class="fas fa-clock"></i>
                        时间
                    </div>
                    <div class="detail-section-content time-display" id="detail-time">
                        <span class="empty">未设置时间</span>
                    </div>
                </div>
                
                <!-- 地点信息 -->
                <div class="detail-section" id="location-section">
                    <div class="detail-section-title">
                        <i class="fas fa-map-marker-alt"></i>
                        地点
                    </div>
                    <div class="detail-section-content" id="detail-location">
                        <span class="empty">未设置地点</span>
                    </div>
                </div>
                
                <!-- 参与人员 -->
                <div class="detail-section" id="participants-section">
                    <div class="detail-section-title">
                        <i class="fas fa-users"></i>
                        参与人员
                    </div>
                    <div class="detail-section-content" id="detail-participants">
                        <span class="empty">未设置参与人员</span>
                    </div>
                </div>
                
                <!-- 标签 -->
                <div class="detail-section" id="tags-section">
                    <div class="detail-section-title">
                        <i class="fas fa-tags"></i>
                        标签
                    </div>
                    <div class="detail-section-content" id="detail-tags">
                        <span class="empty">未设置标签</span>
                    </div>
                </div>
                
                <!-- 备注 -->
                <div class="detail-section" id="notes-section">
                    <div class="detail-section-title">
                        <i class="fas fa-sticky-note"></i>
                        备注
                    </div>
                    <div class="detail-section-content" id="detail-notes">
                        <span class="empty">暂无备注</span>
                    </div>
                </div>
            </div>
            
            <div class="event-detail-actions">
                <button class="action-btn edit-event-btn" id="detail-edit-btn">
                    <i class="fas fa-edit"></i>
                    编辑
                </button>
                <button class="action-btn delete-event-btn" id="detail-delete-btn">
                    <i class="fas fa-trash"></i>
                    删除
                </button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(this.window);
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 关闭按钮
        const closeBtn = this.window.querySelector('#close-detail-window');
        closeBtn.addEventListener('click', () => {
            // 如果正在编辑模式，恢复编辑按钮状态
            if (this.handleCancelEdit) {
                this.handleCancelEdit();
            }
            this.close();
        });

        // 分享按钮
        const shareBtn = this.window.querySelector('#share-event-btn');
        shareBtn.addEventListener('click', () => {
            if (this.currentEvent) {
                this.shareEvent(this.currentEvent);
            }
        });

        // 编辑按钮
        const editBtn = this.window.querySelector('#detail-edit-btn');
        editBtn.addEventListener('click', () => {
            if (this.currentEvent) {
                this.editEvent(this.currentEvent.id);
            }
        });

        // 删除按钮
        const deleteBtn = this.window.querySelector('#detail-delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (this.currentEvent) {
                this.deleteEvent(this.currentEvent.id);
            }
        });

        // 触控适配：下滑关闭
        this.addTouchCloseHandler();

        // 点击窗口外部关闭（仅桌面端）
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.window.contains(e.target) && !this.isTouchDevice()) {
                // 如果正在编辑模式，恢复编辑按钮状态
                if (this.handleCancelEdit) {
                    this.handleCancelEdit();
                }
                this.close();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                // 如果正在编辑模式，恢复编辑按钮状态
                if (this.handleCancelEdit) {
                    this.handleCancelEdit();
                }
                this.close();
            }
        });

        // 监听主题变化
        this.observeThemeChanges();

        // 触控内容区滚动兼容
        this.enableTouchScrollOnContent();

    }

    /**
     * 判断是否为触控设备
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * 添加触控下滑关闭事件
     */
    addTouchCloseHandler() {
        if (!this.isTouchDevice()) return;
        let startY = 0;
        let currentY = 0;
        let dragging = false;
        const threshold = 80; // 下滑距离阈值
        const detailWindow = this.window;
        // 添加顶部滑块提示
        let slider = detailWindow.querySelector('.touch-slider-bar');
        if (!slider) {
            slider = document.createElement('div');
            slider.className = 'touch-slider-bar';
            detailWindow.querySelector('.event-detail-header').prepend(slider);
        }
        // 触摸事件
        detailWindow.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                startY = e.touches[0].clientY;
                dragging = true;
                detailWindow.style.transition = 'none';
            }
        });
        detailWindow.addEventListener('touchmove', (e) => {
            if (!dragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            if (deltaY > 0) {
                detailWindow.style.transform = `translateY(${deltaY}px)`;
            }
        });
        detailWindow.addEventListener('touchend', (e) => {
            if (!dragging) return;
            dragging = false;
            const deltaY = currentY - startY;
            detailWindow.style.transition = '';
            if (deltaY > threshold) {
                detailWindow.style.transform = '';
                this.close();
            } else {
                detailWindow.style.transform = '';
            }
        });
    }

    /**
     * 监听主题变化
     */
    observeThemeChanges() {
        const observer = new MutationObserver(() => {
            this.applyTheme();
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    /**
     * 应用主题样式
     */
    applyTheme() {
        if (document.body.classList.contains('dark-theme')) {
            this.window.classList.add('dark-theme');
        } else {
            this.window.classList.remove('dark-theme');
        }
    }

    /**
     * 显示事件详情
     * @param {Object} event 事件对象
     */
    show(event) {
        if (!event) return;

        this.currentEvent = event;
        this.showLoading(true);
        
        // 延迟显示内容，让加载动画有时间显示
        setTimeout(() => {
            this.updateContent(event);
            this.showLoading(false);
            this.open();
        }, 100);
    }

    /**
     * 更新窗口内容
     * @param {Object} event 事件对象
     */
    updateContent(event) {
        // 更新标题
        const titleElement = this.window.querySelector('#detail-event-title');
        titleElement.textContent = event.name;

        // 更新标记色
        this.updateColorIndicator(event);

        // 更新状态指示器
        this.updateStatusIndicator(event);

        // 更新项目信息
        this.updateProjectInfo(event);

        // 更新时间信息
        this.updateTimeInfo(event);

        // 更新地点信息
        this.updateLocationInfo(event);

        // 更新参与人员
        this.updateParticipantsInfo(event);

        // 更新标签
        this.updateTagsInfo(event);

        // 更新适宜事件推荐
        // this.updateSuitableEvents(event);

        // 更新备注
        this.updateNotesInfo(event);

        // 更新重复信息
        this.updateRepeatInfo(event);
    }

    /**
     * 更新标记色指示器
     */
    updateColorIndicator(event) {
        const colorIndicator = this.window.querySelector('#event-color-indicator');
        if (colorIndicator) {
            const color = event.color || '#4285f4';
            colorIndicator.style.backgroundColor = color;
        }
    }

    /**
     * 更新状态指示器
     */
    updateStatusIndicator(event) {
        const statusElement = this.window.querySelector('.event-status');
        const now = new Date();
        const startTime = event.startTime ? new Date(event.startTime) : null;
        const endTime = event.endTime ? new Date(event.endTime) : null;

        // 重置状态类
        statusElement.className = 'event-status';

        // 如果没有时间信息，不显示状态
        if (!startTime && !endTime) {
            statusElement.style.display = 'none';
            return;
        }

        // 显示状态指示器
        statusElement.style.display = 'block';

        // 获取今天的开始和结束时间
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 判断事件状态
        if (startTime) {
            const eventDate = new Date(startTime);
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate.getTime() === today.getTime()) {
                // 今天的事件 - 绿色
                statusElement.classList.add('today');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else if (eventDate < today) {
                // 过去的事件 - 红色
                statusElement.classList.add('past');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else {
                // 未来事件 - 蓝色
                statusElement.classList.add('future');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            }
        } else if (endTime) {
            // 如果没有开始时间，使用结束时间判断
            const eventDate = new Date(endTime);
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate.getTime() === today.getTime()) {
                // 今天的事件 - 绿色
                statusElement.classList.add('today');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else if (eventDate < today) {
                // 过去的事件 - 红色
                statusElement.classList.add('past');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else {
                // 未来事件 - 蓝色
                statusElement.classList.add('future');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            }
        }
    }

    /**
     * 更新项目信息
     */
    updateProjectInfo(event) {
        const projectElement = this.window.querySelector('#detail-project');
        
        if (event.projectId) {
            const projects = window.StorageManager ? window.StorageManager.getProjects() : [];
            const project = projects.find(p => p.id === event.projectId);
            
            if (project) {
                projectElement.innerHTML = `
                    <div class="project-info-clickable" data-project-id="${project.id}" data-event-id="${event.id}">
                        <i class="fas fa-project-diagram" style="margin-right: 8px; color: ${project.color || '#4285f4'}"></i>
                        <span>${project.name}</span>
                        <i class="fas fa-external-link-alt" style="margin-left: 8px; font-size: 0.8em; color: #666;"></i>
                    </div>
                `;
                projectElement.classList.remove('empty');
                
                // 添加点击事件监听器
                const clickableElement = projectElement.querySelector('.project-info-clickable');
                if (clickableElement) {
                    clickableElement.style.cursor = 'pointer';
                    clickableElement.style.padding = '8px';
                    clickableElement.style.borderRadius = '4px';
                    clickableElement.style.transition = 'background-color 0.2s';
                    
                    // 鼠标悬停效果
                    clickableElement.addEventListener('mouseenter', () => {
                        clickableElement.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
                    });
                    
                    clickableElement.addEventListener('mouseleave', () => {
                        clickableElement.style.backgroundColor = 'transparent';
                    });
                    
                    // 点击事件
                    clickableElement.addEventListener('click', () => {
                        this.navigateToProjectDetail(project, event);
                    });
                }
            } else {
                projectElement.innerHTML = '<span class="empty">项目不存在</span>';
                projectElement.classList.add('empty');
            }
        } else {
            projectElement.innerHTML = '<span class="empty">未设置项目</span>';
            projectElement.classList.add('empty');
        }
    }

    /**
     * 更新时间信息
     */
    updateTimeInfo(event) {
        const timeElement = this.window.querySelector('#detail-time');
        
        if (event.startTime) {
            const startTime = new Date(event.startTime);
            const endTime = event.endTime ? new Date(event.endTime) : null;
            
            const dateOptions = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                weekday: 'long' 
            };
            const timeOptions = { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            };
            
            const dateStr = startTime.toLocaleDateString('zh-CN', dateOptions);
            const timeStr = startTime.toLocaleTimeString('zh-CN', timeOptions);
            
            let timeHTML = `
                <div class="time-main">${dateStr}</div>
                <div class="time-secondary">${timeStr}`;
            
            if (endTime) {
                if (startTime.toDateString() === endTime.toDateString()) {
                    // 同一天
                    timeHTML += ` - ${endTime.toLocaleTimeString('zh-CN', timeOptions)}`;
                } else {
                    // 跨天
                    const endDateStr = endTime.toLocaleDateString('zh-CN', dateOptions);
                    const endTimeStr = endTime.toLocaleTimeString('zh-CN', timeOptions);
                    timeHTML += `</div><div class="time-secondary">至 ${endDateStr} ${endTimeStr}`;
                }
            }
            timeHTML += '</div>';

            // 判断是否进行中
            let now = new Date();
            if (event.startTime && event.endTime) {
                if (startTime <= now && now <= endTime) {
                    timeHTML += '<div class="event-ongoing-tip" style="margin-top:8px;color:#ff9800;font-weight:bold;"><i class="fas fa-bolt"></i> 事件进行中</div>';
                }
            }

            // 添加纪念日信息
            if (window.MemorialDaysManager) {
                const memorialInfo = window.MemorialDaysManager.getMemorialDaysForDate(startTime);
                if (memorialInfo && memorialInfo.length > 0) {
                    timeHTML += window.MemorialDaysManager.getMemorialDaysHTML(memorialInfo);
                }
            }

            timeElement.innerHTML = timeHTML;
            timeElement.classList.remove('empty');
        } else {
            timeElement.innerHTML = '<span class="empty">未设置时间</span>';
            timeElement.classList.add('empty');
        }
    }

    /**
     * 更新地点信息
     */
    updateLocationInfo(event) {
        const locationElement = this.window.querySelector('#detail-location');
        
        if (event.location && event.location.trim()) {
            locationElement.innerHTML = `
                <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: #e74c3c"></i>
                <span>${event.location}</span>
            `;
            locationElement.classList.remove('empty');
        } else {
            locationElement.innerHTML = '<span class="empty">未设置地点</span>';
            locationElement.classList.add('empty');
        }
    }

    /**
     * 更新参与人员信息
     */
    updateParticipantsInfo(event) {
        const participantsElement = this.window.querySelector('#detail-participants');
        
        if (event.participants && event.participants.length > 0) {
            const participants = Array.isArray(event.participants) ? event.participants : [event.participants];
            
            participantsElement.innerHTML = `
                <div class="participants-list">
                    ${participants.map(participant => `
                        <div class="participant-item">
                            <i class="fas fa-user" style="margin-right: 4px;"></i>
                            ${participant}
                        </div>
                    `).join('')}
                </div>
            `;
            participantsElement.classList.remove('empty');
        } else {
            participantsElement.innerHTML = '<span class="empty">未设置参与人员</span>';
            participantsElement.classList.add('empty');
        }
    }

    /**
     * 更新标签信息
     */
    updateTagsInfo(event) {
        const tagsElement = this.window.querySelector('#detail-tags');
        
        if (event.tags && event.tags.length > 0) {
            tagsElement.innerHTML = `
                <div class="detail-tags">
                    ${event.tags.map(tag => `
                        <div class="detail-tag">
                            <i class="fas fa-tag"></i>
                            ${tag}
                        </div>
                    `).join('')}
                </div>
            `;
            tagsElement.classList.remove('empty');
        } else {
            tagsElement.innerHTML = '<span class="empty">未设置标签</span>';
            tagsElement.classList.add('empty');
        }
    }

    /**
     * 更新适宜事件推荐
     */
    // updateSuitableEvents(event) {
    //     const suitableEventsContainer = this.window.querySelector('#detail-suitable-events');
    //     const suitableEventsScroll = this.window.querySelector('#suitable-events-scroll');

    //     if (event.suitableEvents && event.suitableEvents.length > 0) {
    //         suitableEventsScroll.innerHTML = ''; // 清空之前的推荐
    //         event.suitableEvents.forEach(suitableEvent => {
    //             const suitableEventItem = document.createElement('div');
    //             suitableEventItem.className = 'suitable-event-item';
    //             suitableEventItem.innerHTML = `
    //                 <i class="fas fa-calendar-check" style="margin-right: 8px; color: #2ecc71"></i>
    //                 <span>${suitableEvent.name}</span>
    //             `;
    //             suitableEventsScroll.appendChild(suitableEventItem);
    //         });
    //         suitableEventsContainer.classList.remove('empty');
    //     } else {
    //         // 生成示例适宜事件数据
    //         const sampleSuitableEvents = this.generateSampleSuitableEvents(event);
    //         suitableEventsScroll.innerHTML = ''; // 清空之前的推荐
            
    //         sampleSuitableEvents.forEach(suitableEvent => {
    //             const suitableEventItem = document.createElement('div');
    //             suitableEventItem.className = 'suitable-event-item';
    //             suitableEventItem.innerHTML = `
    //                 <i class="fas ${suitableEvent.icon}" style="margin-right: 8px; color: ${suitableEvent.color}"></i>
    //                 <span>${suitableEvent.name}</span>
    //             `;
                
    //             // 添加点击事件
    //             suitableEventItem.addEventListener('click', () => {
    //                 this.handleSuitableEventClick(suitableEvent);
    //             });
                
    //             suitableEventsScroll.appendChild(suitableEventItem);
    //         });
            
    //         suitableEventsContainer.classList.remove('empty');
    //     }
        
    //     // 检查是否需要显示滚动指示器
    //     this.updateScrollIndicator();
    // }

    /**
     * 生成示例适宜事件数据
     */
    // generateSampleSuitableEvents(event) {
    //     const baseEvents = [
    //         { name: '准备会议材料', icon: 'fa-file-alt', color: '#3498db' },
    //         { name: '联系相关人员', icon: 'fa-phone', color: '#e74c3c' },
    //         { name: '检查设备状态', icon: 'fa-laptop', color: '#f39c12' },
    //         { name: '整理工作环境', icon: 'fa-broom', color: '#9b59b6' },
    //         { name: '复习相关文档', icon: 'fa-book', color: '#1abc9c' },
    //         { name: '制定时间计划', icon: 'fa-clock', color: '#34495e' },
    //         { name: '准备演示文稿', icon: 'fa-presentation', color: '#e67e22' },
    //         { name: '收集反馈意见', icon: 'fa-comments', color: '#16a085' },
    //         { name: '更新项目进度', icon: 'fa-chart-line', color: '#8e44ad' },
    //         { name: '安排后续会议', icon: 'fa-calendar-plus', color: '#27ae60' }
    //     ];
        
    //     // 根据事件类型和时间调整推荐
    //     let selectedEvents = [...baseEvents];
        
    //     if (event.startTime) {
    //         const eventTime = new Date(event.startTime);
    //         const hour = eventTime.getHours();
            
    //         // 根据时间调整推荐
    //         if (hour < 9) {
    //             selectedEvents = selectedEvents.filter(e => 
    //                 e.name.includes('准备') || e.name.includes('整理') || e.name.includes('复习')
    //             );
    //         } else if (hour > 18) {
    //             selectedEvents = selectedEvents.filter(e => 
    //                 e.name.includes('总结') || e.name.includes('更新') || e.name.includes('安排')
    //             );
    //         }
    //     }
        
    //     // 随机选择3-6个事件
    //     const count = Math.min(selectedEvents.length, Math.floor(Math.random() * 4) + 3);
    //     const shuffled = selectedEvents.sort(() => 0.5 - Math.random());
    //     return shuffled.slice(0, count);
    // }

    /**
     * 处理适宜事件点击
     */
    // handleSuitableEventClick(suitableEvent) {
    //     // 显示点击反馈
    //     const notification = document.createElement('div');
    //     notification.style.cssText = `
    //         position: fixed;
    //         top: 50%;
    //         left: 50%;
    //         transform: translate(-50%, -50%);
    //         background: rgba(0, 0, 0, 0.8);
    //         color: white;
    //         padding: 12px 20px;
    //         border-radius: 8px;
    //         font-size: 14px;
    //         z-index: 10001;
    //         pointer-events: none;
    //     `;
    //     notification.textContent = `已选择：${suitableEvent.name}`;
    //     document.body.appendChild(notification);
        
    //     // 2秒后移除通知
    //     setTimeout(() => {
    //         if (notification.parentNode) {
    //             notification.parentNode.removeChild(notification);
    //         }
    //     }, 2000);
    // }

    /**
     * 更新滚动指示器
     */
    // updateScrollIndicator() {
    //     const suitableEventsContainer = this.window.querySelector('#detail-suitable-events');
    //     const suitableEventsScroll = this.window.querySelector('#suitable-events-scroll');
        
    //     if (!suitableEventsContainer || !suitableEventsScroll) return;
        
    //     // 检查是否有更多内容需要滚动
    //     const hasMoreContent = suitableEventsScroll.scrollHeight > suitableEventsScroll.clientHeight;
        
    //     if (hasMoreContent) {
    //         suitableEventsContainer.classList.add('has-more-content');
    //     } else {
    //         suitableEventsContainer.classList.remove('has-more-content');
    //     }
    // }

    /**
     * 更新备注信息
     */
    updateNotesInfo(event) {
        const notesElement = this.window.querySelector('#detail-notes');
        
        if (event.notes && event.notes.trim()) {
            notesElement.innerHTML = `
                <div class="notes-content">${event.notes}</div>
                <button class="copy-notes-btn" id="copy-notes-btn" title="复制备注">
                    <i class="fas fa-copy"></i>
                    复制
                </button>
            `;
            notesElement.classList.remove('empty');
            
            // 绑定复制按钮事件
            const copyBtn = notesElement.querySelector('#copy-notes-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.copyNotesToClipboard(event.notes);
                });
            }
        } else {
            notesElement.innerHTML = '<span class="empty">暂无备注</span>';
            notesElement.classList.add('empty');
        }
    }

    /**
     * 复制备注到剪贴板
     */
    async copyNotesToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            
            // 显示复制成功状态
            const copyBtn = this.window.querySelector('#copy-notes-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>已复制';
                copyBtn.classList.add('copied');
                
                // 2秒后恢复原状态
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
            
            // 显示通知
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('备注已复制到剪贴板');
            }
        } catch (err) {
            console.error('复制失败:', err);
            
            // 降级方案：使用传统的复制方法
            this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * 降级复制方案
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            
            // 显示复制成功状态
            const copyBtn = this.window.querySelector('#copy-notes-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>已复制';
                copyBtn.classList.add('copied');
                
                // 2秒后恢复原状态
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
            
            // 显示通知
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('备注已复制到剪贴板');
            }
        } catch (err) {
            console.error('降级复制也失败了:', err);
            alert('复制失败，请手动复制备注内容');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * 更新重复信息
     */
    updateRepeatInfo(event) {
        const timeElement = this.window.querySelector('#detail-time');
        
        // 清除之前的重复信息
        const existingRepeatInfo = timeElement.querySelector('.repeat-info');
        if (existingRepeatInfo) {
            existingRepeatInfo.remove();
        }
        
        // 检查是否为重复事件
        if (event.repeat && event.repeat.type && event.repeat.type !== 'none') {
            const repeatInfo = this.getRepeatInfoText(event.repeat);
            const repeatElement = document.createElement('div');
            repeatElement.className = 'repeat-info';
            repeatElement.innerHTML = `
                <i class="fas fa-redo"></i>
                <span>${repeatInfo}</span>
            `;
            timeElement.appendChild(repeatElement);
        }
    }

    /**
     * 获取重复信息文本
     */
    getRepeatInfoText(repeat) {
        const repeatMap = {
            'daily': '每日重复',
            'weekly': '每周重复',
            'monthly': '每月重复',
            'yearly': '每年重复'
        };
        
        let repeatText = repeatMap[repeat.type] || '重复事件';
        
        // 添加重复次数信息
        if (repeat.count && repeat.count > 0) {
            repeatText += ` (${repeat.count}次)`;
        }
        
        // 添加结束日期信息
        if (repeat.endDate) {
            const endDate = new Date(repeat.endDate);
            const endDateStr = endDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            repeatText += ` - 至${endDateStr}`;
        }
        
        return repeatText;
    }

    /**
     * 显示加载状态
     */
    showLoading(show) {
        const content = this.window.querySelector('#detail-content');
        const spinner = this.window.querySelector('.loading-spinner');
        
        if (show) {
            this.window.classList.add('loading');
            spinner.style.display = 'block';
        } else {
            this.window.classList.remove('loading');
            spinner.style.display = 'none';
        }
    }

    /**
     * 打开窗口
     */
    open() {
        this.window.classList.add('active');
        this.isOpen = true;
        
        // 添加body滚动锁定
        document.body.style.overflow = 'hidden';
        
        // 触发打开事件
        this.window.dispatchEvent(new CustomEvent('detailWindowOpen', {
            detail: { event: this.currentEvent }
        }));
    }

    /**
     * 关闭窗口
     */
    close() {
        this.window.classList.remove('active');
        this.isOpen = false;
        this.currentEvent = null;
        
        // 清理取消处理函数
        if (this.handleCancelEdit) {
            delete this.handleCancelEdit;
        }
        
        // 恢复body滚动
        document.body.style.overflow = '';
        
        // 触发关闭事件
        this.window.dispatchEvent(new CustomEvent('detailWindowClose'));
    }

    /**
     * 编辑事件
     */
    editEvent(eventId) {
        // 直接执行编辑操作，不显示"准备编辑..."提示
        if (window.TaskManager && window.TaskManager.editEvent) {
            window.TaskManager.editEvent(eventId);
        }
        
        // 关闭详情窗口
        this.close();
        
        // 显示友好的提示信息
        if (window.UIManager && window.UIManager.showNotification) {
            const event = window.StorageManager ? window.StorageManager.getEvents().find(e => e.id === eventId) : null;
            if (event) {
                window.UIManager.showNotification(`正在编辑事件"${event.name}"，编辑完成后可选择查看详情`);
            }
        }
    }

    /**
     * 切换到编辑模式
     */
    switchToEditMode(eventId) {
        // 不立即关闭窗口，而是切换到编辑模式
        this.editEvent(eventId);
    }

    /**
     * 删除事件
     */
    deleteEvent(eventId) {
        // 获取事件信息
        const event = window.StorageManager ? window.StorageManager.getEvents().find(e => e.id === eventId) : null;
        if (!event) return;

        // 显示删除确认对话框
        this.showDeleteConfirmDialog(event, () => {
            // 确认删除后的回调
            this.close();
            
            // 延迟执行，确保窗口关闭动画完成
            setTimeout(() => {
                // 直接删除事件，避免调用TaskManager.deleteEvent()导致重复确认对话框
                if (window.StorageManager) {
                    window.StorageManager.deleteEvent(eventId);
                    
                    // 刷新任务列表
                    if (window.TaskManager && window.TaskManager.loadTasks) {
                        window.TaskManager.loadTasks();
                    }
                    
                    // 刷新项目列表
                    if (window.TaskManager && window.TaskManager.loadProjects) {
                        window.TaskManager.loadProjects();
                    }
                    
                    // 刷新日历视图
                    if (window.CalendarManager) {
                        window.CalendarManager.refreshCalendar();
                    }
                    
                    // 显示通知
                    if (window.UIManager) {
                        window.UIManager.showNotification('事件已删除');
                    }
                }
            }, 400);
        });
    }

    /**
     * 显示删除确认对话框
     * @param {Object} event 要删除的事件对象
     * @param {Function} onConfirm 确认删除的回调函数
     */
    showDeleteConfirmDialog(event, onConfirm) {
        // 检查是否已存在对话框，避免重复创建
        const existingOverlay = document.getElementById('detail-delete-confirm-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // 创建对话框HTML，使用不同的ID避免与TaskManager的对话框冲突
        const dialogHTML = `
            <div class="delete-confirm-overlay" id="detail-delete-confirm-overlay">
                <div class="delete-confirm-dialog">
                    <div class="delete-confirm-header">
                        <div class="delete-confirm-icon">
                            <i class="fas fa-trash-alt"></i>
                        </div>
                        <h3 class="delete-confirm-title">确认删除事件</h3>
                    </div>
                    <div class="delete-confirm-content">
                        <p class="delete-confirm-message">您确定要删除以下事件吗？此操作不可撤销。</p>
                        <div class="delete-confirm-event-info">
                            <div class="delete-confirm-event-name">${event.name}</div>
                            <div class="delete-confirm-event-time">${this.formatEventTime(event)}</div>
                        </div>
                    </div>
                    <div class="delete-confirm-actions">
                        <button class="delete-confirm-btn delete-confirm-cancel" id="detail-delete-cancel-btn">
                            取消
                        </button>
                        <button class="delete-confirm-btn delete-confirm-delete" id="detail-delete-confirm-btn">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        
        const overlay = document.getElementById('detail-delete-confirm-overlay');
        const cancelBtn = document.getElementById('detail-delete-cancel-btn');
        const confirmBtn = document.getElementById('detail-delete-confirm-btn');

        // 显示对话框
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);

        // 关闭对话框的函数
        const closeDialog = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        };

        // 绑定事件
        cancelBtn.addEventListener('click', closeDialog);
        
        confirmBtn.addEventListener('click', () => {
            // 显示删除中状态
            confirmBtn.textContent = '删除中...';
            confirmBtn.disabled = true;
            cancelBtn.disabled = true;
            
            // 延迟执行删除，给用户视觉反馈
            setTimeout(() => {
                closeDialog();
                onConfirm();
            }, 500);
        });

        // 点击遮罩层关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });

        // ESC键关闭
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeDialog();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * 格式化事件时间显示
     * @param {Object} event 事件对象
     * @returns {String} 格式化后的时间字符串
     */
    formatEventTime(event) {
        if (!event.startTime && !event.endTime) {
            return '未设置时间';
        }

        const formatDateTime = (dateTime) => {
            const date = new Date(dateTime);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // 判断是今天、明天还是其他日期
            const dateStr = date.toDateString();
            const todayStr = today.toDateString();
            const tomorrowStr = tomorrow.toDateString();
            const yesterdayStr = yesterday.toDateString();

            let dayStr;
            if (dateStr === todayStr) {
                dayStr = '今天';
            } else if (dateStr === tomorrowStr) {
                dayStr = '明天';
            } else if (dateStr === yesterdayStr) {
                dayStr = '昨天';
            } else {
                dayStr = date.toLocaleDateString('zh-CN', {
                    month: 'long',
                    day: 'numeric'
                });
            }

            const timeStr = date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            return `${dayStr} ${timeStr}`;
        };

        if (event.startTime && event.endTime) {
            const startDate = new Date(event.startTime);
            const endDate = new Date(event.endTime);
            
            // 如果是同一天
            if (startDate.toDateString() === endDate.toDateString()) {
                const dayStr = this.getDayString(startDate);
                const startTime = startDate.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                const endTime = endDate.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                return `${dayStr} ${startTime} - ${endTime}`;
            } else {
                // 跨天事件
                return `${formatDateTime(event.startTime)} 至 ${formatDateTime(event.endTime)}`;
            }
        } else if (event.startTime) {
            return `开始时间：${formatDateTime(event.startTime)}`;
        } else if (event.endTime) {
            return `结束时间：${formatDateTime(event.endTime)}`;
        }

        return '未设置时间';
    }

    /**
     * 获取日期的中文描述
     * @param {Date} date 日期对象
     * @returns {String} 日期描述
     */
    getDayString(date) {
        // 修复时区问题 - 使用本地时区进行日期比较
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // 将输入日期转换为本地日期（只保留日期部分）
        const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // 使用毫秒时间戳进行精确比较
        const inputTime = inputDate.getTime();
        const todayTime = today.getTime();
        const tomorrowTime = tomorrow.getTime();
        const yesterdayTime = yesterday.getTime();

        if (inputTime === todayTime) {
            return '今天';
        } else if (inputTime === tomorrowTime) {
            return '明天';
        } else if (inputTime === yesterdayTime) {
            return '昨天';
        } else {
            return date.toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric'
            });
        }
    }

    /**
     * 检查窗口是否打开
     */
    isWindowOpen() {
        return this.isOpen;
    }

    /**
     * 获取当前显示的事件
     */
    getCurrentEvent() {
        return this.currentEvent;
    }

    /**
     * 导航到项目详情
     * @param {Object} project 项目对象
     * @param {Object} event 当前事件对象
     */
    navigateToProjectDetail(project, event) {
        // 显示加载状态
        const clickableElement = this.window.querySelector('.project-info-clickable');
        if (clickableElement) {
            const originalHTML = clickableElement.innerHTML;
            clickableElement.innerHTML = `
                <i class="fas fa-spinner fa-spin" style="margin-right: 8px; color: ${project.color || '#4285f4'}"></i>
                <span>正在跳转到项目详情...</span>
            `;
            
            // 延迟执行跳转，给用户视觉反馈
            setTimeout(() => {
                // 关闭当前事件详情窗口
                this.close();
                
                // 切换到项目视图
                if (window.UIManager && window.UIManager.switchView) {
                    window.UIManager.switchView('projects');
                }
                
                // 延迟显示项目详情，确保视图切换完成
                setTimeout(() => {
                    // 调用TaskManager的showProjectDetails方法
                    if (window.TaskManager && window.TaskManager.showProjectDetails) {
                        window.TaskManager.showProjectDetails(project);
                        
                        // 延迟强调显示事件
                        setTimeout(() => {
                            this.highlightEventInProjectDetail(event.id);
                        }, 500);
                    }
                    
                    // 显示成功提示
                    if (window.UIManager && window.UIManager.showNotification) {
                        window.UIManager.showNotification(`已跳转到项目"${project.name}"详情`);
                    }
                }, 300);
            }, 800);
        }
    }

    /**
     * 在项目详情中强调显示指定事件
     * @param {String} eventId 事件ID
     */
    highlightEventInProjectDetail(eventId) {
        // 查找项目详情模态框中的事件项
        const projectDetailModal = document.querySelector('.project-detail-content');
        if (!projectDetailModal) return;
        
        // 查找对应的事件项
        const eventItem = projectDetailModal.querySelector(`[data-id="${eventId}"]`);
        if (!eventItem) return;
        
        // 添加强调样式
        eventItem.style.transition = 'all 0.3s ease';
        eventItem.style.backgroundColor = '#fff3cd';
        eventItem.style.border = '2px solid #ffc107';
        eventItem.style.borderRadius = '8px';
        eventItem.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
        eventItem.style.transform = 'scale(1.02)';
        
        // 滚动到该事件项
        eventItem.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // 添加闪烁效果
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            if (flashCount >= 6) {
                clearInterval(flashInterval);
                // 保持强调状态3秒后恢复
                setTimeout(() => {
                    eventItem.style.backgroundColor = '';
                    eventItem.style.border = '';
                    eventItem.style.boxShadow = '';
                    eventItem.style.transform = '';
                }, 3000);
                return;
            }
            
            if (flashCount % 2 === 0) {
                eventItem.style.backgroundColor = '#fff3cd';
                eventItem.style.borderColor = '#ffc107';
            } else {
                eventItem.style.backgroundColor = '#fffbf0';
                eventItem.style.borderColor = '#ffdb4d';
            }
            flashCount++;
        }, 200);
        
        // 添加提示文字
        const highlightTip = document.createElement('div');
        highlightTip.className = 'event-highlight-tip';
        highlightTip.innerHTML = `
            <i class="fas fa-arrow-right"></i>
            <span>来自事件详情的跳转</span>
        `;
        highlightTip.style.cssText = `
            position: absolute;
            top: -30px;
            right: 10px;
            background: #ffc107;
            color: #212529;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 4s ease-in-out;
        `;
        
        // 添加CSS动画
        if (!document.querySelector('#highlight-tip-styles')) {
            const style = document.createElement('style');
            style.id = 'highlight-tip-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(-10px); }
                    20% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 设置相对定位以便提示文字定位
        const originalPosition = eventItem.style.position;
        eventItem.style.position = 'relative';
        eventItem.appendChild(highlightTip);
        
        // 4秒后移除提示文字并恢复定位
        setTimeout(() => {
            if (highlightTip.parentNode) {
                highlightTip.parentNode.removeChild(highlightTip);
            }
            eventItem.style.position = originalPosition;
        }, 4000);
    }

    /**
     * 销毁窗口
     */
    destroy() {
        if (this.window && this.window.parentNode) {
            this.window.parentNode.removeChild(this.window);
        }
        this.window = null;
        this.currentEvent = null;
        this.isOpen = false;
    }

    /**
     * 分享事件
     */
    async shareEvent(event) {
        const shareText = this.formatEventForSharing(event);
        if (window.plus && plus.share && plus.share.sendWithSystem) {
            plus.share.sendWithSystem({content: shareText}, function(){}, function(e){
                alert('系统分享失败：'+JSON.stringify(e));
            });
            return;
        } else if (navigator.share) {
            navigator.share({title: event.name, text: shareText});
            return;
        }
        try {
            await navigator.clipboard.writeText(shareText);
            // 显示分享成功状态
            const shareBtn = this.window.querySelector('#share-event-btn');
            if (shareBtn) {
                const originalHTML = shareBtn.innerHTML;
                shareBtn.innerHTML = '<i class="fas fa-check"></i>';
                shareBtn.classList.add('copied');
                setTimeout(() => {
                    shareBtn.innerHTML = originalHTML;
                    shareBtn.classList.remove('copied');
                }, 2000);
            }
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('日程已复制到剪贴板');
            }
        } catch (err) {
            console.error('分享失败:', err);
            this.fallbackShareToClipboard(shareText);
        }
    }

    /**
     * 格式化事件信息用于分享
     */
    formatEventForSharing(event) {
        let shareText = `📅 ${event.name}\n\n`;
        
        // 时间信息
        if (event.startTime) {
            const startTime = new Date(event.startTime);
            const endTime = event.endTime ? new Date(event.endTime) : null;
            
            const dateOptions = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                weekday: 'long' 
            };
            const timeOptions = { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            };
            
            const dateStr = startTime.toLocaleDateString('zh-CN', dateOptions);
            const timeStr = startTime.toLocaleTimeString('zh-CN', timeOptions);
            
            shareText += `🕐 时间：${dateStr} ${timeStr}`;
            
            if (endTime) {
                if (startTime.toDateString() === endTime.toDateString()) {
                    // 同一天
                    shareText += ` - ${endTime.toLocaleTimeString('zh-CN', timeOptions)}`;
                } else {
                    // 跨天
                    const endDateStr = endTime.toLocaleDateString('zh-CN', dateOptions);
                    const endTimeStr = endTime.toLocaleTimeString('zh-CN', timeOptions);
                    shareText += ` 至 ${endDateStr} ${endTimeStr}`;
                }
            }
            // 判断是否进行中
            let now = new Date();
            if (event.startTime && event.endTime) {
                if (startTime <= now && now <= endTime) {
                    shareText += `\n⚡事件进行中`;
                }
            }
            shareText += '\n';
        }
        
        // 项目信息
        if (event.projectId) {
            const projects = window.StorageManager ? window.StorageManager.getProjects() : [];
            const project = projects.find(p => p.id === event.projectId);
            if (project) {
                shareText += `📋 项目：${project.name}\n`;
            }
        }
        
        // 地点信息
        if (event.location && event.location.trim()) {
            shareText += `📍 地点：${event.location}\n`;
        }
        
        // 参与人员
        if (event.participants && event.participants.length > 0) {
            const participants = Array.isArray(event.participants) ? event.participants : [event.participants];
            shareText += `👥 参与人员：${participants.join('、')}\n`;
        }
        
        // 标签
        if (event.tags && event.tags.length > 0) {
            shareText += `🏷️ 标签：${event.tags.join('、')}\n`;
        }

        // 重复信息
        if (event.repeat && event.repeat.type && event.repeat.type !== 'none') {
            const repeatMap = {
                'daily': '每日重复',
                'weekly': '每周重复',
                'monthly': '每月重复',
                'yearly': '每年重复'
            };
            
            let repeatText = repeatMap[event.repeat.type] || '重复事件';
            
            // 添加重复次数信息
            if (event.repeat.count && event.repeat.count > 0) {
                repeatText += ` (${event.repeat.count}次)`;
            }
            
            // 添加结束日期信息
            if (event.repeat.endDate) {
                const endDate = new Date(event.repeat.endDate);
                const endDateStr = endDate.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                repeatText += ` - 至${endDateStr}`;
            }
            
            shareText += `🔄 重复：${repeatText}\n`;
        }
        
        // 状态
        const now = new Date();
        const startTime = event.startTime ? new Date(event.startTime) : null;
        const endTime = event.endTime ? new Date(event.endTime) : null;
        
        if (event.completed) {
            shareText += `\n✅ 已完成`;
        } else {
            // 获取今天的开始时间
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let eventDate = null;
            if (startTime) {
                eventDate = new Date(startTime);
                eventDate.setHours(0, 0, 0, 0);
            } else if (endTime) {
                eventDate = new Date(endTime);
                eventDate.setHours(0, 0, 0, 0);
            }
            
            if (eventDate) {
                if (eventDate.getTime() === today.getTime()) {
                    shareText += `\n🟢 今天`;
                } else if (eventDate < today) {
                    shareText += `\n🔴 已过期`;
                } else {
                    shareText += `\n🔵 未来`;
                }
            } else {
                shareText += `\n⏳ 进行中`;
            }
        }
        
        // 备注
        if (event.notes && event.notes.trim()) {
            shareText += `\n📝 备注：\n${event.notes}\n`;
        }
        
        return shareText;
    }

    /**
     * 降级分享方案
     */
    fallbackShareToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            
            // 显示分享成功状态
            const shareBtn = this.window.querySelector('#share-event-btn');
            if (shareBtn) {
                const originalHTML = shareBtn.innerHTML;
                shareBtn.innerHTML = '<i class="fas fa-check"></i>';
                shareBtn.classList.add('copied');
                
                // 2秒后恢复原状态
                setTimeout(() => {
                    shareBtn.innerHTML = originalHTML;
                    shareBtn.classList.remove('copied');
                }, 2000);
            }
            
            // 显示通知
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('日程已复制到剪贴板');
            }
        } catch (err) {
            console.error('降级分享也失败了:', err);
            alert('分享失败，请手动复制日程内容');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // 新增方法
    enableTouchScrollOnContent() {
        const content = this.window.querySelector('.event-detail-content');
        if (!content) return;

        let startY = 0;
        let canScroll = false;

        content.addEventListener('touchstart', function(e) {
            if (content.scrollHeight > content.clientHeight) {
                canScroll = true;
                startY = e.touches[0].clientY;
            } else {
                canScroll = false;
            }
        }, { passive: false });

        content.addEventListener('touchmove', function(e) {
            if (!canScroll) return;
            const y = e.touches[0].clientY;
            const up = y > startY;
            const down = y < startY;
            const atTop = content.scrollTop === 0;
            const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1;

            if ((atTop && up) || (atBottom && down)) {
                // 阻止"橡皮筋"或穿透
                e.preventDefault();
            }
            // 阻止冒泡到body
            e.stopPropagation();
        }, { passive: false });
    }
}

// 创建全局实例
window.EventDetailWindow = new EventDetailWindow();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventDetailWindow;
}