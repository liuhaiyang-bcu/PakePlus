9/**
 * 简化出行建议管理器
 * 在最近要做标题旁边显示简化的出行建议
 */
const SimpleWeatherManager = {
    // 天气数据缓存
    weatherData: null,
    
    // 当前位置
    currentLocation: '无',
    
    // 刷新状态标记
    isRefreshing: false,
    
    // 出行建议模板
    travelTips: {
        sunny: {
            icon: 'fa-sun', // 默认太阳图标，实际显示会根据时间动态调整
            tips: ['天气晴朗，适合出行', '记得防晒', '可以户外活动']
        },
        cloudy: {
            icon: 'fa-cloud',
            tips: ['天气多云', '适合外出']
        },
        rainy: {
            icon: 'fa-cloud-showers-heavy',
            tips: ['今天有雨', '记得带伞', '注意路滑']
        },
        snowy: {
            icon: 'fa-snowflake',
            tips: ['今天下雪', '注意保暖', '小心路滑']
        },
        foggy: {
            icon: 'fa-smog',
            tips: ['今天有雾', '注意安全', '谨慎驾驶']
        },
        windy: {
            icon: 'fa-wind',
            tips: ['今天有风', '注意保暖', '小心高空坠物']
        }
    },

    /**
     * 初始化简化出行建议
     */
    init() {
        console.log('初始化简化出行建议...');
        
        try {
            this.createSimpleWeather();
            this.bindEvents();
            this.loadWeatherData();
            
            // 每五分钟更新一次天气数据（与原本天气管理器保持一致）
            setInterval(() => this.loadWeatherData(), 5 * 60 * 1000);
            
            console.log('简化出行建议初始化完成');
        } catch (error) {
            console.error('简化出行建议初始化失败:', error);
        }
    },

    /**
     * 创建简化出行建议元素
     */
    createSimpleWeather() {
        // 查找最近要做视图的标题区域
        const recentTasksSection = document.getElementById('recent-tasks');
        if (!recentTasksSection) {
            console.error('找不到最近要做视图，无法创建简化出行建议');
            return;
        }

        // 检查是否已经存在简化出行建议
        if (document.querySelector('.simple-weather-container')) {
            console.log('简化出行建议已存在，跳过创建');
            return;
        }

        const viewHeader = recentTasksSection.querySelector('.view-header');
        if (!viewHeader) {
            console.error('找不到视图标题，无法创建简化出行建议');
            return;
        }

        // 创建简化出行建议容器
        const simpleWeatherContainer = document.createElement('div');
        simpleWeatherContainer.className = 'simple-weather-container';
        simpleWeatherContainer.innerHTML = `
            <div class="simple-weather-icon"><i class="fa-solid fa-sun"></i></div>
            <div class="simple-weather-text">正在获取出行建议...</div>
            <div class="simple-weather-temp">--℃</div>
        `;

        // 将简化出行建议插入到标题旁边（在view-controls之前）
        const viewControls = viewHeader.querySelector('.view-controls');
        if (viewControls) {
            viewHeader.insertBefore(simpleWeatherContainer, viewControls);
        } else {
            viewHeader.appendChild(simpleWeatherContainer);
        }
        
        console.log('简化出行建议元素创建完成');
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        const container = document.querySelector('.simple-weather-container');
        if (container) {
            // 移除可能存在的旧事件监听器
            container.replaceWith(container.cloneNode(true));
            const newContainer = document.querySelector('.simple-weather-container');
            
            // 单一点击事件处理
            newContainer.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                // 检查是否有天气数据
                if (!this.weatherData) {
                    console.log('天气数据未加载，正在刷新...');
                    this.refreshWeather();
                    return;
                }
                
                // 弹出天气详情
                try {
                    const icon = this.travelTips[this.weatherData.condition]?.icon || 'fa-sun';
                    const detail = Object.assign({}, this.weatherData, {
                        icon,
                        humidity: this.weatherData.humidity || (this.weatherData.raw && this.weatherData.raw.humidity) || '--',
                        wind_power: this.weatherData.wind_power || (this.weatherData.raw && this.weatherData.raw.wind_power) || '--',
                        wind_direction: this.weatherData.wind_direction || (this.weatherData.raw && this.weatherData.raw.wind_direction) || '--',
                    });
                    
                    if (window.showWeatherDetailPopup) {
                        window.showWeatherDetailPopup(detail);
                    } else {
                        console.error('天气详情弹窗函数未找到');
                    }
                } catch (error) {
                    console.error('显示天气详情时出错:', error);
                }
            });
        }
    },

    /**
     * 加载天气数据
     */
    async loadWeatherData() {
        const container = document.querySelector('.simple-weather-container');
        if (!container) {
            console.error('简化天气容器未找到');
            return;
        }

        // 显示加载状态
        const iconElement = container.querySelector('.simple-weather-icon');
        const textElement = container.querySelector('.simple-weather-text');
        
        if (iconElement) iconElement.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i>';
        if (textElement) textElement.textContent = '正在获取天气...';

        try {
            await this.getCurrentLocation();
            const weatherData = await this.fetchWeatherData();
            
            if (weatherData) {
                this.updateWeatherDisplay(weatherData);
                this.weatherData = weatherData;
                console.log('天气数据加载成功:', weatherData);
            } else {
                throw new Error('获取到的天气数据为空');
            }
        } catch (error) {
            console.error('获取天气数据失败:', error);
            this.showErrorState();
        }
    },

    /**
     * 获取当前位置信息
     */
    async getCurrentLocation() {
        // 尝试从本地存储获取上次的位置设置
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            this.currentLocation = savedLocation;
            return;
        }

        // 本地无城市，使用默认城市
        this.currentLocation = '北京';
        localStorage.setItem('userLocation', this.currentLocation);
    },

    /**
     * 获取天气数据
     * 使用新的uapis.cn天气API接口
     */
    async fetchWeatherData() {
        // 使用新的uapis.cn天气API
        const weatherUrl = `https://uapis.cn/api/v1/misc/weather?city=${encodeURIComponent(this.currentLocation)}`;
        
        try {
            const response = await fetch(weatherUrl);
            
            // 处理不同的HTTP状态码
            if (response.status === 200) {
                const weatherInfo = await response.json();
                console.log('uapis.cn天气API返回数据：', weatherInfo);
                
                // 成功获取数据，适配新API的数据结构
                return {
                    temp: weatherInfo.temperature || 0,
                    condition: this.mapWeatherCondition(weatherInfo.weather || ''),
                    description: this.generateTravelTip(weatherInfo),
                    city: weatherInfo.city || this.currentLocation,
                    humidity: weatherInfo.humidity || '',
                    wind_power: weatherInfo.wind_power || '',
                    wind_direction: weatherInfo.wind_direction || '',
                    raw: weatherInfo
                };
            } else if (response.status === 400) {
                const errorData = await response.json();
                throw new Error('请求参数错误：' + (errorData.message || '请检查城市名称格式'));
            } else if (response.status === 410) {
                const errorData = await response.json();
                throw new Error(`城市"${this.currentLocation}"无效或不受支持：` + (errorData.message || '请检查城市名称'));
            } else if (response.status === 500) {
                const errorData = await response.json();
                throw new Error('服务器内部错误：' + (errorData.message || '请稍后重试'));
            } else if (response.status === 502) {
                const errorData = await response.json();
                throw new Error('天气服务暂时不可用：' + (errorData.message || '请稍后重试'));
            } else {
                throw new Error('天气数据获取失败，HTTP状态：' + response.status);
            }
        } catch (error) {
            console.warn('获取天气数据失败，使用模拟数据:', error);
            return this.getMockWeatherData();
        }
    },

    /**
     * 映射天气条件到我们的分类
     */
    mapWeatherCondition(weather) {
        const weatherStr = weather.toLowerCase();
        
        if (weatherStr.includes('晴')) {
            return 'sunny';
        } else if (weatherStr.includes('多云') || weatherStr.includes('阴')) {
            return 'cloudy';
        } else if (weatherStr.includes('雨')) {
            return 'rainy';
        } else if (weatherStr.includes('雪')) {
            return 'snowy';
        } else if (weatherStr.includes('雾')) {
            return 'foggy';
        } else if (weatherStr.includes('风')) {
            return 'windy';
        } else {
            return 'cloudy'; // 默认多云
        }
    },

    /**
     * 生成出行建议
     * 适配新的uapis.cn API数据结构
     */
    generateTravelTip(weatherData) {
        const weather = weatherData.weather || '';
        const temp = weatherData.temperature || 0;
        const humidity = parseInt(weatherData.humidity || 0);
        const windDir = weatherData.wind_direction || '';
        const windPower = weatherData.wind_power || '';
        
        let tipText = '';
        
        // 根据天气情况生成贴士
        if (weather.includes('晴')) {
            if (temp > 30) {
                tipText = '天气炎热，注意防晒，多补充水分';
            } else if (temp > 20) {
                tipText = '天气晴朗，适合出行，记得防晒';
            } else if (temp <= 15) {
                tipText = '天气晴朗，早晚较凉，注意保暖';
            } else {
                tipText = '天气晴朗，适合外出活动';
            }
        } else if (weather.includes('多云') || weather.includes('阴')) {
            if (temp < 10) {
                tipText = '天气阴冷，注意保暖，适合室内活动';
            } else if (temp <= 15) {
                tipText = '天气多云，早晚较凉，注意保暖';
            } else {
                tipText = '天气多云，适合外出';
            }
        } else if (weather.includes('雨')) {
            if (weather.includes('小雨')) {
                tipText = '有小雨，记得带伞，注意路滑';
            } else if (weather.includes('中雨') || weather.includes('大雨')) {
                tipText = '有雨，建议减少外出，必须外出请带伞';
            } else {
                tipText = '今天有雨，记得带伞，注意路滑';
            }
        } else if (weather.includes('雪')) {
            tipText = '今天下雪，注意保暖，小心路滑';
        } else if (weather.includes('雾')) {
            tipText = '今天有雾，注意安全，谨慎驾驶';
        } else if (weather.includes('风')) {
            if (windPower.includes('大') || windPower.includes('强')) {
                tipText = '今天有大风，注意安全，小心高空坠物';
            } else {
                tipText = '今天有风';
            }
        } else {
            // 根据温度给出建议
            if (temp > 30) {
                tipText = '天气炎热，注意防暑降温';
            } else if (temp > 20) {
                tipText = '天气适宜，适合外出活动';
            } else if (temp > 15) {
                tipText = '天气较凉，注意添加衣物';
            } else {
                tipText = '天气寒冷，注意保暖';
            }
        }
        
        return tipText || '天气适宜，注意安全';
    },

    /**
     * 获取模拟天气数据（当API不可用时）
     * 适配新的uapis.cn API数据结构
     */
    getMockWeatherData() {
        const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        const temp = Math.floor(Math.random() * 30) + 5; // 5-35度

        return {
            temp: temp,
            condition: randomCondition,
            description: this.travelTips[randomCondition].tips[0],
            city: this.currentLocation || '当前位置',
            humidity: Math.floor(Math.random() * 40) + 30, // 30-70%
            wind_power: Math.floor(Math.random() * 5) + 1, // 1-5级
            wind_direction: ['北', '南', '东', '西'][Math.floor(Math.random() * 4)],
            raw: {
                temperature: temp,
                weather: ['晴', '多云', '小雨', '雪', '雾', '大风'][Math.floor(Math.random() * 6)],
                humidity: Math.floor(Math.random() * 40) + 30,
                wind_power: Math.floor(Math.random() * 5) + 1,
                wind_direction: ['北', '南', '东', '西'][Math.floor(Math.random() * 4)],
                city: this.currentLocation || '当前位置',
                province: '模拟省份',
                report_time: new Date().toLocaleString()
            }
        };
    },

    /**
     * 更新天气显示
     */
    updateWeatherDisplay(weatherData) {
        const container = document.querySelector('.simple-weather-container');
        if (!container) return;

        const iconElement = container.querySelector('.simple-weather-icon');
        const textElement = container.querySelector('.simple-weather-text');
        const tempElement = container.querySelector('.simple-weather-temp');

        // 根据天气条件选择图标和提示
        let tipData = this.travelTips[weatherData.condition] || this.travelTips.cloudy;
        
        // 对于晴天，根据时间段决定显示太阳还是月亮图标
        if (weatherData.condition === 'sunny') {
            const hour = new Date().getHours();
            // 晚上6点(18)到早上6点(6)之间显示月亮图标
            if (hour >= 18 || hour < 6) {
                tipData = {...tipData, icon: 'fa-moon'}; // 晚上显示月亮
            } else {
                tipData = {...tipData, icon: 'fa-sun'}; // 白天显示太阳
            }
        }
        
        // 更新显示内容
        iconElement.innerHTML = `<i class="fa-solid ${tipData.icon}"></i>`;
        textElement.textContent = weatherData.description || tipData.tips[0];
        tempElement.textContent = `${Math.round(weatherData.temp)}℃`;

        // 移除错误状态
        container.classList.remove('error');
    },

    /**
     * 显示错误状态
     */
    showErrorState() {
        const container = document.querySelector('.simple-weather-container');
        if (!container) return;

        const iconElement = container.querySelector('.simple-weather-icon');
        const textElement = container.querySelector('.simple-weather-text');
        const tempElement = container.querySelector('.simple-weather-temp');

        iconElement.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        textElement.textContent = '天气信息获取失败';
        tempElement.textContent = '';

        container.classList.add('error');
    },

    /**
     * 刷新天气
     */
    refreshWeather() {
        console.log('刷新天气数据...');
        
        // 防止重复刷新
        if (this.isRefreshing) {
            console.log('天气数据正在刷新中，请稍候...');
            return Promise.resolve();
        }
        
        this.isRefreshing = true;
        
        // 显示刷新状态
        const container = document.querySelector('.simple-weather-container');
        if (container) {
            const iconElement = container.querySelector('.simple-weather-icon');
            const textElement = container.querySelector('.simple-weather-text');
            
            if (iconElement) iconElement.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i>';
            if (textElement) textElement.textContent = '正在刷新...';
        }
        
        // 执行刷新并返回Promise
        return this.loadWeatherData().finally(() => {
            this.isRefreshing = false;
        });
    },

    /**
     * 设置位置并同步更新
     */
    setLocation(location) {
        this.currentLocation = location;
        localStorage.setItem('userLocation', location);
        
        // 同步更新主天气管理器
        if (window.WeatherManager && window.WeatherManager.currentLocation !== location) {
            window.WeatherManager.currentLocation = location;
        }
        
        // 重新加载天气数据
        this.loadWeatherData();
    },

    /**
     * 销毁简化出行建议
     */
    destroy() {
        const container = document.querySelector('.simple-weather-container');
        if (container) {
            // 移除事件监听器
            container.replaceWith(container.cloneNode(true));
            // 删除元素
            const newContainer = document.querySelector('.simple-weather-container');
            if (newContainer) {
                newContainer.remove();
            }
        }
        
        // 重置状态
        this.weatherData = null;
        this.isRefreshing = false;
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待页面完全加载后初始化简化天气管理器
    setTimeout(() => {
        console.log('开始初始化简化天气管理器');
        SimpleWeatherManager.init();
    }, 1000);
});

// 导出到全局作用域
window.SimpleWeatherManager = SimpleWeatherManager;