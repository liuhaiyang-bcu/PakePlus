// 通知设置模态框逻辑
(function() {
  // 创建通知设置模态框元素
  function createNotificationSettingsModal() {
    // 检查是否已经存在模态框
    if (document.getElementById('notification-settings-modal')) {
      return;
    }

    // 创建模态框HTML
    const modalHTML = `
      <div id="notification-settings-modal">
        <div class="notification-settings-modal-content">
          <button id="close-notification-settings" title="关闭">×</button>
          <div class="notification-settings-header">
            <div class="notification-settings-icon">
              <i class="fas fa-bell"></i>
            </div>
            <div class="notification-settings-title">通知设置</div>
          </div>
          
          <div class="notification-settings-section">
            <div class="notification-settings-section-title">
              <i class="fas fa-cog"></i>
              通知类型
            </div>
            
            <div class="notification-settings-item">
              <div class="notification-settings-item-label">
                <i class="fas fa-calendar-alt notification-settings-item-icon"></i>
                <span class="notification-settings-item-name">事件通知</span>
              </div>
              <label class="notification-settings-item-toggle">
                <input type="checkbox" id="event-notifications" checked>
                <span class="notification-settings-item-toggle-slider"></span>
              </label>
            </div>
            
            <div class="notification-settings-item">
              <div class="notification-settings-item-label">
                <i class="fas fa-list notification-settings-item-icon"></i>
                <span class="notification-settings-item-name">清单提醒</span>
              </div>
              <label class="notification-settings-item-toggle">
                <input type="checkbox" id="todo-notifications" checked>
                <span class="notification-settings-item-toggle-slider"></span>
              </label>
            </div>
            
            <div class="notification-settings-item">
              <div class="notification-settings-item-label">
                <i class="fas fa-hourglass-half notification-settings-item-icon"></i>
                <span class="notification-settings-item-name">倒数日提醒</span>
              </div>
              <label class="notification-settings-item-toggle">
                <input type="checkbox" id="countdown-notifications" checked>
                <span class="notification-settings-item-toggle-slider"></span>
              </label>
            </div>
            
            <div class="notification-settings-item">
              <div class="notification-settings-item-label">
                <i class="fas fa-check-circle notification-settings-item-icon"></i>
                <span class="notification-settings-item-name">打卡提醒</span>
              </div>
              <label class="notification-settings-item-toggle">
                <input type="checkbox" id="daka-notifications" checked>
                <span class="notification-settings-item-toggle-slider"></span>
              </label>
            </div>
            
            <div class="notification-settings-item">
              <div class="notification-settings-item-label">
                <i class="fas fa-clock notification-settings-item-icon"></i>
                <span class="notification-settings-item-name">番茄时钟提醒</span>
              </div>
              <label class="notification-settings-item-toggle">
                <input type="checkbox" id="pomodoro-notifications" checked>
                <span class="notification-settings-item-toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div class="notification-settings-actions">
            <button class="notification-settings-btn notification-settings-save-btn" id="save-notification-settings">
              保存设置
            </button>
            <button class="notification-settings-btn notification-settings-cancel-btn" id="cancel-notification-settings">
              取消
            </button>
          </div>
        </div>
      </div>
    `;

    // 将模态框添加到body中
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 绑定事件
    bindEvents();
    
    // 加载保存的设置
    loadNotificationSettings();
  }

  // 绑定事件
  function bindEvents() {
    const modal = document.getElementById('notification-settings-modal');
    const closeBtn = document.getElementById('close-notification-settings');
    const saveBtn = document.getElementById('save-notification-settings');
    const cancelBtn = document.getElementById('cancel-notification-settings');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeNotificationSettings);
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', saveNotificationSettings);
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeNotificationSettings);
    }
    
    // 点击模态框外部关闭
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeNotificationSettings();
        }
      });
    }
  }

  // 打开通知设置
  function openNotificationSettings() {
    createNotificationSettingsModal();
    const modal = document.getElementById('notification-settings-modal');
    if (modal) {
      modal.classList.add('open');
    }
  }

  // 关闭通知设置
  function closeNotificationSettings() {
    const modal = document.getElementById('notification-settings-modal');
    if (modal) {
      modal.classList.remove('open');
    }
  }

  // 保存通知设置
  function saveNotificationSettings() {
    const settings = {
      eventNotifications: document.getElementById('event-notifications').checked,
      todoNotifications: document.getElementById('todo-notifications').checked,
      countdownNotifications: document.getElementById('countdown-notifications').checked,
      dakaNotifications: document.getElementById('daka-notifications').checked,
      pomodoroNotifications: document.getElementById('pomodoro-notifications').checked
    };
    
    // 保存到本地存储
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    
    // 显示保存成功的提示
    if (window.notificationManager) {
      notificationManager.showToast('通知设置已保存');
    } else {
      // 降级到简单的alert
      alert('通知设置已保存');
    }
    
    // 关闭模态框
    closeNotificationSettings();
  }

  // 加载通知设置
  function loadNotificationSettings() {
    const settingsStr = localStorage.getItem('notificationSettings');
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        
        if (settings.eventNotifications !== undefined) {
          document.getElementById('event-notifications').checked = settings.eventNotifications;
        }
        
        if (settings.todoNotifications !== undefined) {
          document.getElementById('todo-notifications').checked = settings.todoNotifications;
        }
        
        if (settings.countdownNotifications !== undefined) {
          document.getElementById('countdown-notifications').checked = settings.countdownNotifications;
        }
        
        if (settings.dakaNotifications !== undefined) {
          document.getElementById('daka-notifications').checked = settings.dakaNotifications;
        }
        
        if (settings.pomodoroNotifications !== undefined) {
          document.getElementById('pomodoro-notifications').checked = settings.pomodoroNotifications;
        }
      } catch (e) {
        console.error('加载通知设置失败:', e);
      }
    }
  }

  // 检查是否启用特定类型的通知
  function isNotificationEnabled(type) {
    const settingsStr = localStorage.getItem('notificationSettings');
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        switch (type) {
          case 'event':
            return settings.eventNotifications !== false; // 默认为true
          case 'todo':
            return settings.todoNotifications !== false;
          case 'countdown':
            return settings.countdownNotifications !== false;
          case 'daka':
            return settings.dakaNotifications !== false;
          case 'pomodoro':
            return settings.pomodoroNotifications !== false;
          default:
            return true;
        }
      } catch (e) {
        console.error('检查通知设置失败:', e);
        return true; // 默认启用
      }
    }
    return true; // 默认启用
  }

  // 初始化 - 页面加载完成后创建模态框
  document.addEventListener('DOMContentLoaded', function() {
    createNotificationSettingsModal();
  });

  // 暴露到全局作用域
  window.openNotificationSettings = openNotificationSettings;
  window.isNotificationEnabled = isNotificationEnabled;
})();