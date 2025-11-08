/**
 * 应用主模块
 * 负责初始化和管理应用的主要功能
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化存储管理器
    StorageManager.init();

    // 备份数据按钮点击事件
    const backupDataBtn = document.getElementById('backup-data');
    if (backupDataBtn) {
        backupDataBtn.addEventListener('click', async () => {
            try {
                // 获取主应用数据并过滤掉图片内容
                const data = StorageManager.getData();
                const filteredData = filterDataWithoutImages(data);
                
                // 获取心情日记数据
                const moodDiaryData = localStorage.getItem('moodEntries');
                if (moodDiaryData) {
                    filteredData.moodDiary = JSON.parse(moodDiaryData);
                }
                
                // 获取专注时钟数据
                const pomodoroData = localStorage.getItem('pomodoroAppData');
                if (pomodoroData) {
                    filteredData.pomodoro = JSON.parse(pomodoroData);
                }
                
                // 获取清单数据
                if (filteredData.lists && Array.isArray(filteredData.lists)) {
                    // 确保清单数据完整
                } else {
                    const listsData = localStorage.getItem('lists');
                    if (listsData) {
                        try {
                            filteredData.lists = JSON.parse(listsData);
                        } catch (e) {
                            console.warn('解析清单数据失败:', e);
                        }
                    }
                }
                
                // 获取倒数日数据
                if (filteredData.countdowns && Array.isArray(filteredData.countdowns)) {
                    // 确保倒数日数据完整
                } else {
                    const countdownsData = localStorage.getItem('countdowns');
                    if (countdownsData) {
                        try {
                            filteredData.countdowns = JSON.parse(countdownsData);
                        } catch (e) {
                            console.warn('解析倒数日数据失败:', e);
                        }
                    }
                }
                
                // 获取打卡数据
                if (filteredData.dakas && Array.isArray(filteredData.dakas)) {
                    // 确保打卡数据完整
                } else {
                    const dakasData = localStorage.getItem('dakas');
                    if (dakasData) {
                        try {
                            filteredData.dakas = JSON.parse(dakasData);
                        } catch (e) {
                            console.warn('解析打卡数据失败:', e);
                        }
                    }
                }
                
                const jsonString = JSON.stringify(filteredData, null, 2);
                
                // 系统分享优先
                if (window.plus && plus.share && plus.share.sendWithSystem) {
                    plus.share.sendWithSystem({content: jsonString}, function(){}, function(e){
                        // 系统分享失败时自动复制到剪贴板
                        copyTextToClipboard(jsonString);
                        showToast('系统分享失败，备份数据已复制到剪贴板，可粘贴分享！\n注意：图片内容不会被备份。', 'success');
                    });
                } else if (navigator.share) {
                    try {
                        await navigator.share({title: '有数规划数据备份', text: jsonString});
                    } catch (e) {
                        // 用户取消或不支持时自动复制到剪贴板
                        copyTextToClipboard(jsonString);
                        showToast('备份数据已复制到剪贴板，可粘贴分享！\n注意：图片内容不会被备份。', 'success');
                    }
                } else {
                    // 不支持分享功能时自动复制到剪贴板
                    copyTextToClipboard(jsonString);
                    showToast('备份数据已复制到剪贴板，可粘贴分享！\n注意：图片内容不会被备份。', 'success');
                }
            } catch (error) {
                console.error('备份数据失败:', error);
                showToast('备份数据失败，请重试', 'error');
            }
        });
    }
    
    // 查看备份数据按钮点击事件
    const showBackupDataBtn = document.getElementById('show-backup-data');
    const backupDataDisplay = document.getElementById('backup-data-display');
    const backupDataText = document.getElementById('backup-data-text');
    const copyBackupDataBtn = document.getElementById('copy-backup-data');
    const closeBackupDataBtn = document.getElementById('close-backup-data');
    
    if (showBackupDataBtn) {
        showBackupDataBtn.addEventListener('click', async () => {
            try {
                // 获取主应用数据并过滤掉图片内容
                const data = StorageManager.getData();
                const filteredData = filterDataWithoutImages(data);
                
                // 获取心情日记数据
                const moodDiaryData = localStorage.getItem('moodEntries');
                if (moodDiaryData) {
                    filteredData.moodDiary = JSON.parse(moodDiaryData);
                }
                
                // 获取专注时钟数据
                const pomodoroData = localStorage.getItem('pomodoroAppData');
                if (pomodoroData) {
                    filteredData.pomodoro = JSON.parse(pomodoroData);
                }
                
                // 获取清单数据
                if (filteredData.lists && Array.isArray(filteredData.lists)) {
                    // 确保清单数据完整
                } else {
                    const listsData = localStorage.getItem('lists');
                    if (listsData) {
                        try {
                            filteredData.lists = JSON.parse(listsData);
                        } catch (e) {
                            console.warn('解析清单数据失败:', e);
                        }
                    }
                }
                
                // 获取倒数日数据
                if (filteredData.countdowns && Array.isArray(filteredData.countdowns)) {
                    // 确保倒数日数据完整
                } else {
                    const countdownsData = localStorage.getItem('countdowns');
                    if (countdownsData) {
                        try {
                            filteredData.countdowns = JSON.parse(countdownsData);
                        } catch (e) {
                            console.warn('解析倒数日数据失败:', e);
                        }
                    }
                }
                
                // 获取打卡数据
                if (filteredData.dakas && Array.isArray(filteredData.dakas)) {
                    // 确保打卡数据完整
                } else {
                    const dakasData = localStorage.getItem('dakas');
                    if (dakasData) {
                        try {
                            filteredData.dakas = JSON.parse(dakasData);
                        } catch (e) {
                            console.warn('解析打卡数据失败:', e);
                        }
                    }
                }
                
                const jsonString = JSON.stringify(filteredData, null, 2);
                
                // 显示备份数据
                backupDataText.value = jsonString;
                backupDataDisplay.style.display = 'block';
            } catch (error) {
                console.error('查看备份数据失败:', error);
                showToast('查看备份数据失败，请重试', 'error');
            }
        });
    }
    
    // 一键复制按钮点击事件
    if (copyBackupDataBtn) {
        copyBackupDataBtn.addEventListener('click', () => {
            try {
                const text = backupDataText.value;
                copyTextToClipboard(text);
                showToast('备份数据已复制到剪贴板', 'success');
            } catch (error) {
                console.error('复制备份数据失败:', error);
                showToast('复制备份数据失败，请重试', 'error');
            }
        });
    }
    
    // 关闭按钮点击事件
    if (closeBackupDataBtn) {
        closeBackupDataBtn.addEventListener('click', () => {
            backupDataDisplay.style.display = 'none';
        });
    }

    // 导入数据按钮点击事件
    const importDataBtn = document.getElementById('import-data-btn');
    const importDataInput = document.getElementById('import-data');
    if (importDataBtn && importDataInput) {
        importDataBtn.addEventListener('click', () => {
            importDataInput.click();
        });

        importDataInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                // 读取文件内容
                const text = await file.text();
                const jsonData = JSON.parse(text);
                
                // 处理心情日记数据
                if (jsonData.moodDiary) {
                    localStorage.setItem('moodEntries', JSON.stringify(jsonData.moodDiary));
                    delete jsonData.moodDiary;
                }
                
                // 处理专注时钟数据
                if (jsonData.pomodoro) {
                    localStorage.setItem('pomodoroAppData', JSON.stringify(jsonData.pomodoro));
                    delete jsonData.pomodoro;
                }
                
                // 处理清单数据
                if (jsonData.lists) {
                    localStorage.setItem('lists', JSON.stringify(jsonData.lists));
                    delete jsonData.lists;
                }
                
                // 处理倒数日数据
                if (jsonData.countdowns) {
                    localStorage.setItem('countdowns', JSON.stringify(jsonData.countdowns));
                    delete jsonData.countdowns;
                }
                
                // 处理打卡数据
                if (jsonData.dakas) {
                    localStorage.setItem('dakas', JSON.stringify(jsonData.dakas));
                    delete jsonData.dakas;
                }
                
                // 获取默认数据结构
                const DEFAULT_DATA = StorageManager.getData && StorageManager.getData.call({getData: () => window.DEFAULT_DATA || {}}) || {};
                // 兼容：如未挂载全局DEFAULT_DATA，则用当前数据字段
                const defaultKeys = Object.keys(DEFAULT_DATA).length ? Object.keys(DEFAULT_DATA) : Object.keys(StorageManager.getData());
                // 验证数据结构
                const jsonKeys = Object.keys(jsonData);
                const missingKeys = defaultKeys.filter(key => !jsonKeys.includes(key));
                // 用默认数据补全导入数据
                missingKeys.forEach(key => {
                    jsonData[key] = DEFAULT_DATA[key] !== undefined ? JSON.parse(JSON.stringify(DEFAULT_DATA[key])) : null;
                });
                // 询问用户合并还是覆盖
                let keepOld = confirm('是否保留原有内容？\n选择“确定”将合并数据，选择“取消”将覆盖原有内容。');
                if (!keepOld) {
                    // 覆盖模式：用默认数据补全后直接保存
                    StorageManager.saveData(jsonData);
                } else {
                    // 合并模式，先深拷贝原数据，避免引用问题
                    const oldData = JSON.parse(JSON.stringify(StorageManager.getData()));
                    const merged = {};
                    for (const key of defaultKeys) {
                        const oldVal = oldData[key];
                        const newVal = jsonData[key];
                        if (Array.isArray(oldVal) && Array.isArray(newVal)) {
                            // 合并数组，按id去重
                            const oldIds = new Set(oldVal.map(e => e && e.id));
                            merged[key] = [...oldVal, ...newVal.filter(e => e && !oldIds.has(e.id))];
                        } else if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null) {
                            // 合并对象，后者优先
                            merged[key] = { ...oldVal, ...newVal };
                        } else if (typeof oldVal === 'number' && typeof newVal === 'number') {
                            // 数值型（如积分）累加
                            merged[key] = oldVal + newVal;
                        } else if (newVal !== undefined) {
                            // 其他类型用新值
                            merged[key] = newVal;
                        } else {
                            merged[key] = oldVal;
                        }
                    }
                    StorageManager.saveData(merged);
                }
                showToast('数据导入成功！');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error('导入数据失败:', error);
                showToast(`导入数据失败：${error.message}`, 'error');
            } finally {
                // 清除文件输入，允许重复选择同一文件
                event.target.value = '';
            }
        });
    }

    // 清除数据按钮点击事件
    const clearDataBtn = document.getElementById('clear-all-data');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            // 直接使用新的对话框管理器
            if (window.clearDialogManager) {
                clearDialogManager.show();
            } else {
                // 如果对话框管理器未初始化，直接跳转到清除页面
                sessionStorage.setItem('clearDataConfirmed', 'true');
                window.location.href = 'clear.html';
            }
        });
    }
});

/**
 * 显示提示消息
 * @param {string} message 消息内容
 * @param {string} type 消息类型（success/error）
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 添加显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 3秒后移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

/**
 * 过滤数据，移除图片内容
 * @param {Object} data 原始数据
 * @returns {Object} 过滤后的数据
 */
