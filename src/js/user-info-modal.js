// 用户信息模态框逻辑
(function() {
  const btn = document.getElementById('user-profile-btn');
  const modal = document.getElementById('user-info-modal');
  const closeBtn = document.getElementById('close-user-info-modal');
  // 数据填充
  function fillUserInfo() {
    // 头像和昵称
    const avatar = localStorage.getItem('userAvatar') || 'img/1.png';
    const nickname = localStorage.getItem('userNickname') || '未登录';
    document.getElementById('user-info-avatar').src = avatar;
    document.getElementById('user-info-nickname').textContent = nickname;
    // 用户更多信息
    let regDate = '', focusTotal = 0, points = 0, loginDays = 0;
    if (window.StorageManager) {
      // 注册时间
      const data = StorageManager.getData && StorageManager.getData();
      if (data && data.user && data.user.createTime) {
        regDate = new Date(data.user.createTime).toLocaleDateString();
      } else if (data && data.loginDates && data.loginDates.length > 0) {
        regDate = data.loginDates[0];
      }
      // 累计专注时长
      focusTotal = (data && data.focusTime && data.focusTime.total) ? data.focusTime.total : 0;
      // 积分
      points = (data && typeof data.points === 'number') ? data.points : 0;
      // 连续登录天数
      loginDays = (data && data.loginDates) ? data.loginDates.length : 0;
    }
    let moreInfoHtml = `<div class="user-more-info">
      <div><span class="user-more-label"><i class="fas fa-calendar-alt"></i> 注册时间：</span>${regDate || '—'}</div>
      <div><span class="user-more-label"><i class="fas fa-star"></i> 累计积分：</span>${points}</div>
      <div><span class="user-more-label"><i class="fas fa-calendar-check"></i> 连续登录天数：</span>${loginDays}</div>
    </div>`;
    let moreInfoContainer = document.getElementById('user-more-info');
    if (!moreInfoContainer) {
      const avatarNickDiv = document.querySelector('.user-info-avatar-nick');
      moreInfoContainer = document.createElement('div');
      moreInfoContainer.id = 'user-more-info';
      avatarNickDiv && avatarNickDiv.parentNode.insertBefore(moreInfoContainer, avatarNickDiv.nextSibling);
    }
    moreInfoContainer.innerHTML = moreInfoHtml;
    // 项目量数据来自StorageManager
    let created = 0, completed = 0;
    if (window.StorageManager && typeof StorageManager.getProjects === 'function') {
      const projects = StorageManager.getProjects() || [];
      created = projects.length;
      completed = projects.filter(p => (p.totalTasks > 0 && p.completedTasks === p.totalTasks)).length;
    }
    document.getElementById('user-projects-created').textContent = created;
    document.getElementById('user-projects-completed').textContent = completed;
    // 1. 已创建清单
    let listListHtml = '';
    if (window.StorageManager && typeof StorageManager.getData === 'function') {
      const data = StorageManager.getData();
      const lists = data.lists || [];
      if (lists.length > 0) {
        listListHtml = '<ul class="user-list-list">' +
          lists.map(l => `<li><span class="list-name">${l.name || '(未命名清单)'}</span> <span class="list-tasks">(${l.items ? l.items.length : 0}项)</span></li>`).join('') +
          '</ul>';
      } else {
        listListHtml = '<div class="user-list-list-empty">暂无清单</div>';
      }
    }
    let listListContainer = document.getElementById('user-lists-list');
    if (!listListContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      listListContainer = document.createElement('div');
      listListContainer.id = 'user-lists-list';
      statsDiv && statsDiv.parentNode.insertBefore(listListContainer, statsDiv.nextSibling);
    }
    listListContainer.innerHTML = `
      <div class="user-list-list-title">
        <button id="toggle-list-list" class="toggle-list-list-btn">${listListContainer.classList.contains('open') ? '收起' : '展开'}</button>
        已创建清单
      </div>
      <div class="user-list-list-panel" style="display:${listListContainer.classList.contains('open') ? 'block' : 'none'};">${listListHtml}</div>
    `;
    const toggleListBtn = document.getElementById('toggle-list-list');
    if (toggleListBtn) {
      toggleListBtn.onclick = function() {
        listListContainer.classList.toggle('open');
        fillUserInfo();
      };
    }
    // 2. 已创建倒数日
    let countdownListHtml = '';
    if (window.StorageManager && typeof StorageManager.getData === 'function') {
      const data = StorageManager.getData();
      const countdowns = data.countdowns || [];
      if (countdowns.length > 0) {
        countdownListHtml = '<ul class="user-countdown-list">' +
          countdowns.map(c => `<li><span class="countdown-name">${c.name || '(未命名倒数日)'}</span> <span class="countdown-date">(${c.date || ''})</span></li>`).join('') +
          '</ul>';
      } else {
        countdownListHtml = '<div class="user-countdown-list-empty">暂无倒数日</div>';
      }
    }
    let countdownListContainer = document.getElementById('user-countdowns-list');
    if (!countdownListContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      countdownListContainer = document.createElement('div');
      countdownListContainer.id = 'user-countdowns-list';
      statsDiv && statsDiv.parentNode.insertBefore(countdownListContainer, statsDiv.nextSibling);
    }
    countdownListContainer.innerHTML = `
      <div class="user-countdown-list-title">
        <button id="toggle-countdown-list" class="toggle-countdown-list-btn">${countdownListContainer.classList.contains('open') ? '收起' : '展开'}</button>
        已创建倒数日
      </div>
      <div class="user-countdown-list-panel" style="display:${countdownListContainer.classList.contains('open') ? 'block' : 'none'};">${countdownListHtml}</div>
    `;
    const toggleCountdownBtn = document.getElementById('toggle-countdown-list');
    if (toggleCountdownBtn) {
      toggleCountdownBtn.onclick = function() {
        countdownListContainer.classList.toggle('open');
        fillUserInfo();
      };
    }
    // 折叠模块化项目列表
    let projectListHtml = '';
    if (window.StorageManager && typeof StorageManager.getProjects === 'function') {
      const projects = StorageManager.getProjects() || [];
      if (projects.length > 0) {
        projectListHtml = '<ul class="user-project-list">' +
          projects.map(p => `<li><span class="project-name">${p.name || '(未命名项目)'}</span> <span class="project-tasks">(${p.completedTasks||0}/${p.totalTasks||0})</span></li>`).join('') +
          '</ul>';
      } else {
        projectListHtml = '<div class="user-project-list-empty">暂无项目</div>';
      }
    }
    let listContainer = document.getElementById('user-projects-list');
    if (!listContainer) {
      // 动态插入容器
      const statsDiv = document.querySelector('.user-info-stats');
      listContainer = document.createElement('div');
      listContainer.id = 'user-projects-list';
      statsDiv && statsDiv.parentNode.insertBefore(listContainer, statsDiv.nextSibling);
    }
    listContainer.innerHTML = `
      <div class="user-project-list-title">
        <button id="toggle-project-list" class="toggle-project-list-btn">${listContainer.classList.contains('open') ? '收起' : '展开'}</button>
        已创建项目
      </div>
      <div class="user-project-list-panel" style="display:${listContainer.classList.contains('open') ? 'block' : 'none'};">${projectListHtml}</div>
    `;
    // 绑定折叠按钮事件
    const toggleBtn = document.getElementById('toggle-project-list');
    if (toggleBtn) {
      toggleBtn.onclick = function() {
        listContainer.classList.toggle('open');
        fillUserInfo(); // 重新渲染
      };
    }
    // -- 勋章系统重构 --

    // 1. 勋章定义
    const MEDAL_DEFINITIONS = [
      { id: 'newcomer', name: '初来乍到', icon: '🔰', condition: (data) => data.loginDates && data.loginDates.length >= 1, points: 0 },
      { id: 'intermediate', name: '中级高手', icon: '🏆', condition: (data) => data.points >= 600, points: 600 },
      { id: 'super_fan', name: '超级热爱者', icon: '💖', condition: (data) => data.points >= 10000, points: 10000 }
    ];

    // 2. 注入勋章弹窗CSS
    if (!document.getElementById('medal-award-styles')) {
        const style = document.createElement('style');
        style.id = 'medal-award-styles';
        style.innerHTML = `
            .medal-award-modal { display: none; position: fixed; z-index: 1001; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
            .medal-award-content { background-color: #fefefe; margin: auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 300px; text-align: center; border-radius: 10px; position: relative; }
            .medal-award-close { color: #aaa; float: right; font-size: 28px; font-weight: bold; position: absolute; top: 5px; right: 15px; }
            .medal-award-close:hover, .medal-award-close:focus { color: black; text-decoration: none; cursor: pointer; }
            .medal-award-details { margin-top: 15px; }
            .medal-award-icon { font-size: 48px; }
            .medal-award-name { display: block; font-size: 22px; font-weight: bold; margin-top: 10px; }
        `;
        document.head.appendChild(style);
    }

    // 3. 显示获得勋章的弹窗
    function showMedalAwardModal(medal) {
      let modal = document.getElementById('medal-award-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'medal-award-modal';
        modal.className = 'medal-award-modal';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div class="medal-award-content">
          <span class="medal-award-close">&times;</span>
          <h2>恭喜获得新勋章！</h2>
          <div class="medal-award-details">
            <span class="medal-award-icon">${medal.icon}</span>
            <span class="medal-award-name">${medal.name}</span>
          </div>
        </div>
      `;
      modal.style.display = 'flex';

      const close = modal.querySelector('.medal-award-close');
      close.onclick = () => { modal.style.display = 'none'; };
      modal.onclick = (event) => {
        if (event.target == modal) {
          modal.style.display = 'none';
        }
      };
    }

    // 4. 检查并授予勋章
    function checkAndAwardMedals() {
      if (!window.StorageManager) return;
      const data = StorageManager.getData();
      if (!data) return [];

      let medals = data.medals || [];
      const awardedMedalIds = medals.map(m => m.id);
      let changed = false;

      MEDAL_DEFINITIONS.forEach(medalDef => {
        if (!awardedMedalIds.includes(medalDef.id) && medalDef.condition(data)) {
          const newMedal = { id: medalDef.id, name: medalDef.name, icon: medalDef.icon, unlocked: true, unlockedDate: new Date().toISOString() };
          medals.push(newMedal);
          awardedMedalIds.push(newMedal.id); // 更新已授予列表，防止同一批次重复
          showMedalAwardModal(newMedal);
          changed = true;
        }
      });
      
      // 移除不符合新定义的勋章
      const validMedalIds = MEDAL_DEFINITIONS.map(m => m.id);
      const filteredMedals = medals.filter(m => validMedalIds.includes(m.id));
      if (filteredMedals.length !== medals.length) {
          changed = true;
      }

      if (changed) {
        data.medals = filteredMedals;
        StorageManager.saveData(data);
      }
      return filteredMedals;
    }

    // 5. 展示获得的勋章
    const currentMedals = checkAndAwardMedals();
    let medalsHtml = '';
    if (currentMedals && currentMedals.length > 0) {
      medalsHtml = '<ul class="user-medals-list">' +
        currentMedals.sort((a, b) => {
            const pointsA = MEDAL_DEFINITIONS.find(m => m.id === a.id).points;
            const pointsB = MEDAL_DEFINITIONS.find(m => m.id === b.id).points;
            return pointsA - pointsB;
        }).map(m => `<li class="user-medal-item"><span class="user-medal-icon">${m.icon}</span> <span class="user-medal-name">${m.name}</span></li>`).join('') +
        '</ul>';
    } else {
      medalsHtml = '<div class="user-medals-list-empty">暂无获得成就</div>';
    }

    let medalsContainer = document.getElementById('user-medals-list');
    if (!medalsContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      medalsContainer = document.createElement('div');
      medalsContainer.id = 'user-medals-list';
      statsDiv && statsDiv.parentNode.insertBefore(medalsContainer, statsDiv.nextSibling);
    }
    medalsContainer.innerHTML = `
      <div class="user-medals-list-title">已获得成就</div>
      <div class="user-medals-list-panel">${medalsHtml}</div>
    `;
  }
  // 用户数据管理
  const UserDataManager = {
    // 保存用户数据
    saveUserData(nickname) {
      if (!window.StorageManager) return;
      
      const data = StorageManager.getData();
      const userData = {
        nickname: nickname,
        avatar: localStorage.getItem('userAvatar') || 'img/1.png',
        projects: data.projects || [],
        tasks: data.tasks || [],
        lists: data.lists || [],
        countdowns: data.countdowns || [],
        focusTime: data.focusTime || {},
        points: data.points || 0,
        loginDates: data.loginDates || [],
        medals: data.medals || [],
        createTime: data.user ? data.user.createTime : new Date().toISOString(),
        lastLoginTime: new Date().toISOString()
      };
      
      // 保存到本地存储，使用昵称作为key
      localStorage.setItem(`userData_${nickname}`, JSON.stringify(userData));
      console.log(`用户数据已保存: ${nickname}`);
    },
    
    // 恢复用户数据
    restoreUserData(nickname) {
      if (!window.StorageManager) return false;
      
      const userDataStr = localStorage.getItem(`userData_${nickname}`);
      if (!userDataStr) return false;
      
      try {
        const userData = JSON.parse(userDataStr);
        
        // 恢复所有内容
        const data = StorageManager.getData();
        data.projects = userData.projects || [];
        data.tasks = userData.tasks || [];
        data.lists = userData.lists || [];
        data.countdowns = userData.countdowns || [];
        data.focusTime = userData.focusTime || {};
        data.points = userData.points || 0;
        data.medals = userData.medals || [];
        data.user = {
          createTime: userData.createTime,
          lastLoginTime: new Date().toISOString()
        };
        
        // 更新登录日期
        const today = new Date().toLocaleDateString();
        if (!data.loginDates) data.loginDates = [];
        if (!data.loginDates.includes(today)) {
          data.loginDates.push(today);
        }
        
        // 保存恢复的数据
        StorageManager.saveData(data);
        
        // 恢复用户头像和昵称
        localStorage.setItem('userAvatar', userData.avatar);
        localStorage.setItem('userNickname', nickname);
        
        console.log(`用户数据已恢复: ${nickname}`);
        return true;
      } catch (error) {
        console.error('恢复用户数据失败:', error);
        return false;
      }
    },
    
    // 获取所有已保存的用户
    getAllUsers() {
      const users = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userData_')) {
          const nickname = key.replace('userData_', '');
          users.push(nickname);
        }
      }
      return users;
    }
  };

  if(btn && modal && closeBtn) {
    btn.addEventListener('click', function() {
      fillUserInfo();
      modal.classList.add('open');
    });
    closeBtn.addEventListener('click', function() {
      modal.classList.remove('open');
    });
    
    // 添加通知设置按钮事件绑定
    const notificationSettingsBtn = document.getElementById('notification-settings-btn');
    if (notificationSettingsBtn) {
      notificationSettingsBtn.addEventListener('click', function() {
        // 先关闭用户信息模态框
        modal.classList.remove('open');
        // 打开通知设置模态框
        if (typeof openNotificationSettings === 'function') {
          openNotificationSettings();
        } else {
          console.error('通知设置功能未正确加载');
        }
      });
    }
    
    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
      if(e.target === modal) modal.classList.remove('open');
    });
  }

  // 暴露UserDataManager到全局
  window.UserDataManager = UserDataManager;
})(); 