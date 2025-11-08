/**
 * 性能测试工具
 * 用于测试和验证性能优化效果
 */

const PerformanceTest = {
    // 测试结果存储
    testResults: {},
    
    /**
     * 初始化性能测试
     */
    init() {
        console.log('性能测试工具已初始化');
        this.addTestControls();
    },
    
    /**
     * 添加测试控制面板
     */
    addTestControls() {
        // 创建测试控制面板
        const testPanel = document.createElement('div');
        testPanel.id = 'performance-test-panel';
        testPanel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10001;
            font-size: 12px;
            display: none;
        `;
        
        testPanel.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>性能测试工具</strong>
                <button id="close-test-panel" style="float: right; margin-left: 10px;">×</button>
            </div>
            <div>
                <button id="test-load-performance">测试加载性能</button>
                <button id="test-delete-performance">测试删除性能</button>
                <button id="test-toggle-performance">测试切换性能</button>
            </div>
            <div id="test-results" style="margin-top: 10px; max-height: 200px; overflow-y: auto;"></div>
        `;
        
        document.body.appendChild(testPanel);
        
        // 绑定事件
        document.getElementById('close-test-panel').addEventListener('click', () => {
            testPanel.style.display = 'none';
        });
        
        document.getElementById('test-load-performance').addEventListener('click', () => {
            this.testLoadPerformance();
        });
        
        document.getElementById('test-delete-performance').addEventListener('click', () => {
            this.testDeletePerformance();
        });
        
        document.getElementById('test-toggle-performance').addEventListener('click', () => {
            this.testTogglePerformance();
        });
        
        // 添加快捷键 Ctrl+Shift+P 打开测试面板
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                testPanel.style.display = testPanel.style.display === 'none' ? 'block' : 'none';
            }
        });
    },
    
    /**
     * 测试加载性能
     */
    async testLoadPerformance() {
        this.log('开始测试加载性能...');
        
        const events = StorageManager.getEvents();
        const eventCount = events.length;
        
        // 测试原始加载方法
        const originalStart = performance.now();
        
        // 模拟原始加载（清空后重新加载）
        const taskList = document.getElementById('task-list');
        if (taskList) {
            taskList.innerHTML = '';
            
            // 使用原始方法渲染
            events.forEach(event => {
                if (window.TaskManager && typeof TaskManager.createTaskItem === 'function') {
                    taskList.appendChild(TaskManager.createTaskItem(event));
                }
            });
        }
        
        const originalEnd = performance.now();
        const originalTime = originalEnd - originalStart;
        
        // 等待一下再测试优化版本
        await this.sleep(100);
        
        // 测试优化加载方法
        const optimizedStart = performance.now();
        
        if (window.PerformanceOptimizer && taskList) {
            PerformanceOptimizer.renderOptimizedTaskList(events, taskList);
        }
        
        const optimizedEnd = performance.now();
        const optimizedTime = optimizedEnd - optimizedStart;
        
        // 计算性能提升
        const improvement = ((originalTime - optimizedTime) / originalTime * 100).toFixed(1);
        
        const result = {
            eventCount,
            originalTime: originalTime.toFixed(2),
            optimizedTime: optimizedTime.toFixed(2),
            improvement: improvement
        };
        
        this.testResults.loadPerformance = result;
        
        this.log(`加载性能测试完成:`);
        this.log(`事件数量: ${eventCount}`);
        this.log(`原始方法: ${result.originalTime}ms`);
        this.log(`优化方法: ${result.optimizedTime}ms`);
        this.log(`性能提升: ${result.improvement}%`);
        this.log('---');
    },
    
    /**
     * 测试删除性能
     */
    testDeletePerformance() {
        this.log('开始测试删除性能...');
        
        const events = StorageManager.getEvents();
        if (events.length === 0) {
            this.log('没有事件可供测试删除性能');
            return;
        }
        
        // 创建测试事件
        const testEvent = {
            id: `test_delete_${Date.now()}`,
            name: '测试删除事件',
            startTime: new Date().toISOString(),
            completed: false
        };
        
        StorageManager.saveEvent(testEvent);
        
        // 测试删除响应时间
        const deleteStart = performance.now();
        
        // 模拟删除操作
        if (window.PerformanceOptimizer) {
            PerformanceOptimizer.handleTaskDelete(testEvent.id);
        }
        
        const deleteEnd = performance.now();
        const deleteTime = deleteEnd - deleteStart;
        
        this.testResults.deletePerformance = {
            responseTime: deleteTime.toFixed(2)
        };
        
        this.log(`删除响应时间: ${deleteTime.toFixed(2)}ms`);
        this.log('---');
    },
    
    /**
     * 测试状态切换性能
     */
    testTogglePerformance() {
        this.log('开始测试状态切换性能...');
        
        const events = StorageManager.getEvents();
        if (events.length === 0) {
            this.log('没有事件可供测试状态切换性能');
            return;
        }
        
        const testEvent = events[0];
        
        // 测试切换响应时间
        const toggleStart = performance.now();
        
        // 模拟状态切换
        const checkbox = document.querySelector(`[data-task-id="${testEvent.id}"]`);
        if (checkbox && window.PerformanceOptimizer) {
            PerformanceOptimizer.handleTaskToggle(testEvent.id, checkbox);
        }
        
        const toggleEnd = performance.now();
        const toggleTime = toggleEnd - toggleStart;
        
        this.testResults.togglePerformance = {
            responseTime: toggleTime.toFixed(2)
        };
        
        this.log(`状态切换响应时间: ${toggleTime.toFixed(2)}ms`);
        this.log('---');
    },
    
    /**
     * 生成测试数据
     */
    generateTestData(count = 100) {
        this.log(`生成 ${count} 个测试事件...`);
        
        const testEvents = [];
        const now = new Date();
        
        for (let i = 0; i < count; i++) {
            const eventDate = new Date(now);
            eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 30) - 15); // 前后15天
            
            const testEvent = {
                id: `test_event_${Date.now()}_${i}`,
                name: `测试事件 ${i + 1}`,
                startTime: eventDate.toISOString(),
                endTime: new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString(), // 1小时后
                completed: Math.random() > 0.7, // 30%已完成
                color: ['#4285f4', '#ea4335', '#fbbc04', '#34a853'][Math.floor(Math.random() * 4)],
                location: Math.random() > 0.5 ? `地点${i + 1}` : '',
                tags: Math.random() > 0.5 ? ['测试', '性能'] : []
            };
            
            testEvents.push(testEvent);
            StorageManager.saveEvent(testEvent);
        }
        
        this.log(`已生成 ${count} 个测试事件`);
        
        // 刷新任务列表
        if (window.TaskManager && typeof TaskManager.loadTasks === 'function') {
            TaskManager.loadTasks();
        }
        
        return testEvents;
    },
    
    /**
     * 清理测试数据
     */
    cleanupTestData() {
        this.log('清理测试数据...');
        
        const events = StorageManager.getEvents();
        let cleanupCount = 0;
        
        events.forEach(event => {
            if (event.id.startsWith('test_')) {
                StorageManager.deleteEvent(event.id);
                cleanupCount++;
            }
        });
        
        this.log(`已清理 ${cleanupCount} 个测试事件`);
        
        // 刷新任务列表
        if (window.TaskManager && typeof TaskManager.loadTasks === 'function') {
            TaskManager.loadTasks();
        }
    },
    
    /**
     * 运行完整性能测试套件
     */
    async runFullTestSuite() {
        this.log('开始运行完整性能测试套件...');
        this.log('='.repeat(40));
        
        // 清理旧的测试数据
        this.cleanupTestData();
        
        // 生成不同数量的测试数据进行测试
        const testSizes = [10, 50, 100, 200];
        
        for (const size of testSizes) {
            this.log(`测试数据量: ${size} 个事件`);
            
            // 生成测试数据
            this.generateTestData(size);
            
            // 等待渲染完成
            await this.sleep(500);
            
            // 测试加载性能
            await this.testLoadPerformance();
            
            // 清理测试数据
            this.cleanupTestData();
            
            // 等待一下再进行下一轮测试
            await this.sleep(1000);
        }
        
        this.log('完整性能测试套件运行完成');
        this.log('='.repeat(40));
        
        // 输出汇总报告
        this.generateReport();
    },
    
    /**
     * 生成性能报告
     */
    generateReport() {
        this.log('性能测试报告:');
        this.log(JSON.stringify(this.testResults, null, 2));
    },
    
    /**
     * 记录日志
     */
    log(message) {
        console.log(`[性能测试] ${message}`);
        
        const resultsDiv = document.getElementById('test-results');
        if (resultsDiv) {
            const logEntry = document.createElement('div');
            logEntry.textContent = message;
            logEntry.style.marginBottom = '2px';
            resultsDiv.appendChild(logEntry);
            resultsDiv.scrollTop = resultsDiv.scrollHeight;
        }
    },
    
    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// 导出到全局
window.PerformanceTest = PerformanceTest;

// 在开发环境下自动初始化
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        PerformanceTest.init();
        console.log('性能测试工具已启用，按 Ctrl+Shift+P 打开测试面板');
    });
}