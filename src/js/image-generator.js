(function(w){
    // 检查 html2canvas 是否存在
    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas.js is not loaded. Image generation will not work.');
        // 可以选择注入脚本
        // const script = document.createElement('script');
        // script.src = 'path/to/html2canvas.min.js';
        // document.head.appendChild(script);
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, function(s) {
            return ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'})[s];
        });
    }

    // 统一的图片生成函数
    async function generateShareImage(type, data) {
        if (typeof html2canvas === 'undefined') {
            alert('图片生成工具未加载，请稍后重试。');
            return null;
        }

        let htmlContent = '';
        let cardWidth = '380px';

        switch (type) {
            case 'countdown':
                htmlContent = createCountdownImageHTML(data);
                break;
            case 'todolist':
                htmlContent = createTodolistImageHTML(data);
                break;
            case 'daka':
                htmlContent = createDakaImageHTML(data);
                break;
            default:
                console.error('Unknown image generation type:', type);
                return null;
        }

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px'; // 移出屏幕外
        tempContainer.style.top = '0';
        tempContainer.style.width = cardWidth;
        tempContainer.innerHTML = htmlContent;

        document.body.appendChild(tempContainer);

        try {
            const canvas = await html2canvas(tempContainer.querySelector('.share-card-container'), {
                backgroundColor: null, // 使用CSS背景
                useCORS: true,
                scale: 2.5 // 提高分辨率
            });
            const imgUrl = canvas.toDataURL('image/png');
            return imgUrl;
        } catch (error) {
            console.error('Error generating image with html2canvas:', error);
            alert('图片生成失败，请检查浏览器兼容性或联系支持。');
            return null;
        } finally {
            document.body.removeChild(tempContainer); // 清理DOM
        }
    }

    // --- 倒数日图片模板 ---
    function createCountdownImageHTML(d) {
        const days = CountdownManager.calculateDays(d);
        const daysText = CountdownManager.formatDays(days);
        const dateText = CountdownManager.formatDate(d.date);
        const typeShort = d.type !== 'once' ? `(${CountdownManager.formatTypeShort(d.type)})` : '';
        const participants = (d.participants && d.participants.length > 0) ? d.participants.map(escapeHtml).join('，') : '';

        return `
            <div class="share-card-container" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px; padding: 28px 24px; font-family: 'Microsoft YaHei', sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <div style="font-size: 26px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 12px; word-break: break-all;">
                    <span style="font-size: 32px;">${d.icon || '⏳'}</span>
                    <span>${escapeHtml(d.name)}</span>
                </div>
                <div style="font-size: 16px; opacity: 0.8; margin-bottom: 20px;">${escapeHtml(dateText)} ${escapeHtml(typeShort)}</div>
                <div style="font-size: 48px; font-weight: bold; color: #f0e68c; text-align: center; margin-bottom: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${daysText}</div>
                ${d.notes ? `<div style="font-size: 15px; opacity: 0.9; margin-bottom: 10px; border-left: 3px solid #f0e68c; padding-left: 10px;"><b>备注：</b>${escapeHtml(d.notes)}</div>` : ''}
                ${participants ? `<div style="font-size: 14px; opacity: 0.8;"><b>参与者：</b>${participants}</div>` : ''}
                <div style="margin-top: 24px; text-align: center; font-size: 13px; opacity: 0.6;">-- 来自「有数规划」APP --</div>
            </div>
        `;
    }

    // --- 待办清单图片模板 ---
    function createTodolistImageHTML(d) {
        const items = d.items || [];
        const completedCount = items.filter(item => item.completed).length;
        const totalCount = items.length;
        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        let itemsHtml = '';
        if (items.length > 0) {
            itemsHtml = items.slice(0, 10).map(item => { // 最多显示10条
                const date = item.dueDate ? new Date(item.dueDate) : null;
                const dateStr = date ? `<span style="font-size:12px; color: #888;"> (截止: ${date.getMonth() + 1}-${date.getDate()})</span>` : '';
                return `
                    <div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 15px; ${item.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                        <span style="margin-right: 10px;">${item.completed ? '✅' : '⬜️'}</span>
                        <span>${escapeHtml(item.title)}${dateStr}</span>
                    </div>
                `;
            }).join('');
            if (items.length > 10) {
                itemsHtml += `<div style="text-align:center; color:#999; margin-top:10px;">...等共 ${items.length} 项</div>`;
            }
        } else {
            itemsHtml = '<div style="color:#999; text-align:center; padding: 20px 0;">这个清单还没有任务哦~</div>';
        }

        return `
            <div class="share-card-container" style="background: #ffffff; border: 1px solid #e0e0e0; color: #333; border-radius: 16px; padding: 24px; font-family: 'Microsoft YaHei', sans-serif; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
                <div style="font-size: 24px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; color: #4a4a4a;">
                    <span>🗒️</span>
                    <span>${escapeHtml(d.name)}</span>
                </div>
                <div style="margin-bottom: 18px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #666; margin-bottom: 6px;">
                        <span>完成度</span>
                        <span>${completedCount} / ${totalCount}</span>
                    </div>
                    <div style="background: #e0e0e0; border-radius: 5px; height: 10px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #56ab2f 0%, #a8e063 100%); border-radius: 5px;"></div>
                    </div>
                </div>
                <div style="max-height: 300px; overflow: hidden;">${itemsHtml}</div>
                <div style="margin-top: 24px; text-align: center; font-size: 13px; color: #aaa;">-- 来自「有数规划」APP --</div>
            </div>
        `;
    }

    // --- 打卡图片模板 ---
    function createDakaImageHTML(d) {
        const records = Array.isArray(d.punchRecords) ? d.punchRecords : [];
        const totalCount = records.length;
        const uniqueDays = new Set(records.map(r => r.date)).size;
        const lastRecord = records[records.length - 1];

        return `
            <div class="share-card-container" style="background: linear-gradient(to top, #fff1eb 0%, #ace0f9 100%); color: #333; border-radius: 16px; padding: 28px 24px; font-family: 'Microsoft YaHei', sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
                <div style="text-align:center; margin-bottom: 15px;">
                    <span style="font-size: 24px; font-weight: bold; color: #d9534f;">${escapeHtml(d.title)}</span>
                </div>
                <div style="font-size: 16px; color: #555; text-align: center; margin-bottom: 20px; min-height: 40px;">${escapeHtml(d.content)}</div>
                
                <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 25px; font-size: 16px;">
                    <div>
                        <div style="font-size: 28px; font-weight: bold; color: #f0ad4e;">${totalCount}</div>
                        <div style="font-size: 14px; color: #777;">累计打卡 (次)</div>
                    </div>
                    <div>
                        <div style="font-size: 28px; font-weight: bold; color: #5bc0de;">${uniqueDays}</div>
                        <div style="font-size: 14px; color: #777;">坚持天数 (天)</div>
                    </div>
                </div>

                ${lastRecord ? `
                <div style="background: rgba(255,255,255,0.6); border-radius: 10px; padding: 12px; font-size: 14px;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 5px;">最近一次打卡：${escapeHtml(lastRecord.date)}</div>
                    <div style="color: #666;">${escapeHtml(lastRecord.text) || '无文字记录'}</div>
                </div>
                ` : ''}
                
                <div style="margin-top: 24px; text-align: center; font-size: 13px; color: #aaa;">-- 来自「有数规划」APP --</div>
            </div>
        `;
    }

    // 对外暴露
    w.ImageGenerator = {
        generate: generateShareImage
    };

})(window);