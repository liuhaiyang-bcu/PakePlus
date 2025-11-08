/**
 * 轻松一刻管理模块
 * 负责管理勋章、积分和幸运转盘功能
 */

const RelaxManager = {
    // 幸运转盘实例
    wheel: null,
    // 转盘是否正在旋转
    isSpinning: false,
    
    /**
     * 初始化
     */
    init() {
        // 检查是否已经初始化过，避免重复初始化
        if (this._initialized) {
            return;
        }
        
        // 检查是否处于专注模式计时状态
        const isTimerActive = window.FocusManager && 
            FocusManager.status === 'active' && 
            FocusManager.startTime !== null;
        
        if (isTimerActive) {
            console.log('专注计时中，不初始化轻松一刻');
            
            // 强制隐藏轻松一刻视图
            const relaxView = document.getElementById('relax');
            if (relaxView) {
                relaxView.classList.remove('active');
                relaxView.style.display = 'none';
            }
            
            return;
        }
        
        // 在非计时状态下，确保轻松一刻视图可见
        const relaxView = document.getElementById('relax');
        if (relaxView) {
            relaxView.style.display = '';
            relaxView.classList.add('active');
        }

        console.log('初始化轻松一刻功能');
        this.loadMedals();
        this.updatePoints();
        this.initWheel();
        this.bindEvents();
        this.initSearch();
        
        // 初始化喝水提醒功能
        if (window.WaterReminderManager) {
            WaterReminderManager.init();
        }
        
        // 确保喝水提醒面板在健康卡片分组中显示
        this.showRelaxCardsByPoints();
        
        // 标记已初始化
        this._initialized = true;
    },

    /**
     * 初始化搜索
     */
    initSearch() {
        const input = document.getElementById('relax-search-input');
        const btn = document.getElementById('relax-search-btn');
        const clearBtn = document.getElementById('relax-search-clear');
        if (!input || !btn || !clearBtn) return;
        const doFilter = () => {
            const q = (input.value || '').trim().toLowerCase();
            this.filterCards(q);
        };
        btn.addEventListener('click', doFilter);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doFilter(); });
        clearBtn.addEventListener('click', () => { input.value = ''; this.filterCards(''); });
    },

    /**
     * 根据关键字过滤卡片
     * 仅前端过滤：匹配卡片标题和卡片内可见文本
     */
    filterCards(keyword) {
        const container = document.querySelector('#relax .relax-main-content');
        if (!container) return;
        const cards = Array.from(container.children);
        cards.forEach(card => {
            const text = (card.innerText || '').toLowerCase();
            const match = !keyword || text.includes(keyword);
            card.style.display = match ? '' : 'none';
        });
    },
    
    /**
     * 加载勋章墙
     */
    loadMedals() {
        const medals = StorageManager.getMedals();
        const container = document.getElementById('medals-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 只显示已解锁的勋章
        const unlockedMedals = medals.filter(medal => medal.unlocked);
        
        if (unlockedMedals.length === 0) {
            // 如果没有解锁的勋章，显示提示信息
            container.innerHTML = `
                <div class="no-medals-message">
                    <i class="fas fa-medal" style="font-size: 2rem; color: var(--text-secondary-color);"></i>
                    <p>还没有获得任何勋章，继续努力吧！</p>
                </div>
            `;
            return;
        }
        
        // 使用文档片段优化DOM操作
        const fragment = document.createDocumentFragment();
        unlockedMedals.forEach(medal => {
            const medalElement = document.createElement('div');
            medalElement.className = 'medal-item';
            medalElement.dataset.medalId = medal.id;
            medalElement.innerHTML = `
                <div class="medal-icon">${medal.icon}</div>
                <div class="medal-info">
                    <h4>${medal.name}</h4>
                    <p>${medal.description}</p>
                </div>
            `;
            
            fragment.appendChild(medalElement);
        });
        
        container.appendChild(fragment);
    },
    
    /**
     * 更新积分显示
     */
    updatePoints() {
        const points = StorageManager.getPoints();
        
        // 更新轻松一刻页面的积分显示
        const pointsElement = document.getElementById('user-points');
        if (pointsElement) {
            pointsElement.textContent = points;
        }
        
        // 更新顶部栏积分显示
        const headerPoints = document.getElementById('header-points');
        if (headerPoints) {
            headerPoints.textContent = points;
            
            // 根据积分数量添加不同的样式
            headerPoints.className = '';
            if (points >= 1000) {
                headerPoints.classList.add('points-master');
            } else if (points >= 500) {
                headerPoints.classList.add('points-expert');
            } else if (points >= 100) {
                headerPoints.classList.add('points-advanced');
            } else {
                headerPoints.classList.add('points-beginner');
            }
            
            // 添加积分变化动画
            headerPoints.classList.add('points-updated');
            setTimeout(() => {
                headerPoints.classList.remove('points-updated');
            }, 500);
        }
    },
    
    /**
     * 初始化幸运转盘
     */
    initWheel() {
        const canvas = document.getElementById('wheel-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const items = StorageManager.getData().wheelItems;
        
        // 设置画布大小
        canvas.width = 300;
        canvas.height = 300;
        
        this.wheel = {
            items,
            angle: 0,
            spinTime: 0,
            spinTimeTotal: 0,
            ctx,
            spinVelocity: 0
        };
        
        this.drawWheel();
    },
    
    /**
     * 绘制转盘
     */
    drawWheel() {
        if (!this.wheel) return;
        
        const { ctx, items, angle } = this.wheel;
        const canvas = ctx.canvas;
        const radius = canvas.width / 2;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制转盘
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle);
        
        const arc = Math.PI * 2 / items.length;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // 绘制扇形
            ctx.beginPath();
            ctx.fillStyle = item.color;
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius - 20, i * arc, (i + 1) * arc);
            ctx.lineTo(0, 0);
            ctx.fill();
            
            // 绘制文字
            ctx.save();
            ctx.rotate(i * arc + arc / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.text, radius / 2, 0);
            ctx.restore();
        }
        
        ctx.restore();
        
        // 绘制中心点
        ctx.beginPath();
        ctx.arc(radius, radius, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.stroke();
    },
    
    /**
     * 转动转盘
     */
    spinWheel() {
        if (this.isSpinning) return;
        
        const points = StorageManager.getPoints();
        if (points < 50) {
            UIManager.showNotification('积分不足，需要50积分');
            return;
        }
        
        // 扣除积分
        StorageManager.addPoints(-50, '小工具', '使用小工具页面');
        this.updatePoints();
        
        this.isSpinning = true;
        const spinBtn = document.getElementById('spin-wheel');
        if (spinBtn) {
            spinBtn.disabled = true;
        }
        
        // 随机选择结果
        const items = this.wheel.items;
        const selectedIndex = Math.floor(Math.random() * items.length);
        
        // 计算需要旋转的角度
        const targetAngle = 2 * Math.PI * 5 + // 多转5圈
            (2 * Math.PI / items.length) * (items.length - selectedIndex);
        
        this.wheel.spinTime = 0;
        this.wheel.spinTimeTotal = 3000; // 3秒
        this.wheel.targetAngle = targetAngle;
        this.wheel.startAngle = this.wheel.angle;
        
        this.rotateWheel();
    },
    
    /**
     * 旋转动画
     */
    rotateWheel() {
        if (!this.wheel) return;
        
        this.wheel.spinTime += 30;
        
        if (this.wheel.spinTime >= this.wheel.spinTimeTotal) {
            this.stopRotateWheel();
            return;
        }
        
        const spinPercent = this.wheel.spinTime / this.wheel.spinTimeTotal;
        const easeOut = (t) => t * (2 - t); // 缓出效果
        
        const angleOffset = this.wheel.targetAngle * easeOut(spinPercent);
        this.wheel.angle = this.wheel.startAngle + angleOffset;
        
        this.drawWheel();
        requestAnimationFrame(() => this.rotateWheel());
    },
    
    /**
     * 停止旋转
     */
    stopRotateWheel() {
        this.isSpinning = false;
        const spinBtn = document.getElementById('spin-wheel');
        if (spinBtn) {
            spinBtn.disabled = false;
        }
        
        // 计算结果
        const items = this.wheel.items;
        const degrees = (this.wheel.angle * 180 / Math.PI) % 360;
        const itemAngle = 360 / items.length;
        const selectedIndex = Math.floor(((360 - degrees) % 360) / itemAngle);
        const result = items[selectedIndex];
        
        // 显示结果
        UIManager.showNotification(`恭喜获得：${result.text}！`);
        
        // 根据结果添加积分
        if (result.points) {
            StorageManager.addPoints(result.points, '幸运转盘', `获得${result.text}`);
            this.updatePoints();
        }
    },
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 使用事件委托优化事件绑定
        const relaxContainer = document.getElementById('relax');
        if (!relaxContainer) return;
        
        relaxContainer.addEventListener('click', (e) => {
            // 幸运转盘按钮
            if (e.target.id === 'spin-wheel') {
                this.spinWheel();
                return;
            }
            
            // 小工具页面按钮
            if (e.target.id === 'tools-btn') {
                this.openToolsPage();
                return;
            }
            
            // 健康打卡按钮
            if (e.target.id === 'health-checkin-btn') {
                this.openHealthCheckin();
                return;
            }
            
            // AI聊天按钮
            if (e.target.id === 'ai-chat-btn') {
                this.openAIChat();
                return;
            }
            
            // 更多游戏按钮
            if (e.target.id === 'more-games-btn') {
                this.openMoreGames();
                return;
            }
        });
        
        // 其他特定按钮事件
        const url = 'https://youshu3formobileqwertyuisdfghjkccghvh.netlify.app/';
        const toolsBtn = document.getElementById('tools-btn');
        if (toolsBtn) {
            toolsBtn.onclick = (e) => {
                e.preventDefault();
                this.openToolsPage();
            };
        }
    },
    
    /**
     * 打开小工具页面
     */
    openToolsPage() {
        const url = 'https://youshu3formobileqwertyuisdfghjkccghvh.netlify.app/';
        const lastUseTime = localStorage.getItem('toolsLastUseTime');
        const cooldownTime = 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        if (lastUseTime) {
            const timeDiff = now - parseInt(lastUseTime);
            if (timeDiff < cooldownTime) {
                // 冷却期间，允许跳转
                if (window.plus && plus.runtime && plus.runtime.openURL) {
                    plus.runtime.openURL(url);
                } else {
                    window.open(url, '_blank');
                }
                return;
            }
        }
        // 冷却未启用，检查积分
        const currentPoints = StorageManager.getPoints();
        if (currentPoints >= 20) {
            StorageManager.addPoints(-20, '小工具', '使用小工具页面');
            if (window.UIManager && typeof UIManager.updateHeaderPoints === 'function') {
                UIManager.updateHeaderPoints();
            }
            localStorage.setItem('toolsLastUseTime', now);
            if (typeof startToolsCountdown === 'function') {
                startToolsCountdown();
            }
            if (window.plus && plus.runtime && plus.runtime.openURL) {
                plus.runtime.openURL(url);
            } else {
                window.open(url, '_blank');
            }
        } else {
            UIManager && UIManager.showNotification && UIManager.showNotification('积分不足，需要20积分', 'warning');
        }
    },
    
    /**
     * 打开健康打卡
     */
    openHealthCheckin() {
        // 检查积分
        const currentPoints = StorageManager.getPoints();
        if (currentPoints >= 10) {
            StorageManager.addPoints(-10, '健康打卡', '使用健康打卡功能');
            this.updatePoints();
            
            // 跳转到健康打卡页面
            window.location.href = 'health-checkin.html';
        } else {
            UIManager.showNotification('积分不足，需要10积分', 'warning');
        }
    },
    
    /**
     * 打开AI聊天
     */
    openAIChat() {
        // 检查积分
        const currentPoints = StorageManager.getPoints();
        if (currentPoints >= 30) {
            StorageManager.addPoints(-30, 'AI聊天', '使用AI聊天功能');
            this.updatePoints();
            
            // 跳转到AI聊天页面
            window.location.href = 'ai-chat.html';
        } else {
            UIManager.showNotification('积分不足，需要30积分', 'warning');
        }
    },
    
    /**
     * 打开更多游戏
     */
    openMoreGames() {
        // 检查积分
        const currentPoints = StorageManager.getPoints();
        if (currentPoints >= 15) {
            StorageManager.addPoints(-15, '更多游戏', '使用更多游戏功能');
            this.updatePoints();
            
            // 跳转到游戏页面
            window.location.href = 'games.html';
        } else {
            UIManager.showNotification('积分不足，需要15积分', 'warning');
        }
    },
    
    /**
     * 根据积分显示健康卡片
     */
    showRelaxCardsByPoints() {
        const points = StorageManager.getPoints();
        const healthCard = document.getElementById('health-reminder-card');
        
        if (healthCard) {
            // 积分达到100时显示喝水提醒卡片
            if (points >= 100) {
                healthCard.style.display = 'block';
            } else {
                healthCard.style.display = 'none';
            }
        }
    },
    
    /**
     * 销毁实例
     */
    destroy() {
        // 清理定时器等资源
        this._initialized = false;
    }
};

// 导出到全局作用域
window.RelaxManager = RelaxManager;