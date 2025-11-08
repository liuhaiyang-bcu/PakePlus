/**
 * 笔记管理器
 * 负责笔记的增删改查、搜索、批量操作等功能
 */
const NotesManager = {
    // DOM元素
    elements: {
        notesList: null,
        emptyMessage: null,
        searchInput: null,
        addBtn: null,
        batchToggleBtn: null,
        batchDeleteBtn: null,
        importBtn: null,
        editBtn: null
    },

    // 状态
    batchMode: false,
    selectedNotes: new Set(),
    currentNote: null,

    /**
     * 初始化笔记管理器
     */
    init() {
        console.log('初始化笔记管理器...');
        
        try {
            this.initElements();
            this.bindEvents();
            this.loadNotes();
            
            console.log('笔记管理器初始化完成');
        } catch (error) {
            console.error('笔记管理器初始化失败:', error);
        }
    },

    /**
     * 初始化DOM元素
     */
    initElements() {
        this.elements.notesList = document.getElementById('notes-list');
        this.elements.emptyMessage = document.getElementById('empty-notes-message');
        this.elements.searchInput = document.getElementById('notes-search-input');
        this.elements.addBtn = document.getElementById('add-note-btn');
        this.elements.batchToggleBtn = document.getElementById('toggle-notes-batch-mode-btn');
        this.elements.batchDeleteBtn = document.getElementById('notes-batch-delete-btn');
        this.elements.importBtn = document.getElementById('import-notes-text-btn');
        this.elements.editBtn = document.getElementById('edit-notes-text-btn');

        if (!this.elements.notesList || !this.elements.emptyMessage) {
            throw new Error('找不到笔记列表容器');
        }
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 新建笔记
        if (this.elements.addBtn) {
            this.elements.addBtn.addEventListener('click', () => this.showModal());
        }

        // 批量模式切换
        if (this.elements.batchToggleBtn) {
            this.elements.batchToggleBtn.addEventListener('click', () => this.toggleBatchMode());
        }

        // 批量删除
        if (this.elements.batchDeleteBtn) {
            this.elements.batchDeleteBtn.addEventListener('click', () => this.batchDelete());
        }

        // 搜索
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => this.searchNotes(e.target.value));
        }

        // 文本导入
        if (this.elements.importBtn) {
            this.elements.importBtn.addEventListener('click', () => this.showImportModal());
        }

        // 文件导入
        const fileImportBtn = document.getElementById('import-notes-file-btn');
        if (fileImportBtn) {
            fileImportBtn.addEventListener('click', () => this.showFileImportModal());
        }

        // 文本编辑
        if (this.elements.editBtn) {
            this.elements.editBtn.addEventListener('click', () => this.showEditModal());
        }

        // 监听数据变化
        window.addEventListener('storage', (e) => {
            if (e.key === 'appData') {
                this.loadNotes();
            }
        });
    },

    /**
     * 加载所有笔记
     */
    loadNotes() {
        const data = StorageManager.getData();
        const notes = data.notes || [];
        
        // 当笔记没有内容时隐藏筛选器
        const filterContainer = document.getElementById('notes-filter-container');
        if (filterContainer) {
            if (notes.length === 0) {
                filterContainer.style.display = 'none';
            } else {
                filterContainer.style.display = 'block';
            }
        }
        
        if (notes.length === 0) {
            this.elements.notesList.style.display = 'none';
            this.elements.emptyMessage.style.display = 'block';
            return;
        }
        
        this.elements.notesList.style.display = 'grid';
        this.elements.emptyMessage.style.display = 'none';
        
        // 清空列表
        this.elements.notesList.innerHTML = '';
        
        // 收藏优先，时间倒序
        notes.sort((a, b) => {
            if ((b.starred ? 1 : 0) !== (a.starred ? 1 : 0)) {
                return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
            }
            return new Date(b.createTime) - new Date(a.createTime);
        });
        
        // 添加笔记卡片
        notes.forEach(note => {
            const card = this.createNoteCard(note);
            this.elements.notesList.appendChild(card);
        });
        
        // 如果是批量模式，更新全选按钮状态
        if (this.batchMode) {
            this.updateSelectAllButton();
        }
        
        // 通知筛选器更新标签按钮
        this.notifyFilterManager();
    },

    /**
     * 创建笔记卡片
     */
    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.setAttribute('data-note-id', note.id);
        
        // 格式化日期
        const createDate = new Date(note.createTime);
        const updateDate = note.updateTime ? new Date(note.updateTime) : createDate;
        const dateText = updateDate.toLocaleDateString('zh-CN');
        
        // 内容预览（去除HTML标签）
        const contentPreview = note.content.replace(/<[^>]*>/g, '').substring(0, 150);
        
        // 标签HTML
        const tagsHTML = note.tags && note.tags.length > 0 
            ? note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')
            : '';
        
        card.innerHTML = `
            <div class="note-checkbox"></div>
            <button class="note-star${note.starred ? ' active' : ''}" title="${note.starred ? '取消收藏' : '收藏'}"><i class="fas fa-star"></i></button>
            <div class="note-title">${this.escapeHtml(note.title)}</div>
            <div class="note-content-preview">${this.escapeHtml(contentPreview)}</div>
            <div class="note-meta">
                <div class="note-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${dateText}</span>
                </div>
                <div class="note-tags">${tagsHTML}</div>
            </div>
            <div class="note-actions">
                <button class="note-action-btn edit" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="note-action-btn share" title="分享">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="note-action-btn delete" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // 绑定卡片事件
        if (!this.batchMode) {
            const editBtn = card.querySelector('.edit');
            const shareBtn = card.querySelector('.share');
            const deleteBtn = card.querySelector('.delete');
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showModal(note);
            });
            
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareNote(note);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNote(note.id);
            });
            
            // 点击卡片查看详情
            card.addEventListener('click', () => {
                this.showNoteDetail(note);
            });
        } else {
            // 批量模式下的选择功能
            const checkbox = card.querySelector('.note-checkbox');
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNoteSelection(note.id, checkbox);
            });
        }
        
        // 收藏按钮事件
        const starBtn = card.querySelector('.note-star');
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStar(note.id);
        });
        
        return card;
    },

    /**
     * 显示笔记编辑模态框
     */
    showModal(note = null) {
        this.currentNote = note;
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.id = 'note-modal';
        
        const isEdit = !!note;
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3>${isEdit ? '编辑笔记' : '新建笔记'}</h3>
                    <button class="note-modal-close" id="note-modal-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label for="note-title">标题</label>
                        <input type="text" id="note-title" class="note-form-input" 
                               placeholder="请输入笔记标题" value="${note ? this.escapeHtml(note.title) : ''}">
                    </div>
                    <div class="note-form-group">
                        <label for="note-content">内容 <span style="font-size: 12px; color: var(--text-secondary-color, #666666);">(支持Markdown格式)</span></label>
                        <textarea id="note-content" class="note-form-textarea" 
                                  placeholder="请输入笔记内容，支持Markdown格式">${note ? this.escapeHtml(note.content) : ''}</textarea>
                    </div>
                    <div class="note-form-group">
                        <label for="note-tags">标签</label>
                        <input type="text" id="note-tags" class="note-form-input" 
                               placeholder="请输入标签，用逗号分隔" 
                               value="${note && note.tags ? note.tags.join(', ') : ''}">
                    </div>
                </div>
                <div class="note-modal-actions">
                    ${isEdit ? '<button class="note-modal-btn danger" id="note-delete-btn">删除</button>' : ''}
                    <button class="note-modal-btn secondary" id="note-cancel-btn">取消</button>
                    <button class="note-modal-btn primary" id="note-save-btn">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定模态框事件
        this.bindModalEvents(modal);
        
        // 聚焦到标题输入框
        setTimeout(() => {
            document.getElementById('note-title').focus();
        }, 100);
    },

    /**
     * 绑定模态框事件
     */
    bindModalEvents(modal) {
        const closeBtn = modal.querySelector('#note-modal-close');
        const cancelBtn = modal.querySelector('#note-cancel-btn');
        const saveBtn = modal.querySelector('#note-save-btn');
        const deleteBtn = modal.querySelector('#note-delete-btn');
        
        // 关闭模态框
        const closeModal = () => {
            modal.remove();
            this.currentNote = null;
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // 保存笔记
        saveBtn.addEventListener('click', () => {
            this.saveNote(modal);
        });
        
        // 删除笔记
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.currentNote) {
                    this.deleteNote(this.currentNote.id);
                    closeModal();
                }
            });
        }
        
        // 编辑/预览模式切换 - 已移除预览功能
        // 不再需要模式切换相关代码
        
        // 回车保存
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.saveNote(modal);
            }
        });
    },

    /**
     * 保存笔记
     */
    saveNote(modal) {
        const titleInput = modal.querySelector('#note-title');
        const contentInput = modal.querySelector('#note-content');
        const tagsInput = modal.querySelector('#note-tags');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!title) {
            UIManager.showNotification('请输入笔记标题', 'warning');
            titleInput.focus();
            return;
        }
        
        if (!content) {
            UIManager.showNotification('请输入笔记内容', 'warning');
            contentInput.focus();
            return;
        }
        
        const data = StorageManager.getData();
        if (!data.notes) {
            data.notes = [];
        }
        
        const now = new Date().toISOString();
        
        if (this.currentNote) {
            // 编辑现有笔记
            const noteIndex = data.notes.findIndex(n => n.id === this.currentNote.id);
            if (noteIndex !== -1) {
                data.notes[noteIndex] = {
                    ...this.currentNote,
                    title,
                    content,
                    tags,
                    updateTime: now
                };
            }
        } else {
            // 新建笔记
            const newNote = {
                id: this.generateId(),
                title,
                content,
                tags,
                createTime: now,
                updateTime: now,
                starred: false
            };
            data.notes.push(newNote);
        }
        
        StorageManager.saveData(data);
        this.loadNotes();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        modal.remove();
        this.currentNote = null;
        
        UIManager.showNotification(
            this.currentNote ? '笔记更新成功' : '笔记创建成功', 
            'success'
        );
    },

    /**
     * 删除笔记
     */
    deleteNote(noteId) {
        if (!confirm('确定要删除这个笔记吗？')) {
            return;
        }
        
        const data = StorageManager.getData();
        data.notes = data.notes.filter(note => note.id !== noteId);
        StorageManager.saveData(data);
        
        this.loadNotes();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        UIManager.showNotification('笔记删除成功', 'success');
    },

    /**
     * 分享笔记
     */
    shareNote(note) {
        // 整理数据结构，兼容图片分享
        const noteData = {
            title: note.title,
            content: note.content,
            tags: note.tags
        };
        if (window.showShareNoteImageModal) {
            window.showShareNoteImageModal(noteData);
        } else {
            // 兼容未加载图片分享脚本时的降级
            let shareText = `📝【笔记】${note.title}\n`;
            shareText += `-----------------------------\n`;
            shareText += `${note.content}\n`;
            if (note.tags && note.tags.length > 0) {
                shareText += `\n标签：${note.tags.join(', ')}\n`;
            }
            shareText += `-----------------------------\n`;
            shareText += `🎉 来自有数规划`;
            if (navigator.share) {
                navigator.share({
                    title: note.title,
                    text: shareText
                });
            } else {
                navigator.clipboard.writeText(shareText).then(() => {
                    UIManager.showNotification('笔记内容已复制到剪贴板', 'success');
                });
            }
        }
    },

    /**
     * 搜索笔记
     */
    searchNotes(keyword) {
        const cards = this.elements.notesList.querySelectorAll('.note-card');
        const lowerKeyword = keyword.toLowerCase();
        
        cards.forEach(card => {
            const title = card.querySelector('.note-title').textContent.toLowerCase();
            const content = card.querySelector('.note-content-preview').textContent.toLowerCase();
            const tags = Array.from(card.querySelectorAll('.note-tag'))
                .map(tag => tag.textContent.toLowerCase());
            
            const matches = title.includes(lowerKeyword) || 
                           content.includes(lowerKeyword) ||
                           tags.some(tag => tag.includes(lowerKeyword));
            
            card.style.display = matches ? 'block' : 'none';
        });
    },

    /**
     * 切换批量模式
     */
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        this.selectedNotes.clear();
        
        const list = this.elements.notesList;
        const toggleBtn = this.elements.batchToggleBtn;
        const deleteBtn = this.elements.batchDeleteBtn;
        
        if (this.batchMode) {
            list.classList.add('batch-mode');
            toggleBtn.innerHTML = '<i class="fas fa-times"></i>退出批量';
            deleteBtn.style.display = 'inline-flex';
        } else {
            list.classList.remove('batch-mode');
            toggleBtn.innerHTML = '<i class="fas fa-check-square"></i>批量选择';
            deleteBtn.style.display = 'none';
        }
        
        this.loadNotes();
    },

    /**
     * 切换笔记选择状态
     */
    toggleNoteSelection(noteId, checkbox) {
        if (this.selectedNotes.has(noteId)) {
            this.selectedNotes.delete(noteId);
            checkbox.classList.remove('checked');
        } else {
            this.selectedNotes.add(noteId);
            checkbox.classList.add('checked');
        }
        
        this.updateBatchDeleteButton();
    },

    /**
     * 更新批量删除按钮状态
     */
    updateBatchDeleteButton() {
        const deleteBtn = this.elements.batchDeleteBtn;
        if (this.selectedNotes.size > 0) {
            deleteBtn.innerHTML = `<i class="fas fa-trash"></i>删除选中 (${this.selectedNotes.size})`;
            deleteBtn.disabled = false;
        } else {
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>批量删除';
            deleteBtn.disabled = true;
        }
    },

    /**
     * 批量删除
     */
    batchDelete() {
        if (this.selectedNotes.size === 0) {
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${this.selectedNotes.size} 个笔记吗？`)) {
            return;
        }
        
        const data = StorageManager.getData();
        data.notes = data.notes.filter(note => !this.selectedNotes.has(note.id));
        StorageManager.saveData(data);
        
        this.selectedNotes.clear();
        this.toggleBatchMode();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        UIManager.showNotification(`成功删除 ${this.selectedNotes.size} 个笔记`, 'success');
    },

    /**
     * 显示笔记详情页
     */
    showNoteDetail(note) {
        // 创建全屏详情页
        const detailPage = document.createElement('div');
        detailPage.className = 'note-detail-page';
        detailPage.id = 'note-detail-page';
        
        detailPage.innerHTML = `
            <div class="note-detail-page-header">
                <div class="note-detail-nav">
                    <button class="note-detail-back-btn" id="note-detail-back-btn" title="返回">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="note-detail-title-section">
                        <h1 class="note-detail-page-title">${this.escapeHtml(note.title)}</h1>
                    </div>
                    <div class="note-detail-actions">
                        <button class="note-detail-star-btn${note.starred ? ' active' : ''}" id="note-detail-star-btn" title="${note.starred ? '取消收藏' : '收藏'}">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="note-detail-more-btn" id="note-detail-more-btn" title="更多操作">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <div class="note-detail-more-menu" id="note-detail-more-menu" style="display: none;">
                    <button class="note-detail-menu-item" id="note-detail-edit-btn">
                        <i class="fas fa-edit"></i>
                        <span>编辑笔记</span>
                    </button>
                    <button class="note-detail-menu-item" id="note-detail-copy-btn">
                        <i class="fas fa-copy"></i>
                        <span>复制内容</span>
                    </button>
                    <button class="note-detail-menu-item" id="note-detail-share-btn">
                        <i class="fas fa-share-alt"></i>
                        <span>分享内容</span>
                    </button>
                </div>
            </div>
            
            <div class="note-detail-page-content" id="note-detail-page-content">
                <div class="note-detail-search-section">
                    <input id="note-detail-search-input" type="text" placeholder="搜索本笔记内容..." class="note-detail-search-input" />
                    <div class="note-detail-search-buttons">
                        <button id="note-detail-search-btn" class="note-detail-search-btn">
                            <i class="fas fa-search"></i>
                            <span>搜索</span>
                        </button>
                        <button id="note-detail-clear-btn" class="note-detail-clear-btn">
                            <i class="fas fa-times"></i>
                            <span>清除</span>
                        </button>
                    </div>
                </div>
                
                <div class="note-detail-content-section">
                    <div class="note-detail-content-label">
                        <h4><i class="fas fa-file-text"></i> 笔记内容</h4>
                        <div class="note-detail-content-actions">
                            <button class="note-detail-content-action-btn copy" id="note-detail-content-copy-btn">
                                <i class="fas fa-copy"></i>
                                复制
                            </button>
                            <button class="note-detail-content-action-btn share" id="note-detail-content-share-btn">
                                <i class="fas fa-share-alt"></i>
                                分享
                            </button>
                        </div>
                    </div>
                    <div id="note-detail-content" class="note-detail-content">
                        ${this.renderNoteContent(note.content)}
                    </div>
                </div>
                
                ${note.tags && note.tags.length > 0 ? `
                <div class="note-detail-tags-section">
                    <h4><i class="fas fa-tags"></i> 标签</h4>
                    <div class="note-detail-tags">
                        ${note.tags.map(tag => `<span class="note-detail-tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="note-detail-time-section">
                    <h4><i class="fas fa-clock"></i> 时间信息</h4>
                    <div class="note-detail-time-info">
                        <div class="note-detail-time-item">
                            <i class="fas fa-calendar-plus"></i>
                            <span class="note-detail-time-text">创建时间：${new Date(note.createTime).toLocaleString('zh-CN')}</span>
                        </div>
                        ${note.updateTime && note.updateTime !== note.createTime ? `
                        <div class="note-detail-time-item">
                            <i class="fas fa-calendar-check"></i>
                            <span class="note-detail-time-text">更新时间：${new Date(note.updateTime).toLocaleString('zh-CN')}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="note-detail-page-footer">
                    <button class="note-detail-footer-btn primary" id="note-detail-edit-btn-footer">
                        <i class="fas fa-edit"></i>
                        编辑笔记
                    </button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(detailPage);
        
        // 添加笔记详情页激活类
        document.body.classList.add('note-detail-page-active');
        
        // 隐藏主页面内容
        const mainContent = document.querySelector('.main-content') || document.querySelector('main') || document.querySelector('#app');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        // 显示详情页
        setTimeout(() => {
            detailPage.classList.add('show');
            // 移除了笔记高亮标记的恢复功能，保持简洁的文本显示
        }, 10);
        
        // 添加触控滑动适配
        this.enableTouchScrollForNoteDetailPage(detailPage);
        
        // 绑定事件
        const closePage = () => {
            detailPage.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(detailPage);
                // 移除笔记详情页激活类
                document.body.classList.remove('note-detail-page-active');
                // 恢复主页面内容显示
                const mainContent = document.querySelector('.main-content') || document.querySelector('main') || document.querySelector('#app');
                if (mainContent) {
                    mainContent.style.display = '';
                }
            }, 300);
        };
        
        const backBtn = detailPage.querySelector('#note-detail-back-btn');
        const editBtn = detailPage.querySelector('#note-detail-edit-btn');
        const editBtnFooter = detailPage.querySelector('#note-detail-edit-btn-footer');
        const starBtn = detailPage.querySelector('#note-detail-star-btn');
        const moreBtn = detailPage.querySelector('#note-detail-more-btn');
        const moreMenu = detailPage.querySelector('#note-detail-more-menu');
        const searchBtn = detailPage.querySelector('#note-detail-search-btn');
        const clearBtn = detailPage.querySelector('#note-detail-clear-btn');
        const searchInput = detailPage.querySelector('#note-detail-search-input');
        const contentDiv = detailPage.querySelector('#note-detail-content');
        const copyBtn = detailPage.querySelector('#note-detail-copy-btn');
        const shareBtn = detailPage.querySelector('#note-detail-share-btn');
        const contentCopyBtn = detailPage.querySelector('#note-detail-content-copy-btn');
        const contentShareBtn = detailPage.querySelector('#note-detail-content-share-btn');
        
        backBtn.addEventListener('click', closePage);
        
        // 更多按钮菜单切换
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = moreMenu.style.display !== 'none';
            moreMenu.style.display = isVisible ? 'none' : 'block';
        });
        
        // 点击页面其他地方关闭菜单
        document.addEventListener('click', () => {
            moreMenu.style.display = 'none';
        });
        
        // 阻止菜单内部点击事件冒泡
        moreMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        editBtn.addEventListener('click', () => {
            closePage();
            this.showModal(note);
        });
        editBtnFooter.addEventListener('click', () => {
            closePage();
            this.showModal(note);
        });
        starBtn.addEventListener('click', () => {
            this.toggleStar(note.id);
            // 更新页面中的星星状态
            starBtn.classList.toggle('active');
            const title = starBtn.classList.contains('active') ? '取消收藏' : '收藏';
            starBtn.setAttribute('title', title);
        });
        
        // 搜索功能
        function highlightKeyword(keyword, html) {
            if (!keyword) return html;
            let matched = false;
            const replaced = html.replace(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), function(match) {
                matched = true;
                return '<span style="background:yellow;color:#d32f2f;">' + match + '</span>';
            });
            return { html: replaced, matched };
        }
        
        searchBtn.addEventListener('click', () => {
            const kw = searchInput.value.trim();
            const result = highlightKeyword(kw, `${this.renderNoteContent(note.content)}`);
            if (kw && !result.matched) {
                contentDiv.innerHTML = '<div style="color:#d32f2f;padding:24px 0;text-align:center;">未找到相关内容</div>';
            } else {
                contentDiv.innerHTML = result.html;
            }
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
        
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            contentDiv.innerHTML = this.renderNoteContent(note.content);
        });
        
        // 复制功能 - 顶部复制按钮复制完整信息
        const copyNoteContent = () => {
            // 只复制笔记内容，不复制其他信息
            const text = note.content;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showCopySuccessToast('笔记内容已复制到剪贴板 ✓');
                }).catch(() => {
                    this.showCopyErrorToast('复制失败，请手动复制');
                });
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    this.showCopySuccessToast('笔记内容已复制到剪贴板 ✓');
                } catch (e) {
                    this.showCopyErrorToast('复制失败，请手动复制');
                }
                document.body.removeChild(textarea);
            }
        };

        // 顶部复制功能 - 复制完整笔记信息
        const copyFullNoteInfo = () => {
            let text = '';
            text += `📒 标题：${note.title}\n`;
            text += `📝 内容：${note.content}\n`;
            if (note.tags && note.tags.length > 0) {
                text += `🏷️ 标签：${note.tags.join(', ')}\n`;
            }
            text += `⏰ 创建时间：${new Date(note.createTime).toLocaleString('zh-CN')}\n`;
            if (note.updateTime && note.updateTime !== note.createTime) {
                text += `🔄 更新时间：${new Date(note.updateTime).toLocaleString('zh-CN')}\n`;
            }
            text += `⭐ 收藏状态：${note.starred ? '已收藏' : '未收藏'}\n`;
            text += `📱 来源：有数规划日程\n`;
            text += `✨ 祝你生活愉快！`;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showCopySuccessToast('完整笔记信息已复制到剪贴板 ✓');
                }).catch(() => {
                    this.showCopyErrorToast('复制失败，请手动复制');
                });
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    this.showCopySuccessToast('完整笔记信息已复制到剪贴板 ✓');
                } catch (e) {
                    this.showCopyErrorToast('复制失败，请手动复制');
                }
                document.body.removeChild(textarea);
            }
        };
        
        // 绑定复制按钮事件
        copyBtn.addEventListener('click', copyFullNoteInfo); // 顶部复制按钮复制完整信息
        contentCopyBtn.addEventListener('click', copyNoteContent); // 内容区域复制按钮只复制内容
        
        // 分享功能
        const shareNoteContent = () => {
            let text = '';
            text += `📒 标题：${note.title}\n`;
            text += `📝 内容：${note.content}\n`;
            if (note.tags && note.tags.length > 0) {
                text += `🏷️ 标签：${note.tags.map(tag=>`#${tag}`).join('、')}\n`;
            }
            text += `⏰ 创建时间：${new Date(note.createTime).toLocaleString('zh-CN')}\n`;
            if (note.updateTime && note.updateTime !== note.createTime) {
                text += `🔄 更新时间：${new Date(note.updateTime).toLocaleString('zh-CN')}\n`;
            }
            text += `⭐ 收藏状态：${note.starred ? '已收藏' : '未收藏'}\n`;
            text += `📱 来源：有数规划日程\n`;
            text += `✨ 祝你生活愉快！`;
            
            if (window.plus && plus.share && plus.share.sendWithSystem) {
                plus.share.sendWithSystem({content: text}, function(){}, function(e){
                    alert('系统分享失败：'+JSON.stringify(e));
                });
            } else if (navigator.share) {
                navigator.share({title: note.title, text: text});
            } else {
                copyFullNoteInfo(); // 分享失败时复制完整信息
            }
        };
        
        // 绑定分享按钮事件
        shareBtn.addEventListener('click', shareNoteContent);
        contentShareBtn.addEventListener('click', shareNoteContent);
        
        // 添加基础文本选择支持，移除复杂的格式保持功能
        this.addBasicTextSelection(contentDiv);
    },

    /**
     * 添加基础文本选择支持
     */
    addBasicTextSelection(contentDiv) {
        // 保留基础的文本选择功能，但移除复杂的格式保持功能
        // 这里可以添加一些简单的文本选择增强功能，如显示选中文本的字符数等
        
        // 监听选择变化事件
        const selectionHandler = () => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            // 可以在这里添加一些基础的文本选择反馈，比如显示选中文本的字符数
            // 但不添加复杂的格式化功能
        };
        
        document.addEventListener('selectionchange', selectionHandler);
        
        // 返回清理函数
        return {
            destroy: () => {
                // 移除事件监听器
                document.removeEventListener('selectionchange', selectionHandler);
            }
        };
    },
    
    /**
     * 备用复制方法
     */
    fallbackCopyTextToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('复制失败:', err);
        }
        document.body.removeChild(textarea);
    },
    
    /**
     * 显示复制成功提示
     */
    showCopySuccessToast(message) {
        // 移除已存在的提示
        const existingToast = document.querySelector('.copy-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = 'copy-toast copy-toast-success';
        toast.innerHTML = `
            <div class="copy-toast-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .copy-toast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #4caf50;
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                font-size: 14px;
                font-weight: 500;
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
                max-width: 90vw;
                text-align: center;
            }

            .copy-toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            .copy-toast-content {
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
            }

            .copy-toast-success {
                background: linear-gradient(135deg, #4caf50, #45a049);
            }

            .copy-toast i {
                font-size: 16px;
            }

            @media (max-width: 480px) {
                .copy-toast {
                    font-size: 13px;
                    padding: 10px 16px;
                    top: 15px;
                }
            }
        `;

        // 添加样式到页面
        if (!document.querySelector('#copy-toast-styles')) {
            style.id = 'copy-toast-styles';
            document.head.appendChild(style);
        }

        // 添加到页面
        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },
    
    // 移除了高亮标记相关的功能，保持简洁的文本显示
    
    /**
     * 显示文本导入模态框
     */
    showImportModal() {
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.id = 'note-import-modal';
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3>文本导入笔记</h3>
                    <button class="note-modal-close" id="note-import-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label>导入格式说明：</label>
                        <div style="background-color: var(--card-bg-color, #f8f9fa); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary-color, #666666);">
                            标题 | 内容 | 标签1,标签2<br>
                            例如：<br>
                            会议记录 | 今天讨论了项目进度... | 工作,会议<br>
                            学习笔记 | 学习了JavaScript的... | 学习,编程
                        </div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-import-text">导入内容：</label>
                        <textarea id="note-import-text" class="note-form-textarea" 
                                  placeholder="请按照上述格式输入笔记内容，每行一个笔记"></textarea>
                    </div>
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-import-cancel">取消</button>
                    <button class="note-modal-btn primary" id="note-import-confirm">导入</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定事件
        const closeBtn = modal.querySelector('#note-import-close');
        const cancelBtn = modal.querySelector('#note-import-cancel');
        const confirmBtn = modal.querySelector('#note-import-confirm');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', () => {
            this.importNotes(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    },

    /**
     * 导入笔记
     */
    importNotes(modal) {
        const textarea = modal.querySelector('#note-import-text');
        const content = textarea.value.trim();
        
        if (!content) {
            UIManager.showNotification('请输入要导入的内容', 'warning');
            return;
        }
        
        const lines = content.split('\n').filter(line => line.trim());
        const data = StorageManager.getData();
        if (!data.notes) {
            data.notes = [];
        }
        
        let successCount = 0;
        const now = new Date().toISOString();
        
        lines.forEach(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 2) {
                const title = parts[0];
                const content = parts[1];
                const tags = parts[2] ? parts[2].split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                
                if (title && content) {
                    const newNote = {
                        id: this.generateId(),
                        title,
                        content,
                        tags,
                        createTime: now,
                        updateTime: now,
                        starred: false
                    };
                    data.notes.push(newNote);
                    successCount++;
                }
            }
        });
        
        StorageManager.saveData(data);
        this.loadNotes();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        modal.remove();
        UIManager.showNotification(`成功导入 ${successCount} 个笔记`, 'success');
    },

    /**
     * 显示文件导入模态框
     */
    showFileImportModal() {
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.id = 'note-file-import-modal';
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3>文件导入笔记</h3>
                    <button class="note-modal-close" id="note-file-import-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label>支持的文件格式：</label>
                        <div style="background-color: var(--card-bg-color, #f8f9fa); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary-color, #666666);">
                            • Markdown (.md) - 支持格式化和链接<br>
                            • Word文档 (.docx, .doc) - 自动提取文本内容<br>
                            • 纯文本 (.txt) - 直接导入文本内容<br>
                            • 多个文件可同时选择导入
                        </div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-file-input">选择文件：</label>
                        <input type="file" id="note-file-input" class="note-form-input" 
                               accept=".md,.docx,.doc,.txt" multiple>
                        <p class="input-hint">支持的文件格式：.md, .docx, .doc, .txt</p>
                    </div>
                    <div class="note-form-group">
                        <label>导入预览：</label>
                        <div id="file-import-preview" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color, #e0e0e0); border-radius: 8px; padding: 12px; background-color: var(--card-bg-color, #f8f9fa);">
                            <p style="color: var(--text-secondary-color, #999999); text-align: center;">选择文件后将显示预览</p>
                        </div>
                    </div>
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-file-import-cancel">取消</button>
                    <button class="note-modal-btn primary" id="note-file-import-confirm" disabled>导入</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定事件
        const closeBtn = modal.querySelector('#note-file-import-close');
        const cancelBtn = modal.querySelector('#note-file-import-cancel');
        const confirmBtn = modal.querySelector('#note-file-import-confirm');
        const fileInput = modal.querySelector('#note-file-input');
        const preview = modal.querySelector('#file-import-preview');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files, preview, confirmBtn);
        });
        
        // 确认导入
        confirmBtn.addEventListener('click', () => {
            this.importFiles(fileInput.files, modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    },

    /**
     * 处理文件选择
     */
    async handleFileSelection(files, preview, confirmBtn) {
        if (!files || files.length === 0) {
            preview.innerHTML = '<p style="color: var(--text-secondary-color, #999999); text-align: center;">选择文件后将显示预览</p>';
            confirmBtn.disabled = true;
            return;
        }
        
        confirmBtn.disabled = true;
        preview.innerHTML = '<p style="color: var(--text-secondary-color, #666666); text-align: center;">正在解析文件...</p>';
        
        try {
            const fileInfos = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const content = await this.parseFile(file);
                fileInfos.push({
                    name: file.name,
                    content: content,
                    size: file.size
                });
            }
            
            // 显示预览
            this.showFilePreview(fileInfos, preview);
            confirmBtn.disabled = false;
            
        } catch (error) {
            console.error('文件解析失败:', error);
            preview.innerHTML = `<p style="color: var(--danger-color, #ea4335); text-align: center;">文件解析失败: ${error.message}</p>`;
            confirmBtn.disabled = true;
        }
    },

    /**
     * 解析文件内容
     */
    async parseFile(file) {
        const extension = file.name.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'md':
                return await this.parseMarkdownFile(file);
            case 'docx':
                return await this.parseDocxFile(file);
            case 'doc':
                return await this.parseDocFile(file);
            case 'txt':
                return await this.parseTxtFile(file);
            default:
                throw new Error(`不支持的文件格式: ${extension}`);
        }
    },

    /**
     * 解析Markdown文件
     */
    async parseMarkdownFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    // 提取标题（第一个#开头的行）
                    const titleMatch = content.match(/^#\s+(.+)$/m);
                    const title = titleMatch ? titleMatch[1].trim() : file.name.replace('.md', '');
                    
                    // 提取标签（从文件名或内容中）
                    const tags = this.extractTagsFromContent(content);
                    
                    resolve({
                        title: title,
                        content: content,
                        tags: tags
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    },

    /**
     * 解析DOCX文件
     */
    async parseDocxFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            
            const content = result.value;
            const title = this.extractTitleFromContent(content) || file.name.replace('.docx', '');
            const tags = this.extractTagsFromContent(content);
            
            return {
                title: title,
                content: content,
                tags: tags
            };
        } catch (error) {
            throw new Error(`DOCX文件解析失败: ${error.message}`);
        }
    },

    /**
     * 解析DOC文件（降级为二进制处理）
     */
    async parseDocFile(file) {
        // DOC文件比较复杂，这里提供一个基本的文本提取
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // 简单的文本提取（可能不完整）
                    const content = this.extractTextFromBinary(e.target.result);
                    const title = this.extractTitleFromContent(content) || file.name.replace('.doc', '');
                    const tags = this.extractTagsFromContent(content);
                    
                    resolve({
                        title: title,
                        content: content,
                        tags: tags
                    });
                } catch (error) {
                    reject(new Error(`DOC文件解析失败: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * 解析TXT文件
     */
    async parseTxtFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const title = this.extractTitleFromContent(content) || file.name.replace('.txt', '');
                    const tags = this.extractTagsFromContent(content);
                    
                    resolve({
                        title: title,
                        content: content,
                        tags: tags
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    },

    /**
     * 从内容中提取标题
     */
    extractTitleFromContent(content) {
        // 查找第一行非空内容作为标题
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // 如果第一行太长，截取前50个字符
            return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
        }
        return null;
    },

    /**
     * 从内容中提取标签
     */
    extractTagsFromContent(content) {
        const tags = [];
        
        // 查找#标签
        const hashTags = content.match(/#(\w+)/g);
        if (hashTags) {
            tags.push(...hashTags.map(tag => tag.substring(1)));
        }
        
        // 查找[标签]格式
        const bracketTags = content.match(/\[([^\]]+)\]/g);
        if (bracketTags) {
            tags.push(...bracketTags.map(tag => tag.substring(1, tag.length - 1)));
        }
        
        return tags.slice(0, 5); // 最多5个标签
    },

    /**
     * 从二进制数据中提取文本（用于DOC文件）
     */
    extractTextFromBinary(arrayBuffer) {
        const uint8Array = new Uint8Array(arrayBuffer);
        let text = '';
        
        // 简单的文本提取（查找可打印字符）
        for (let i = 0; i < uint8Array.length; i++) {
            const byte = uint8Array[i];
            if (byte >= 32 && byte <= 126) { // 可打印ASCII字符
                text += String.fromCharCode(byte);
            } else if (byte === 10 || byte === 13) { // 换行符
                text += '\n';
            }
        }
        
        return text;
    },

    /**
     * 显示文件预览
     */
    showFilePreview(fileInfos, preview) {
        let previewHTML = '<div style="font-size: 12px;">';
        
        fileInfos.forEach((fileInfo, index) => {
            previewHTML += `
                <div style="margin-bottom: 15px; padding: 10px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; background-color: var(--bg-color, #ffffff);">
                    <div style="font-weight: bold; color: var(--text-color, #333333); margin-bottom: 5px;">
                        📄 ${fileInfo.name} (${this.formatFileSize(fileInfo.size)})
                    </div>
                    <div style="color: var(--text-secondary-color, #666666); margin-bottom: 5px;">
                        <strong>标题:</strong> ${this.escapeHtml(fileInfo.content.title)}
                    </div>
                    <div style="color: var(--text-secondary-color, #666666); margin-bottom: 5px;">
                        <strong>标签:</strong> ${fileInfo.content.tags.length > 0 ? fileInfo.content.tags.map(tag => `<span style="background-color: var(--primary-color-light, rgba(66, 133, 244, 0.1)); color: var(--primary-color, #4285f4); padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px;">${this.escapeHtml(tag)}</span>`).join('') : '无'}
                    </div>
                    <div style="color: var(--text-secondary-color, #666666);">
                        <strong>内容预览:</strong> ${this.escapeHtml(fileInfo.content.content.substring(0, 100))}${fileInfo.content.content.length > 100 ? '...' : ''}
                    </div>
                </div>
            `;
        });
        
        previewHTML += '</div>';
        preview.innerHTML = previewHTML;
    },

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 导入文件
     */
    async importFiles(files, modal) {
        if (!files || files.length === 0) {
            UIManager.showNotification('请选择要导入的文件', 'warning');
            return;
        }
        
        const data = StorageManager.getData();
        if (!data.notes) {
            data.notes = [];
        }
        
        let successCount = 0;
        const now = new Date().toISOString();
        
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileContent = await this.parseFile(file);
                
                const newNote = {
                    id: this.generateId(),
                    title: fileContent.title,
                    content: fileContent.content,
                    tags: fileContent.tags,
                    createTime: now,
                    updateTime: now,
                    sourceFile: file.name,
                    starred: false
                };
                
                data.notes.push(newNote);
                successCount++;
            }
            
            StorageManager.saveData(data);
            this.loadNotes();
            
            // 更新快速导航计数
            if (window.QuickNavManager) {
                QuickNavManager.updateCounts();
            }
            
            modal.remove();
            UIManager.showNotification(`成功导入 ${successCount} 个笔记`, 'success');
            
        } catch (error) {
            console.error('文件导入失败:', error);
            UIManager.showNotification(`文件导入失败: ${error.message}`, 'error');
        }
    },

    /**
     * 显示文本编辑模态框
     */
    showEditModal() {
        const data = StorageManager.getData();
        const notes = data.notes || [];
        
        if (notes.length === 0) {
            UIManager.showNotification('没有笔记可以编辑', 'warning');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.id = 'note-edit-modal';
        
        const notesText = notes.map(note => {
            const tags = note.tags && note.tags.length > 0 ? note.tags.join(',') : '';
            return `${note.title} | ${note.content} | ${tags}`;
        }).join('\n');
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3>文本编辑笔记</h3>
                    <button class="note-modal-close" id="note-edit-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label>编辑格式说明：</label>
                        <div style="background-color: var(--card-bg-color, #f8f9fa); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary-color, #666666);">
                            标题 | 内容 | 标签1,标签2<br>
                            每行一个笔记，修改后点击保存即可更新
                        </div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-edit-text">编辑内容：</label>
                        <textarea id="note-edit-text" class="note-form-textarea">${notesText}</textarea>
                    </div>
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-edit-cancel">取消</button>
                    <button class="note-modal-btn primary" id="note-edit-confirm">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定事件
        const closeBtn = modal.querySelector('#note-edit-close');
        const cancelBtn = modal.querySelector('#note-edit-cancel');
        const confirmBtn = modal.querySelector('#note-edit-confirm');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', () => {
            this.editNotes(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    },

    /**
     * 编辑笔记
     */
    editNotes(modal) {
        const textarea = modal.querySelector('#note-edit-text');
        const content = textarea.value.trim();
        
        if (!content) {
            UIManager.showNotification('请输入笔记内容', 'warning');
            return;
        }
        
        const lines = content.split('\n').filter(line => line.trim());
        const data = StorageManager.getData();
        data.notes = [];
        
        let successCount = 0;
        const now = new Date().toISOString();
        
        lines.forEach(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 2) {
                const title = parts[0];
                const content = parts[1];
                const tags = parts[2] ? parts[2].split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                
                if (title && content) {
                    const newNote = {
                        id: this.generateId(),
                        title,
                        content,
                        tags,
                        createTime: now,
                        updateTime: now
                    };
                    data.notes.push(newNote);
                    successCount++;
                }
            }
        });
        
        StorageManager.saveData(data);
        this.loadNotes();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        modal.remove();
        UIManager.showNotification(`成功更新 ${successCount} 个笔记`, 'success');
    },

    /**
     * 切换到编辑模式
     */
    switchToEditMode(editBtn, previewBtn, textarea, previewDiv) {
        editBtn.classList.add('active');
        previewBtn.classList.remove('active');
        
        textarea.style.display = 'block';
        previewDiv.style.display = 'none';
        textarea.focus();
    },

    /**
     * 切换到预览模式
     */
    switchToPreviewMode(editBtn, previewBtn, textarea, previewDiv) {
        previewBtn.classList.add('active');
        editBtn.classList.remove('active');
        
        textarea.style.display = 'none';
        previewDiv.style.display = 'block';
        
        // 渲染Markdown预览
        const content = textarea.value;
        previewDiv.innerHTML = this.renderNoteContent(content);
        
        // 添加触摸屏友好的滚动
        this.enableTouchScrolling(previewDiv);
    },

    /**
     * 启用触摸屏友好的滚动
     */
    enableTouchScrolling(element) {
        // 为触摸屏设备优化滚动体验
        if ('ontouchstart' in window) {
            element.style.webkitOverflowScrolling = 'touch';
            element.style.overscrollBehavior = 'contain';
        }
    },

    /**
     * 渲染笔记内容（支持Markdown）
     */
    renderNoteContent(content) {
        if (!content || !content.trim()) {
            return '<div class="empty-content"><i class="fas fa-file-alt"></i><p>暂无内容</p></div>';
        }
        
        try {
            // 配置Markdown解析选项
            marked.setOptions({
                breaks: true, // 支持换行
                gfm: true,   // 支持GitHub风格Markdown
                headerIds: true, // 为标题添加ID
                mangle: false,   // 不转义HTML
                sanitize: false  // 允许HTML标签
            });
            
            // 预处理内容，规范化换行符
            let processedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            
            // 处理多个连续的换行符，避免产生过多的空行
            processedContent = processedContent.replace(/\n{3,}/g, '\n\n');
            
            // 渲染Markdown
            const htmlContent = marked.parse(processedContent);
            
            // 添加触摸屏友好的交互元素
            const enhancedContent = this.enhanceMarkdownContent(htmlContent);
            
            // 确保内容容器启用触摸屏滚动
            const previewDiv = document.querySelector('#note-detail-content');
            if (previewDiv) {
                this.enableTouchScrolling(previewDiv);
            }
            
            return enhancedContent;
        } catch (error) {
            console.error('Markdown解析失败:', error);
            // 如果Markdown解析失败，显示原始文本
            return `<div class="fallback-content"><pre>${this.escapeHtml(content)}</pre></div>`;
        }
    },

    /**
     * 增强Markdown内容，添加触摸屏友好的功能
     */
    enhanceMarkdownContent(htmlContent) {
        // 创建临时容器
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // 改进段落处理 - 确保段落有适当的类名和属性
        const paragraphs = tempDiv.querySelectorAll('p');
        paragraphs.forEach((p, index) => {
            // 为每个段落添加唯一的标识符
            p.setAttribute('data-paragraph-id', `para-${index}`);
            
            // 确保段落有适当的间距
            if (!p.style.marginBottom) {
                p.style.marginBottom = '1em';
            }
            
            // 添加段落类名便于样式控制
            p.classList.add('note-paragraph');
        });
        
        // 优化段落间距，移除多余的空段落
        this.optimizeParagraphSpacing(tempDiv);
        
        // 为代码块添加复制按钮
        const codeBlocks = tempDiv.querySelectorAll('pre code');
        codeBlocks.forEach((codeBlock, index) => {
            const pre = codeBlock.parentElement;
            const copyBtn = document.createElement('button');
            copyBtn.className = 'code-copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.title = '复制代码';
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyToClipboard(codeBlock.textContent);
                this.showCopyFeedback(copyBtn);
            });
            
            // 确保pre元素有相对定位
            if (pre.style.position !== 'relative') {
                pre.style.position = 'relative';
            }
            
            pre.appendChild(copyBtn);
        });
        
        // 为表格添加触摸屏友好的滚动
        const tables = tempDiv.querySelectorAll('table');
        tables.forEach(table => {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            wrapper.style.overflowX = 'auto';
            wrapper.style.webkitOverflowScrolling = 'touch';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
        
        // 为链接添加触摸屏友好的样式
        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
        
        // 确保所有文本节点都在适当的块级元素中
        this.wrapTextNodesInParagraphs(tempDiv);
        
        return tempDiv.innerHTML;
    },

    /**
     * 优化段落间距，移除多余的空段落
     */
    optimizeParagraphSpacing(container) {
        // 获取所有段落元素
        const paragraphs = Array.from(container.querySelectorAll('p'));
        
        // 遍历段落，移除视觉上为空的段落
        paragraphs.forEach(p => {
            // 移除只包含空格、&nbsp; 或 <br> 的段落
            if (/^(\s|&nbsp;|<br\s*\/?>)*$/.test(p.innerHTML.trim())) {
                p.remove();
            }
        });
        
        // 处理连续的br标签，避免过多的空行
        const brTags = Array.from(container.querySelectorAll('br'));
        let consecutiveBrCount = 0;
        let brGroupStart = null;
        
        brTags.forEach((br, index) => {
            // 检查是否是连续的br标签
            if (index > 0 && br.previousElementSibling === brTags[index - 1]) {
                consecutiveBrCount++;
                if (consecutiveBrCount === 1) {
                    brGroupStart = brTags[index - 1];
                }
            } else {
                // 结束当前组，如果超过2个br则只保留2个
                if (consecutiveBrCount > 1) {
                    // 保留最多2个br标签
                    let brToRemove = consecutiveBrCount - 1; // 保留1个，移除其余的
                    while (brToRemove > 0 && brGroupStart.nextSibling && brGroupStart.nextSibling.tagName === 'BR') {
                        const nextBr = brGroupStart.nextSibling;
                        nextBr.remove();
                        brToRemove--;
                    }
                }
                
                // 重置计数器
                consecutiveBrCount = 0;
                brGroupStart = null;
            }
        });
        
        // 处理最后一组
        if (consecutiveBrCount > 1 && brGroupStart) {
            let brToRemove = consecutiveBrCount - 1; // 保留1个，移除其余的
            while (brToRemove > 0 && brGroupStart.nextSibling && brGroupStart.nextSibling.tagName === 'BR') {
                const nextBr = brGroupStart.nextSibling;
                nextBr.remove();
                brToRemove--;
            }
        }
    },

    /**
     * 将文本节点包装在段落标签中
     */
    wrapTextNodesInParagraphs(container) {
        // 获取所有直接子文本节点
        const childNodes = Array.from(container.childNodes);
        
        let currentParagraph = null;
        
        childNodes.forEach(node => {
            // 如果是文本节点
            if (node.nodeType === Node.TEXT_NODE) {
                // 检查是否包含非空白字符
                if (node.textContent.trim()) {
                    // 如果当前没有段落，创建一个新段落
                    if (!currentParagraph) {
                        currentParagraph = document.createElement('p');
                        currentParagraph.className = 'note-paragraph';
                        node.parentNode.insertBefore(currentParagraph, node);
                    }
                    
                    // 将文本节点移动到当前段落中
                    currentParagraph.appendChild(node);
                }
                // 如果是纯空白文本节点，检查是否包含换行符
                else if (node.textContent.includes('\n')) {
                    // 只有当当前段落有内容时才结束段落
                    if (currentParagraph && currentParagraph.textContent.trim()) {
                        currentParagraph = null;
                    }
                }
            } 
            // 如果是块级元素，重置当前段落
            else if (node.nodeType === Node.ELEMENT_NODE && 
                     ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'pre', 'blockquote', 'table', 'hr'].includes(node.tagName.toLowerCase())) {
                // 只有当当前段落有内容时才结束段落
                if (currentParagraph && currentParagraph.textContent.trim()) {
                    currentParagraph = null;
                }
            }
        });
        
        // 移除空的段落元素
        const emptyParagraphs = container.querySelectorAll('p.note-paragraph:empty');
        emptyParagraphs.forEach(p => p.remove());
    },

    /**
     * 复制文本到剪贴板
     */
    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('代码已复制到剪贴板');
            }).catch(err => {
                console.error('复制失败:', err);
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    },

    /**
     * 备用复制方法
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
            console.log('代码已复制到剪贴板');
        } catch (err) {
            console.error('复制失败:', err);
        }
        
        document.body.removeChild(textArea);
    },

    /**
     * 显示复制反馈
     */
    showCopyFeedback(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.background = 'var(--success-color, #4caf50)';
        button.style.color = 'white';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
            button.style.color = '';
        }, 2000);
    },

    /**
     * 显示复制成功提示
     */
    showCopySuccessToast(message) {
        this.showToast(message, 'success');
    },

    /**
     * 显示复制错误提示
     */
    showCopyErrorToast(message) {
        this.showToast(message, 'error');
    },

    /**
     * 显示提示消息
     */
    showToast(message, type = 'success') {
        // 移除已存在的提示
        const existingToast = document.querySelector('.copy-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `copy-toast copy-toast-${type}`;
        toast.innerHTML = `
            <div class="copy-toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .copy-toast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: ${type === 'success' ? '#4caf50' : '#f44336'};
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                font-size: 14px;
                font-weight: 500;
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
                max-width: 90vw;
                text-align: center;
            }

            .copy-toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            .copy-toast-content {
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
            }

            .copy-toast-success {
                background: linear-gradient(135deg, #4caf50, #45a049);
            }

            .copy-toast-error {
                background: linear-gradient(135deg, #f44336, #e53935);
            }

            .copy-toast i {
                font-size: 16px;
            }

            @media (max-width: 480px) {
                .copy-toast {
                    font-size: 13px;
                    padding: 10px 16px;
                    top: 15px;
                }
            }

            /* 深色主题适配 */
            .dark-theme .copy-toast-success {
                background: linear-gradient(135deg, #66bb6a, #4caf50);
            }

            .dark-theme .copy-toast-error {
                background: linear-gradient(135deg, #ef5350, #f44336);
            }
        `;

        // 添加样式到页面
        if (!document.querySelector('#copy-toast-styles')) {
            style.id = 'copy-toast-styles';
            document.head.appendChild(style);
        }

        // 添加到页面
        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },

    /**
     * 转义HTML字符
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 收藏/取消收藏
     */
    toggleStar(noteId) {
        const data = StorageManager.getData();
        const note = data.notes.find(n => n.id === noteId);
        if (note) {
            note.starred = !note.starred;
            note.updateTime = new Date().toISOString();
            StorageManager.saveData(data);
            this.loadNotes();
        }
    },

    /**
     * 通知筛选器更新标签按钮
     */
    notifyFilterManager() {
        if (window.notesFilterManager && typeof window.notesFilterManager.updateTagFilterButtons === 'function') {
            window.notesFilterManager.updateTagFilterButtons();
        }
    },

    /**
     * 筛选器回调：筛选已应用
     */
    onFiltersApplied(filteredNotes) {
        // 当筛选器应用筛选时，更新笔记列表显示
        if (filteredNotes && filteredNotes.length > 0) {
            // 筛选器已经处理了显示，这里不需要额外操作
            console.log(`筛选器已应用，显示 ${filteredNotes.length} 个笔记`);
        }
    },

    /**
     * 为笔记详情页启用触控滑动适配
     * @param {Element} detailPage 笔记详情页元素
     */
    enableTouchScrollForNoteDetailPage(detailPage) {
        // 获取主要的滚动容器
        const pageContent = detailPage.querySelector('.note-detail-page-content');
        const contentContainer = detailPage.querySelector('.note-detail-content');
        
        if (!pageContent) return;

        // 检查是否为触控设备
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;

        // 为页面内容容器添加触控滑动支持
        this.addTouchScrollSupport(pageContent, 'note-detail-page-content');
        
        // 为内容容器添加触控滑动支持（如果内容很长）
        if (contentContainer) {
            this.addTouchScrollSupport(contentContainer, 'note-detail-content');
        }
    },

    /**
     * 为指定容器添加触控滑动支持
     * @param {Element} container 容器元素
     * @param {string} containerType 容器类型标识
     */
    addTouchScrollSupport(container, containerType) {
        let startY = 0;
        let startScrollTop = 0;
        let isScrolling = false;

        // 触摸开始
        container.addEventListener('touchstart', function(e) {
            if (container.scrollHeight > container.clientHeight) {
                startY = e.touches[0].clientY;
                startScrollTop = container.scrollTop;
                isScrolling = true;
            }
        }, { passive: true });

        // 触摸移动
        container.addEventListener('touchmove', function(e) {
            if (!isScrolling) return;

            const currentY = e.touches[0].clientY;
            const deltaY = startY - currentY;

            // 检查滚动边界
            const atTop = container.scrollTop === 0;
            const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;

            // 如果在边界且继续向边界方向滑动，阻止默认行为防止穿透
            if ((atTop && deltaY < 0) || (atBottom && deltaY > 0)) {
                e.preventDefault();
            }

            // 阻止事件冒泡到父元素
            e.stopPropagation();
        }, { passive: false });

        // 触摸结束
        container.addEventListener('touchend', function(e) {
            isScrolling = false;
        }, { passive: true });

        // 添加触控友好的样式
        if (!container.classList.contains('touch-scroll-enabled')) {
            container.classList.add('touch-scroll-enabled');
            
            // 动态添加CSS样式
            if (!document.getElementById('note-detail-touch-scroll-styles')) {
                const style = document.createElement('style');
                style.id = 'note-detail-touch-scroll-styles';
                style.textContent = `
                  .touch-scroll-enabled {
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                    scroll-behavior: smooth;
                  }
                  
                  .note-detail-page-content.touch-scroll-enabled {
                    overflow-y: auto;
                    height: 100vh;
                    padding-bottom: 80px;
                  }
                  
                  .note-detail-content.touch-scroll-enabled {
                    overflow-y: auto;
                    max-height: none;
                  }
                  
                  .touch-scroll-enabled::-webkit-scrollbar {
                    width: 4px;
                  }
                  
                  .touch-scroll-enabled::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 2px;
                  }
                  
                  .touch-scroll-enabled::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 2px;
                  }
                  
                  .touch-scroll-enabled::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.5);
                  }
                  
                  /* 深色主题适配 */
                  body.dark-theme .touch-scroll-enabled::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                  }
                  
                  body.dark-theme .touch-scroll-enabled::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                  }
                  
                  body.dark-theme .touch-scroll-enabled::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                  }
                  
                  /* 移动端优化 */
                  @media (max-width: 768px) {
                    .note-detail-page-content.touch-scroll-enabled {
                      padding: 16px;
                      height: calc(100vh - 60px);
                      padding-bottom: 100px;
                    }
                    
                    .note-detail-content.touch-scroll-enabled {
                      padding: 16px;
                      line-height: 1.6;
                    }
                    
                    .touch-scroll-enabled::-webkit-scrollbar {
                      width: 6px;
                    }
                    
                    /* 为笔记详情内容添加触控友好的样式 */
                    .note-detail-content.touch-scroll-enabled p,
                    .note-detail-content.touch-scroll-enabled div {
                      margin-bottom: 12px;
                    }
                    
                    .note-detail-content.touch-scroll-enabled h1,
                    .note-detail-content.touch-scroll-enabled h2,
                    .note-detail-content.touch-scroll-enabled h3,
                    .note-detail-content.touch-scroll-enabled h4,
                    .note-detail-content.touch-scroll-enabled h5,
                    .note-detail-content.touch-scroll-enabled h6 {
                      margin: 16px 0 12px 0;
                    }
                    
                    /* 增强触控反馈 */
                    .note-detail-content.touch-scroll-enabled:active {
                      transform: scale(0.999);
                      transition: transform 0.1s ease;
                    }
                  }
                `;
                document.head.appendChild(style);
            }
        }
    },

    /**
     * 筛选器回调：筛选已清除
     */
    onFiltersCleared() {
        // 当筛选器清除筛选时，重新加载所有笔记
        console.log('筛选器已清除，重新加载所有笔记');
        this.loadNotes();
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待其他管理器初始化完成
    setTimeout(() => {
        NotesManager.init();
    }, 500);
});

// 导出到全局作用域
window.NotesManager = NotesManager; 