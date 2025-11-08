// 悬浮窗：今日农历信息
(function() {
  const solarSpan = document.getElementById('today-solar');
  const lunarSpan = document.getElementById('today-lunar');
  const btn = document.getElementById('holiday-lunar-float');

  // 获取今日日期
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  let lastDetail = null;
  let lastHolidayInfo = null;
  let lastHolidayType = null; // 0:班 1:休 2:假

  // 调用万年历API
  function fetchAlmanac() {
    const url = `https://api.tiax.cn/almanac/?year=${yyyy}&month=${parseInt(mm)}&day=${parseInt(dd)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        // 公历月日（不显示年份）
        const solar = `${parseInt(mm)}月${parseInt(dd)}日`;
        // 农历信息，只显示月日
        let lunar = '';
        if (data.农历日期) {
          lunar = data.农历日期.replace(/^农历.*?年\s*/,'').trim();
        } else {
          lunar = '农历加载失败';
        }
        lastDetail = data;
        fetchHolidayInfo(solar, lunar);
      })
      .catch(() => {
        solarSpan.textContent = '日期加载失败';
        lunarSpan.textContent = '';
        lastDetail = null;
      });
  }

  // 节假日API（以timor.tech为例，支持免费/开源/离线）
  function fetchHolidayInfo(solar, lunar) {
    fetch(`https://timor.tech/api/holiday/info?date=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        // 结构参考 https://timor.tech/api/holiday/info?date=2024-05-01
        // data.holiday: {name: "劳动节", ...}  data.type.type: 0/1/2
        let info = '';
        let type = null;
        if (data.holiday && data.holiday.name) {
          info = data.holiday.name;
        } else if (data.type) {
          if (data.type.type === 2) info = '节假日';
          else if (data.type.type === 1) info = '休息日';
          else if (data.type.type === 0) info = '工作日';
        }
        type = data.type ? data.type.type : null;
        lastHolidayInfo = info;
        lastHolidayType = type;
        // 顶部栏加“假”或“班”
        let tag = '';
        // 统一亮色（橙色）
        if (type === 2) tag = '<span style="color:#ffb300;font-size:12px;font-weight:bold;margin-left:6px;">假</span>';
        else if (type === 1) tag = '<span style="color:#ffb300;font-size:12px;font-weight:bold;margin-left:6px;">假</span>';
        else if (type === 0) tag = '<span style="color:#ffb300;font-size:12px;font-weight:bold;margin-left:6px;">班</span>';
        // solar和lunar也高亮
        solarSpan.innerHTML = `<span style="color:#fff;font-weight:bold;">${solar}</span>` + tag;
        lunarSpan.innerHTML = `<span style="color:#f8e9b0;font-weight:bold;">${lunar}</span>`;
      })
      .catch(() => {
        lastHolidayInfo = null;
        lastHolidayType = null;
        solarSpan.textContent = solar;
        lunarSpan.textContent = lunar;
      });
  }

  // 完整宜事项列表
  function showYiFullList(data) {
    if (!data) return;
    const isDark = document.body.classList.contains('dark-theme');
    const cardBg = isDark ? 'linear-gradient(135deg,#1a1d23 0%,#2d3138 50%,#23272e 100%)' : 'linear-gradient(135deg,#ffffff 0%,#f8fafc 50%,#f1f5f9 100%)';
    const cardColor = isDark ? '#e2e8f0' : '#1e293b';
    const cardShadow = isDark ? '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' : '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)';
    const closeColor = isDark ? '#94a3b8' : '#64748b';
    const lunarColor = isDark ? '#60a5fa' : '#2563eb';
    const accentColor = isDark ? '#10b981' : '#059669';
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const headerBg = isDark ? 'linear-gradient(135deg,#1e293b 0%,#334155 100%)' : 'linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 100%)';
    
    const yiItems = (data.宜||'').split('、').filter(Boolean);
    const listHtml = yiItems.length ? yiItems.map((it, idx) => `
      <li style="
        padding: 12px 16px;
        margin: 8px 0;
        background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
        border-radius: 12px;
        border-left: 3px solid ${accentColor};
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
        box-shadow: ${isDark ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'};
      ">
        <span style="
          min-width: 28px;
          height: 28px;
          background: ${accentColor};
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">${idx+1}</span>
        <span style="
          flex: 1;
          font-size: 15px;
          line-height: 1.5;
          color: ${cardColor};
        ">${it}</span>
      </li>
    `).join('') : '<li style="text-align:center;padding:20px;color:#94a3b8;font-style:italic;">暂无数据</li>';
    
    let dlg = document.createElement('div');
    dlg.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
    `;
    
    dlg.innerHTML = `
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .yi-modal-content {
          animation: slideUp 0.3s ease-out;
        }
      </style>
      <div class="yi-modal-content" style="
        background: ${cardBg};
        color: ${cardColor};
        border-radius: 20px;
        box-shadow: ${cardShadow};
        max-width: 90vw;
        width: 600px;
        max-height: 85vh;
        overflow: hidden;
        position: relative;
        border: 1px solid ${borderColor};
      ">
        <!-- Header -->
        <div style="
          background: ${headerBg};
          padding: 20px 24px 16px 24px;
          border-bottom: 1px solid ${borderColor};
          position: relative;
        ">
          <button id="close-yi-list" style="
            position: absolute;
            right: 16px;
            top: 16px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: ${closeColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(0,0,0,0.1)'" onmouseout="this.style.background='none'">×</button>
          
          <button id="share-yi-list" style="
            position: absolute;
            right: 56px;
            top: 16px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: ${closeColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(0,0,0,0.1)'" onmouseout="this.style.background='none'" title="分享">
            <i class="fas fa-share-alt"></i>
          </button>
          
          <div style="text-align: center; margin-right: 80px;">
            <div style="
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 4px;
              background: linear-gradient(135deg, ${lunarColor}, ${accentColor});
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            ">${data.公历日期||''}</div>
            <div style="
              font-size: 15px;
              color: ${lunarColor};
              font-weight: 500;
            ">${data.农历日期||''}</div>
          </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px;">
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding: 16px;
            background: ${isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.08)'};
            border-radius: 12px;
            border: 1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)'};
          ">
            <div style="
              width: 40px;
              height: 40px;
              background: ${accentColor};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 18px;
            ">✓</div>
            <div>
              <h3 style="
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: ${accentColor};
              ">今日适宜事项</h3>
              <p style="
                margin: 4px 0 0 0;
                font-size: 14px;
                color: ${isDark ? '#94a3b8' : '#64748b'};
              ">共 ${yiItems.length} 项适宜活动（内容来自网络，仅供参考）</p>
            </div>
          </div>
          
          <div id="yi-scroll-container" style="
            max-height: 400px;
            overflow-y: auto;
            padding-right: 8px;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          ">
            <ul style="
              list-style: none;
              margin: 0;
              padding: 0;
            ">${listHtml}</ul>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dlg);
    
    // Close button
    dlg.querySelector('#close-yi-list').onclick = () => {
      dlg.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => document.body.removeChild(dlg), 200);
    };
    
    // Share button
    dlg.querySelector('#share-yi-list').onclick = (e) => {
      e.stopPropagation();
      const shareText = `📅 ${data.公历日期||''}\n🌙 ${data.农历日期||''}\n\n✅ 今日适宜事项：\n${yiItems.map((item, idx) => `${idx+1}. ${item}`).join('\n')}\n\n✨ 来自有数规划 ✨`;
      
      if (navigator.share) {
        navigator.share({
          title: `${data.公历日期||''} 适宜事项`,
          text: shareText
        }).catch(() => {
          // Fallback to clipboard
          navigator.clipboard.writeText(shareText).then(() => {
            alert('已复制到剪贴板');
          });
        });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
          alert('已复制到剪贴板');
        });
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          alert('已复制到剪贴板');
        } catch (err) {
          alert('复制失败');
        }
        document.body.removeChild(textarea);
      }
    };
    
    // Click outside to close
    dlg.onclick = (e) => {
      if (e.target === dlg) {
        dlg.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => document.body.removeChild(dlg), 200);
      }
    };
    
    // 添加触控滑动适配
    enableTouchScrollForYiList(dlg);
  }

  // 弹窗显示详细信息
  function showDetailDialog(data) {
    if (!data) return;
    // 判断深色模式
    const isDark = document.body.classList.contains('dark-theme');
    const cardBg = isDark ? 'linear-gradient(135deg,#23272e 60%,#2d3138 100%)' : 'linear-gradient(135deg,#fff 60%,#f7fafd 100%)';
    const cardColor = isDark ? '#f3f3f3' : '#222';
    const cardShadow = isDark ? '0 8px 32px rgba(0,0,0,0.55)' : '0 8px 32px rgba(0,0,0,0.13)';
    const closeColor = isDark ? '#aaa' : '#888';
    const lunarColor = isDark ? '#7ecfff' : '#2980b9';
    const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const tag1 = isDark ? 'linear-gradient(90deg,#3a3f4a,#5e5a7a)' : 'linear-gradient(90deg,#fbeee6,#f7d9c4)';
    const tag2 = isDark ? 'linear-gradient(90deg,#2e4a5e,#3a7ca5)' : 'linear-gradient(90deg,#e6f7fb,#c4e3f7)';
    const tag3 = isDark ? 'linear-gradient(90deg,#3a2e5e,#7b3fb0)' : 'linear-gradient(90deg,#f3e6fb,#e0c4f7)';
    const fontTitle = 'font-family:STKaiti,STSong,SimSun,fangsong,Microsoft YaHei,serif;';
    const yiItems = (data.宜||'').split('、').filter(Boolean);
    const previewCount = 6;
    const yiPreview = yiItems.slice(0, previewCount);
    const yiPreviewHtml = yiPreview.map(item=>`<span style='display:inline-flex;align-items:center;gap:2px;margin:3px 8px 3px 0;'><span style="color:#27ae60;font-size:13px;">✔️</span><span>${item}</span></span>`).join('');
    const yiMore = yiItems.length>previewCount;
    // 获取当前时间字符串
    function getTimeStr() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }
    // 假日信息优先用API
    let holidayText = lastHolidayInfo ? `<div style="font-size:15px;color:#e67e22;font-weight:bold;margin-top:6px;letter-spacing:1px;">${lastHolidayInfo}</div>` : '';
    // 时间显示
    let timeHtml = `<div id="lunar-detail-time" style="font-size:14px;color:#ffb300;font-weight:bold;margin-top:2px;letter-spacing:1px;">${getTimeStr()}</div>`;
    const html = `
      <div style="text-align:center;margin-bottom:18px;">
        <div style="font-size:22px;font-weight:600;letter-spacing:1.5px;${fontTitle}line-height:1.2;">${data.公历日期||''}</div>
        <div style="font-size:16px;color:${lunarColor};margin-top:4px;${fontTitle}line-height:1.2;">${data.农历日期||''}</div>
        ${timeHtml}
        ${holidayText}
      </div>
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
        <span style="background:${tag1};border-radius:8px;padding:3px 14px;font-size:13px;color:#b07b33;${isDark?'color:#e0c08c;':''};box-shadow:0 1px 4px 0 rgba(0,0,0,0.04);transition:box-shadow 0.2s;cursor:default;">干支：${data.干支日期||''}</span>
        <span style="background:${tag2};border-radius:8px;padding:3px 14px;font-size:13px;color:#3a7ca5;${isDark?'color:#7ecfff;':''};box-shadow:0 1px 4px 0 rgba(0,0,0,0.04);transition:box-shadow 0.2s;cursor:default;">五行：${data.五行纳音||''}</span>
        <span style="background:${tag3};border-radius:8px;padding:3px 14px;font-size:13px;color:#7b3fb0;${isDark?'color:#c7aaff;':''};box-shadow:0 1px 4px 0 rgba(0,0,0,0.04);transition:box-shadow 0.2s;cursor:default;">星神：${data.值日星神||''}</span>
      </div>
      <div style="border-top:1px solid ${borderColor};margin:0 0 0 0;padding:12px 0 0 0;">
        <div style="font-size:16px;font-weight:bold;color:#27ae60;letter-spacing:1px;text-align:center;${fontTitle}">宜</div>
        <div style="font-size:14px;line-height:1.8;color:${isDark?'#b6e6c7':'#2d7a4b'};margin-top:6px;">${yiPreviewHtml}${yiMore?`<span style='color:${isDark?'#b6e6c7':'#2d7a4b'};margin-left:6px;'>等</span>`:''}</div>
        <div style="text-align:center;margin-top:10px;">
          <button id="view-all-yi" style="padding:8px 14px;border-radius:10px;border:1px solid ${borderColor};background:${isDark?'#2d3138':'#fff'};color:${isDark?'#f3f3f3':'#222'};cursor:pointer;">查看全部适宜事项</button>
        </div>
      </div>
      <div style="border-top:1px solid ${borderColor};margin:18px 0 0 0;padding:10px 0 0 0;text-align:center;">
        <div style="font-size:13px;color:${isDark?'#aaa':'#888'};">黄历参考：${data.黄历日期||''}</div>
      </div>
    `;
    // 创建弹窗
    let dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.left = '0';
    dialog.style.top = '0';
    dialog.style.width = '100vw';
    dialog.style.height = '100vh';
    dialog.style.background = 'rgba(0,0,0,0.25)';
    dialog.style.zIndex = '9999';
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';
    dialog.innerHTML = `<div style="background:${cardBg};color:${cardColor};padding:32px 22px 22px 22px;border-radius:20px;max-width:96vw;min-width:240px;box-shadow:${cardShadow};position:relative;backdrop-filter:blur(2px);">
      <button id="close-lunar-detail" style="position:absolute;right:14px;top:10px;background:none;border:none;font-size:22px;cursor:pointer;color:${closeColor};line-height:1;">×</button>
      <button id="share-lunar-detail" title="分享" style="position:absolute;right:48px;top:12px;background:none;border:none;font-size:18px;cursor:pointer;color:${closeColor};line-height:1;"><i class="fas fa-share-alt"></i></button>
      ${html}
    </div>`;
    document.body.appendChild(dialog);
    // 关闭按钮
    dialog.querySelector('#close-lunar-detail').onclick = function() {
      document.body.removeChild(dialog);
    };
    dialog.onclick = function(e) {
      if (e.target === dialog) document.body.removeChild(dialog);
    };
    // 分享按钮
    dialog.querySelector('#share-lunar-detail').onclick = function(e) {
      e.stopPropagation();
      // 分享方式选择
      let shareBox = document.createElement('div');
      shareBox.style.position = 'fixed';
      shareBox.style.left = '0';
      shareBox.style.top = '0';
      shareBox.style.width = '100vw';
      shareBox.style.height = '100vh';
      shareBox.style.background = 'rgba(0,0,0,0.15)';
      shareBox.style.zIndex = '10000';
      shareBox.style.display = 'flex';
      shareBox.style.alignItems = 'center';
      shareBox.style.justifyContent = 'center';
      shareBox.innerHTML = `<div style="background:${cardBg};color:${cardColor};padding:18px 24px;border-radius:14px;box-shadow:${cardShadow};min-width:180px;max-width:90vw;display:flex;flex-direction:column;gap:16px;align-items:center;">
        <button id="share-as-text" style="font-size:15px;padding:8px 18px;border-radius:8px;border:none;background:#27ae60;color:#fff;font-weight:bold;cursor:pointer;display:flex;align-items:center;gap:8px;"><i class="fas fa-font"></i>文字分享</button>
        <button id="share-cancel" style="font-size:13px;padding:4px 12px;border-radius:6px;border:none;background:#eee;color:#888;cursor:pointer;margin-top:8px;">取消</button>
      </div>`;
      document.body.appendChild(shareBox);
      shareBox.onclick = function(ev) { if (ev.target === shareBox) document.body.removeChild(shareBox); };
      shareBox.querySelector('#share-cancel').onclick = function() { document.body.removeChild(shareBox); };
      // 文字分享
      shareBox.querySelector('#share-as-text').onclick = function() {
        document.body.removeChild(shareBox);
        let text = '';
        text += `📅 ${lastDetail?.公历日期||''}\n`;
        text += `🌙 ${lastDetail?.农历日期||''}\n`;
        if (lastHolidayInfo) text += `🎉 [${lastHolidayInfo}]\n`;
        text += `✔️ 宜：${lastDetail?.宜||''}\n`;
        text += `📖 黄历：${lastDetail?.黄历日期||''}\n`;
        text += '✨—— 来自有数规划 ✨';
        if (window.plus && plus.share && plus.share.sendWithSystem) {
          plus.share.sendWithSystem({content: text}, function(){}, function(e){
            alert('系统分享失败：'+JSON.stringify(e));
          });
        } else if (navigator.share) {
          navigator.share({title: lastDetail?.公历日期||'日历', text: text});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            alert('已复制到剪贴板，可粘贴分享');
          });
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            alert('已复制到剪贴板，可粘贴分享');
          } catch (err) {
            alert('复制失败，请手动复制');
          }
          document.body.removeChild(textarea);
        }
      };
    };
    // 查看全部宜事项按钮
    const viewAllBtn = dialog.querySelector('#view-all-yi');
    if (viewAllBtn) {
      viewAllBtn.onclick = function(ev) {
        ev.stopPropagation();
        showYiFullList(data);
      };
    }
    // 自动更新时间
    setTimeout(function updateTime() {
      const t = document.getElementById('lunar-detail-time');
      if (t) {
        t.textContent = getTimeStr();
        setTimeout(updateTime, 1000);
      }
    }, 1000);
  }

  btn && btn.addEventListener('click', function() {
    if (lastDetail) showDetailDialog(lastDetail);
  });

  fetchAlmanac();

  /**
   * 为适宜事项列表启用触控滑动适配
   * @param {Element} dlg 弹窗元素
   */
  function enableTouchScrollForYiList(dlg) {
    const container = dlg.querySelector('#yi-scroll-container');
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
      if (!document.getElementById('yi-touch-scroll-styles')) {
        const style = document.createElement('style');
        style.id = 'yi-touch-scroll-styles';
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
              padding-right: 12px;
            }
            
            .touch-scroll-enabled::-webkit-scrollbar {
              width: 6px;
            }
            
            /* 为适宜事项列表项添加触控友好的间距 */
            .touch-scroll-enabled li {
              margin: 10px 0 !important;
              padding: 14px 18px !important;
            }
            
            /* 增强触控反馈 */
            .touch-scroll-enabled li:active {
              transform: scale(0.98);
              transition: transform 0.1s ease;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }
})(); 