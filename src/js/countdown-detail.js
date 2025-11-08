/**
 * 倒数日详情窗口管理器
 */
const CountdownDetailManager = {
    /**
     * 初始化详情窗口管理器
     */
    init() {
        this.createDetailModal();
        this.bindEvents();
        this.currentCountdown = null;
    },

    /**
     * 创建详情模态框
     */
    createDetailModal() {
        // 检查是否已存在
        if (document.getElementById('countdown-detail-modal')) {
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'countdown-detail-modal';
        modal.className = 'countdown-detail-modal';
        
        modal.innerHTML = `
            <div class="countdown-detail-content">
                <!-- 背景图片区域 -->
                <div class="countdown-detail-background" id="countdown-detail-background">
                    <!-- 背景上传按钮 -->
                    <label class="countdown-background-upload" for="countdown-background-input">
                        <i class="fas fa-image"></i>
                        <span>更换背景</span>
                        <input type="file" id="countdown-background-input" accept="image/*">
                    </label>
                    
                    <!-- 背景移除按钮 -->
                    <button class="countdown-background-remove" id="countdown-background-remove">
                        <i class="fas fa-trash"></i>
                        <span>移除背景</span>
                    </button>
                    
                    <!-- 关闭/返回按钮 -->
                    <button class="countdown-detail-close" id="countdown-detail-close" title="关闭">
                        <i class="fas fa-arrow-left mobile-only" aria-hidden="true"></i>
                        <i class="fas fa-times desktop-only" aria-hidden="true"></i>
                    </button>
                    
                    <!-- 背景提示 -->
                    <div class="countdown-background-hint" id="countdown-background-hint">
                        <i class="fas fa-image"></i>
                        <p>点击左上角按钮添加背景图片</p>
                    </div>
                    
                    <!-- 倒数日信息覆盖层 -->
                    <div class="countdown-detail-overlay">
                        <span class="countdown-detail-icon" id="countdown-detail-icon">📅</span>
                        <h2 class="countdown-detail-title" id="countdown-detail-title">倒数日名称</h2>
                        <div class="countdown-detail-date" id="countdown-detail-date">2024年1月1日</div>
                        <div class="countdown-detail-days" id="countdown-detail-days">还有 30 天</div>
                        <!-- 添加详细的倒数时间显示区域 -->
                        <div class="countdown-detail-time" id="countdown-detail-time" style="display: none;">
                            <div class="time-unit">
                                <span class="time-value" id="countdown-hours">00</span>
                                <span class="time-label">小时</span>
                            </div>
                            <div class="time-separator">:</div>
                            <div class="time-unit">
                                <span class="time-value" id="countdown-minutes">00</span>
                                <span class="time-label">分钟</span>
                            </div>
                            <div class="time-separator">:</div>
                            <div class="time-unit">
                                <span class="time-value" id="countdown-seconds">00</span>
                                <span class="time-label">秒</span>
                            </div>
                        </div>
                        <!-- 添加切换按钮 -->
                        <button class="countdown-toggle-btn" id="countdown-toggle-btn">
                            <i class="fas fa-clock"></i>
                            <span>详细倒数</span>
                        </button>
                    </div>
                </div>
                
                <!-- 详情内容 -->
                <div class="countdown-detail-body">
                    <div class="countdown-detail-info" id="countdown-detail-info">
                        <!-- 详情信息将动态生成 -->
                    </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="countdown-detail-actions">
                    <button class="countdown-detail-btn edit" id="countdown-detail-edit">
                        <i class="fas fa-edit"></i>
                        <span>编辑</span>
                    </button>
                    <button class="countdown-detail-btn share" id="countdown-detail-share">
                        <i class="fas fa-share-alt"></i>
                        <span>分享</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'countdown-detail-close' || e.target.closest('#countdown-detail-close')) {
                this.hideDetail();
            }
        });

        // 点击模态框背景关闭
        document.addEventListener('click', (e) => {
            if (e.target.id === 'countdown-detail-modal') {
                this.hideDetail();
            }
        });

        // 编辑按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'countdown-detail-edit' || e.target.closest('#countdown-detail-edit')) {
                this.editCountdown();
            }
        });

        // 分享按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'countdown-detail-share' || e.target.closest('#countdown-detail-share')) {
                this.shareCountdown();
            }
        });

        // 背景图片上传
        document.addEventListener('change', (e) => {
            if (e.target.id === 'countdown-background-input') {
                this.handleBackgroundUpload(e.target.files[0]);
            }
        });

        // 背景移除按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'countdown-background-remove' || e.target.closest('#countdown-background-remove')) {
                this.removeBackground();
            }
        });

        // 备注复制按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.countdown-notes-copy-btn')) {
                const btn = e.target.closest('.countdown-notes-copy-btn');
                const notes = btn.getAttribute('data-notes');
                this.copyNotes(notes, btn);
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hideDetail();
            }
        });
        
        // 添加切换倒数显示方式的按钮事件
        document.addEventListener('click', (e) => {
            if (e.target.id === 'countdown-toggle-btn' || e.target.closest('#countdown-toggle-btn')) {
                this.toggleCountdownDisplay();
            }
        });
    },

    /**
     * 显示倒数日详情
     * @param {Object} countdown 倒数日对象
     */
    showDetail(countdown) {
        if (!countdown) return;
        
        this.currentCountdown = countdown;
        const modal = document.getElementById('countdown-detail-modal');
        
        if (!modal) {
            this.createDetailModal();
        }
        
        // 更新内容
        this.updateDetailContent(countdown);
        
        // 显示模态框
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // 阻止页面滚动
        document.body.style.overflow = 'hidden';
        
        // 启动定时器以更新详细倒数时间
        this.startCountdownTimer();
    },

    /**
     * 隐藏详情窗口
     * @param {Function} [callback] - 隐藏后执行的回调函数
     */
    hideDetail(callback) {
        const modal = document.getElementById('countdown-detail-modal');
        if (!modal || !modal.classList.contains('show')) {
            if (callback) callback();
            return;
        }
        
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            if (callback) {
                callback();
            }
        }, 300);
        
        // 停止定时器
        this.stopCountdownTimer();
        
        // 重置显示方式为天数显示
        const daysElement = document.getElementById('countdown-detail-days');
        const timeElement = document.getElementById('countdown-detail-time');
        const toggleBtn = document.getElementById('countdown-toggle-btn');
        
        if (daysElement && timeElement && toggleBtn) {
            daysElement.style.display = 'block';
            timeElement.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-clock"></i> <span>详细倒数</span>';
        }
    },

    /**
     * 检查详情窗口是否可见
     */
    isVisible() {
        const modal = document.getElementById('countdown-detail-modal');
        return modal && modal.classList.contains('show');
    },

    /**
     * 更新详情内容
     * @param {Object} countdown 倒数日对象
     */
    updateDetailContent(countdown) {
        // 更新基本信息
        document.getElementById('countdown-detail-icon').textContent = countdown.icon;
        document.getElementById('countdown-detail-title').textContent = countdown.name;
        document.getElementById('countdown-detail-date').textContent = this.formatDate(countdown.date);
        
        // 计算并显示天数
        const days = this.calculateDays(countdown);
        document.getElementById('countdown-detail-days').textContent = this.formatDays(days);
        
        // 初始化详细倒数时间显示
        this.updateDetailedCountdown(countdown);
        
        // 更新背景
        this.updateBackground(countdown);
        
        // 更新详细信息
        this.updateDetailInfo(countdown);
        
        // 设置主题色
        const background = document.getElementById('countdown-detail-background');
        background.style.setProperty('--countdown-primary', countdown.color);
    },

    /**
     * 更新详细信息区域
     * @param {Object} countdown 倒数日对象
     */
    updateDetailInfo(countdown) {
        const infoContainer = document.getElementById('countdown-detail-info');
        let infoHTML = '';
        
        // 类型信息
        infoHTML += `
            <div class="countdown-detail-info-item">
                <div class="countdown-detail-info-label">
                    <i class="fas fa-redo"></i>
                    类型
                </div>
                <div class="countdown-detail-info-value">${this.formatType(countdown.type)}</div>
            </div>
        `;
        
        // 创建时间
        if (countdown.createTime) {
            infoHTML += `
                <div class="countdown-detail-info-item">
                    <div class="countdown-detail-info-label">
                        <i class="fas fa-plus"></i>
                        创建于
                    </div>
                    <div class="countdown-detail-info-value">${new Date(countdown.createTime).toLocaleString()}</div>
                </div>
            `;
        }
        
        // 更新时间
        if (countdown.updateTime && countdown.updateTime !== countdown.createTime) {
            infoHTML += `
                <div class="countdown-detail-info-item">
                    <div class="countdown-detail-info-label">
                        <i class="fas fa-edit"></i>
                        更新于
                    </div>
                    <div class="countdown-detail-info-value">${new Date(countdown.updateTime).toLocaleString()}</div>
                </div>
            `;
        }
        
        // 参与者
        if (countdown.participants && countdown.participants.length > 0) {
            const participantsHTML = countdown.participants.map(participant => 
                `<span class="countdown-participant-tag">${participant}</span>`
            ).join('');
            
            infoHTML += `
                <div class="countdown-detail-info-item">
                    <div class="countdown-detail-info-label">
                        <i class="fas fa-users"></i>
                        参与者
                    </div>
                    <div class="countdown-detail-info-value">
                        <div class="countdown-detail-participants">${participantsHTML}</div>
                    </div>
                </div>
            `;
        }
        
        // 备注
        if (countdown.notes) {
            infoHTML += `
                <div class="countdown-detail-info-item">
                    <div class="countdown-detail-info-label">
                        <i class="fas fa-sticky-note"></i>
                        备注
                    </div>
                    <div class="countdown-detail-info-value">
                        <div class="countdown-notes-content">
                            <span class="countdown-notes-text">${countdown.notes}</span>
                            <button class="countdown-notes-copy-btn" title="复制备注" data-notes="${countdown.notes.replace(/"/g, '&quot;')}">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        infoContainer.innerHTML = infoHTML;
    },

    /**
     * 更新背景图片
     * @param {Object} countdown 倒数日对象
     */
    updateBackground(countdown) {
        const background = document.getElementById('countdown-detail-background');
        const hint = document.getElementById('countdown-background-hint');
        const removeBtn = document.getElementById('countdown-background-remove');
        
        if (countdown.backgroundImage) {
            background.style.backgroundImage = `url(${countdown.backgroundImage})`;
            background.classList.add('has-image');
            hint.classList.add('hidden');
            removeBtn.classList.add('show');
            
            // 智能检测图片比例并选择最佳显示模式
            this.optimizeImageDisplay(countdown.backgroundImage, background);
        } else {
            background.style.backgroundImage = '';
            background.style.background = `linear-gradient(135deg, ${countdown.color}22, ${countdown.color}88)`;
            background.classList.remove('has-image', 'contain-mode');
            hint.classList.remove('hidden');
            removeBtn.classList.remove('show');
        }
    },

    /**
     * 智能优化图片显示模式
     * @param {string} imageUrl 图片URL
     * @param {HTMLElement} background 背景元素
     */
    optimizeImageDisplay(imageUrl, background) {
        const img = new Image();
        img.onload = () => {
            const containerWidth = background.offsetWidth;
            const containerHeight = background.offsetHeight;
            const containerRatio = containerWidth / containerHeight;
            const imageRatio = img.width / img.height;
            
            // 移除之前的模式类
            background.classList.remove('contain-mode');
            
            // 如果图片比例与容器比例差异较大，使用contain模式确保图片完整显示
            const ratioDifference = Math.abs(containerRatio - imageRatio);
            
            if (ratioDifference > 0.5) {
                // 比例差异较大时，使用contain模式并居中显示
                background.classList.add('contain-mode');
                background.style.backgroundSize = 'contain';
                background.style.backgroundPosition = 'center center';
            } else {
                // 比例相近时，使用cover模式并智能定位
                background.style.backgroundSize = 'cover';
                background.style.backgroundPosition = 'center center';
                
                // 如果是竖图在横向容器中，稍微调整位置
                if (imageRatio < 1 && containerRatio > 1) {
                    background.style.backgroundPosition = 'center top';
                }
                // 如果是横图在竖向容器中，保持居中
                else if (imageRatio > 1 && containerRatio < 1) {
                    background.style.backgroundPosition = 'center center';
                }
            }
        };
        
        img.onerror = () => {
            // 图片加载失败时，使用默认的cover模式
            background.style.backgroundSize = 'cover';
            background.style.backgroundPosition = 'center center';
        };
        
        img.src = imageUrl;
    },

    /**
     * 处理背景图片上传
     * @param {File} file 上传的文件
     */
    async handleBackgroundUpload(file) {
        if (!file || !this.currentCountdown) return;

        // 检查文件大小（最大20MB）
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (file.size > maxSize) {
            this.showNotification('图片文件大小不能超过20MB', 'error');
            return;
        }

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            this.showNotification('请选择图片文件', 'error');
            return;
        }

        try {
            // 使用ImageCompressor进行压缩
            const compressor = new window.ImageCompressor({
                quality: 0.4, // 40%
                maxWidth: 1920, // 限制最大宽度
                maxHeight: 1080, // 限制最大高度
            });

            this.showNotification('正在压缩背景图...', 'info');
            const compressedImage = await compressor.compressImage(file);

            // 保存背景图片到倒数日数据
            this.saveBackgroundImage(compressedImage.data);

            // 更新显示
            this.updateBackground(this.currentCountdown);

            const originalSizeKB = Math.round(file.size / 1024);
            const compressedSizeKB = Math.round(compressedImage.size / 1024);
            const savedKB = originalSizeKB - compressedSizeKB;

            if (savedKB > 0) {
                this.showNotification(`背景已更新并压缩 (节省 ${savedKB}KB)`, 'success');
            } else {
                this.showNotification('背景已更新', 'success');
            }

        } catch (error) {
            console.error('图片压缩失败:', error);
            this.showNotification('图片压缩失败，将使用原图', 'error');
            // 压缩失败，使用原图
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                this.saveBackgroundImage(imageData);
                this.updateBackground(this.currentCountdown);
                this.showNotification('背景图片已更新', 'success');
            };
            reader.readAsDataURL(file);
        }
    },

    /**
     * 保存背景图片到数据
     * @param {string} imageData 图片数据
     */
    saveBackgroundImage(imageData) {
        if (!this.currentCountdown) return;
        
        // 更新当前倒数日对象
        this.currentCountdown.backgroundImage = imageData;
        this.currentCountdown.updateTime = new Date().toISOString();
        
        // 保存到存储
        const data = StorageManager.getData();
        const index = data.countdowns.findIndex(c => c.id === this.currentCountdown.id);
        if (index !== -1) {
            data.countdowns[index] = this.currentCountdown;
            StorageManager.saveData(data);
            
            // 刷新倒数日列表
            if (window.CountdownManager && typeof CountdownManager.loadCountdowns === 'function') {
                CountdownManager.loadCountdowns();
            }
        }
    },

    /**
     * 移除背景图片
     */
    removeBackground() {
        if (!this.currentCountdown) return;
        
        // 移除背景图片
        delete this.currentCountdown.backgroundImage;
        this.currentCountdown.updateTime = new Date().toISOString();
        
        // 保存到存储
        const data = StorageManager.getData();
        const index = data.countdowns.findIndex(c => c.id === this.currentCountdown.id);
        if (index !== -1) {
            data.countdowns[index] = this.currentCountdown;
            StorageManager.saveData(data);
            
            // 刷新倒数日列表
            if (window.CountdownManager && typeof CountdownManager.loadCountdowns === 'function') {
                CountdownManager.loadCountdowns();
            }
        }
        
        // 更新显示
        this.updateBackground(this.currentCountdown);
        
        this.showNotification('背景图片已移除', 'success');
    },

    /**
     * 切换倒数显示方式
     */
    toggleCountdownDisplay() {
        const daysElement = document.getElementById('countdown-detail-days');
        const timeElement = document.getElementById('countdown-detail-time');
        const toggleBtn = document.getElementById('countdown-toggle-btn');
        
        if (daysElement.style.display === 'none') {
            // 切换到天数显示
            daysElement.style.display = 'block';
            timeElement.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-clock"></i> <span>详细倒数</span>';
        } else {
            // 切换到详细时间显示
            daysElement.style.display = 'none';
            timeElement.style.display = 'flex';
            toggleBtn.innerHTML = '<i class="fas fa-calendar-day"></i> <span>天数显示</span>';
            
            // 确保定时器正在运行
            if (!this.countdownInterval) {
                this.startCountdownTimer();
            }
        }
    },
    
    /**
     * 启动倒数计时器
     */
    startCountdownTimer() {
        // 清除现有的定时器
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        // 启动新的定时器，每秒更新一次
        this.countdownInterval = setInterval(() => {
            if (this.currentCountdown) {
                this.updateDetailedCountdown(this.currentCountdown);
            }
        }, 1000);
    },
    
    /**
     * 停止倒数计时器
     */
    stopCountdownTimer() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    },
    
    /**
     * 更新详细倒数时间显示
     * @param {Object} countdown 倒数日对象
     */
    updateDetailedCountdown(countdown) {
        const timeElement = document.getElementById('countdown-detail-time');
        if (!timeElement || timeElement.style.display === 'none') {
            return; // 如果详细时间显示区域未显示，则不更新
        }
        
        // 计算精确的倒数时间
        const targetDate = new Date(countdown.date);
        const now = new Date();
        
        // 处理重复类型的倒数日
        if (countdown.type === 'yearly') {
            const currentYear = now.getFullYear();
            targetDate.setFullYear(currentYear);
            if (targetDate < now) {
                targetDate.setFullYear(currentYear + 1);
            }
        } else if (countdown.type === 'monthly') {
            const currentMonth = now.getMonth();
            targetDate.setMonth(currentMonth);
            if (targetDate < now) {
                targetDate.setMonth(currentMonth + 1);
            }
        }
        
        // 计算时间差（毫秒）
        const diff = targetDate - now;
        
        if (diff <= 0) {
            // 如果已经过了目标日期
            document.getElementById('countdown-hours').textContent = '00';
            document.getElementById('countdown-minutes').textContent = '00';
            document.getElementById('countdown-seconds').textContent = '00';
            return;
        }
        
        // 计算小时、分钟、秒
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // 更新显示
        document.getElementById('countdown-hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('countdown-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('countdown-seconds').textContent = seconds.toString().padStart(2, '0');
    },

    /**
     * 编辑倒数日
     */
    editCountdown() {
        if (!this.currentCountdown) return;
        
        const countdownToEdit = this.currentCountdown;

        // 隐藏详情窗口，并在动画结束后打开编辑模态框
        this.hideDetail(() => {
            if (window.CountdownManager && typeof CountdownManager.showModal === 'function') {
                CountdownManager.showModal(countdownToEdit);
            }
        });
    },

    /**
     * 分享倒数日
     */
    shareCountdown() {
        if (!this.currentCountdown) return;
        
        const countdown = this.currentCountdown;
        const days = this.calculateDays(countdown);
        
        // 生成分享文本
        let shareText = `⏳【倒数日】${countdown.icon} ${countdown.name}\n`;
        shareText += `-----------------------------\n`;
        shareText += `📅 日期：${this.formatDate(countdown.date)}`;
        if (countdown.type !== 'once') {
            shareText += `（${this.formatTypeShort(countdown.type)}）`;
        }
        shareText += `\n`;
        shareText += `🕒 剩余：${this.formatDays(days)}\n`;
        if (countdown.notes) {
            shareText += `📝 备注：${countdown.notes}\n`;
        }
        if (countdown.participants && countdown.participants.length > 0) {
            shareText += `👥 参与者：${countdown.participants.join('、')}\n`;
        }
        shareText += `-----------------------------\n`;
        shareText += `🎉 来自有数规划`;
        
        // 尝试不同的分享方式
        if (window.plus && plus.share && plus.share.sendWithSystem) {
            // HBuilderX环境
            plus.share.sendWithSystem({
                content: shareText
            }, function() {
                // 分享成功
            }, function(e) {
                console.error('系统分享失败：', e);
                this.fallbackShare(shareText);
            });
        } else if (navigator.share) {
            // Web Share API
            navigator.share({
                title: countdown.name,
                text: shareText
            }).catch(() => {
                this.fallbackShare(shareText);
            });
        } else {
            // 降级到复制
            this.fallbackShare(shareText);
        }
    },

    /**
     * 降级分享方式（复制到剪贴板）
     * @param {string} text 分享文本
     */
    fallbackShare(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('倒数日信息已复制，可粘贴到微信/QQ等', 'success');
            }).catch(() => {
                this.legacyCopy(text);
            });
        } else {
            this.legacyCopy(text);
        }
    },

    /**
     * 兼容旧浏览器的复制方法
     * @param {string} text 要复制的文本
     */
    legacyCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            this.showNotification('倒数日信息已复制，可粘贴到微信/QQ等', 'success');
        } catch (err) {
            console.error('复制失败:', err);
            this.showNotification('复制失败，请手动复制', 'error');
        }
        document.body.removeChild(textarea);
    },

    /**
     * 显示通知
     * @param {string} message 消息内容
     * @param {string} type 消息类型
     */
    showNotification(message, type = 'info') {
        if (window.UIManager && typeof UIManager.showNotification === 'function') {
            UIManager.showNotification(message, type);
        } else {
            alert(message);
        }
    },

    /**
     * 计算距离倒数日的天数
     * @param {Object} countdown 倒数日对象
     * @returns {number} 距离的天数
     */
    calculateDays(countdown) {
        if (window.CountdownManager && typeof CountdownManager.calculateDays === 'function') {
            return CountdownManager.calculateDays(countdown);
        }
        
        // 简化版计算
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(countdown.date);
        targetDate.setHours(0, 0, 0, 0);
        
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * 格式化天数显示
     * @param {number} days 天数
     * @returns {string} 格式化后的文本
     */
    formatDays(days) {
        if (days === 0) {
            return '就是今天';
        } else if (days > 0) {
            return `还有 ${days} 天`;
        } else {
            return `已过 ${Math.abs(days)} 天`;
        }
    },

    /**
     * 格式化日期显示
     * @param {string} dateStr 日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateStr) {
        if (window.CountdownManager && typeof CountdownManager.formatDate === 'function') {
            return CountdownManager.formatDate(dateStr);
        }
        
        // 简化版格式化
        const date = new Date(dateStr);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    },

    /**
     * 格式化倒数日类型显示
     * @param {string} type 类型
     * @returns {string} 格式化后的类型文本
     */
    formatType(type) {
        switch (type) {
            case 'once':
                return '单次事件';
            case 'monthly':
                return '每月重复';
            case 'yearly':
                return '每年重复';
            default:
                return '单次事件';
        }
    },

    /**
     * 格式化倒数日类型显示（简短版本）
     * @param {string} type 类型
     * @returns {string} 格式化后的类型文本
     */
    formatTypeShort(type) {
        switch (type) {
            case 'once':
                return '单次';
            case 'monthly':
                return '每月';
            case 'yearly':
                return '每年';
            default:
                return '单次';
        }
    },

    /**
     * 复制备注内容
     * @param {string} notes 备注内容
     * @param {HTMLElement} btn 复制按钮元素
     */
    copyNotes(notes, btn) {
        if (!notes) return;
        
        // 尝试使用现代剪贴板API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(notes).then(() => {
                this.showCopySuccess(btn);
            }).catch(() => {
                this.fallbackCopy(notes, btn);
            });
        } else {
            this.fallbackCopy(notes, btn);
        }
    },

    /**
     * 降级复制方法（兼容旧浏览器）
     * @param {string} text 要复制的文本
     * @param {HTMLElement} btn 复制按钮元素
     */
    fallbackCopy(text, btn) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        
        try {
            textarea.select();
            textarea.setSelectionRange(0, 99999); // 移动端兼容
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess(btn);
            } else {
                this.showCopyError();
            }
        } catch (err) {
            console.error('复制失败:', err);
            this.showCopyError();
        } finally {
            document.body.removeChild(textarea);
        }
    },

    /**
     * 显示复制成功的视觉反馈
     * @param {HTMLElement} btn 复制按钮元素
     */
    showCopySuccess(btn) {
        // 保存原始内容
        const originalHTML = btn.innerHTML;
        const originalTitle = btn.title;
        
        // 显示成功状态
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.title = '已复制';
        btn.classList.add('copied');
        
        // 显示通知
        this.showNotification('备注已复制到剪贴板', 'success');
        
        // 2秒后恢复原状
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.title = originalTitle;
            btn.classList.remove('copied');
        }, 2000);
    },

    /**
     * 显示复制失败的提示
     */
    showCopyError() {
        this.showNotification('复制失败，请手动复制', 'error');
    }
};

// 初始化详情窗口管理器
document.addEventListener('DOMContentLoaded', function() {
    CountdownDetailManager.init();
});

// 导出到全局
window.CountdownDetailManager = CountdownDetailManager;