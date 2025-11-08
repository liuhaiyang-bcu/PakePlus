// 打卡卡片图片分享功能
// 依赖：html2canvas（需在index.html中引入）
(function(){
    function showShareDakaImageModal(dakaData) {
        // 直接文本内容分享，增加丰富emoji
        let shareText = '';
        shareText += (dakaData.title ? `🏅【${dakaData.title}】\n` : '');
        shareText += (dakaData.content ? `📝 ${dakaData.content}\n` : '');
        if (dakaData.tags && dakaData.tags.length) {
            shareText += '🏷️ 标签：' + dakaData.tags.map(tag=>`#${tag}`).join('、') + '\n';
        }
        if (dakaData.punchRecords && dakaData.punchRecords.length) {
            shareText += '📅 打卡记录：\n';
            dakaData.punchRecords.forEach(r => {
                shareText += `  📆 ${r.date}`;
                if (r.text) shareText += `：${r.text}`;
                shareText += '\n';
            });
        }
        shareText += '✨—— 来自有数规划 ✨';
        if (window.plus && plus.share && plus.share.sendWithSystem) {
            plus.share.sendWithSystem({content: shareText}, function(){}, function(e){
                alert('系统分享失败：'+JSON.stringify(e));
            });
        } else if (navigator.share) {
            navigator.share({title: dakaData.title, text: shareText});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('打卡内容已复制，可粘贴到微信/QQ等进行分享');
            });
        } else {
            // 兼容旧浏览器
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                alert('打卡内容已复制，可粘贴到微信/QQ等进行分享');
            } catch (err) {
                alert('复制失败，请手动复制');
            }
            document.body.removeChild(textarea);
        }
    }

    function showImagePreviewModal(imgUrl) {
        // 移除已存在的弹窗
        document.querySelectorAll('.share-daka-image-modal').forEach(e=>e.remove());
        // 创建弹窗
        const overlay = document.createElement('div');
        overlay.className = 'share-daka-image-modal';
        overlay.innerHTML = `
            <div class="share-daka-image-popup">
                <button class="share-daka-image-close" title="关闭">×</button>
                <div class="share-daka-image-preview"><img src="${imgUrl}" style="max-width:100%;max-height:50vh;border-radius:12px;" /></div>
                <div class="share-daka-image-actions">
                    <button class="share-daka-image-btn" id="daka-img-download"><i class="fas fa-download"></i> 下载图片</button>
                    <button class="share-daka-image-btn" id="daka-img-share"><i class="fas fa-share-alt"></i> 分享图片</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('.share-daka-image-close').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        // 下载
        overlay.querySelector('#daka-img-download').onclick = () => {
            const a = document.createElement('a');
            a.href = imgUrl;
            a.download = 'daka-share.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        // 分享
        overlay.querySelector('#daka-img-share').onclick = async () => {
            if (navigator.canShare && navigator.canShare({ files: [] })) {
                const res = await fetch(imgUrl);
                const blob = await res.blob();
                const file = new File([blob], 'daka-share.png', { type: 'image/png' });
                try {
                    await navigator.share({ files: [file], title: '打卡分享', text: '分享我的打卡' });
                } catch {}
            } else {
                alert('当前浏览器不支持原生图片分享，可手动下载后分享');
            }
        };
    }

    // 笔记分享图片
    window.showShareNoteImageModal = function(noteData) {
        // 统一文本内容格式，增加emoji
        let shareText = '';
        shareText += (noteData.title ? `📒【${noteData.title}】\n` : '');
        shareText += (noteData.content ? `📝 ${noteData.content}\n` : '');
        if (noteData.tags && noteData.tags.length) {
            shareText += '🏷️ 标签：' + noteData.tags.map(tag=>`#${tag}`).join('、') + '\n';
        }
        shareText += '✨—— 来自有数规划 ✨';
        if (window.plus && plus.share && plus.share.sendWithSystem) {
            plus.share.sendWithSystem({content: shareText}, function(){}, function(e){
                alert('系统分享失败：'+JSON.stringify(e));
            });
        } else if (navigator.share) {
            navigator.share({title: noteData.title, text: shareText});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('笔记内容已复制，可粘贴到微信/QQ等进行分享');
            });
        } else {
            // 兼容旧浏览器
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                alert('笔记内容已复制，可粘贴到微信/QQ等进行分享');
            } catch (err) {
                alert('复制失败，请手动复制');
            }
            document.body.removeChild(textarea);
        }
    }

    // 倒数日分享图片
    window.showShareCountdownImageModal = function(countdownData) {
        const temp = document.createElement('div');
        temp.style.position = 'fixed';
        temp.style.left = '-9999px';
        temp.style.top = '0';
        temp.style.width = '360px';
        temp.style.background = '#fff';
        temp.style.color = '#222';
        temp.style.borderRadius = '16px';
        temp.style.boxShadow = '0 2px 16px #4285f422';
        temp.style.padding = '28px 20px 20px 20px';
        temp.style.fontFamily = 'inherit';
        temp.innerHTML = `
            <div style=\"font-size:22px;font-weight:700;margin-bottom:10px;word-break:break-all;display:flex;align-items:center;gap:10px;\">${countdownData.icon||''} ${escapeHtml(countdownData.name)}</div>
            <div style=\"font-size:15px;color:#666;margin-bottom:8px;word-break:break-all;\">日期：${escapeHtml(countdownData.date)}${countdownData.typeShort?`（${escapeHtml(countdownData.typeShort)}）`:''}</div>
            <div style=\"font-size:18px;font-weight:600;color:#4285f4;margin-bottom:8px;\">${countdownData.daysText}</div>
            ${countdownData.notes?`<div style=\"font-size:14px;color:#888;margin-bottom:8px;word-break:break-all;\">备注：${escapeHtml(countdownData.notes)}</div>`:''}
            ${countdownData.participants&&countdownData.participants.length?`<div style=\"font-size:13px;color:#888;margin-bottom:8px;\">参与者：${countdownData.participants.map(escapeHtml).join('，')}</div>`:''}
            <div style='margin-top:18px;text-align:center;font-size:12px;color:#bbb;'>内容来自有数规划</div>
        `;
        document.body.appendChild(temp);
        window.html2canvas(temp, {backgroundColor: null, useCORS: true, scale: 2}).then(canvas => {
            const imgUrl = canvas.toDataURL('image/png');
            document.body.removeChild(temp);
            showImagePreviewModal(imgUrl);
        });
    }

    function escapeHtml(str) {
        return String(str||'').replace(/[&<>"']/g, function(s) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[s];
        });
    }

    // 对外暴露
    window.showShareDakaImageModal = showShareDakaImageModal;
    window.showImagePreviewModal = showImagePreviewModal; // 暴露给 share-modal.js 使用
})(); 