/**
 * 清单管理器
 * 负责创建、编辑、删除和管理待办清单
 */
const TodoListManager = {
    currentListId: null,
    batchMode: false, // 批量选择模式

    /**
     * 按名称去重，仅保留第一个同名清单
     * @param {Array} lists 原始清单数组
     * @returns {Array} 去重后的清单数组
     */
    getUniqueListsByName(lists) {
        const seen = new Set();
        const unique = [];
        (lists || []).forEach(list => {
            const key = (list && list.name ? String(list.name) : '').trim().toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(list);
            }
        });
        return unique;
    },

    /**
     * 初始化清单管理器
     */
    init() {
        console.log('初始化清单管理器');
        
        // 获取DOM元素
        this.listsContainer = document.querySelector('.lists-container');
        this.listsNav = document.getElementById('lists-nav');
        this.listItemsContainer = document.getElementById('list-items-container');
        this.currentListTitle = document.getElementById('current-list-title');
        this.addListBtn = document.getElementById('add-list-btn');
        this.deleteListBtn = document.getElementById('delete-list-btn');
        this.addListItemBtn = document.getElementById('add-list-item-btn');
        this.editListBtn = document.getElementById('edit-list-btn');
        this.listSearch = document.getElementById('list-search');
        this.clearListSearchBtn = document.getElementById('clear-list-search-btn');
        this.importListsInput = document.getElementById('import-lists-input');
        this.importListsTextBtn = document.getElementById('import-lists-text-btn');
        this.editListsTextBtn = document.getElementById('edit-lists-text-btn');
        this.todolistImportModal = document.getElementById('todolist-import-modal');
        this.todolistEditModal = document.getElementById('todolist-edit-modal');
        this.closeImportModal = document.getElementById('close-todolist-import-modal');
        this.closeEditModal = document.getElementById('close-todolist-edit-modal');
        this.todolistImportText = document.getElementById('todolist-import-text');
        this.todolistEditText = document.getElementById('todolist-edit-text');
        this.confirmImport = document.getElementById('confirm-todolist-import');
        this.confirmEdit = document.getElementById('confirm-todolist-edit');
        this.cancelImport = document.getElementById('cancel-todolist-import');
        this.cancelEdit = document.getElementById('cancel-todolist-edit');

        // 移动端覆盖层容器（不存在则创建）
        this.mobileOverlay = document.getElementById('todolist-mobile-overlay');
        if (!this.mobileOverlay) {
            const overlay = document.createElement('div');
            overlay.id = 'todolist-mobile-overlay';
            overlay.className = 'todolist-mobile-overlay';
            overlay.innerHTML = `
                <div class="todolist-mobile-header">
                    <button class="todolist-mobile-back" id="todolist-mobile-back"><i class="fas fa-arrow-left"></i></button>
                    <div class="todolist-mobile-title" id="todolist-mobile-title"></div>
                    <div class="todolist-mobile-actions">
                        <button id="todolist-mobile-fav" class="list-action-btn" title="收藏/取消收藏"><i class="fas fa-star"></i></button>
                        <button id="todolist-mobile-share" class="list-action-btn" title="分享"><i class="fas fa-share-alt"></i></button>
                        <button id="todolist-mobile-add" class="list-action-btn"><i class="fas fa-plus"></i> 添加</button>
                    </div>
                </div>
                <div class="todolist-mobile-content" id="todolist-mobile-content"></div>`;
            document.body.appendChild(overlay);
            this.mobileOverlay = overlay;
        }
        
        // 移动端导入页面容器（不存在则创建）
        this.mobileImportPage = document.getElementById('todolist-mobile-import-page');
        if (!this.mobileImportPage) {
            const importPage = document.createElement('div');
            importPage.id = 'todolist-mobile-import-page';
            importPage.className = 'todolist-mobile-import-page';
            importPage.innerHTML = `
                <div class="todolist-mobile-import-header">
                    <button class="todolist-mobile-import-back" id="todolist-mobile-import-back">
                        <i class="fas fa-arrow-left"></i> 返回
                    </button>
                    <div class="todolist-mobile-import-title">导入清单</div>
                    <div style="width: 60px;"></div> <!-- 占位元素，保持标题居中 -->
                </div>
                <div class="todolist-mobile-import-content">
                    <div class="todolist-mobile-import-format-hint">
                        <div class="todolist-mobile-import-format-header">
                            <h4 class="todolist-mobile-import-format-title">导入格式说明：</h4>
                            <button id="todolist-mobile-import-copy-btn" class="todolist-mobile-import-copy-btn">
                                <i class="fas fa-copy"></i> 复制案例
                            </button>
                        </div>
                        <div id="todolist-mobile-import-format-example" class="todolist-mobile-import-format-example">购物清单 | 买牛奶 | 2024-03-20 | 高 | 日常,生活
购物清单 | 买面包 | 2024-03-20 | 中 | 日常,生活
工作清单 | 完成报告 | 2024-03-25 | 高 | 工作,紧急
工作清单 | 预约会议 | 2024-03-22 | 中 | 工作,会议</div>
                    </div>
                    <div class="todolist-mobile-import-form-group">
                        <label for="todolist-mobile-import-text" class="todolist-mobile-import-form-label">请输入清单内容：</label>
                        <textarea id="todolist-mobile-import-text" class="todolist-mobile-import-textarea" placeholder="请按照上述格式输入清单内容，每行一个事项"></textarea>
                    </div>
                </div>
                <div class="todolist-mobile-import-actions">
                    <button id="todolist-mobile-import-confirm-btn" class="todolist-mobile-import-confirm-btn">导入</button>
                    <button id="todolist-mobile-import-cancel-btn" class="todolist-mobile-import-cancel-btn">取消</button>
                </div>`;
            document.body.appendChild(importPage);
            this.mobileImportPage = importPage;
        }
        
        // 移动端编辑页面容器（不存在则创建）
        this.mobileEditPage = document.getElementById('todolist-mobile-edit-page');
        if (!this.mobileEditPage) {
            const editPage = document.createElement('div');
            editPage.id = 'todolist-mobile-edit-page';
            editPage.className = 'todolist-mobile-edit-page';
            editPage.innerHTML = `
                <div class="todolist-mobile-edit-header">
                    <button class="todolist-mobile-edit-back" id="todolist-mobile-edit-back">
                        <i class="fas fa-arrow-left"></i> 返回
                    </button>
                    <div class="todolist-mobile-edit-title">编辑清单</div>
                    <div style="width: 60px;"></div> <!-- 占位元素，保持标题居中 -->
                </div>
                <div class="todolist-mobile-edit-content">
                    <div class="todolist-mobile-edit-format-hint">
                        <div class="todolist-mobile-edit-format-header">
                            <h4 class="todolist-mobile-edit-format-title">编辑格式说明：</h4>
                            <button id="todolist-mobile-edit-copy-btn" class="todolist-mobile-edit-copy-btn">
                                <i class="fas fa-copy"></i> 复制案例
                            </button>
                        </div>
                        <div id="todolist-mobile-edit-format-example" class="todolist-mobile-edit-format-example">购物清单 | 买牛奶 | 2024-03-20 | 高 | 日常,生活
购物清单 | 买面包 | 2024-03-20 | 中 | 日常,生活
工作清单 | 完成报告 | 2024-03-25 | 高 | 工作,紧急
工作清单 | 预约会议 | 2024-03-22 | 中 | 工作,会议</div>
                    </div>
                    <div class="todolist-mobile-edit-form-group">
                        <label for="todolist-mobile-edit-text" class="todolist-mobile-edit-form-label">编辑清单内容：</label>
                        <textarea id="todolist-mobile-edit-text" class="todolist-mobile-edit-textarea" placeholder="请按照上述格式编辑清单内容，每行一个事项"></textarea>
                    </div>
                </div>
                <div class="todolist-mobile-edit-actions">
                    <button id="todolist-mobile-edit-confirm-btn" class="todolist-mobile-edit-confirm-btn">保存</button>
                    <button id="todolist-mobile-edit-cancel-btn" class="todolist-mobile-edit-cancel-btn">取消</button>
                </div>`;
            document.body.appendChild(editPage);
            this.mobileEditPage = editPage;
        }
        
        // 批量操作相关元素
        this.toggleBatchModeBtn = document.getElementById('toggle-batch-mode-btn');
        this.batchDeleteBtn = document.getElementById('batch-delete-btn');
        
        // 绑定事件
        this.bindEvents();
        
        // 加载清单
        this.loadLists();
    },

    /**
     * 分享当前选中的清单（与桌面端分享逻辑一致）
     */
    shareCurrentList() {
        const data = StorageManager.getData();
        const currentTitle = document.getElementById('current-list-title').textContent.trim();
        const list = data.lists && data.lists.find(l => l.name === currentTitle);
        if (!list) {
            alert('未找到当前清单');
            return;
        }
        let shareText = `🗒️【清单】${list.name}\n`;
        shareText += `-----------------------------\n`;
        if (list.items && list.items.length > 0) {
            list.items.forEach((item, idx) => {
                const status = item.completed ? '✅ 已完成' : '⏳ 未完成';
                let line = ` ${item.completed ? '✔️' : '⬜'} ${idx + 1}. ${item.title}`;
                if (item.dueDate) {
                    const date = new Date(item.dueDate);
                    line += `（截止：${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                    line += ')';
                }
                line += `  ${status}`;
                shareText += line + '\n';
                // 在每个事项后添加空行，使内容更清晰
                shareText += '\n';
            });
        } else {
            shareText += '（暂无事项）\n';
        }
        shareText += `-----------------------------\n`;
        shareText += `🎉 来自有数规划`;

        // 直接调用系统分享功能，不再显示选择窗口
        if (window.plus && plus.share && plus.share.sendWithSystem) {
            // HBuilderX环境
            plus.share.sendWithSystem({
                content: shareText
            }, function() {
                // 分享成功
                if (window.UIManager && typeof UIManager.showNotification === 'function') {
                    UIManager.showNotification('清单已分享', 'success');
                }
            }, function(e) {
                console.error('系统分享失败：', e);
                fallbackShare(shareText);
            });
        } else if (navigator.share) {
            // Web Share API
            navigator.share({
                title: list.name,
                text: shareText
            }).catch(() => {
                fallbackShare(shareText);
            });
        } else {
            // 降级到复制
            fallbackShare(shareText);
        }

        // 降级分享方式（复制到剪贴板）
        function fallbackShare(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    if (window.UIManager && typeof UIManager.showNotification === 'function') {
                        UIManager.showNotification('清单信息已复制，可粘贴到微信/QQ等', 'success');
                    } else {
                        alert('清单信息已复制，可粘贴到微信/QQ等');
                    }
                }).catch(() => {
                    legacyCopy(text);
                });
            } else {
                legacyCopy(text);
            }
        }

        // 兼容旧浏览器的复制方法
        function legacyCopy(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                if (window.UIManager && typeof UIManager.showNotification === 'function') {
                    UIManager.showNotification('清单信息已复制，可粘贴到微信/QQ等', 'success');
                } else {
                    alert('清单信息已复制，可粘贴到微信/QQ等');
                }
            } catch (err) {
                console.error('复制失败:', err);
                if (window.UIManager && typeof UIManager.showNotification === 'function') {
                    UIManager.showNotification('复制失败，请手动复制', 'error');
                } else {
                    alert('复制失败，请手动复制');
                }
            }
            document.body.removeChild(textarea);
        }
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 创建新清单
        this.addListBtn.addEventListener('click', () => this.createNewList());
        
        // 删除当前清单
        this.deleteListBtn.addEventListener('click', () => this.deleteCurrentList());
        
        // 添加清单项
        this.addListItemBtn.addEventListener('click', () => this.addListItem());
        
        // 编辑清单
        this.editListBtn.addEventListener('click', () => this.editCurrentList());
        
        // 导入清单文件
        this.importListsInput.addEventListener('change', (e) => this.importLists(e.target.files[0]));
        
        // 导入清单文本
        this.importListsTextBtn.addEventListener('click', () => {
            // 在移动端显示导入页面，在桌面端显示模态框
            if (window.innerWidth <= 768) {
                this.showMobileImportPage();
            } else {
                this.showImportModal();
            }
        });
        
        // 关闭导入模态框
        this.closeImportModal.addEventListener('click', () => this.hideImportModal());
        this.cancelImport.addEventListener('click', () => this.hideImportModal());
        
        // 确认导入
        this.confirmImport.addEventListener('click', () => this.importFromText());
        
        // 搜索清单
        this.listSearch.addEventListener('input', (e) => {
            const query = e.target.value;
            // 显示或隐藏清除按钮
            if (query) {
                this.clearListSearchBtn.style.display = 'flex';
            } else {
                this.clearListSearchBtn.style.display = 'none';
                this.loadLists(); // 清空搜索时显示所有清单
            }
            this.searchLists(query);
        });
        
        // 清除搜索按钮
        if (this.clearListSearchBtn) {
            this.clearListSearchBtn.addEventListener('click', () => {
                this.listSearch.value = '';
                this.clearListSearchBtn.style.display = 'none';
                this.loadLists(); // 重新加载所有清单
            });
        }

        // 批量操作相关
        if (this.toggleBatchModeBtn) {
            this.toggleBatchModeBtn.addEventListener('click', () => this.toggleBatchMode());
        }
        
        if (this.batchDeleteBtn) {
            this.batchDeleteBtn.addEventListener('click', () => this.batchDeleteItems());
        }

        // 文本编辑按钮
        this.editListsTextBtn.addEventListener('click', () => {
            // 在移动端显示编辑页面，在桌面端显示模态框
            if (window.innerWidth <= 768) {
                this.showMobileEditPage();
            } else {
                this.showEditModal();
            }
        });
        
        // 关闭编辑模态框
        this.closeEditModal.addEventListener('click', () => this.hideEditModal());
        this.cancelEdit.addEventListener('click', () => this.hideEditModal());
        
        // 确认编辑
        this.confirmEdit.addEventListener('click', () => this.saveEditChanges());
    },

    /**
     * 切换批量选择模式
     */
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        
        // 更新按钮状态
        this.toggleBatchModeBtn.classList.toggle('active', this.batchMode);
        this.toggleBatchModeBtn.innerHTML = this.batchMode ? 
            '<i class="fas fa-times"></i> 取消选择' : 
            '<i class="fas fa-check-square"></i> 批量选择';
        
        // 显示/隐藏批量删除按钮
        if (this.batchDeleteBtn) {
            this.batchDeleteBtn.style.display = this.batchMode ? 'flex' : 'none';
        }
        
        // 更新任务项目显示
        this.loadListItems(this.getCurrentList());
    },

    /**
     * 获取当前清单
     * @returns {Object|null} 当前清单对象或null
     */
    getCurrentList() {
        if (!this.currentListId) return null;
        
        const data = StorageManager.getData();
        return data.lists.find(l => l.id === this.currentListId);
    },

    /**
     * 批量删除选中的项目
     */
    batchDeleteItems() {
        if (!this.currentListId || !this.batchMode) return;
        
        // 防止重复调用
        if (this._isBatchDeleting) {
            return;
        }
        
        this._isBatchDeleting = true;
        
        const checkboxes = document.querySelectorAll('.batch-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('请至少选择一个项目');
            this._isBatchDeleting = false;
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${checkboxes.length} 个项目吗？此操作不可恢复。`)) {
            this._isBatchDeleting = false;
            return;
        }
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        
        if (!list) {
            this._isBatchDeleting = false;
            return;
        }
        
        // 收集要删除的项目ID
        const itemIds = Array.from(checkboxes).map(cb => cb.dataset.itemId);
        
        // 查找已完成的项目，以便扣除积分
        const completedItems = list.items.filter(item => itemIds.includes(item.id) && item.completed);
        const completedCount = completedItems.length;
        
        // 过滤掉要删除的项目
        list.items = list.items.filter(item => !itemIds.includes(item.id));
        
        StorageManager.saveData(data);
        
        // 如果删除包含已完成项目，扣除积分
        if (completedCount > 0) {
            const pointsDeduction = completedCount * -10;
            StorageManager.addPoints(pointsDeduction, '清单', '删除已完成事项');
            UIManager.showNotification(`删除了${completedCount}个已完成项目 ${pointsDeduction}积分`, 'info');
        }
        
        // 如果删除所有项目后退出批量模式
        if (list.items.length === 0) {
            this.batchMode = false;
            this.toggleBatchModeBtn.classList.remove('active');
            this.toggleBatchModeBtn.innerHTML = '<i class="fas fa-check-square"></i> 批量选择';
            if (this.batchDeleteBtn) {
                this.batchDeleteBtn.style.display = 'none';
            }
        }
        
        // 重新加载
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
        
        // 重置状态
        this._isBatchDeleting = false;
    },

    /**
     * 加载所有清单
     */
    loadLists() {
        const data = StorageManager.getData();
        const lists = this.getUniqueListsByName(data.lists || []);
        
        if (lists.length === 0) {
            // 移动端与桌面端分别展示空状态
            if (this.listsNav) {
                this.listsNav.innerHTML = `
                    <div class="empty-list-message">
                        <div class="empty-icon">📋</div>
                        <p>${window.innerWidth <= 768 ? '暂无清单内容' : '暂无清单，请创建一个吧'}</p>
                    </div>
                `;
            }
            this.showEmptyListMessage();
            return;
        }
        
        // 清空现有列表
        this.listsNav.innerHTML = '';
        
        // 排序：收藏的清单在前，未收藏的在后
        const sortedLists = lists.sort((a, b) => {
            const aFavorited = a.favorited || false;
            const bFavorited = b.favorited || false;
            
            if (aFavorited && !bFavorited) return -1;
            if (!aFavorited && bFavorited) return 1;
            
            // 如果收藏状态相同，按创建时间排序（新的在前）
            return new Date(b.createTime || 0) - new Date(a.createTime || 0);
        });
        
        // 分离收藏和未收藏的清单（并在分组内部按名称去重）
        const favoritedLists = this.getUniqueListsByName(sortedLists.filter(list => list.favorited));
        const unfavoritedLists = this.getUniqueListsByName(sortedLists.filter(list => !list.favorited));
        
        // 添加收藏的清单
        if (favoritedLists.length > 0) {
            favoritedLists.forEach(list => {
                const listElement = this.createListNavItem(list);
                this.listsNav.appendChild(listElement);
            });
        }
        
        // 添加分隔线（如果有收藏和未收藏的清单）
        if (favoritedLists.length > 0 && unfavoritedLists.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'favorite-separator';
            separator.textContent = '其他清单';
            this.listsNav.appendChild(separator);
        }
        
        // 添加未收藏的清单
        unfavoritedLists.forEach(list => {
            const listElement = this.createListNavItem(list);
            this.listsNav.appendChild(listElement);
        });
        
        // 如果有当前选中的清单，加载它的内容
        if (this.currentListId) {
            const currentList = lists.find(l => l.id === this.currentListId);
            if (currentList) {
                this.loadListItems(currentList);
            }
        }
        
        // 通知快速导航更新计数（计数使用去重后的列表规模）
        if (window.QuickNavManager && typeof QuickNavManager.triggerDataUpdate === 'function') {
            QuickNavManager.triggerDataUpdate();
        }
    },

    /**
     * 创建清单导航项
     * @param {Object} list 清单对象
     */
    createListNavItem(list) {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        if (list.id === this.currentListId) {
            listItem.classList.add('active');
        }
        
        // 为收藏的清单添加特殊样式
        if (list.favorited) {
            listItem.classList.add('favorited');
        }
        
        // 计算未完成项目数量
        const incompleteCount = list.items ? list.items.filter(item => !item.completed).length : 0;
        
        // 收藏状态
        const isFavorited = list.favorited || false;
        
        listItem.innerHTML = `
            <div class="list-item-content">
                <div class="list-item-text">${list.name}</div>
                <span class="list-item-count">${incompleteCount}</span>
            </div>
            <button class="list-favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    data-list-id="${list.id}" 
                    title="${isFavorited ? '取消收藏' : '收藏清单'}">
                <i class="fas fa-star"></i>
            </button>
        `;
        
        // 绑定点击事件
        listItem.addEventListener('click', (e) => {
            // 如果点击的是收藏按钮，不触发选择
            if (e.target.closest('.list-favorite-btn')) {
                return;
            }
            this.selectList(list.id);
        });
        
        // 绑定收藏按钮事件
        const favoriteBtn = listItem.querySelector('.list-favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(list.id);
        });
        
        // 添加移动端滑动功能
        this.addSwipeFunctionality(listItem, list.id);
        
        return listItem;
    },

    /**
     * 为清单项目添加滑动功能
     * @param {HTMLElement} listItem 清单项目元素
     * @param {string} listId 清单ID
     */
    addSwipeFunctionality(listItem, listId) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isSwiping = false;
        let swipeThreshold = 50; // 滑动阈值
        let originalTransform = '';
        
        // 触摸开始
        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = startX;
            isSwiping = false;
            originalTransform = listItem.style.transform;
            
            // 添加滑动状态类
            listItem.classList.add('swipe-ready');
        };
        
        // 触摸移动
        const handleTouchMove = (e) => {
            if (e.touches.length !== 1) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            const deltaY = Math.abs(e.touches[0].clientY - startY);
            
            // 如果垂直滑动距离大于水平滑动距离，不处理
            if (deltaY > Math.abs(deltaX)) {
                return;
            }
            
            // 如果滑动距离超过阈值，标记为滑动状态
            if (Math.abs(deltaX) > 10) {
                isSwiping = true;
                e.preventDefault(); // 阻止默认滚动
            }
            
            if (isSwiping) {
                // 限制滑动距离，最大滑动距离为100px
                const maxSwipe = 100;
                const swipeDistance = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
                
                // 应用滑动效果
                listItem.style.transform = `translateX(${swipeDistance}px)`;
                
                // 根据滑动方向添加视觉反馈
                if (swipeDistance > 0) {
                    listItem.classList.add('swipe-right');
                    listItem.classList.remove('swipe-left');
                } else if (swipeDistance < 0) {
                    listItem.classList.add('swipe-left');
                    listItem.classList.remove('swipe-right');
                } else {
                    listItem.classList.remove('swipe-right', 'swipe-left');
                }
            }
        };
        
        // 触摸结束
        const handleTouchEnd = (e) => {
            if (!isSwiping) {
                listItem.classList.remove('swipe-ready');
                return;
            }
            
            const deltaX = currentX - startX;
            
            // 如果滑动距离超过阈值，执行相应操作
            if (Math.abs(deltaX) > swipeThreshold) {
                if (deltaX > 0) {
                    // 向右滑动 - 收藏/取消收藏
                    this.toggleFavorite(listId);
                } else {
                    // 向左滑动 - 删除清单
                    this.showDeleteConfirmDialog(listId);
                }
            }
            
            // 恢复原始位置
            listItem.style.transform = originalTransform;
            listItem.classList.remove('swipe-ready', 'swipe-right', 'swipe-left');
            
            isSwiping = false;
        };
        
        // 绑定触摸事件
        listItem.addEventListener('touchstart', handleTouchStart, { passive: false });
        listItem.addEventListener('touchmove', handleTouchMove, { passive: false });
        listItem.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // 清理函数
        const cleanup = () => {
            listItem.removeEventListener('touchstart', handleTouchStart);
            listItem.removeEventListener('touchmove', handleTouchMove);
            listItem.removeEventListener('touchend', handleTouchEnd);
        };
        
        // 在元素被移除时清理事件监听器
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === listItem || (node.nodeType === 1 && node.contains(listItem))) {
                        cleanup();
                        observer.disconnect();
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },

    /**
     * 显示删除确认对话框
     * @param {string} listId 清单ID
     */
    showDeleteConfirmDialog(listId) {
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === listId);
        
        if (!list) return;
        
        // 创建确认对话框
        const dialog = document.createElement('div');
        dialog.className = 'swipe-delete-dialog';
        dialog.innerHTML = `
            <div class="swipe-delete-content">
                <div class="swipe-delete-icon">🗑️</div>
                <div class="swipe-delete-text">删除清单"${list.name}"？</div>
                <div class="swipe-delete-actions">
                    <button class="swipe-delete-cancel">取消</button>
                    <button class="swipe-delete-confirm">删除</button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(dialog);
        
        // 绑定事件
        const cancelBtn = dialog.querySelector('.swipe-delete-cancel');
        const confirmBtn = dialog.querySelector('.swipe-delete-confirm');
        
        const closeDialog = () => {
            dialog.remove();
        };
        
        cancelBtn.addEventListener('click', closeDialog);
        confirmBtn.addEventListener('click', () => {
            this.deleteList(listId);
            closeDialog();
        });
        
        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
        
        // 3秒后自动关闭
        setTimeout(closeDialog, 3000);
    },

    /**
     * 删除指定清单
     * @param {string} listId 清单ID
     */
    deleteList(listId) {
        try {
            const data = StorageManager.getData();
            const listIndex = data.lists.findIndex(l => l.id === listId);
            
            if (listIndex === -1) {
                UIManager.showNotification('清单不存在', 'error');
                return;
            }
            
            const list = data.lists[listIndex];
            
            // 如果删除的是当前选中的清单，清除选中状态
            if (this.currentListId === listId) {
                this.currentListId = null;
                this.showEmptyListMessage();
            }
            
            // 从数组中移除清单
            data.lists.splice(listIndex, 1);
            
            // 保存数据
            StorageManager.saveData(data);
            
            // 重新加载清单列表
            this.loadLists();
            
            // 显示成功消息
            UIManager.showNotification(`已删除清单"${list.name}"`, 'success');
            
        } catch (error) {
            console.error('删除清单时出错:', error);
            UIManager.showNotification('删除失败，请重试', 'error');
        }
    },

    /**
     * 选择清单
     * @param {string} listId 清单ID
     */
    selectList(listId) {
        this.currentListId = listId;
        
        // 更新UI状态
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === listId);
        
        if (list) {
            // 更新标题
            this.currentListTitle.textContent = list.name;
            
            // 启用按钮
            this.deleteListBtn.style.display = 'inline-flex';
            this.addListItemBtn.disabled = false;
            this.editListBtn.disabled = false;
            
            // 加载清单项目
            this.loadListItems(list);
            
            // 更新导航项的选中状态
            const listItems = this.listsNav.querySelectorAll('.list-item');
            listItems.forEach(item => {
                item.classList.toggle('active', item.querySelector('.list-item-text').textContent === list.name);
            });

            // 移动端打开全屏窗口
            if (window.innerWidth <= 768 && this.mobileOverlay) {
                this.renderMobileOverlay(list);
                this.mobileOverlay.classList.add('show');

                const backBtn = document.getElementById('todolist-mobile-back');
                if (backBtn && !backBtn._bound) {
                    backBtn.addEventListener('click', () => {
                        this.mobileOverlay.classList.remove('show');
                    });
                    backBtn._bound = true;
                }

                const addBtn = document.getElementById('todolist-mobile-add');
                if (addBtn && !addBtn._bound) {
                    addBtn.addEventListener('click', () => {
                        this.addListItem();
                        // 新建后立即刷新移动端详情窗
                        this.refreshMobileOverlay();
                    });
                    addBtn._bound = true;
                }

                const favBtn = document.getElementById('todolist-mobile-fav');
                if (favBtn) {
                    // 绑定当前选中清单ID，避免不同清单之间相互影响
                    favBtn.dataset.listId = this.currentListId;
                    // 根据收藏状态更新样式与图标
                    const dataNow = StorageManager.getData();
                    const cur = dataNow.lists && dataNow.lists.find(l => l.id === this.currentListId);
                    const isFav = !!(cur && cur.favorited);
                    favBtn.classList.toggle('fav-active', isFav);
                    const favIcon = favBtn.querySelector('i');
                    if (favIcon) favIcon.className = isFav ? 'fas fa-star' : 'far fa-star';

                    // 使用 onclick 确保每次渲染都覆盖旧的处理器
                    favBtn.onclick = () => {
                        const targetId = favBtn.dataset.listId;
                        if (targetId) {
                            this.toggleFavorite(targetId);
                            this.refreshMobileOverlay();
                        }
                    };
                }

                const shareBtn = document.getElementById('todolist-mobile-share');
                if (shareBtn && !shareBtn._bound) {
                    shareBtn.addEventListener('click', () => this.shareCurrentList());
                    shareBtn._bound = true;
                }

                // 在移动端列表中重新绑定收藏按钮事件，保持同步
                const overlayFavoriteBtns = this.mobileOverlay.querySelectorAll('.list-favorite-btn');
                overlayFavoriteBtns.forEach(btn => {
                    if (!btn._bound) {
                        const targetListId = btn.getAttribute('data-list-id');
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.toggleFavorite(targetListId);
                            this.refreshMobileOverlay();
                        });
                        btn._bound = true;
                    }
                });
            }
        }
    },

    /**
     * 加载清单项目
     * @param {Object} list 清单对象
     */
    loadListItems(list) {
        this.listItemsContainer.innerHTML = '';
        
        if (!list) {
            this.showEmptyListMessage();
            return;
        }
        
        if (!list.items || list.items.length === 0) {
            this.listItemsContainer.innerHTML = `
                <div class="empty-list-message">
                    <div class="empty-icon">📝</div>
                    <p>这个清单还没有任何项目</p>
                </div>
            `;
            return;
        }
        
        // 如果处于批量模式，显示批量操作工具栏
        if (this.batchMode) {
            const batchToolbar = document.createElement('div');
            batchToolbar.className = 'batch-toolbar';
            batchToolbar.innerHTML = `
                <div class="batch-select-all">
                    <input type="checkbox" id="select-all-checkbox">
                    <label for="select-all-checkbox">全选</label>
                </div>
                <div class="batch-info">已选择 <span id="selected-count">0</span> 项</div>
            `;
            this.listItemsContainer.appendChild(batchToolbar);
            
            // 绑定全选事件
            const selectAllCheckbox = batchToolbar.querySelector('#select-all-checkbox');
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.batch-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
                this.updateSelectedCount();
            });
        }
        
        // 分组：未完成的在前，已完成的在后
        const incompleteItems = list.items.filter(item => !item.completed);
        const completedItems = list.items.filter(item => item.completed);
        
        // 添加未完成项目
        if (incompleteItems.length > 0) {
            const incompleteSection = document.createElement('div');
            incompleteSection.className = 'items-section';
            
            incompleteItems.forEach(item => {
                const itemElement = this.createListItemElement(item);
                incompleteSection.appendChild(itemElement);
            });
            
            this.listItemsContainer.appendChild(incompleteSection);
        }
        
        // 添加已完成项目
        if (completedItems.length > 0) {
            const completedSection = document.createElement('div');
            completedSection.className = 'completed-items-section';
            completedSection.innerHTML = '<h4>已完成</h4>';
            
            completedItems.forEach(item => {
                const itemElement = this.createListItemElement(item);
                completedSection.appendChild(itemElement);
            });
            
            this.listItemsContainer.appendChild(completedSection);
        }
        
        // 如果处于批量模式，添加更新选中计数的函数
        if (this.batchMode) {
            this.updateSelectedCount();
        }
    },

    /**
     * 显示空清单消息
     */
    showEmptyListMessage() {
        this.currentListTitle.textContent = '请选择或创建清单';
        this.deleteListBtn.style.display = 'none';
        this.addListItemBtn.disabled = true;
        this.editListBtn.disabled = true;
        
        this.listItemsContainer.innerHTML = `
            <div class="empty-list-message">
                <div class="empty-icon">📋</div>
                <p>${window.innerWidth <= 768 ? '暂无清单内容' : '请选择或创建一个清单'}</p>
            </div>
        `;
    },
    /**
     * 计算截止日期剩余天数
     * @param {string} dueDate 截止日期
     * @returns {number} 剩余天数
     */
    calculateDaysLeft(dueDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * HTML转义
     * @param {string} unsafe 不安全的字符串
     * @returns {string} 转义后的字符串
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * CSV字段转义
     * @param {string} field 字段值
     * @returns {string} 转义后的字段
     */
    escapeCsvField(field) {
        if (field === null || field === undefined) {
            return '';
        }
        
        const str = String(field);
        // 如果字段包含逗号、引号或换行符，需要用引号包围
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            // 将字段中的引号替换为两个引号
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    },

    /**
     * 导入清单数据
     * @param {File} file 导入的JSON文件
     */
    importLists(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // 验证导入数据格式
                if (!importData.lists || !Array.isArray(importData.lists) || importData.type !== 'todolist_export') {
                    alert('无效的清单数据文件');
                    return;
                }
                
                if (confirm(`确定要导入${importData.lists.length}个清单吗？这将会合并到现有所有内容中。`)) {
                    const data = StorageManager.getData();
                    
                    if (!data.lists) {
                        data.lists = [];
                    }
                    
                    // 合并数据，避免重复
                    const existingIds = new Set(data.lists.map(list => list.id));
                    
                    importData.lists.forEach(list => {
                        if (!existingIds.has(list.id)) {
                            data.lists.push(list);
                        }
                    });
                    
                    StorageManager.saveData(data);
                    this.loadLists();
                    
                    alert('清单数据导入成功');
                }
            } catch (error) {
                console.error('导入失败:', error);
                alert('导入失败: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    },

    /**
     * 创建清单项目元素
     * @param {Object} item 清单项目对象
     */
    createListItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'list-task-item';
        // 为移动端克隆渲染提供数据标识
        itemElement.dataset.itemId = item.id;
        if (item.completed) {
            itemElement.classList.add('completed');
        }
        
        // 根据优先级添加不同的样式类
        if (item.priority) {
            itemElement.classList.add(`priority-${item.priority === '高' ? 'high' : item.priority === '低' ? 'low' : 'medium'}`);
        }
        
        // 如果处于批量模式，添加批量选择类
        if (this.batchMode) {
            itemElement.classList.add('batch-mode');
        }
        
        // 准备优先级标签的HTML
        const priorityLabel = item.priority ? 
            `<span class="priority-tag priority-${item.priority === '高' ? 'high' : item.priority === '低' ? 'low' : 'medium'}">
                ${item.priority}
            </span>` : '';
        
        itemElement.innerHTML = `
            ${this.batchMode ? `<input type="checkbox" class="batch-checkbox" data-item-id="${item.id}">` : ''}
            <div class="list-task-checkbox">
                <input type="checkbox" ${item.completed ? 'checked' : ''} ${this.batchMode ? 'disabled' : ''}>
            </div>
            <div class="list-task-content">
                <div class="list-task-title">
                    ${item.title}
                    ${priorityLabel}
                </div>
                ${item.dueDate ? `
                    <div class="list-task-dates">
                        <span class="list-task-date">
                            <i class="fas fa-calendar"></i>
                            ${new Date(item.dueDate).toLocaleDateString()}
                        </span>
                        ${this.getCountdownHTML(item.dueDate)}
                    </div>
                ` : ''}
            </div>
            <div class="list-task-actions">
                ${!this.batchMode ? `
                <button class="list-task-action edit-task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="list-task-action delete-task">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        `;
        
        // 绑定事件
        if (!this.batchMode) {
            const checkbox = itemElement.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => this.toggleItemCompletion(item.id));
            
            const editBtn = itemElement.querySelector('.edit-task');
            editBtn.addEventListener('click', () => this.editListItem(item.id));
            
            const deleteBtn = itemElement.querySelector('.delete-task');
            deleteBtn.addEventListener('click', () => this.deleteListItem(item.id));
        } else {
            // 在批量模式下，绑定批量复选框事件
            const batchCb = itemElement.querySelector('.batch-checkbox');
            if (batchCb) {
                batchCb.addEventListener('change', () => {
                    this.updateSelectedCount();
                });
            }
        }
        
        return itemElement;
    },

    /**
     * 渲染移动端覆盖层内容，并绑定事件，保持与桌面端数据同步
     * @param {Object} list 清单对象
     */
    renderMobileOverlay(list) {
        if (!this.mobileOverlay) return;
        const titleEl = document.getElementById('todolist-mobile-title');
        const contentEl = document.getElementById('todolist-mobile-content');
        if (titleEl) titleEl.textContent = list.name;
        if (contentEl) {
            // 基于桌面容器生成最新视图后再克隆
            this.loadListItems(list);
            const clone = this.listItemsContainer.cloneNode(true);
            clone.id = '';
            contentEl.innerHTML = '';
            contentEl.appendChild(clone);

            // 绑定勾选/编辑/删除事件（克隆不包含原事件）
            const bindForContainer = (container) => {
                // 完成勾选
                container.querySelectorAll('.list-task-item').forEach(el => {
                    const itemId = el.dataset.itemId;
                    if (!itemId) return;
                    const cb = el.querySelector('.list-task-checkbox input');
                    if (cb && !cb._boundMobile) {
                        cb.addEventListener('change', () => {
                            this.toggleItemCompletion(itemId);
                            this.refreshMobileOverlay();
                        });
                        cb._boundMobile = true;
                    }
                    // 编辑
                    const editBtn = el.querySelector('.list-task-action.edit-task');
                    if (editBtn && !editBtn._boundMobile) {
                        editBtn.addEventListener('click', () => {
                            this.editListItem(itemId);
                            this.refreshMobileOverlay();
                        });
                        editBtn._boundMobile = true;
                    }
                    // 删除
                    const deleteBtn = el.querySelector('.list-task-action.delete-task');
                    if (deleteBtn && !deleteBtn._boundMobile) {
                        deleteBtn.addEventListener('click', () => {
                            this.deleteListItem(itemId);
                            this.refreshMobileOverlay();
                        });
                        deleteBtn._boundMobile = true;
                    }
                });
            };

            bindForContainer(contentEl);
        }
    },

    /** 刷新移动端覆盖层（基于当前选中清单） */
    refreshMobileOverlay() {
        if (!this.currentListId) return;
        const data = StorageManager.getData();
        const list = data.lists && data.lists.find(l => l.id === this.currentListId);
        if (list) {
            this.renderMobileOverlay(list);
        }
    },

    /**
     * 获取倒计时HTML
     * @param {string} dueDate 截止日期
     */
    getCountdownHTML(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        
        let countdownClass = 'countdown-normal';
        if (diffDays <= 3) {
            countdownClass = 'countdown-warning';
        }
        if (diffDays <= 1) {
            countdownClass = 'countdown-danger';
        }
        
        let countdownText = '';
        if (diffDays < 0) {
            countdownText = `已逾期 ${Math.abs(diffDays)} 天`;
        } else if (diffDays === 0) {
            countdownText = '今天到期';
        } else {
            countdownText = `还剩 ${diffDays} 天`;
        }
        
        return `
            <span class="list-task-countdown ${countdownClass}">
                <i class="fas fa-clock"></i>
                ${countdownText}
            </span>
        `;
    },

    /**
     * 创建新清单
     */
    createNewList() {
        const listName = prompt('请输入清单名称:');
        if (!listName) return;
        
        const data = StorageManager.getData();
        if (!data.lists) {
            data.lists = [];
        }
        
        const newList = {
            id: Date.now().toString(),
            name: listName,
            items: [],
            createTime: new Date().toISOString()
        };
        
        data.lists.push(newList);
        StorageManager.saveData(data);
        
        // 重新加载清单并选择新创建的清单
        this.loadLists();
        this.selectList(newList.id);
    },

    /**
     * 编辑当前清单
     */
    editCurrentList() {
        if (!this.currentListId) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        
        if (!list) return;
        
        const newName = prompt('请输入新的清单名称:', list.name);
        if (!newName || newName === list.name) return;
        
        list.name = newName;
        list.updateTime = new Date().toISOString();
        
        StorageManager.saveData(data);
        this.loadLists();
    },

    /**
     * 删除当前清单
     */
    deleteCurrentList() {
        if (!this.currentListId) return;
        
        if (!confirm('确定要删除这个清单吗？此操作不可恢复。')) return;
        
        const data = StorageManager.getData();
        data.lists = data.lists.filter(l => l.id !== this.currentListId);
        
        StorageManager.saveData(data);
        
        this.currentListId = null;
        this.loadLists();
        this.showEmptyListMessage();
    },

    /**
     * 添加清单项目
     */
    addListItem() {
        if (!this.currentListId) return;
        
        const title = prompt('请输入待办事项:');
        if (!title) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        
        if (!list) return;
        
        const dueDate = prompt('请输入截止日期 (可选，格式：YYYY-MM-DD):');
        
        // 添加优先级选择
        let priority = prompt('请输入优先级 (高/中/低):', '中');
        // 验证优先级输入
        if (!priority || !['高', '中', '低'].includes(priority)) {
            priority = '中'; // 默认为中优先级
        }
        
        const newItem = {
            id: Date.now().toString(),
            title,
            completed: false,
            createTime: new Date().toISOString(),
            priority: priority // 添加优先级属性
        };
        
        if (dueDate) {
            newItem.dueDate = new Date(dueDate).toISOString();
        }
        
        if (!list.items) {
            list.items = [];
        }
        
        list.items.push(newItem);
        StorageManager.saveData(data);
        
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
    },

    /**
     * 编辑清单项目
     * @param {string} itemId 项目ID
     */
    editListItem(itemId) {
        if (!this.currentListId) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        const item = list.items.find(i => i.id === itemId);
        
        if (!item) return;
        
        const newTitle = prompt('请输入新的待办事项:', item.title);
        if (!newTitle || newTitle === item.title) return;
        
        const newDueDate = prompt('请输入新的截止日期 (可选，格式：YYYY-MM-DD):', 
            item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '');
        
        // 添加优先级修改
        let newPriority = prompt('请输入新的优先级 (高/中/低):', item.priority || '中');
        if (!newPriority || !['高', '中', '低'].includes(newPriority)) {
            newPriority = item.priority || '中'; // 保持原优先级或默认为中
        }
        
        item.title = newTitle;
        item.updateTime = new Date().toISOString();
        item.priority = newPriority; // 更新优先级
        
        if (newDueDate) {
            item.dueDate = new Date(newDueDate).toISOString();
        } else {
            delete item.dueDate;
        }
        
        StorageManager.saveData(data);
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
    },

    /**
     * 删除清单项目
     * @param {string} itemId 项目ID
     */
    deleteListItem(itemId) {
        if (!this.currentListId) return;
        
        if (!confirm('确定要删除这个待办事项吗？')) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        
        if (!list) return;
        
        // 查找要删除的项目，检查是否已完成
        const item = list.items.find(i => i.id === itemId);
        const wasCompleted = item && item.completed;
        
        // 删除项目
        list.items = list.items.filter(i => i.id !== itemId);
        StorageManager.saveData(data);
        
        // 如果删除的是已完成项目，扣除积分
        if (wasCompleted) {
            StorageManager.addPoints(-10, '清单', '删除已完成事项');
            UIManager.showNotification('删除已完成项目 -10积分', 'info');
        }
        
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
    },

    /**
     * 切换项目完成状态
     * @param {string} itemId 项目ID
     */
    toggleItemCompletion(itemId) {
        if (!this.currentListId) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        const item = list.items.find(i => i.id === itemId);
        
        if (!item) return;
        
        // 检查之前的完成状态
        const wasCompleted = item.completed;
        
        // 更新完成状态
        item.completed = !item.completed;
        item.completedTime = item.completed ? new Date().toISOString() : null;
        
        StorageManager.saveData(data);
        
        // 积分奖励
        if (!wasCompleted && item.completed) {
            StorageManager.addPoints(10, '清单', `完成事项：${item.title}`);
            UIManager.showNotification('🎉 任务完成 +10积分', 'success');
        } else if (wasCompleted && !item.completed) {
            StorageManager.addPoints(-10, '清单', `撤销完成事项：${item.title}`);
            UIManager.showNotification('任务标记为未完成 -10积分', 'info');
        }
        
        // 重新加载以正确显示已完成/未完成分组
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
    },

    /**
     * 搜索清单
     * @param {string} query 搜索关键词
     */
    searchLists(query) {
        const data = StorageManager.getData();
        if (!data.lists) return;
        
        const normalizedQuery = query.toLowerCase().trim();
        
        // 如果没有搜索词，显示所有清单
        if (!normalizedQuery) {
            this.loadLists();
            return;
        }
        
        // 过滤匹配的清单
        const matchedLists = this.getUniqueListsByName(data.lists).filter(list => {
            // 匹配清单名称
            if (list.name.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // 匹配清单项目
            if (list.items && list.items.some(item => 
                item.title.toLowerCase().includes(normalizedQuery)
            )) {
                return true;
            }
            
            return false;
        });
        
        // 排序：收藏的清单在前，未收藏的在后
        const sortedLists = matchedLists.sort((a, b) => {
            const aFavorited = a.favorited || false;
            const bFavorited = b.favorited || false;
            
            if (aFavorited && !bFavorited) return -1;
            if (!aFavorited && bFavorited) return 1;
            
            // 如果收藏状态相同，按创建时间排序（新的在前）
            return new Date(b.createTime || 0) - new Date(a.createTime || 0);
        });
        
        // 分离收藏和未收藏的清单
        const favoritedLists = sortedLists.filter(list => list.favorited);
        const unfavoritedLists = sortedLists.filter(list => !list.favorited);
        
        // 清空并重新填充导航
        this.listsNav.innerHTML = '';
        
        if (matchedLists.length === 0) {
            this.listsNav.innerHTML = `
                <div class="empty-search-message">
                    <p>未找到匹配的清单</p>
                </div>
            `;
            return;
        }
        
        // 添加收藏的清单
        if (favoritedLists.length > 0) {
            favoritedLists.forEach(list => {
                const listElement = this.createListNavItem(list);
                this.listsNav.appendChild(listElement);
            });
        }
        
        // 添加分隔线（如果有收藏和未收藏的清单）
        if (favoritedLists.length > 0 && unfavoritedLists.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'favorite-separator';
            separator.textContent = '其他清单';
            this.listsNav.appendChild(separator);
        }
        
        // 添加未收藏的清单
        unfavoritedLists.forEach(list => {
            const listElement = this.createListNavItem(list);
            this.listsNav.appendChild(listElement);
        });
    },

    /**
     * 更新已选中项目的计数
     */
    updateSelectedCount() {
        const countElement = document.getElementById('selected-count');
        if (!countElement) return;
        
        const selectedCount = document.querySelectorAll('.batch-checkbox:checked').length;
        countElement.textContent = selectedCount;
        
        // 如果有选中项目，启用批量删除按钮
        if (this.batchDeleteBtn) {
            this.batchDeleteBtn.disabled = selectedCount === 0;
        }
    },

    getTodolistPreviewItems(list) {
        if (!list.items || list.items.length === 0) {
            return '<div class="empty-preview">暂无项目</div>';
        }
        
        // 按是否完成排序，同时考虑优先级
        const sortedItems = [...list.items].sort((a, b) => {
            // 首先按照完成状态排序
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // 如果都是未完成的，按优先级排序
            if (!a.completed && !b.completed && a.priority && b.priority) {
                // 获取优先级值
                const getPriorityValue = (priority) => {
                    if (priority === '高' || priority === 'high') return 3;
                    if (priority === '中' || priority === 'medium') return 2;
                    if (priority === '低' || priority === 'low') return 1;
                    return 0;
                };
                
                return getPriorityValue(b.priority) - getPriorityValue(a.priority);
            }
            
            return 0;
        });
        
        // 只显示前2个项目
        const previewItems = sortedItems.slice(0, 2);
        
        let html = '';
        previewItems.forEach(item => {
            // 处理截止日期信息
            let dueDateHtml = '';
            if (item.dueDate) {
                const diffDays = this.calculateDaysLeft(item.dueDate);
                let countdownClass = '';
                let countdownText = '';
                
                if (diffDays < 0) {
                    countdownClass = 'due-overdue';
                    countdownText = `已逾期 ${Math.abs(diffDays)} 天`;
                } else if (diffDays === 0) {
                    countdownClass = 'due-today';
                    countdownText = '今天到期';
                } else if (diffDays <= 3) {
                    countdownClass = 'due-soon';
                    countdownText = `还剩 ${diffDays} 天`;
                } else {
                    countdownClass = 'due-future';
                    countdownText = `还剩 ${diffDays} 天`;
                }
                
                dueDateHtml = `<span class="preview-due-date ${countdownClass}">${countdownText}</span>`;
            }
            
            // 添加优先级标签
            let priorityHtml = '';
            if (item.priority && !item.completed) {
                let priorityClass = '';
                let priorityIcon = '';
                let priorityText = '';
                
                // 统一处理中文和英文格式的优先级
                if (item.priority === 'high' || item.priority === '高') {
                    priorityClass = 'priority-high';
                    priorityIcon = 'exclamation-circle';
                    priorityText = '高';
                } else if (item.priority === 'medium' || item.priority === '中') {
                    priorityClass = 'priority-medium';
                    priorityIcon = 'exclamation';
                    priorityText = '中';
                } else if (item.priority === 'low' || item.priority === '低') {
                    priorityClass = 'priority-low';
                    priorityIcon = 'arrow-down';
                    priorityText = '低';
                }
                
                priorityHtml = `<span class="preview-priority-tag ${priorityClass}">
                    <i class="fas fa-${priorityIcon}"></i> ${priorityText}
                </span>`;
            }
            
            html += `
                <div class="preview-list-item ${item.completed ? 'completed' : ''} ${item.priority ? 'priority-' + ((item.priority === 'high' || item.priority === '高') ? 'high' : ((item.priority === 'medium' || item.priority === '中') ? 'medium' : 'low')) : ''}">
                    <span class="preview-checkbox ${item.completed ? 'checked' : ''}"></span>
                    <div class="preview-item-content">
                        <span class="preview-item-title">${item.title}</span>
                        <div class="preview-item-tags">
                            ${priorityHtml}
                            ${dueDateHtml}
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html;
    },

    showImportModal() {
        if (this.todolistImportModal) {
            this.todolistImportModal.style.display = 'flex';
            // 添加动画效果
            setTimeout(() => {
                this.todolistImportModal.classList.add('show');
            }, 10);
            this.todolistImportText.value = '';
        } else {
            console.error('导入模态框元素未找到');
        }
    },

    hideImportModal() {
        if (this.todolistImportModal) {
            // 先移除动画类，然后隐藏模态框
            this.todolistImportModal.classList.remove('show');
            setTimeout(() => {
                this.todolistImportModal.style.display = 'none';
            }, 300); // 等待动画完成
            this.todolistImportText.value = '';
        }
    },

    importFromText() {
        const text = this.todolistImportText.value.trim();
        if (!text) {
            UIManager.showNotification('请输入要导入的文本', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const lists = new Map(); // 使用Map存储清单
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，至少需要清单名称和事项内容`);
                return;
            }

            try {
                const listName = parts[0];
                const itemContent = parts[1];
                const dueDate = parts[2] ? new Date(parts[2]) : null;
                const priority = parts[3] || '中';
                const tags = parts[4] ? parts[4].split(',').map(tag => tag.trim()) : [];

                // 验证日期格式
                if (parts[2] && isNaN(dueDate.getTime())) {
                    throw new Error('日期格式无效');
                }

                // 验证优先级
                if (!['高', '中', '低'].includes(priority)) {
                    throw new Error('优先级必须是"高"、"中"或"低"');
                }

                // 获取或创建清单
                if (!lists.has(listName)) {
                    lists.set(listName, {
                        id: 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        name: listName,
                        items: [],
                        createTime: new Date().toISOString()
                    });
                }

                const list = lists.get(listName);

                // 添加清单项
                list.items.push({
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    title: itemContent,
                    completed: false,
                    dueDate: dueDate ? dueDate.toISOString() : null,
                    priority: priority,
                    tags: tags
                });
            } catch (e) {
                errors.push(`第 ${index + 1} 行: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`导入出错：\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有清单
        try {
            // 将Map转换为数组
            const listsArray = Array.from(lists.values());
            
            listsArray.forEach(list => {
                StorageManager.saveList(list);
            });

            // 清空输入框并关闭模态框
            this.hideImportModal();

            // 刷新清单列表
            this.loadLists();

            UIManager.showNotification(`成功导入 ${listsArray.length} 个清单`, 'success');
        } catch (error) {
            UIManager.showNotification(`保存清单时出错：${error.message}`, 'error');
        }
    },

    /**
     * 显示导入页面（移动端）
     */
    showMobileImportPage() {
        if (this.mobileImportPage) {
            this.mobileImportPage.classList.add('show');
            
            // 绑定移动端导入页面事件
            const backBtn = document.getElementById('todolist-mobile-import-back');
            const copyBtn = document.getElementById('todolist-mobile-import-copy-btn');
            const confirmBtn = document.getElementById('todolist-mobile-import-confirm-btn');
            const cancelBtn = document.getElementById('todolist-mobile-import-cancel-btn');
            const importText = document.getElementById('todolist-mobile-import-text');
            const contentArea = document.querySelector('.todolist-mobile-import-content');
            const actionsArea = document.querySelector('.todolist-mobile-import-actions');
            
            // 清空之前的内容
            if (importText) {
                importText.value = '';
            }
            
            // 动态设置内容区域的底部内边距，避免被固定按钮遮挡
            const updateContentPadding = () => {
                if (contentArea && actionsArea) {
                    // 强制浏览器重新计算元素尺寸
                    actionsArea.style.display = 'none';
                    actionsArea.offsetHeight; // 触发重排
                    actionsArea.style.display = '';
                    
                    const actionsHeight = actionsArea.offsetHeight;
                    contentArea.style.paddingBottom = (actionsHeight + 16) + 'px'; // 额外16px间距
                }
            };
            
            // 初始设置
            setTimeout(updateContentPadding, 0);
            
            // 确保在字体加载完成后再次更新（处理字体加载导致的高度变化）
            if (document.fonts) {
                document.fonts.ready.then(updateContentPadding);
            }
            
            // 使用 ResizeObserver 监听按钮区域尺寸变化（如果浏览器支持）
            if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(updateContentPadding);
                if (actionsArea) {
                    resizeObserver.observe(actionsArea);
                }
                
                // 在隐藏页面时断开观察器
                const originalHideMobileImportPage = this.hideMobileImportPage.bind(this);
                this.hideMobileImportPage = () => {
                    if (resizeObserver && actionsArea) {
                        resizeObserver.unobserve(actionsArea);
                    }
                    window.removeEventListener('resize', handleResize);
                    originalHideMobileImportPage();
                };
            }
            
            // 监听窗口大小变化，重新计算底部内边距
            let resizeTimeout;
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(updateContentPadding, 100);
            };
            
            window.addEventListener('resize', handleResize);
            
            // 在隐藏页面时移除事件监听器
            const originalHideMobileImportPage = this.hideMobileImportPage.bind(this);
            this.hideMobileImportPage = () => {
                window.removeEventListener('resize', handleResize);
                originalHideMobileImportPage();
            };
            
            // 返回按钮事件
            if (backBtn && !backBtn._mobileImportBound) {
                backBtn.addEventListener('click', () => {
                    this.hideMobileImportPage();
                });
                backBtn._mobileImportBound = true;
            }
            
            // 复制按钮事件
            if (copyBtn && !copyBtn._mobileImportBound) {
                copyBtn.addEventListener('click', () => {
                    const exampleElement = document.getElementById('todolist-mobile-import-format-example');
                    if (exampleElement) {
                        const exampleText = exampleElement.textContent;
                        this.copyToClipboard(exampleText, copyBtn);
                    }
                });
                copyBtn._mobileImportBound = true;
            }
            
            // 确认导入按钮事件
            if (confirmBtn && !confirmBtn._mobileImportBound) {
                confirmBtn.addEventListener('click', () => {
                    this.importFromMobileText();
                });
                confirmBtn._mobileImportBound = true;
            }
            
            // 取消按钮事件
            if (cancelBtn && !cancelBtn._mobileImportBound) {
                cancelBtn.addEventListener('click', () => {
                    this.hideMobileImportPage();
                });
                cancelBtn._mobileImportBound = true;
            }
        }
    },

    /**
     * 隐藏导入页面（移动端）
     */
    hideMobileImportPage() {
        if (this.mobileImportPage) {
            this.mobileImportPage.classList.remove('show');
            
            // 清空输入内容
            const importText = document.getElementById('todolist-mobile-import-text');
            if (importText) {
                importText.value = '';
            }
        }
    },

    /**
     * 从移动端文本导入
     */
    /**
     * 显示编辑页面（移动端）
     */
    showMobileEditPage() {
        if (this.mobileEditPage) {
            this.mobileEditPage.classList.add('show');
            
            // 绑定移动端编辑页面事件
            const backBtn = document.getElementById('todolist-mobile-edit-back');
            const copyBtn = document.getElementById('todolist-mobile-edit-copy-btn');
            const confirmBtn = document.getElementById('todolist-mobile-edit-confirm-btn');
            const cancelBtn = document.getElementById('todolist-mobile-edit-cancel-btn');
            const editText = document.getElementById('todolist-mobile-edit-text');
            const contentArea = document.querySelector('.todolist-mobile-edit-content');
            const actionsArea = document.querySelector('.todolist-mobile-edit-actions');
            
            // 填充当前清单数据
            if (editText) {
                // 获取当前所有清单数据
                const data = StorageManager.getData();
                const lists = data.lists || [];
                
                // 将清单数据转换为文本格式
                const text = lists.map(list => {
                    return list.items.map(item => {
                        const parts = [
                            list.name,
                            item.title,
                            item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
                            item.priority || '中',
                            item.tags ? item.tags.join(',') : ''
                        ];
                        return parts.join(' | ');
                    }).join('\n');
                }).join('\n');
                
                editText.value = text;
            }
            
            // 动态设置内容区域的底部内边距，避免被固定按钮遮挡
            const updateContentPadding = () => {
                if (contentArea && actionsArea) {
                    // 强制浏览器重新计算元素尺寸
                    actionsArea.style.display = 'none';
                    actionsArea.offsetHeight; // 触发重排
                    actionsArea.style.display = '';
                    
                    const actionsHeight = actionsArea.offsetHeight;
                    contentArea.style.paddingBottom = (actionsHeight + 16) + 'px'; // 额外16px间距
                }
            };
            
            // 初始设置
            setTimeout(updateContentPadding, 0);
            
            // 确保在字体加载完成后再次更新（处理字体加载导致的高度变化）
            if (document.fonts) {
                document.fonts.ready.then(updateContentPadding);
            }
            
            // 使用 ResizeObserver 监听按钮区域尺寸变化（如果浏览器支持）
            if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(updateContentPadding);
                if (actionsArea) {
                    resizeObserver.observe(actionsArea);
                }
                
                // 在隐藏页面时断开观察器
                const originalHideMobileEditPage = this.hideMobileEditPage.bind(this);
                this.hideMobileEditPage = () => {
                    if (resizeObserver && actionsArea) {
                        resizeObserver.unobserve(actionsArea);
                    }
                    window.removeEventListener('resize', handleResize);
                    originalHideMobileEditPage();
                };
            }
            
            // 监听窗口大小变化，重新计算底部内边距
            let resizeTimeout;
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(updateContentPadding, 100);
            };
            
            window.addEventListener('resize', handleResize);
            
            // 在隐藏页面时移除事件监听器
            const originalHideMobileEditPage = this.hideMobileEditPage.bind(this);
            this.hideMobileEditPage = () => {
                window.removeEventListener('resize', handleResize);
                originalHideMobileEditPage();
            };

            // 返回按钮事件
            if (backBtn && !backBtn._mobileEditBound) {
                backBtn.addEventListener('click', () => {
                    this.hideMobileEditPage();
                });
                backBtn._mobileEditBound = true;
            }
            
            // 复制按钮事件
            if (copyBtn && !copyBtn._mobileEditBound) {
                copyBtn.addEventListener('click', () => {
                    const exampleElement = document.getElementById('todolist-mobile-edit-format-example');
                    if (exampleElement) {
                        const exampleText = exampleElement.textContent;
                        this.copyToClipboard(exampleText, copyBtn);
                    }
                });
                copyBtn._mobileEditBound = true;
            }
            
            // 确认编辑按钮事件
            if (confirmBtn && !confirmBtn._mobileEditBound) {
                confirmBtn.addEventListener('click', () => {
                    this.saveMobileEditChanges();
                });
                confirmBtn._mobileEditBound = true;
            }
            
            // 取消按钮事件
            if (cancelBtn && !cancelBtn._mobileEditBound) {
                cancelBtn.addEventListener('click', () => {
                    this.hideMobileEditPage();
                });
                cancelBtn._mobileEditBound = true;
            }
        }
    },

    /**
     * 隐藏编辑页面（移动端）
     */
    hideMobileEditPage() {
        if (this.mobileEditPage) {
            this.mobileEditPage.classList.remove('show');
            
            // 清空输入内容
            const editText = document.getElementById('todolist-mobile-edit-text');
            if (editText) {
                editText.value = '';
            }
        }
    },

    /**
     * 保存移动端编辑的更改
     */
    saveMobileEditChanges() {
        const editText = document.getElementById('todolist-mobile-edit-text');
        if (!editText) return;
        
        const text = editText.value.trim();
        if (!text) {
            UIManager.showNotification('请输入要编辑的文本', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const lists = new Map(); // 使用Map存储清单
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，至少需要清单名称和事项内容`);
                return;
            }

            try {
                const listName = parts[0];
                const itemContent = parts[1];
                const dueDate = parts[2] ? new Date(parts[2]) : null;
                const priority = parts[3] || '中';
                const tags = parts[4] ? parts[4].split(',').map(tag => tag.trim()) : [];

                // 验证日期格式
                if (parts[2] && isNaN(dueDate.getTime())) {
                    throw new Error('日期格式无效');
                }

                // 验证优先级
                if (!['高', '中', '低'].includes(priority)) {
                    throw new Error('优先级必须是"高"、"中"或"低"');
                }

                // 获取或创建清单
                if (!lists.has(listName)) {
                    lists.set(listName, {
                        id: 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        name: listName,
                        items: [],
                        createTime: new Date().toISOString()
                    });
                }

                const list = lists.get(listName);

                // 添加清单项
                list.items.push({
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    title: itemContent,
                    completed: false,
                    dueDate: dueDate ? dueDate.toISOString() : null,
                    priority: priority,
                    tags: tags
                });
            } catch (e) {
                errors.push(`第 ${index + 1} 行: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`编辑出错：\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有清单
        try {
            // 将Map转换为数组
            const listsArray = Array.from(lists.values());
            
            // 保存到存储
            const data = StorageManager.getData();
            data.lists = listsArray;
            StorageManager.saveData(data);

            // 清空输入框并关闭页面
            this.hideMobileEditPage();

            // 刷新清单列表
            this.loadLists();

            UIManager.showNotification(`成功保存 ${listsArray.length} 个清单`, 'success');
        } catch (error) {
            UIManager.showNotification(`保存清单时出错：${error.message}`, 'error');
        }
    },

    importFromMobileText() {
        const importText = document.getElementById('todolist-mobile-import-text');
        if (!importText) return;
        
        const text = importText.value.trim();
        if (!text) {
            UIManager.showNotification('请输入要导入的文本', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const lists = new Map(); // 使用Map存储清单
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，至少需要清单名称和事项内容`);
                return;
            }

            try {
                const listName = parts[0];
                const itemContent = parts[1];
                const dueDate = parts[2] ? new Date(parts[2]) : null;
                const priority = parts[3] || '中';
                const tags = parts[4] ? parts[4].split(',').map(tag => tag.trim()) : [];

                // 验证日期格式
                if (parts[2] && isNaN(dueDate.getTime())) {
                    throw new Error('日期格式无效');
                }

                // 验证优先级
                if (!['高', '中', '低'].includes(priority)) {
                    throw new Error('优先级必须是"高"、"中"或"低"');
                }

                // 获取或创建清单
                if (!lists.has(listName)) {
                    lists.set(listName, {
                        id: 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        name: listName,
                        items: [],
                        createTime: new Date().toISOString()
                    });
                }

                const list = lists.get(listName);

                // 添加清单项
                list.items.push({
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    title: itemContent,
                    completed: false,
                    dueDate: dueDate ? dueDate.toISOString() : null,
                    priority: priority,
                    tags: tags
                });
            } catch (e) {
                errors.push(`第 ${index + 1} 行: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`导入出错：\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有清单
        try {
            // 将Map转换为数组
            const listsArray = Array.from(lists.values());
            
            listsArray.forEach(list => {
                StorageManager.saveList(list);
            });

            // 清空输入框并关闭页面
            this.hideMobileImportPage();

            // 刷新清单列表
            this.loadLists();

            UIManager.showNotification(`成功导入 ${listsArray.length} 个清单`, 'success');
        } catch (error) {
            UIManager.showNotification(`保存清单时出错：${error.message}`, 'error');
        }
    },

    /**
     * 复制文本到剪贴板
     * @param {string} text 要复制的文本
     * @param {HTMLElement} button 触发复制的按钮元素
     */
    copyToClipboard(text, button) {
        // 复制到剪贴板
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                // 显示成功提示
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> 已复制';
                setTimeout(() => {
                    button.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            });
        } else {
            // 兼容旧浏览器
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                // 显示成功提示
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> 已复制';
                setTimeout(() => {
                    button.innerHTML = originalText;
                    document.body.removeChild(textArea);
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
                document.body.removeChild(textArea);
            }
        }
    },

    createTaskItem(task, todolist = null) {
        const taskElement = document.createElement('div');
        taskElement.className = 'todolist-item';
        taskElement.dataset.taskId = task.id;
        
        // 获取搜索词（如果有）
        const searchInput = document.getElementById('todolist-search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        // 高亮匹配文本的函数
        const highlightMatch = (text) => {
            if (!searchTerm || !text) return text;
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            return text.replace(regex, '<span class="highlight-match">$1</span>');
        };
        
        // 创建任务内容
        const taskContent = `
            <div class="todolist-checkbox ${task.completed ? 'checked' : ''}"></div>
            <div class="todolist-content">
                <div class="todolist-title ${task.completed ? 'completed' : ''}">
                    ${highlightMatch(task.name)}
                </div>
                <div class="todolist-meta">
                    ${task.dueDate ? `
                        <div class="todolist-date">
                            <i class="far fa-calendar"></i>
                            ${highlightMatch(this.formatDate(task.dueDate))}
                        </div>
                    ` : ''}
                    ${task.priority ? `
                        <div class="todolist-priority ${task.priority.toLowerCase()}">
                            ${highlightMatch(task.priority)}
                        </div>
                    ` : ''}
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="todolist-tags">
                            ${task.tags.map(tag => `
                                <span class="todolist-tag">${highlightMatch(tag)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                ${task.content ? `
                    <div class="todolist-description">
                        ${highlightMatch(task.content)}
                    </div>
                ` : ''}
            </div>
            <div class="todolist-actions">
                <button class="todolist-action-btn edit" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="todolist-action-btn delete" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        taskElement.innerHTML = taskContent;
        
        // 添加事件监听器
        const checkbox = taskElement.querySelector('.todolist-checkbox');
        checkbox.addEventListener('click', () => this.toggleTaskCompletion(task.id, todolist));
        
        const editBtn = taskElement.querySelector('.todolist-action-btn.edit');
        editBtn.addEventListener('click', () => this.editTask(task.id, todolist));
        
        const deleteBtn = taskElement.querySelector('.todolist-action-btn.delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id, todolist));
        
        return taskElement;
    },

    /**
     * 显示编辑模态框
     */
    showEditModal() {
        // 获取当前所有清单数据
        const data = StorageManager.getData();
        const lists = data.lists || [];
        
        // 将清单数据转换为文本格式
        const text = lists.map(list => {
            return list.items.map(item => {
                const parts = [
                    list.name,
                    item.title,
                    item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
                    item.priority || '中',
                    item.tags ? item.tags.join(',') : ''
                ];
                return parts.join(' | ');
            }).join('\n');
        }).join('\n');
        
        // 显示模态框并填充文本
        this.todolistEditText.value = text;
        this.todolistEditModal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            this.todolistEditModal.classList.add('show');
        }, 10);
    },

    /**
     * 隐藏编辑模态框
     */
    hideEditModal() {
        // 先移除动画类，然后隐藏模态框
        this.todolistEditModal.classList.remove('show');
        setTimeout(() => {
            this.todolistEditModal.style.display = 'none';
        }, 300); // 等待动画完成
        this.todolistEditText.value = '';
    },

    /**
     * 保存编辑的更改
     */
    saveEditChanges() {
        const text = this.todolistEditText.value.trim();
        if (!text) {
            UIManager.showNotification('请输入要编辑的文本', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const lists = new Map(); // 使用Map存储清单
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，至少需要清单名称和事项内容`);
                return;
            }

            try {
                const listName = parts[0];
                const itemContent = parts[1];
                const dueDate = parts[2] ? new Date(parts[2]) : null;
                const priority = parts[3] || '中';
                const tags = parts[4] ? parts[4].split(',').map(tag => tag.trim()) : [];

                // 验证日期格式
                if (parts[2] && isNaN(dueDate.getTime())) {
                    throw new Error('日期格式无效');
                }

                // 验证优先级
                if (!['高', '中', '低'].includes(priority)) {
                    throw new Error('优先级必须是"高"、"中"或"低"');
                }

                // 获取或创建清单
                if (!lists.has(listName)) {
                    lists.set(listName, {
                        id: 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        name: listName,
                        items: [],
                        createTime: new Date().toISOString()
                    });
                }

                const list = lists.get(listName);

                // 添加清单项
                list.items.push({
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    title: itemContent,
                    completed: false,
                    dueDate: dueDate ? dueDate.toISOString() : null,
                    priority: priority,
                    tags: tags
                });
            } catch (e) {
                errors.push(`第 ${index + 1} 行: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`编辑出错：\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有清单
        try {
            // 将Map转换为数组
            const listsArray = Array.from(lists.values());
            
            // 保存到存储
            const data = StorageManager.getData();
            data.lists = listsArray;
            StorageManager.saveData(data);

            // 清空输入框并关闭模态框
            this.hideEditModal();

            // 刷新清单列表
            this.loadLists();

            UIManager.showNotification(`成功保存 ${listsArray.length} 个清单`, 'success');
        } catch (error) {
            UIManager.showNotification(`保存清单时出错：${error.message}`, 'error');
        }
    },

    /**
     * 切换清单收藏状态
     * @param {string} listId 清单ID
     */
    toggleFavorite(listId) {
        try {
            const data = StorageManager.getData();
            const list = data.lists.find(l => l.id === listId);
            
            if (list) {
                const wasFavorited = list.favorited || false;
                list.favorited = !wasFavorited;
                
                // 保存数据
                StorageManager.saveData(data);
                
                // 重新加载清单列表
                this.loadLists();
                
                // 显示用户反馈
                const action = list.favorited ? '收藏' : '取消收藏';
                UIManager.showNotification(`已${action}清单"${list.name}"`, 'success');
                
                // 如果当前选中的清单被收藏/取消收藏，更新其显示
                if (this.currentListId === listId) {
                    this.selectList(listId);
                }
            }
        } catch (error) {
            console.error('切换收藏状态时出错:', error);
            UIManager.showNotification('操作失败，请重试', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const shareBtn = document.getElementById('share-list-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            TodoListManager.shareCurrentList();
        });
    }
    
    // 添加清单导入复制按钮功能
    const copyTodolistImportBtn = document.getElementById('copy-todolist-import-example');
    if (copyTodolistImportBtn) {
        copyTodolistImportBtn.addEventListener('click', function() {
            const formatHint = this.closest('.import-format-hint');
            const preElement = formatHint.querySelector('pre');
            const exampleText = preElement.textContent;
            
            // 移除第一行标题，只复制示例内容
            const lines = exampleText.split('\n');
            const contentLines = lines.slice(1); // 跳过第一行标题
            const contentText = contentLines.join('\n');
            
            copyToClipboard(contentText, this);
        });
    }
    
    // 添加清单编辑复制按钮功能
    const copyTodolistEditBtn = document.getElementById('copy-todolist-edit-example');
    if (copyTodolistEditBtn) {
        copyTodolistEditBtn.addEventListener('click', function() {
            const formatHint = this.closest('.edit-format-hint');
            const preElement = formatHint.querySelector('pre');
            const exampleText = preElement.textContent;
            
            // 移除第一行标题，只复制示例内容
            const lines = exampleText.split('\n');
            const contentLines = lines.slice(1); // 跳过第一行标题
            const contentText = contentLines.join('\n');
            
            copyToClipboard(contentText, this);
        });
    }
    
    // 添加倒数日导入复制按钮功能
    const copyCountdownImportBtn = document.getElementById('copy-countdown-import-example');
    if (copyCountdownImportBtn) {
        copyCountdownImportBtn.addEventListener('click', function() {
            const formatHint = this.closest('.import-format-hint');
            const preElement = formatHint.querySelector('pre');
            const exampleText = preElement.textContent;
            
            // 移除第一行标题，只复制示例内容
            const lines = exampleText.split('\n');
            const contentLines = lines.slice(1); // 跳过第一行标题
            const contentText = contentLines.join('\n');
            
            copyToClipboard(contentText, this);
        });
    }
    
    // 添加倒数日编辑复制按钮功能
    const copyCountdownEditBtn = document.getElementById('copy-countdown-edit-example');
    if (copyCountdownEditBtn) {
        copyCountdownEditBtn.addEventListener('click', function() {
            const formatHint = this.closest('.import-format-hint');
            const preElement = formatHint.querySelector('pre');
            const exampleText = preElement.textContent;
            
            // 移除第一行标题，只复制示例内容
            const lines = exampleText.split('\n');
            const contentLines = lines.slice(1); // 跳过第一行标题
            const contentText = contentLines.join('\n');
            
            copyToClipboard(contentText, this);
        });
    }
});

/**
 * 复制文本到剪贴板
 * @param {string} text 要复制的文本
 * @param {HTMLElement} button 触发复制的按钮元素
 */
function copyToClipboard(text, button) {
    // 复制到剪贴板
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            // 显示成功提示
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> 已复制';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
        });
    } else {
        // 兼容旧浏览器
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            // 显示成功提示
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> 已复制';
            setTimeout(() => {
                button.innerHTML = originalText;
                document.body.removeChild(textArea);
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
            document.body.removeChild(textArea);
        }
    }
}
