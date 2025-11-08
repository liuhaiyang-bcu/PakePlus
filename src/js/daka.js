// 打卡管理器，风格参考笔记功能
const DakaManager = {
    elements: {
        dakaList: null,
        emptyMessage: null,
        searchInput: null,
        addBtn: null,
        batchToggleBtn: null,
        batchDeleteBtn: null,
        importBtn: null,
        editBtn: null
    },
    batchMode: false,
    selectedDakas: new Set(),
    currentDaka: null,

    init() {
        this.initElements();
        this.bindEvents();
        this.loadDakas();
    },
    initElements() {
        this.elements.dakaList = document.getElementById('daka-list');
        this.elements.emptyMessage = document.getElementById('empty-daka-message');
        this.elements.searchInput = document.getElementById('daka-search-input');
        this.elements.addBtn = document.getElementById('add-daka-btn');
        this.elements.batchToggleBtn = document.getElementById('toggle-daka-batch-mode-btn');
        this.elements.batchDeleteBtn = document.getElementById('daka-batch-delete-btn');
        this.elements.importBtn = document.getElementById('import-daka-text-btn');
        this.elements.editBtn = document.getElementById('edit-daka-text-btn');
    },
    bindEvents() {
        if (this.elements.addBtn) {
            this.elements.addBtn.addEventListener('click', () => this.showModal());
        }
        if (this.elements.batchToggleBtn) {
            this.elements.batchToggleBtn.addEventListener('click', () => this.toggleBatchMode());
        }
        if (this.elements.batchDeleteBtn) {
            this.elements.batchDeleteBtn.addEventListener('click', () => this.batchDelete());
        }
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => this.searchDakas(e.target.value));
        }
        if (this.elements.importBtn) {
            this.elements.importBtn.addEventListener('click', () => this.showImportModal());
        }
        if (this.elements.editBtn) {
            this.elements.editBtn.addEventListener('click', () => this.showEditModal());
        }
        
        // 自动图片优化：页面加载时检查并优化
        this.autoOptimizeImages();
        window.addEventListener('storage', (e) => {
            if (e.key === 'appData') {
                this.loadDakas();
            }
        });
    },
    loadDakas() {
        const data = StorageManager.getData();
        const dakas = data.dakas || [];
        
        // 当打卡没有内容时隐藏筛选器
        const filterContainer = document.getElementById('daka-filter-container');
        if (filterContainer) {
            if (dakas.length === 0) {
                filterContainer.style.display = 'none';
            } else {
                filterContainer.style.display = 'block';
            }
        }
        
        if (dakas.length === 0) {
            this.elements.dakaList.style.display = 'none';
            this.elements.emptyMessage.style.display = 'block';
            return;
        }
        this.elements.dakaList.style.display = 'grid';
        this.elements.emptyMessage.style.display = 'none';
        this.elements.dakaList.innerHTML = '';
        // 收藏优先，时间倒序
        dakas.sort((a, b) => {
            if ((b.starred ? 1 : 0) !== (a.starred ? 1 : 0)) {
                return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
            }
            return new Date(b.createTime) - new Date(a.createTime);
        });
        dakas.forEach(daka => {
            const card = this.createDakaCard(daka);
            this.elements.dakaList.appendChild(card);
        });
        if (this.batchMode) {
            this.updateSelectAllButton();
        }
    },
    createDakaCard(daka) {
        const card = document.createElement('div');
        card.className = 'daka-card';
        card.setAttribute('data-daka-id', daka.id);
        const createDate = new Date(daka.createTime);
        const dateText = createDate.toLocaleDateString('zh-CN');
        const contentPreview = daka.content.replace(/<[^>]*>/g, '').substring(0, 150);
        const tagsHTML = daka.tags && daka.tags.length > 0
            ? daka.tags.map(tag => `<span class="daka-tag">${tag}</span>`).join('')
            : '';
        // 统计打卡
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        const totalCount = punchRecords.length;
        // 统计打卡天数（去重日期）
        const uniqueDays = new Set(punchRecords.map(r => r.date)).size;
        // 判断今日是否可打卡
        let hasToday = false;
        const today = new Date();
        if (daka.repeatType === 'yearly') {
            const ymd = today.toISOString().slice(5, 10); // MM-DD
            hasToday = punchRecords.some(r => (r.date||'').slice(5,10) === ymd);
        } else if (daka.repeatType === 'monthly') {
            const md = today.toISOString().slice(8, 10); // DD
            hasToday = punchRecords.some(r => (r.date||'').slice(8,10) === md && (r.date||'').slice(0,7) === today.toISOString().slice(0,7));
        } else {
            // 默认每天
            const todayStr = today.toISOString().slice(0, 10);
            hasToday = punchRecords.some(r => r.date === todayStr);
        }
        // 卡片内容
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
                <button class="daka-action-btn punch" ${hasToday ? 'disabled' : ''} title="${hasToday ? '今日已打卡' : '点击打卡'}">${hasToday ? '已打卡' : '今日打卡'}</button>
                <button class="daka-action-btn edit" title="编辑"><i class="fas fa-edit"></i></button>
                <button class="daka-action-btn share" title="分享"><i class="fas fa-share-alt"></i></button>
                <button class="daka-action-btn delete" title="删除"><i class="fas fa-trash"></i></button>
            </div>
        `;
        if (!this.batchMode) {
            const punchBtn = card.querySelector('.punch');
            const editBtn = card.querySelector('.edit');
            const shareBtn = card.querySelector('.share');
            const deleteBtn = card.querySelector('.delete');
            const starBtn = card.querySelector('.daka-star');
            
            if (punchBtn && !hasToday) {
                punchBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handlePunch(daka);
                });
            }
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showModal(daka);
            });
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareDaka(daka);
            });
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 新增：弹出确认对话框
                if (confirm('确定要删除本项目打卡吗？')) {
                    this.deleteDaka(daka.id);
                }
            });
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleStar(daka.id);
            });
            card.addEventListener('click', (e) => {
                // 避免点击按钮时也触发详情
                if (e.target.closest('.daka-action-btn') || e.target.closest('.daka-star')) return;
                this.showDetailModal(daka);
            });
        } else {
            // 批量选择模式，显示复选框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'daka-checkbox-input';
            checkbox.checked = this.selectedDakas.has(daka.id);
            checkbox.onclick = (e) => {
                e.stopPropagation();
                this.toggleDakaSelection(daka.id, checkbox.checked);
            };
            card.querySelector('.daka-checkbox').appendChild(checkbox);
            card.onclick = (e) => {
                if (e.target === checkbox) return;
                checkbox.checked = !checkbox.checked;
                this.toggleDakaSelection(daka.id, checkbox.checked);
            };
            if (this.selectedDakas.has(daka.id)) card.classList.add('selected');
        }
        // 批量选择逻辑可后续补充
        return card;
    },
    showModal(daka = null) {
        this.currentDaka = daka;
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.id = 'daka-modal';
        const isEdit = !!daka;
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>${isEdit ? '编辑打卡' : '新建打卡'}</h3>
                    <button class="daka-modal-close" id="daka-modal-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label for="daka-title">标题</label>
                        <input type="text" id="daka-title" class="daka-form-input" placeholder="请输入打卡标题" value="${daka ? this.escapeHtml(daka.title) : ''}">
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-repeat-type">打卡规则</label>
                        <select id="daka-repeat-type" class="daka-form-input">
                            <option value="daily" ${!daka||daka.repeatType==='daily'?'selected':''}>每天打卡</option>
                            <option value="monthly" ${daka&&daka.repeatType==='monthly'?'selected':''}>每月打卡</option>
                            <option value="yearly" ${daka&&daka.repeatType==='yearly'?'selected':''}>每年打卡</option>
                        </select>
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-time-range">打卡预定时间范围</label>
                        <div class="daka-time-range">
                            <input type="datetime-local" id="daka-start-time" class="daka-form-input" value="${daka && daka.startTime ? daka.startTime : ''}">
                            <span class="time-separator">至</span>
                            <input type="datetime-local" id="daka-end-time" class="daka-form-input" value="${daka && daka.endTime ? daka.endTime : ''}">
                        </div>
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-content">内容</label>
                        <textarea id="daka-content" class="daka-form-textarea" placeholder="请输入打卡内容">${daka ? this.escapeHtml(daka.content) : ''}</textarea>
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-tags">标签</label>
                        <input type="text" id="daka-tags" class="daka-form-input" placeholder="请输入标签，用逗号分隔" value="${daka && daka.tags ? daka.tags.join(', ') : ''}">
                    </div>
                </div>
                <div class="daka-modal-actions">
                    ${isEdit ? '<button class="daka-modal-btn danger" id="daka-clear-btn">清除打卡记录</button>' : ''}
                    <button class="daka-modal-btn secondary" id="daka-cancel-btn">取消</button>
                    <button class="daka-modal-btn primary" id="daka-save-btn">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        this.bindModalEvents(modal);
        setTimeout(() => {
            document.getElementById('daka-title').focus();
        }, 100);
    },
    bindModalEvents(modal) {
        const closeBtn = modal.querySelector('#daka-modal-close');
        const cancelBtn = modal.querySelector('#daka-cancel-btn');
        const saveBtn = modal.querySelector('#daka-save-btn');
        const deleteBtn = modal.querySelector('#daka-delete-btn');
        const clearBtn = modal.querySelector('#daka-clear-btn');
        const repeatTypeInput = modal.querySelector('#daka-repeat-type');
        const closeModal = () => {
            // 先移除动画类，然后隐藏模态框
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                this.currentDaka = null;
            }, 300); // 等待动画完成
        };
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        saveBtn.addEventListener('click', () => {
            this.saveDaka(modal);
        });
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.currentDaka) {
                    // 修复：弹出确认对话框
                    if (confirm('确定要删除本项目打卡吗？')) {
                        this.deleteDaka(this.currentDaka.id);
                        closeModal();
                    }
                }
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (this.currentDaka) {
                    this.clearPunchRecords(this.currentDaka.id);
                    closeModal();
                }
            });
        }
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.saveDaka(modal);
            }
        });
    },
    saveDaka(modal) {
        const titleInput = modal.querySelector('#daka-title');
        const contentInput = modal.querySelector('#daka-content');
        const tagsInput = modal.querySelector('#daka-tags');
        const startTimeInput = modal.querySelector('#daka-start-time');
        const endTimeInput = modal.querySelector('#daka-end-time');
        const repeatTypeInput = modal.querySelector('#daka-repeat-type');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const repeatType = repeatTypeInput ? repeatTypeInput.value : 'daily';
        if (!title) {
            if (window.UIManager) UIManager.showNotification('请输入打卡标题', 'warning');
            titleInput.focus();
            return;
        }
        if (!content) {
            if (window.UIManager) UIManager.showNotification('请输入打卡内容', 'warning');
            contentInput.focus();
            return;
        }
        // 允许不填写时间范围
        // if (!startTime || !endTime) {
        //     if (window.UIManager) UIManager.showNotification('请选择打卡时间范围', 'warning');
        //     startTimeInput.focus();
        //     return;
        // }
        if (startTime && endTime && startTime > endTime) {
            if (window.UIManager) UIManager.showNotification('开始时间不能晚于结束时间', 'warning');
            startTimeInput.focus();
            return;
        }
        const data = StorageManager.getData();
        if (!data.dakas) data.dakas = [];
        const now = new Date().toISOString();
        if (this.currentDaka) {
            // 编辑
            const idx = data.dakas.findIndex(d => d.id === this.currentDaka.id);
            if (idx !== -1) {
                data.dakas[idx] = {
                    ...this.currentDaka,
                    title,
                    content,
                    tags,
                    startTime,
                    endTime,
                    repeatType,
                    updateTime: now
                    // 保持原有的starred状态
                };
            }
        } else {
            // 新建
            const newDaka = {
                id: this.generateId(),
                title,
                content,
                tags,
                startTime,
                endTime,
                repeatType,
                createTime: now,
                updateTime: now,
                punchRecords: [],
                starred: false // 新增：收藏状态字段
            };
            data.dakas.push(newDaka);
        }
        StorageManager.saveData(data);
        this.loadDakas();
        if (window.QuickNavManager) QuickNavManager.updateCounts();
        modal.remove();
        this.currentDaka = null;
        if (window.UIManager) UIManager.showNotification('打卡保存成功', 'success');
    },
    deleteDaka(dakaId) {
        let data = StorageManager.getData();
        // 修复：真正删除daka
        data.dakas = (data.dakas || []).filter(d => d.id !== dakaId);
        StorageManager.saveData(data);
        this.loadDakas();
    },
    shareDaka(daka) {
        // 整理分享文本
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        const totalCount = punchRecords.length;
        const uniqueDays = new Set(punchRecords.map(r => r.date)).size;

        let shareText = `🏅【打卡】${daka.title}\n\n`;
        shareText += `📝 ${daka.content}\n\n`;
        if (daka.tags && daka.tags.length > 0) {
            shareText += `🏷️ 标签：${daka.tags.map(tag => `#${tag}`).join('、')}\n\n`;
        }
        shareText += `📊 累计打卡：${totalCount} 次\n`;
        shareText += `📅 总天数：${uniqueDays} 天\n\n`;
        shareText += `✨—— 来自有数规划 ✨`;

        // 直接进行文字分享
        if (window.plus && plus.share && plus.share.sendWithSystem) {
            // HBuilderX 环境，使用系统分享
            plus.share.sendWithSystem({content: shareText}, function(){}, function(e){
                alert('系统分享失败：'+JSON.stringify(e));
            });
        } else if (navigator.share) {
            // 支持 Web Share API 的浏览器
            navigator.share({
                title: daka.title,
                text: shareText
            }).catch(console.error);
        } else if (navigator.clipboard) {
            // 复制到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                if (window.UIManager) {
                    UIManager.showNotification('打卡内容已复制到剪贴板，可粘贴分享', 'success');
                } else {
                    alert('打卡内容已复制到剪贴板，可粘贴分享');
                }
            }).catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            });
        } else {
            // 兼容旧浏览器
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                if (window.UIManager) {
                    UIManager.showNotification('打卡内容已复制到剪贴板，可粘贴分享', 'success');
                } else {
                    alert('打卡内容已复制到剪贴板，可粘贴分享');
                }
            } catch (err) {
                alert('复制失败，请手动复制');
            }
            document.body.removeChild(textarea);
        }
    },
    searchDakas(keyword) {
        // TODO: 搜索功能
        this.loadDakas();
    },
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        if (!this.batchMode) this.selectedDakas.clear();
        this.updateBatchDeleteButton();
        this.loadDakas();
    },
    toggleDakaSelection(dakaId, checked) {
        if (checked) this.selectedDakas.add(dakaId);
        else this.selectedDakas.delete(dakaId);
        this.updateBatchDeleteButton();
        this.loadDakas();
    },
    updateBatchDeleteButton() {
        if (this.elements.batchDeleteBtn) {
            this.elements.batchDeleteBtn.style.display = this.batchMode && this.selectedDakas.size > 0 ? '' : 'none';
        }
    },
    batchDelete() {
        if (!this.batchMode || this.selectedDakas.size === 0) return;
        if (!confirm('确定要删除选中的打卡吗？')) return;
        const data = StorageManager.getData();
        data.dakas = (data.dakas || []).filter(d => !this.selectedDakas.has(d.id));
        StorageManager.saveData(data);
        this.selectedDakas.clear();
        this.batchMode = false;
        this.updateBatchDeleteButton();
        this.loadDakas();
        if (window.UIManager) UIManager.showNotification('批量删除成功', 'success');
    },

    /**
     * 切换打卡收藏状态
     */
    toggleStar(dakaId) {
        const data = StorageManager.getData();
        const daka = data.dakas.find(d => d.id === dakaId);
        if (daka) {
            daka.starred = !daka.starred;
            daka.updateTime = new Date().toISOString();
            StorageManager.saveData(data);
            this.loadDakas();
            
            // 显示通知
            if (window.UIManager) {
                UIManager.showNotification(
                    daka.starred ? '已添加到收藏' : '已取消收藏', 
                    'success'
                );
            }
        }
    },

    /**
     * 筛选器清除后的回调方法
     */
    onFiltersCleared() {
        this.loadDakas();
    },

    showImportModal() {
        // 打卡文本导入弹窗
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.id = 'daka-import-modal';
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>导入打卡</h3>
                    <button class="daka-modal-close" id="daka-import-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label>每行格式：标题 | 内容 | 标签（逗号分隔） | 开始时间 | 结束时间</label>
                        <textarea id="daka-import-text" class="daka-form-textarea" rows="8" placeholder="例如：\n晨跑|每天早上跑步|健康,运动|2024-07-01T06:30|2024-07-01T07:00\n读书|晚上读书|学习|2024-07-01T20:00|2024-07-01T21:00"></textarea>
                    </div>
                </div>
                <div class="daka-modal-actions">
                    <button class="daka-modal-btn secondary" id="daka-import-cancel">取消</button>
                    <button class="daka-modal-btn primary" id="daka-import-confirm">导入</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        const closeModal = () => {
            // 先移除动画类，然后隐藏模态框
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300); // 等待动画完成
        };
        modal.querySelector('#daka-import-close').onclick = closeModal;
        modal.querySelector('#daka-import-cancel').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        modal.querySelector('#daka-import-confirm').onclick = () => {
            const text = modal.querySelector('#daka-import-text').value.trim();
            if (!text) return closeModal();
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
            const now = new Date().toISOString();
            const newDakas = lines.map(line => {
                const parts = line.split('|').map(s => s.trim());
                return {
                    id: this.generateId(),
                    title: parts[0] || '',
                    content: parts[1] || '',
                    tags: parts[2] ? parts[2].split(',').map(t => t.trim()).filter(t => t) : [],
                    startTime: parts[3] || '',
                    endTime: parts[4] || '',
                    createTime: now,
                    updateTime: now,
                    punchRecords: [],
                    starred: false // 新增：收藏状态字段
                };
            }).filter(d => d.title);
            if (newDakas.length) {
                const data = StorageManager.getData();
                if (!data.dakas) data.dakas = [];
                data.dakas = data.dakas.concat(newDakas);
                StorageManager.saveData(data);
                this.loadDakas();
                if (window.UIManager) UIManager.showNotification('导入成功', 'success');
            }
            closeModal();
        };
    },
    showEditModal() {
        // 打卡文本编辑弹窗
        const data = StorageManager.getData();
        const dakas = Array.isArray(data.dakas) ? data.dakas : [];
        const lines = dakas.map(d => [d.title, d.content, (d.tags||[]).join(','), d.startTime||'', d.endTime||'', d.repeatType||'daily'].join(' | ')).join('\n');
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.id = 'daka-edit-modal';
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>批量编辑打卡</h3>
                    <button class="daka-modal-close" id="daka-edit-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label>每行格式：标题 | 内容 | 标签（逗号分隔） | 开始时间 | 结束时间 | 打卡规则</label>
                        <textarea id="daka-edit-text" class="daka-form-textarea" rows="10">${lines}</textarea>
                    </div>
                </div>
                <div class="daka-modal-actions">
                    <button class="daka-modal-btn secondary" id="daka-edit-cancel">取消</button>
                    <button class="daka-modal-btn primary" id="daka-edit-confirm">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        const closeModal = () => {
            // 先移除动画类，然后隐藏模态框
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300); // 等待动画完成
        };
        modal.querySelector('#daka-edit-close').onclick = closeModal;
        modal.querySelector('#daka-edit-cancel').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        modal.querySelector('#daka-edit-confirm').onclick = () => {
            const text = modal.querySelector('#daka-edit-text').value.trim();
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
            const now = new Date().toISOString();
            const newDakas = lines.map(line => {
                const parts = line.split('|').map(s => s.trim());
                return {
                    id: this.generateId(),
                    title: parts[0] || '',
                    content: parts[1] || '',
                    tags: parts[2] ? parts[2].split(',').map(t => t.trim()).filter(t => t) : [],
                    startTime: parts[3] || '',
                    endTime: parts[4] || '',
                    repeatType: parts[5] || 'daily',
                    createTime: now,
                    updateTime: now,
                    punchRecords: [],
                    starred: false // 新增：收藏状态字段
                };
            }).filter(d => d.title);
            if (Array.isArray(data.dakas)) data.dakas = newDakas;
            else data.dakas = newDakas;
            StorageManager.saveData(data);
            this.loadDakas();
            if (window.UIManager) UIManager.showNotification('保存成功', 'success');
            closeModal();
        };
    },
    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"']/g, function (c) {
            return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
        });
    },
    generateId() {
        return 'daka_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    },
    handlePunch(daka) {
        // 判断是否允许打卡
        const today = new Date();
        let alreadyPunched = false;
        if (daka.repeatType === 'yearly') {
            const ymd = today.toISOString().slice(5, 10);
            alreadyPunched = (Array.isArray(daka.punchRecords) ? daka.punchRecords : []).some(r => (r.date||'').slice(5,10) === ymd);
        } else if (daka.repeatType === 'monthly') {
            const md = today.toISOString().slice(8, 10);
            alreadyPunched = (Array.isArray(daka.punchRecords) ? daka.punchRecords : []).some(r => (r.date||'').slice(8,10) === md && (r.date||'').slice(0,7) === today.toISOString().slice(0,7));
        } else {
            const todayStr = today.toISOString().slice(0, 10);
            alreadyPunched = (Array.isArray(daka.punchRecords) ? daka.punchRecords : []).some(r => r.date === todayStr);
        }
        if (alreadyPunched) {
            if (window.UIManager) UIManager.showNotification('本周期已打卡', 'warning');
            return;
        }
        // 弹窗：直接进入记录内容模式
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>今日打卡</h3>
                    <button class="daka-modal-close" id="daka-punch-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div id="daka-punch-detail-area" style="display:block;">
                        <div class="daka-form-group">
                            <label>文字记录</label>
                            <textarea id="daka-punch-text" class="daka-form-textarea" placeholder="写点什么..." style="min-height:60px;"></textarea>
                        </div>
                        <div class="daka-form-group">
                            <label>上传图片/视频/文档</label>
                            <input type="file" id="daka-punch-file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt">
                            <div id="daka-punch-file-list" style="margin-top:8px;font-size:13px;color:#888;"></div>
                        </div>
                        <button class="daka-modal-btn primary" id="daka-punch-save">保存打卡</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        // 关闭
        const closeModal = () => {
            // 先移除动画类，然后隐藏模态框
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300); // 等待动画完成
        };
        modal.querySelector('#daka-punch-close').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        // 不再询问方式，直接显示记录内容区域
        // 文件选择预览
        const fileInput = modal.querySelector('#daka-punch-file');
        const fileListDiv = modal.querySelector('#daka-punch-file-list');
        // 新增：图片预览和移除功能
        let selectedImages = [];
        function renderImagePreview() {
            fileListDiv.innerHTML = '';
            selectedImages.forEach((img, idx) => {
                const imgContainer = document.createElement('div');
                imgContainer.style = 'display:inline-block;margin-right:8px;margin-bottom:8px;position:relative;';
                
                const imgElem = document.createElement('img');
                imgElem.src = img.data;
                imgElem.style = 'width:60px;height:60px;object-fit:cover;border-radius:6px;box-shadow:0 1px 4px #ccc;cursor:pointer;display:block;';
                imgElem.title = '点击移除';
                imgElem.onclick = () => {
                    selectedImages.splice(idx, 1);
                    renderImagePreview();
                };
                
                // 添加压缩信息提示
                if (img.compressionRatio && img.compressionRatio > 0) {
                    const compressionBadge = document.createElement('div');
                    compressionBadge.style = 'position:absolute;top:-6px;right:-6px;background:#4caf50;color:white;border-radius:10px;padding:2px 6px;font-size:10px;font-weight:bold;';
                    compressionBadge.textContent = `-${img.compressionRatio}%`;
                    compressionBadge.title = `压缩率: ${img.compressionRatio}%`;
                    imgContainer.appendChild(compressionBadge);
                }
                
                // 添加文件大小信息
                const sizeInfo = document.createElement('div');
                sizeInfo.style = 'font-size:10px;color:#666;text-align:center;margin-top:2px;';
                const sizeKB = Math.round(img.size / 1024);
                sizeInfo.textContent = `${sizeKB}KB`;
                if (img.originalSize && img.originalSize !== img.size) {
                    const originalKB = Math.round(img.originalSize / 1024);
                    sizeInfo.textContent = `${originalKB}→${sizeKB}KB`;
                }
                
                imgContainer.appendChild(imgElem);
                imgContainer.appendChild(sizeInfo);
                fileListDiv.appendChild(imgContainer);
            });
        }
        fileInput.onchange = async () => {
            const files = Array.from(fileInput.files);
            const imageFiles = files.filter(f => f.type.startsWith('image/'));
            
            if (imageFiles.length === 0) {
                fileInput.value = '';
                return;
            }

            // 显示压缩进度提示
            const progressDiv = document.createElement('div');
            progressDiv.style = 'margin-top:8px;padding:8px;background:#f0f8ff;border-radius:6px;font-size:13px;color:#4285f4;';
            progressDiv.textContent = '正在压缩图片，请稍候...';
            fileListDiv.appendChild(progressDiv);

            try {
                // 使用极致压缩器压缩图片
                const compressedImages = await window.DakaImageOptimizer.batchSmartCompress(imageFiles, 80);
                
                compressedImages.forEach(compressedImg => {
                    selectedImages.push({
                        name: compressedImg.name,
                        type: compressedImg.type,
                        size: compressedImg.size,
                        data: compressedImg.data,
                        originalSize: compressedImg.originalSize,
                        compressionRatio: compressedImg.compressionRatio
                    });
                });

                // 移除进度提示
                progressDiv.remove();
                renderImagePreview();

                // 显示压缩结果提示
                const totalOriginalSize = compressedImages.reduce((sum, img) => sum + img.originalSize, 0);
                const totalCompressedSize = compressedImages.reduce((sum, img) => sum + img.size, 0);
                const totalSavedKB = Math.round((totalOriginalSize - totalCompressedSize) / 1024);
                
                if (totalSavedKB > 0) {
                    const resultDiv = document.createElement('div');
                    resultDiv.style = 'margin-top:4px;padding:6px;background:#e8f5e8;border-radius:4px;font-size:12px;color:#2e7d32;';
                    resultDiv.textContent = `✓ 自动压缩完成，节省 ${totalSavedKB}KB`;
                    fileListDiv.appendChild(resultDiv);
                    
                    // 3秒后自动移除提示
                    setTimeout(() => {
                        if (resultDiv.parentNode) {
                            resultDiv.remove();
                        }
                    }, 3000);
                }
            } catch (error) {
                console.error('图片压缩失败:', error);
                progressDiv.textContent = '图片压缩失败，使用原图';
                progressDiv.style.background = '#ffebee';
                progressDiv.style.color = '#c62828';
                
                // 压缩失败时使用原图
                imageFiles.forEach(f => {
                    const reader = new FileReader();
                    reader.onload = e => {
                        selectedImages.push({ 
                            name: f.name, 
                            type: f.type, 
                            size: f.size, 
                            data: e.target.result 
                        });
                        renderImagePreview();
                    };
                    reader.readAsDataURL(f);
                });
                
                setTimeout(() => progressDiv.remove(), 3000);
            }
            
            // 清空input，允许重复选择同一图片
            fileInput.value = '';
        };
        // 保存打卡（带内容/附件）
        modal.querySelector('#daka-punch-save').onclick = async () => {
            const text = modal.querySelector('#daka-punch-text').value.trim();
            // 只保存已选图片
            this.savePunchRecord(daka, { text, files: selectedImages });
            closeModal();
        };
    },
    savePunchRecord(daka, { text, files }) {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        if (punchRecords.some(r => r.date === todayStr)) return;
        punchRecords.push({
            date: todayStr,
            startTime: daka.startTime || '',
            endTime: daka.endTime || '',
            text,
            files
        });
        // 保存
        const data = StorageManager.getData();
        const idx = data.dakas.findIndex(item => item.id === daka.id);
        if (idx !== -1) {
            data.dakas[idx].punchRecords = punchRecords;
            data.dakas[idx].updateTime = new Date().toISOString();
            StorageManager.saveData(data);
            this.loadDakas();
            if (window.UIManager) UIManager.showNotification('打卡成功', 'success');
        }
        StorageManager.addPoints(20, '打卡', '每日打卡成功');
    },
    clearPunchRecords(dakaId) {
        const data = StorageManager.getData();
        const idx = data.dakas.findIndex(d => d.id === dakaId);
        if (idx !== -1) {
            data.dakas[idx].punchRecords = [];
            data.dakas[idx].updateTime = new Date().toISOString();
            StorageManager.saveData(data);
            this.loadDakas();
            if (window.UIManager) UIManager.showNotification('打卡记录已清除', 'success');
        }
    },
    showDetailModal(daka) {
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.id = 'daka-detail-modal';
        // 打卡记录内容
        let punchHtml = '';
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        if (punchRecords.length === 0) {
            punchHtml = '<div style="color:#888;">暂无打卡记录</div>';
        } else {
            punchHtml = `<ul class='daka-detail-punch-list'>` + punchRecords.map((r, i) => `
                <li class='daka-detail-punch-item'>
                    <div class='daka-detail-punch-date'><i class="fas fa-calendar-check"></i>${r.date}</div>
                    ${r.text ? `<div class='daka-detail-punch-text'>${this.escapeHtml(r.text)}</div>` : ''}
                    ${r.files && r.files.length ? `<div class='daka-detail-punch-attachments'>${r.files.map((f, idx) => f.type && f.type.startsWith('image/') && f.data ? `<img src='${f.data}' alt='${this.escapeHtml(f.name)}' class='daka-detail-punch-img' style='max-width:80px;max-height:80px;border-radius:6px;box-shadow:0 1px 4px #ccc;cursor:pointer;margin-right:6px;' data-preview-idx='${i}_${idx}' />` : '').join('')}</div>` : ''}
                    <button class='daka-punch-edit-btn' data-punch-idx='${i}' style='margin-top:6px;font-size:12px;padding:2px 10px;border-radius:6px;background:#e3f0ff;color:#4285f4;border:none;cursor:pointer;'>编辑</button>
                </li>
            `).join('') + `</ul>`;
        }
        // 预定时间显示逻辑
        let timeRangeHtml = '';
        if (daka.startTime || daka.endTime) {
            timeRangeHtml = `<div style="margin-bottom:8px;color:#888;font-size:13px;">预定时间：${daka.startTime ? daka.startTime.replace('T',' ') : '--'} 至 ${daka.endTime ? daka.endTime.replace('T',' ') : '--'}</div>`;
        }
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>打卡详情</h3>
                    <button class="daka-modal-close" id="daka-detail-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div style="font-size:18px;font-weight:600;margin-bottom:8px;">${this.escapeHtml(daka.title)}</div>
                    <div style="color:#666;font-size:14px;margin-bottom:8px;">${this.escapeHtml(daka.content)}</div>
                    <div style="margin-bottom:8px;">
                        <span style="color:#888;font-size:13px;">标签：</span>
                        ${(daka.tags||[]).map(tag=>`<span style=\"background:#e3f0ff;color:#4285f4;padding:2px 8px;border-radius:4px;margin-right:6px;font-size:12px;\">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                    ${timeRangeHtml}
                    <div style="margin:12px 0 4px 0;font-weight:500;">打卡记录：</div>
                    <div id="daka-punch-records-container" style="max-height:220px;overflow-y:auto;">${punchHtml}</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        const closeModal = () => {
            // 先移除动画类，然后隐藏模态框
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300); // 等待动画完成
        };
        modal.querySelector('#daka-detail-close').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        // 绑定图片点击预览
        modal.querySelectorAll('.daka-detail-punch-img').forEach(img => {
            img.onclick = (e) => {
                e.stopPropagation();
                this.previewImage(img.src);
            };
        });
        // 绑定每条打卡记录的编辑按钮
        modal.querySelectorAll('.daka-punch-edit-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-punch-idx'));
                this.showEditPunchModal(daka, idx, modal);
            };
        });
        
        // 添加触控滑动适配
        this.enableTouchScrollForPunchRecords(modal);
    },
    // 新增：编辑单条打卡记录（文字+多图）
    showEditPunchModal(daka, punchIdx, parentModal) {
        const punch = (Array.isArray(daka.punchRecords) ? daka.punchRecords : [])[punchIdx];
        if (!punch) return;
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.id = 'daka-edit-punch-modal';
        // 复制图片数据
        let selectedImages = Array.isArray(punch.files) ? punch.files.map(f => ({...f})) : [];
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>编辑打卡记录</h3>
                    <button class="daka-modal-close" id="daka-edit-punch-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label>文字记录</label>
                        <textarea id="daka-edit-punch-text" class="daka-form-textarea" style="min-height:60px;">${this.escapeHtml(punch.text||'')}</textarea>
                    </div>
                    <div class="daka-form-group">
                        <label>上传照片</label>
                        <input type="file" id="daka-edit-punch-file" multiple accept="image/*">
                        <div id="daka-edit-punch-file-list" style="margin-top:8px;font-size:13px;color:#888;display:flex;gap:8px;flex-wrap:wrap;"></div>
                    </div>
                </div>
                <div class="daka-modal-actions">
                    <button class="daka-modal-btn danger" id="daka-edit-punch-delete">删除</button>
                    <button class="daka-modal-btn secondary" id="daka-edit-punch-cancel">取消</button>
                    <button class="daka-modal-btn primary" id="daka-edit-punch-save">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        // 关闭
        const closeModal = () => {
            // 先移除动画类，然后隐藏模态框
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300); // 等待动画完成
        };
        modal.querySelector('#daka-edit-punch-close').onclick = closeModal;
        modal.querySelector('#daka-edit-punch-cancel').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        // 图片预览和移除
        const fileInput = modal.querySelector('#daka-edit-punch-file');
        const fileListDiv = modal.querySelector('#daka-edit-punch-file-list');
        function renderImagePreview() {
            fileListDiv.innerHTML = '';
            selectedImages.forEach((img, idx) => {
                const imgContainer = document.createElement('div');
                imgContainer.style = 'display:inline-block;margin-right:8px;margin-bottom:8px;position:relative;';
                
                const imgElem = document.createElement('img');
                imgElem.src = img.data;
                imgElem.style = 'width:60px;height:60px;object-fit:cover;border-radius:6px;box-shadow:0 1px 4px #ccc;cursor:pointer;display:block;';
                imgElem.title = '点击移除';
                imgElem.onclick = () => {
                    selectedImages.splice(idx, 1);
                    renderImagePreview();
                };
                
                // 添加压缩信息提示
                if (img.compressionRatio && img.compressionRatio > 0) {
                    const compressionBadge = document.createElement('div');
                    compressionBadge.style = 'position:absolute;top:-6px;right:-6px;background:#4caf50;color:white;border-radius:10px;padding:2px 6px;font-size:10px;font-weight:bold;';
                    compressionBadge.textContent = `-${img.compressionRatio}%`;
                    compressionBadge.title = `压缩率: ${img.compressionRatio}%`;
                    imgContainer.appendChild(compressionBadge);
                }
                
                // 添加文件大小信息
                const sizeInfo = document.createElement('div');
                sizeInfo.style = 'font-size:10px;color:#666;text-align:center;margin-top:2px;';
                const sizeKB = Math.round(img.size / 1024);
                sizeInfo.textContent = `${sizeKB}KB`;
                if (img.originalSize && img.originalSize !== img.size) {
                    const originalKB = Math.round(img.originalSize / 1024);
                    sizeInfo.textContent = `${originalKB}→${sizeKB}KB`;
                }
                
                imgContainer.appendChild(imgElem);
                imgContainer.appendChild(sizeInfo);
                fileListDiv.appendChild(imgContainer);
            });
        }
        renderImagePreview();
        fileInput.onchange = async () => {
            const files = Array.from(fileInput.files);
            const imageFiles = files.filter(f => f.type.startsWith('image/'));
            
            if (imageFiles.length === 0) {
                fileInput.value = '';
                return;
            }

            // 显示压缩进度提示
            const progressDiv = document.createElement('div');
            progressDiv.style = 'margin-top:8px;padding:8px;background:#f0f8ff;border-radius:6px;font-size:13px;color:#4285f4;';
            progressDiv.textContent = '正在压缩图片，请稍候...';
            fileListDiv.appendChild(progressDiv);

            try {
                // 使用极致压缩器压缩图片
                const compressedImages = await window.DakaImageOptimizer.batchSmartCompress(imageFiles, 80);
                
                compressedImages.forEach(compressedImg => {
                    selectedImages.push({
                        name: compressedImg.name,
                        type: compressedImg.type,
                        size: compressedImg.size,
                        data: compressedImg.data,
                        originalSize: compressedImg.originalSize,
                        compressionRatio: compressedImg.compressionRatio
                    });
                });

                // 移除进度提示
                progressDiv.remove();
                renderImagePreview();

                // 显示压缩结果提示
                const totalOriginalSize = compressedImages.reduce((sum, img) => sum + img.originalSize, 0);
                const totalCompressedSize = compressedImages.reduce((sum, img) => sum + img.size, 0);
                const totalSavedKB = Math.round((totalOriginalSize - totalCompressedSize) / 1024);
                
                if (totalSavedKB > 0) {
                    const resultDiv = document.createElement('div');
                    resultDiv.style = 'margin-top:4px;padding:6px;background:#e8f5e8;border-radius:4px;font-size:12px;color:#2e7d32;';
                    resultDiv.textContent = `✓ 自动压缩完成，节省 ${totalSavedKB}KB`;
                    fileListDiv.appendChild(resultDiv);
                    
                    // 3秒后自动移除提示
                    setTimeout(() => {
                        if (resultDiv.parentNode) {
                            resultDiv.remove();
                        }
                    }, 3000);
                }
            } catch (error) {
                console.error('图片压缩失败:', error);
                progressDiv.textContent = '图片压缩失败，使用原图';
                progressDiv.style.background = '#ffebee';
                progressDiv.style.color = '#c62828';
                
                // 压缩失败时使用原图
                imageFiles.forEach(f => {
                    const reader = new FileReader();
                    reader.onload = e => {
                        selectedImages.push({ 
                            name: f.name, 
                            type: f.type, 
                            size: f.size, 
                            data: e.target.result 
                        });
                        renderImagePreview();
                    };
                    reader.readAsDataURL(f);
                });
                
                setTimeout(() => progressDiv.remove(), 3000);
            }
            
            // 清空input，允许重复选择同一图片
            fileInput.value = '';
        };
        // 保存
        modal.querySelector('#daka-edit-punch-save').onclick = () => {
            const text = modal.querySelector('#daka-edit-punch-text').value.trim();
            // 更新数据
            const data = StorageManager.getData();
            const dakaIdx = data.dakas.findIndex(item => item.id === daka.id);
            if (dakaIdx !== -1 && Array.isArray(data.dakas[dakaIdx].punchRecords)) {
                data.dakas[dakaIdx].punchRecords[punchIdx].text = text;
                data.dakas[dakaIdx].punchRecords[punchIdx].files = selectedImages;
                data.dakas[dakaIdx].updateTime = new Date().toISOString();
                StorageManager.saveData(data);
                this.loadDakas();
                if (window.UIManager) UIManager.showNotification('打卡记录已更新', 'success');
            }
            closeModal();
            if (parentModal) parentModal.remove(); // 关闭详情，刷新
        };
        // 删除
        modal.querySelector('#daka-edit-punch-delete').onclick = () => {
            if (!confirm('确定要删除本条打卡记录吗？此操作不可恢复。')) return;
            const data = StorageManager.getData();
            const dakaIdx = data.dakas.findIndex(item => item.id === daka.id);
            if (dakaIdx !== -1 && Array.isArray(data.dakas[dakaIdx].punchRecords)) {
                data.dakas[dakaIdx].punchRecords.splice(punchIdx, 1);
                data.dakas[dakaIdx].updateTime = new Date().toISOString();
                StorageManager.saveData(data);
                this.loadDakas();
                if (window.UIManager) UIManager.showNotification('打卡记录已删除', 'success');
            }
            closeModal();
            if (parentModal) parentModal.remove(); // 关闭详情，刷新
        };
    },
    getFileIconHtml(type) {
        if (!type) return '<i class="fas fa-file"></i>';
        if (type.startsWith('image/')) return '<i class="fas fa-file-image"></i>';
        if (type.startsWith('video/')) return '<i class="fas fa-file-video"></i>';
        if (type.includes('pdf')) return '<i class="fas fa-file-pdf"></i>';
        if (type.includes('word') || type.includes('doc')) return '<i class="fas fa-file-word"></i>';
        if (type.includes('excel') || type.includes('sheet')) return '<i class="fas fa-file-excel"></i>';
        if (type.includes('ppt')) return '<i class="fas fa-file-powerpoint"></i>';
        if (type.includes('text')) return '<i class="fas fa-file-alt"></i>';
        return '<i class="fas fa-file"></i>';
    },
    previewImage(src) {
        // 大图预览弹窗，只保留关闭按钮
        const modal = document.createElement('div');
        modal.className = 'daka-image-preview-modal';
        modal.id = 'daka-image-preview-modal';
        modal.innerHTML = `
            <div class="daka-image-preview-container">
                <img src="${src}" class="daka-image-preview-image" alt="预览图片" />
                <button class="daka-image-preview-close" id="daka-image-preview-close" title="关闭">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        const closeModal = () => {
            // 先移除动画类，然后隐藏模态框
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300); // 等待动画完成
        };
        
        // 关闭事件
        modal.onclick = closeModal;
        modal.querySelector('#daka-image-preview-close').onclick = (e) => { 
            e.stopPropagation(); 
            closeModal(); 
        };
        
        // 键盘快捷键
        document.addEventListener('keydown', function handleKeydown(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            }
        });
    },
    openDocAttachment(f) {
        // 移除文档相关逻辑，不再支持文档预览
    },

    /**
     * 自动图片优化
     */
    async autoOptimizeImages() {
        // 延迟执行，避免影响页面加载
        setTimeout(async () => {
            try {
                if (!window.dakaBatchOptimizer) return;
                
                // 扫描需要优化的图片
                const images = window.dakaBatchOptimizer.scanAllDakaImages();
                const needOptimization = images.filter(img => {
                    const sizeKB = Math.round(img.originalSize / 1024);
                    return !img.file.optimized && sizeKB > 80; // 大于80KB且未优化的图片
                });
                
                if (needOptimization.length === 0) return;
                
                console.log(`发现 ${needOptimization.length} 张图片需要优化，开始自动优化...`);
                
                // 静默优化，不显示进度弹窗
                await window.dakaBatchOptimizer.optimizeAllDakaImages({
                    targetSizeKB: 60,
                    skipIfSmaller: true,
                    createBackup: false
                });
                
                // 优化完成后刷新列表
                this.loadDakas();
                
                // 显示简单的通知
                if (window.UIManager) {
                    UIManager.showNotification(`✅ 已自动优化 ${needOptimization.length} 张图片`, 'success');
                }
                
            } catch (error) {
                console.warn('自动图片优化失败:', error);
            }
        }, 2000); // 2秒后开始优化
    },

    /**
     * 为打卡记录容器启用触控滑动适配
     * @param {Element} modal 模态框元素
     */
    enableTouchScrollForPunchRecords(modal) {
        const container = modal.querySelector('#daka-punch-records-container');
        if (!container) return;

        // 检查是否为触控设备
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;

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
            const newScrollTop = startScrollTop + deltaY;

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

        // 添加滚动指示器样式
        container.style.overscrollBehavior = 'contain';
        container.style.webkitOverflowScrolling = 'touch';
        
        // 为容器添加触控友好的样式
        if (!container.classList.contains('touch-scroll-enabled')) {
            container.classList.add('touch-scroll-enabled');
            
            // 动态添加CSS样式
            if (!document.getElementById('daka-touch-scroll-styles')) {
                const style = document.createElement('style');
                style.id = 'daka-touch-scroll-styles';
                style.textContent = `
                    .touch-scroll-enabled {
                        -webkit-overflow-scrolling: touch;
                        overscroll-behavior: contain;
                        scroll-behavior: smooth;
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
                        .touch-scroll-enabled {
                            padding-right: 8px;
                        }
                        
                        .touch-scroll-enabled::-webkit-scrollbar {
                            width: 6px;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('daka')) {
        DakaManager.init();
    }
}); 