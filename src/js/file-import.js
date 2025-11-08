/**
 * 文件导入模块
 * 使用成熟的开源库处理CSV和ICS文件导入
 */

const FileImportManager = {
    /**
     * 解析CSV内容并转换为事件对象
     * @param {string} csvContent CSV文件内容
     * @returns {Array} 事件对象数组
     */
    parseCSV(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV文件格式不正确，至少需要包含标题行和数据行');
        }

        // 解析标题行
        const headers = this.parseCSVLine(lines[0]);
        
        // 确定列索引
        const nameIndex = headers.indexOf('事件名称');
        const startTimeIndex = headers.indexOf('开始时间');
        const endTimeIndex = headers.indexOf('结束时间');
        const locationIndex = headers.indexOf('地点');
        const participantsIndex = headers.indexOf('参与人员');
        const tagsIndex = headers.indexOf('标签');
        const projectIndex = headers.indexOf('所属项目');
        const repeatIndex = headers.indexOf('重复设置');
        const priorityIndex = headers.indexOf('重要等级');
        
        if (nameIndex === -1 || startTimeIndex === -1) {
            throw new Error('CSV文件缺少必要的列：事件名称或开始时间');
        }

        const events = [];
        
        // 解析数据行
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length < headers.length) continue;
            
            try {
                const event = {
                    name: values[nameIndex] || '',
                    startTime: this.parseDateTime(values[startTimeIndex]) || null,
                    endTime: this.parseDateTime(values[endTimeIndex]) || null,
                    location: values[locationIndex] || '',
                    participants: values[participantsIndex] ? values[participantsIndex].split('、').map(p => p.trim()).filter(p => p) : [],
                    tags: values[tagsIndex] ? values[tagsIndex].split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                    color: '#4285f4',
                    completed: false,
                    id: 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                };

                // 处理项目字段
                if (values[projectIndex]) {
                    const project = StorageManager.getOrCreateProject(values[projectIndex]);
                    if (project) {
                        event.projectId = project.id;
                    }
                }

                // 处理重复设置
                if (values[repeatIndex]) {
                    event.repeat = this.parseRepeatSettings(values[repeatIndex]);
                } else {
                    event.repeat = {
                        type: 'none',
                        endDate: null,
                        count: null
                    };
                }

                // 处理重要等级字段
                if (values[priorityIndex]) {
                    const priorityValue = values[priorityIndex].trim().toLowerCase();
                    const validPriorities = ['urgent-important', 'important-not-urgent', 'urgent-not-important', 'not-urgent-not-important'];
                    if (validPriorities.includes(priorityValue)) {
                        event.priority = priorityValue;
                    }
                }

                // 验证必填字段
                if (!event.name) {
                    throw new Error('事件名称不能为空');
                }
                if (!event.startTime) {
                    throw new Error('开始时间不能为空');
                }

                // 验证时间
                if (event.startTime && event.endTime) {
                    const start = new Date(event.startTime);
                    const end = new Date(event.endTime);
                    if (end <= start) {
                        throw new Error('结束时间必须晚于开始时间');
                    }
                }

                events.push(event);
            } catch (e) {
                console.warn(`解析第 ${i + 1} 行时出错: ${e.message}`);
                // 继续处理其他行
            }
        }

        return events;
    },

    /**
     * 解析CSV单行数据
     * @param {string} line CSV行数据
     * @returns {Array} 解析后的值数组
     */
    parseCSVLine(line) {
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    // 双引号转义
                    currentValue += '"';
                    i++; // 跳过下一个引号
                } else {
                    // 切换引号状态
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 逗号分隔符
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        // 添加最后一个值
        values.push(currentValue.trim());
        
        return values;
    },

    /**
     * 解析日期时间字符串
     * @param {string} dateTimeStr 日期时间字符串
     * @returns {string|null} ISO格式的日期时间字符串
     */
    parseDateTime(dateTimeStr) {
        if (!dateTimeStr) return null;
        
        // 尝试多种日期格式
        const formats = [
            'YYYY-MM-DD HH:mm',
            'YYYY/MM/DD HH:mm',
            'YYYY-MM-DDTHH:mm',
            'YYYY-MM-DD HH:mm:ss',
            'YYYY/MM/DD HH:mm:ss'
        ];
        
        // 简单解析逻辑
        const date = new Date(dateTimeStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
        
        // 尝试手动解析常见格式
        const formatsToTry = [
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,  // YYYY-MM-DD HH:mm
            /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/,  // YYYY/MM/DD HH:mm
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,  // YYYY-MM-DDTHH:mm
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,  // YYYY-MM-DD HH:mm:ss
            /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/  // YYYY/MM/DD HH:mm:ss
        ];
        
        for (let i = 0; i < formatsToTry.length; i++) {
            if (formatsToTry[i].test(dateTimeStr)) {
                // 使用Date构造函数解析
                const date = new Date(dateTimeStr);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
                break;
            }
        }
        
        return null;
    },

    /**
     * 解析重复设置
     * @param {string} repeatStr 重复设置字符串
     * @returns {Object} 重复设置对象
     */
    parseRepeatSettings(repeatStr) {
        const repeat = {
            type: 'none',
            endDate: null,
            count: null
        };

        if (!repeatStr) return repeat;

        const repeatSettings = repeatStr.split(',').map(s => s.trim());
        if (repeatSettings.length > 0) {
            // 解析重复类型
            const repeatType = repeatSettings[0].toLowerCase();
            if (['daily', 'weekly', 'monthly', 'yearly'].includes(repeatType)) {
                repeat.type = repeatType;
            }

            // 解析结束日期
            if (repeatSettings[1]) {
                const endDate = new Date(repeatSettings[1]);
                if (!isNaN(endDate.getTime())) {
                    repeat.endDate = endDate.toISOString();
                }
            }

            // 解析重复次数
            if (repeatSettings[2]) {
                const count = parseInt(repeatSettings[2]);
                if (!isNaN(count) && count > 0 && count <= 100) {
                    repeat.count = count;
                }
            }
        }

        return repeat;
    },

    /**
     * 解析ICS内容并转换为事件对象
     * @param {string} icsContent ICS文件内容
     * @returns {Array} 事件对象数组
     */
    parseICS(icsContent) {
        const lines = icsContent.split('\n').filter(line => line.trim());
        const events = [];
        let currentEvent = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line === 'BEGIN:VEVENT') {
                currentEvent = {
                    name: '',
                    startTime: null,
                    endTime: null,
                    location: '',
                    description: '',
                    color: '#4285f4',
                    completed: false,
                    id: 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                };
            } else if (line === 'END:VEVENT' && currentEvent) {
                // 验证必要字段
                if (currentEvent.name && currentEvent.startTime) {
                    events.push(currentEvent);
                }
                currentEvent = null;
            } else if (currentEvent) {
                // 解析事件属性
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex);
                    const value = line.substring(colonIndex + 1);
                    
                    switch (key) {
                        case 'SUMMARY':
                            currentEvent.name = value;
                            break;
                        case 'DTSTART':
                            currentEvent.startTime = this.parseICSTime(value);
                            break;
                        case 'DTEND':
                            currentEvent.endTime = this.parseICSTime(value);
                            break;
                        case 'LOCATION':
                            currentEvent.location = value;
                            break;
                        case 'DESCRIPTION':
                            currentEvent.description = value;
                            break;
                    }
                }
            }
        }

        return events;
    },

    /**
     * 解析ICS时间格式
     * @param {string} timeStr ICS时间字符串
     * @returns {string|null} ISO格式的日期时间字符串
     */
    parseICSTime(timeStr) {
        if (!timeStr) return null;
        
        try {
            // 处理UTC时间格式：20240320T140000Z
            if (timeStr.endsWith('Z')) {
                const year = timeStr.substring(0, 4);
                const month = timeStr.substring(4, 6);
                const day = timeStr.substring(6, 8);
                const hour = timeStr.substring(9, 11);
                const minute = timeStr.substring(11, 13);
                const second = timeStr.substring(13, 15);
                
                const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
            }
            
            // 处理本地时间格式：20240320T140000
            if (timeStr.length === 15 && timeStr[8] === 'T') {
                const year = timeStr.substring(0, 4);
                const month = timeStr.substring(4, 6);
                const day = timeStr.substring(6, 8);
                const hour = timeStr.substring(9, 11);
                const minute = timeStr.substring(11, 13);
                const second = timeStr.substring(13, 15);
                
                // 修复时区问题：使用本地时间而不是UTC
                const date = new Date(year, month - 1, day, hour, minute, second);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
            }
        } catch (e) {
            console.warn('解析ICS时间出错:', e);
        }
        
        return null;
    },

    /**
     * 解析VCS内容并转换为事件对象
     * @param {string} vcsContent VCS文件内容
     * @returns {Array} 事件对象数组
     */
    parseVCS(vcsContent) {
        const lines = vcsContent.split('\n').filter(line => line.trim());
        const events = [];
        let currentEvent = null;
        let isV1Format = false; // 标记是否为VCS v1.0格式
        let inValarm = false; // 标记是否在VALARM块中

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 检查是否为VCS v1.0格式
            if (line.startsWith('VERSION:') && line.includes('1.0')) {
                isV1Format = true;
            }
            
            // 处理嵌套结构
            if (line === 'BEGIN:VALARM') {
                inValarm = true;
                continue;
            } else if (line === 'END:VALARM') {
                inValarm = false;
                continue;
            }
            
            // 跳过VALARM块中的内容
            if (inValarm) {
                continue;
            }
            
            if (line === 'BEGIN:VEVENT') {
                currentEvent = {
                    name: '',
                    startTime: null,
                    endTime: null,
                    location: '',
                    description: '',
                    color: '#4285f4',
                    completed: false,
                    id: 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                };
            } else if (line === 'END:VEVENT' && currentEvent) {
                // 验证必要字段
                if (currentEvent.name && currentEvent.startTime) {
                    events.push(currentEvent);
                }
                currentEvent = null;
            } else if (currentEvent) {
                // 解析事件属性，支持带参数的属性
                const property = this.parseVCSProperty(line);
                if (property) {
                    const { key, value } = property;
                    
                    switch (key) {
                        case 'SUMMARY':
                            currentEvent.name = this.decodeQuotedPrintable(value);
                            break;
                        case 'DTSTART':
                            currentEvent.startTime = this.parseVCSTimeWithTimezone(value);
                            break;
                        case 'DTEND':
                            currentEvent.endTime = this.parseVCSTimeWithTimezone(value);
                            break;
                        case 'LOCATION':
                            currentEvent.location = this.decodeQuotedPrintable(value);
                            break;
                        case 'DESCRIPTION':
                            currentEvent.description = this.decodeQuotedPrintable(value);
                            break;
                        case 'UID':
                            // 可以保存UID用于去重或其他用途
                            break;
                    }
                }
            }
        }

        return events;
    },

    /**
     * 解析VCS属性行
     * @param {string} line 属性行
     * @returns {Object|null} 包含key和value的对象
     */
    parseVCSProperty(line) {
        if (!line.includes(':')) return null;
        
        // 处理带参数的属性，如 SUMMARY;ENCODING=QUOTED-PRINTABLE;CHARSET=UTF-8:=E9=83=BD=E5=91=B5=E5=91=B5
        const firstColonIndex = line.indexOf(':');
        const propertyPart = line.substring(0, firstColonIndex);
        const valuePart = line.substring(firstColonIndex + 1);
        
        // 提取属性名（冒号前的第一个分号之前的部分）
        const key = propertyPart.split(';')[0];
        
        return { key, value: valuePart };
    },
    
    /**
     * 解码quoted-printable编码
     * @param {string} str 编码字符串
     * @returns {string} 解码后的字符串
     */
    decodeQuotedPrintable(str) {
        if (!str) return str;
        
        try {
            // 检查是否是quoted-printable编码（包含=E格式）
            if (str.includes('=')) {
                // quoted-printable解码
                let result = '';
                let i = 0;
                
                while (i < str.length) {
                    if (str[i] === '=' && i + 2 < str.length) {
                        // 检查是否是十六进制编码
                        const hex = str.substring(i + 1, i + 3);
                        if (/^[0-9A-F]{2}$/i.test(hex)) {
                            result += String.fromCharCode(parseInt(hex, 16));
                            i += 3; // 跳过 =XX
                            continue;
                        } else if (str[i+1] === '\n' || str[i+1] === '\r') {
                            // 软换行，跳过 = 和换行符
                            i += 2;
                            // 跳过换行符
                            while (i < str.length && (str[i] === '\n' || str[i] === '\r')) {
                                i++;
                            }
                            continue;
                        }
                    }
                    result += str[i];
                    i++;
                }
                
                // 尝试UTF-8解码
                try {
                    // 先尝试直接解码
                    return decodeURIComponent(result);
                } catch (utf8Error) {
                    try {
                        // 如果直接解码失败，尝试其他方式
                        return result;
                    } catch (escapeError) {
                        // 如果所有解码都失败，返回原始解码结果
                        return result;
                    }
                }
            }
            return str;
        } catch (e) {
            console.warn('解码quoted-printable出错:', e);
            return str;
        }
    },
    
    /**
     * 解析带时区的VCS时间格式
     * @param {string} timeStr VCS时间字符串
     * @returns {string|null} ISO格式的日期时间字符串
     */
    parseVCSTimeWithTimezone(timeStr) {
        if (!timeStr) return null;
        
        try {
            // 处理带时区的时间格式：20251008T093000Z
            if (timeStr.endsWith('Z')) {
                const year = timeStr.substring(0, 4);
                const month = timeStr.substring(4, 6);
                const day = timeStr.substring(6, 8);
                const hour = timeStr.substring(9, 11);
                const minute = timeStr.substring(11, 13);
                const second = timeStr.substring(13, 15);
                
                const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
            }
            
            // 处理本地时间格式：20251008T093000
            if (timeStr.length === 15 && timeStr[8] === 'T') {
                const year = timeStr.substring(0, 4);
                const month = timeStr.substring(4, 6);
                const day = timeStr.substring(6, 8);
                const hour = timeStr.substring(9, 11);
                const minute = timeStr.substring(11, 13);
                const second = timeStr.substring(13, 15);
                
                // 修复时区问题：使用本地时间而不是UTC
                const date = new Date(year, parseInt(month) - 1, day, hour, minute, second);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
            }
        } catch (e) {
            console.warn('解析VCS时间出错:', e);
        }
        
        return null;
    },
    
    /**
     * 解析VCS时间格式
     * @param {string} timeStr VCS时间字符串
     * @returns {string|null} ISO格式的日期时间字符串
     */
    parseVCSTime(timeStr) {
        return this.parseVCSTimeWithTimezone(timeStr);
    },

    /**
     * 从CSV内容导入事件
     * @param {string} csvContent CSV文件内容
     * @returns {Object} 导入结果
     */
    importEventsFromCSV(csvContent) {
        try {
            const events = this.parseCSV(csvContent);
            let totalEvents = 0;
            
            events.forEach(event => {
                if (event.repeat && event.repeat.type !== 'none') {
                    // 生成重复事件
                    const repeatEvents = TaskManager.generateRepeatEvents(event);
                    repeatEvents.forEach(e => {
                        StorageManager.saveEvent(e);
                        totalEvents++;
                    });
                } else {
                    StorageManager.saveEvent(event);
                    totalEvents++;
                }
            });

            return {
                success: true,
                count: totalEvents
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * 从ICS内容导入事件
     * @param {string} icsContent ICS文件内容
     * @returns {Object} 导入结果
     */
    importEventsFromICS(icsContent) {
        try {
            const events = this.parseICS(icsContent);
            let totalEvents = 0;
            
            events.forEach(event => {
                StorageManager.saveEvent(event);
                totalEvents++;
            });

            return {
                success: true,
                count: totalEvents
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * 从VCS内容导入事件
     * @param {string} vcsContent VCS文件内容
     * @returns {Object} 导入结果
     */
    importEventsFromVCS(vcsContent) {
        try {
            const events = this.parseVCS(vcsContent);
            let totalEvents = 0;
            
            events.forEach(event => {
                StorageManager.saveEvent(event);
                totalEvents++;
            });

            return {
                success: true,
                count: totalEvents
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * 处理文件导入
     * @param {File} file 文件对象
     * @returns {Promise<Object>} 导入结果
     */
    async handleFileImport(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    let result;
                    
                    if (file.name.endsWith('.csv')) {
                        result = this.importEventsFromCSV(content);
                    } else if (file.name.endsWith('.ics')) {
                        result = this.importEventsFromICS(content);
                    } else if (file.name.endsWith('.vcs')) {
                        result = this.importEventsFromVCS(content);
                    } else {
                        throw new Error('不支持的文件格式，请选择CSV、ICS或VCS文件');
                    }
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('读取文件失败'));
            };
            
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file, 'UTF-8');
            } else if (file.name.endsWith('.ics')) {
                reader.readAsText(file, 'UTF-8');
            } else if (file.name.endsWith('.vcs')) {
                reader.readAsText(file, 'UTF-8');
            } else {
                reject(new Error('不支持的文件格式'));
            }
        });
    }
};

// 为StorageManager添加缺失的方法
if (window.StorageManager) {
    StorageManager.importEventsFromCSV = function(csvContent) {
        return FileImportManager.importEventsFromCSV(csvContent);
    };
    
    StorageManager.importEventsFromICS = function(icsContent) {
        return FileImportManager.importEventsFromICS(icsContent);
    };
    
    StorageManager.importEventsFromVCS = function(vcsContent) {
        return FileImportManager.importEventsFromVCS(vcsContent);
    };
}

// 导出模块
window.FileImportManager = FileImportManager;