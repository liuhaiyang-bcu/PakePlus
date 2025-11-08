document.addEventListener('DOMContentLoaded', () => {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'share-modal-container';
    document.body.appendChild(modalContainer);
});

function showShareModal(title, text, url, shareData = null) {
    const modalContainer = document.getElementById('share-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
        <div class="share-modal">
            <div class="share-modal-overlay"></div>
            <div class="share-options">
                <button class="share-option-btn share-as-image">
                    <i class="fas fa-image"></i>
                    分享精美图片
                </button>
                <button class="share-option-btn share-link">
                    <i class="fas fa-share-alt"></i>
                    分享链接/文本
                </button>
            </div>
        </div>
    `;

    const modal = modalContainer.querySelector('.share-modal');
    setTimeout(() => modal.classList.add('visible'), 10);

    const closeModal = () => {
        modal.classList.remove('visible');
        setTimeout(() => {
            modalContainer.innerHTML = '';
        }, 300);
    };

    modalContainer.querySelector('.share-modal-overlay').addEventListener('click', closeModal);

    modalContainer.querySelector('.share-link').addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: title,
                text: text,
                url: url,
            }).catch(console.error);
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                 if (window.UIManager) UIManager.showNotification('内容已复制到剪贴板', 'success');
                 else alert('内容已复制到剪贴板');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('复制失败');
            });
        } else {
            alert('您的浏览器不支持一键复制，请手动复制。');
        }
        closeModal();
    });

    modalContainer.querySelector('.share-as-image').addEventListener('click', () => {
        if (shareData && shareData.type === 'daka') {
            // 调用打卡专用的图片分享功能
            if (window.showShareDakaImageModal) {
                window.showShareDakaImageModal(shareData.data);
            } else {
                alert('打卡图片分享功能未加载');
            }
        } else if (shareData && shareData.type === 'countdown') {
            // 调用倒数日的图片分享功能
            if (window.showShareCountdownImageModal) {
                window.showShareCountdownImageModal(shareData.data);
            } else {
                alert('倒数日图片分享功能未加载');
            }
        } else if (shareData && shareData.type === 'todolist') {
            // 调用清单的图片分享功能（如果有的话）
            alert('清单图片分享功能正在开发中！');
        } else {
            alert('图片分享功能正在开发中！');
        }
        closeModal();
    });
}