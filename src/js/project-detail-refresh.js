/**
 * 项目详情刷新管理器
 * 处理项目详情窗口中事件完成、取消或删除时的自动刷新逻辑
 */

const ProjectDetailRefreshManager = {
    /**
     * 初始化项目详情刷新管理器
     */
    init() {
        console.log('初始化项目详情刷新管理器');
        this.bindEventListeners();
    },

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 监听存储管理器中的事件状态变化
        this.observeStorageEvents();
        
        // 监听任务管理器中的事件
        this.observeTaskManagerEvents();
        
        // 监听事件详情窗口的关闭事件
        this.observeEventDetailWindow();
    },

    /**
     * 监听存储管理器中的事件变化
     */
    observeStorageEvents() {
        // 使用 MutationObserver 监听 localStorage 变化
        // 由于 localStorage 不支持直接监听，我们通过拦截 StorageManager 方法来实现
        
        // 保存原始方法引用
        const originalMarkEventCompleted = StorageManager.markEventCompleted;
        const originalDeleteEvent = StorageManager.deleteEvent;
        
        // 重写 markEventCompleted 方法
        StorageManager.markEventCompleted = (eventId, completed) => {
            // 调用原始方法
            const result = originalMarkEventCompleted.call(StorageManager, eventId, completed);
            
            // 如果操作成功，触发刷新
            if (result) {
                this.handleEventStatusChange(eventId, 'completed', completed);
            }
            
            return result;
        };
        
        // 重写 deleteEvent 方法
        StorageManager.deleteEvent = (eventId) => {
            // 获取事件信息用于后续处理
            const event = StorageManager.getEventById(eventId);
            
            // 调用原始方法
            const result = originalDeleteEvent.call(StorageManager, eventId);
            
            // 如果操作成功，触发刷新
            if (result && event) {
                this.handleEventStatusChange(eventId, 'deleted', null, event);
            }
            
            return result;
        };
    },

    /**
     * 监听任务管理器中的事件
     */
    observeTaskManagerEvents() {
        // 如果任务管理器存在，监听其方法
        if (window.TaskManager) {
            // 保存原始方法引用
            const originalToggleTaskCompletion = TaskManager.toggleTaskCompletion;
            const originalDeleteEvent = TaskManager.deleteEvent;
            
            // 重写 toggleTaskCompletion 方法
            if (TaskManager.toggleTaskCompletion) {
                TaskManager.toggleTaskCompletion = (taskId) => {
                    // 获取事件的当前状态
                    const event = StorageManager.getEventById(taskId);
                    const wasCompleted = event ? event.completed : false;
                    
                    // 调用原始方法
                    originalToggleTaskCompletion.call(TaskManager, taskId);
                    
                    // 获取更新后的状态
                    const updatedEvent = StorageManager.getEventById(taskId);
                    const isCompleted = updatedEvent ? updatedEvent.completed : !wasCompleted;
                    
                    // 触发刷新
                    this.handleEventStatusChange(taskId, 'completed', isCompleted);
                };
            }
            
            // 重写 deleteEvent 方法
            if (TaskManager.deleteEvent) {
                TaskManager.deleteEvent = (eventId) => {
                    // 获取事件信息用于后续处理
                    const event = StorageManager.getEventById(eventId);
                    
                    // 调用原始方法
                    originalDeleteEvent.call(TaskManager, eventId);
                    
                    // 触发刷新
                    if (event) {
                        this.handleEventStatusChange(eventId, 'deleted', null, event);
                    }
                };
            }
        }
    },

    /**
     * 监听事件详情窗口
     */
    observeEventDetailWindow() {
        // 监听事件详情窗口的关闭事件
        if (window.EventDetailWindow) {
            const originalClose = EventDetailWindow.close;
            EventDetailWindow.close = () => {
                // 调用原始关闭方法
                originalClose.call(EventDetailWindow);
                
                // 检查是否需要刷新项目详情
                this.checkAndRefreshProjectDetail();
            };
        }
    },

    /**
     * 处理事件状态变化
     * @param {String} eventId 事件ID
     * @param {String} changeType 变化类型 ('completed', 'deleted')
     * @param {Boolean} completed 是否完成（仅在changeType为'completed'时有效）
     * @param {Object} event 事件对象（仅在changeType为'deleted'时有效）
     */
    handleEventStatusChange(eventId, changeType, completed, event) {
        console.log(`事件状态变化: ${eventId}, 类型: ${changeType}, 完成状态: ${completed}`);
        
        // 延迟执行刷新，确保数据已更新
        setTimeout(() => {
            // 检查当前是否有打开的项目详情窗口
            this.checkAndRefreshProjectDetail();
            
            // 触发自定义事件，允许其他组件响应
            window.dispatchEvent(new CustomEvent('projectDetailRefresh', {
                detail: {
                    eventId,
                    changeType,
                    completed,
                    event
                }
            }));
        }, 100);
    },

    /**
     * 检查并刷新项目详情
     */
    checkAndRefreshProjectDetail() {
        // 查找所有打开的项目详情模态框
        const projectDetailModals = document.querySelectorAll('.project-detail-content');
        
        projectDetailModals.forEach(modal => {
            // 获取项目ID
            const modalId = modal.closest('.modal')?.id;
            if (modalId && modalId.startsWith('project-detail-modal-')) {
                const projectId = modalId.replace('project-detail-modal-', '');
                
                // 获取对应的项目信息
                const project = StorageManager.getProjects().find(p => p.id === projectId);
                if (project) {
                    // 刷新项目详情内容
                    this.refreshProjectDetail(project, modal);
                }
            }
        });
    },

    /**
     * 刷新项目详情内容
     * @param {Object} project 项目对象
     * @param {HTMLElement} modalContent 模态框内容容器
     */
    refreshProjectDetail(project, modalContent) {
        console.log(`刷新项目详情: ${project.name}`);
        
        // 获取最新的项目信息
        const updatedProject = StorageManager.getProjects().find(p => p.id === project.id);
        if (!updatedProject) {
            console.warn('项目不存在或已被删除');
            return;
        }
        
        // 获取内容容器
        const detailsContainer = modalContent.querySelector('.project-details-container');
        if (!detailsContainer) {
            console.warn('未找到项目详情容器');
            return;
        }
        
        // 调用任务管理器的刷新方法（如果存在）
        if (window.TaskManager && TaskManager.refreshProjectDetails) {
            TaskManager.refreshProjectDetails(updatedProject, modalContent);
        } else {
            // 降级处理：重新加载内容
            this.reloadProjectDetailContent(updatedProject, detailsContainer);
        }
        
        // 显示刷新成功提示
        this.showRefreshNotification();
    },

    /**
     * 重新加载项目详情内容
     * @param {Object} project 项目对象
     * @param {HTMLElement} container 内容容器
     */
    reloadProjectDetailContent(project, container) {
        // 调用任务管理器的加载内容方法（如果存在）
        if (window.TaskManager && TaskManager.loadProjectDetailsContent) {
            TaskManager.loadProjectDetailsContent(project, container);
        } else {
            console.warn('无法重新加载项目详情内容：缺少TaskManager方法');
        }
    },

    /**
     * 显示刷新成功提示
     */
    showRefreshNotification() {
        // 如果UI管理器存在，使用其通知功能
        if (window.UIManager && UIManager.showNotification) {
            UIManager.showNotification('项目详情已自动刷新', 1500);
        } else {
            // 降级处理：使用简单的console.log
            console.log('项目详情已自动刷新');
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 确保必要的依赖已加载
    if (window.StorageManager) {
        ProjectDetailRefreshManager.init();
    } else {
        // 如果依赖未加载，等待它们加载完成
        const checkDependencies = () => {
            if (window.StorageManager) {
                ProjectDetailRefreshManager.init();
            } else {
                setTimeout(checkDependencies, 100);
            }
        };
        checkDependencies();
    }
});

// 导出管理器
window.ProjectDetailRefreshManager = ProjectDetailRefreshManager;