function filterDataWithoutImages(data) {
    // 深拷贝数据以避免修改原始数据
    const filteredData = JSON.parse(JSON.stringify(data));
    
    // 如果存在打卡数据，过滤掉其中的图片内容
    if (filteredData.dakas && Array.isArray(filteredData.dakas)) {
        filteredData.dakas.forEach(daka => {
            if (daka.punchRecords && Array.isArray(daka.punchRecords)) {
                daka.punchRecords.forEach(record => {
                    // 移除记录中的文件信息（主要是图片）
                    if (record.files) {
                        delete record.files;
                    }
                });
            }
        });
    }
    
    // 确保包含所有必要的数据字段
    if (!filteredData.lists) {
        filteredData.lists = [];
    }
    
    if (!filteredData.countdowns) {
        filteredData.countdowns = [];
    }
    
    if (!filteredData.dakas) {
        filteredData.dakas = [];
    }
    
    return filteredData;
}

/**
 * 复制文本到剪贴板
 * @param {string} text 要复制的文本
 */
function copyTextToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('复制到剪贴板失败:', err);
            // 使用备选方案
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // 使用备选方案
        fallbackCopyTextToClipboard(text);
    }
}

/**
 * 备选的复制文本到剪贴板方法
 * @param {string} text 要复制的文本
 */
function fallbackCopyTextToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('复制失败:', err);
    }
    document.body.removeChild(textarea);
}

// 添加复制导入示例功能
document.addEventListener('DOMContentLoaded', function() {
    // 复制导入示例按钮
    const copyImportExampleBtn = document.getElementById('copy-import-example');
    if (copyImportExampleBtn) {
        copyImportExampleBtn.addEventListener('click', function() {
            // 获取示例文本
            const formatHint = this.closest('.format-hint');
            const preElement = formatHint.querySelector('pre');
            
            // 只复制示例内容，不包括说明部分
            const lines = preElement.textContent.split('\n');
            let exampleLines = [];
            let inExampleSection = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // 开始收集示例行
                if (line.startsWith('事件名称 |')) {
                    inExampleSection = true;
                    continue; // 跳过标题行
                }
                
                // 跳过"例如："行
                if (line.trim() === '例如：') {
                    continue;
                }
                
                // 结束收集示例行
                if (line.startsWith('重复设置格式说明：')) {
                    break;
                }
                
                // 收集示例行
                if (inExampleSection && line.trim() !== '') {
                    exampleLines.push(line);
                }
            }
            
            const exampleText = exampleLines.join('\n');
            
            // 复制到剪贴板
            if (navigator.clipboard) {
                navigator.clipboard.writeText(exampleText).then(() => {
                    // 显示成功提示
                    this.innerHTML = '已复制';
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-copy"></i> 复制示例';
                    }, 3000);
                }).catch(err => {
                    console.error('复制失败:', err);
                    alert('复制失败，请手动复制');
                });
            } else {
                // 兼容旧浏览器
                const textArea = document.createElement('textarea');
                textArea.value = exampleText;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    // 显示成功提示
                    this.innerHTML = '已复制';
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-copy"></i> 复制示例';
                        document.body.removeChild(textArea);
                    }, 3000);
                } catch (err) {
                    console.error('复制失败:', err);
                    alert('复制失败，请手动复制');
                    document.body.removeChild(textArea);
                }
            }
        });
    }
});
