// 天气与出行贴士管理
const WeatherManager = {
    // 当前天气数据
    weatherData: null,
    
    // 当前位置
    currentLocation: '无',
    
    // 初始化
    init() {
        console.log('初始化天气系统');
        
        // 尝试从本地存储获取上次的位置设置
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            this.currentLocation = savedLocation;
            // 获取天气数据
            this.fetchWeatherData();
        } else {
            // 本地无城市，使用默认城市
            this.currentLocation = '北京';
            localStorage.setItem('userLocation', this.currentLocation);
            this.fetchWeatherData();
        }
        
        // 每五分钟更新一次天气数据
        setInterval(() => this.fetchWeatherData(), 5 * 60 * 1000);
        
        // 添加城市设置按钮点击事件
        this.setupCityChangeEvent();

        // 添加刷新按钮点击事件
        const refreshBtn = document.getElementById('refresh-weather');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // 直接刷新天气数据
                this.fetchWeatherData();
            });
        }
    },
    
    // 设置城市修改事件
    setupCityChangeEvent() {
        const locationElem = document.getElementById('weather-location');
        
        // 添加城市设置按钮
        const cityChangeBtn = document.createElement('button');
        cityChangeBtn.className = 'city-change-btn';
        cityChangeBtn.innerHTML = '<i class="fas fa-edit"></i>';
        cityChangeBtn.title = '更改城市';
        
        // 将按钮插入到位置信息旁边
        locationElem.parentNode.appendChild(cityChangeBtn);
        
        // 点击按钮弹出修改框
        cityChangeBtn.addEventListener('click', () => {
            const newCity = prompt('请输入城市名称（如：北京、上海、广州、New York等）:', this.currentLocation);
            if (newCity && newCity.trim() !== '') {
                // 验证城市名称格式
                const cityName = newCity.trim();
                if (!/^[\u4e00-\u9fa5a-zA-Z\s]+(市|省|自治区|特别行政区)?$/i.test(cityName)) {
                    alert('请输入有效的城市名称，支持中英文');
                    return;
                }
                this.setLocation(cityName);
            }
        });
    },
    
    // 获取天气数据
    fetchWeatherData() {
        // 使用新的uapis.cn天气API
        const weatherUrl = `https://uapis.cn/api/v1/misc/weather?city=${encodeURIComponent(this.currentLocation)}`;
        
        // 显示加载状态
        document.getElementById('weather-location').textContent = this.currentLocation;
        document.getElementById('weather-temp').textContent = '加载中...';
        document.getElementById('weather-condition').textContent = '加载中...';
        document.getElementById('travel-tips').textContent = '天气数据加载中...';
        
        fetch(weatherUrl)
            .then(response => {
                // 处理不同的HTTP状态码
                if (response.status === 200) {
                    return response.json();
                } else if (response.status === 400) {
                    return response.json().then(errorData => {
                        throw new Error('请求参数错误：' + (errorData.message || '请检查城市名称格式'));
                    });
                } else if (response.status === 410) {
                    return response.json().then(errorData => {
                        throw new Error(`城市"${this.currentLocation}"无效或不受支持：` + (errorData.message || '请检查城市名称'));
                    });
                } else if (response.status === 500) {
                    return response.json().then(errorData => {
                        throw new Error('服务器内部错误：' + (errorData.message || '请稍后重试'));
                    });
                } else if (response.status === 502) {
                    return response.json().then(errorData => {
                        throw new Error('天气服务暂时不可用：' + (errorData.message || '请稍后重试'));
                    });
                } else {
                    throw new Error('天气数据获取失败，HTTP状态：' + response.status);
                }
            })
            .then(weatherInfo => {
                console.log('uapis.cn天气API返回数据：', weatherInfo);
                
                // 成功获取数据，适配新API的数据结构
                this.weatherData = {
                    city: weatherInfo.city || this.currentLocation,
                    temperature: weatherInfo.temperature,
                    weather: weatherInfo.weather,
                    humidity: weatherInfo.humidity,
                    wind_direction: weatherInfo.wind_direction,
                    wind_power: weatherInfo.wind_power,
                    reporttime: weatherInfo.report_time || new Date().toLocaleString(),
                    // 保留原始数据
                    raw: weatherInfo
                };
                this.updateWeatherUI();
            })
            .catch(error => {
                console.error('获取天气信息出错:', error);
                document.getElementById('weather-location').textContent = this.currentLocation;
                document.getElementById('weather-temp').textContent = '--℃';
                document.getElementById('weather-condition').textContent = '--';
                document.getElementById('travel-tips').textContent = '天气信息获取失败：' + error.message;
                
                // 如果是城市无效的错误，提示用户修改城市
                if (error.message.includes('无效') || error.message.includes('不支持')) {
                    setTimeout(() => {
                        if (confirm('城市无效或不受支持，是否修改城市名称？')) {
                            const newCity = prompt('请输入城市名称（支持中英文，如：北京、上海、New York等）:', '北京');
                            if (newCity && newCity.trim() !== '') {
                                const cityName = newCity.trim();
                                // 验证城市名称格式
                                if (!/^[\u4e00-\u9fa5a-zA-Z\s]+(市|省|自治区|特别行政区)?$/i.test(cityName)) {
                                    alert('请输入有效的城市名称');
                                    return;
                                }
                                this.setLocation(cityName);
                            }
                        }
                    }, 100);
                }
            });
    },
    
    // 更新天气UI
    updateWeatherUI() {
        if (!this.weatherData) return;
        
        // 更新位置
        document.getElementById('weather-location').textContent = this.weatherData.city || this.currentLocation;
        
        // 更新温度
        document.getElementById('weather-temp').textContent = `${this.weatherData.temperature || this.weatherData.temp || '--'}℃`;
        
        // 更新天气状况
        document.getElementById('weather-condition').textContent = this.weatherData.weather || this.weatherData.wea || '--';
        
        // 更新出行贴士
        this.updateTravelTips();
    },
    
    // 更新出行贴士
    updateTravelTips() {
        let tipText = '';
        
        // 根据天气情况生成贴士
        if (!this.weatherData) {
            tipText = '天气数据加载中...';
        } else {
            // 对uapis.cn API返回的数据进行处理
            const weather = this.weatherData.weather || '';
            const temp = this.weatherData.temperature || 0;
            const humidity = parseInt(this.weatherData.humidity || 0);
            const windDir = this.weatherData.wind_direction || '';
            const windPower = this.weatherData.wind_power || '';
            const reportTime = this.weatherData.reporttime || new Date().toLocaleString();
            
            // 添加更新时间
            const timeStr = reportTime.includes(' ') ? reportTime.split(' ')[1] : new Date().toLocaleTimeString();
            tipText += `数据更新：${timeStr} | `;
            
            // 根据天气类型给出建议
            if (weather.includes('雨')) {
                tipText += '记得携带雨伞，注意防滑。';
            } else if (weather.includes('雪')) {
                tipText += '外出注意保暖，道路可能湿滑。';
            } else if (weather.includes('晴') && parseInt(temp) > 30) {
                tipText += '天气炎热，注意防晒补水。';
            } else if (weather.includes('雾') || weather.includes('霾')) {
                tipText += '空气质量较差，建议戴口罩出行。';
            } else if (weather.includes('阴') && humidity > 80) {
                tipText += '湿度较大，外出注意保持干爽。';
            } else if (windPower.includes('5') || windPower.includes('大') || windPower.includes('强')) {
                tipText += `${windDir}风较大，外出注意安全。`;
            } else {
                const humidityText = humidity ? `${humidity}%` : '--';
                const windText = windPower ? `${windPower}` : '--';
                tipText += `今日${weather}，湿度${humidityText}，${windDir}风${windText}，宜出行。`;
            }
            
            // 根据温度给出穿衣建议
            const temperatureNum = parseInt(temp);
            if (temperatureNum < 5) {
                tipText += ' 天气寒冷，注意保暖。';
            } else if (temperatureNum < 12) {
                tipText += ' 天气较凉，建议穿厚外套。';
            } else if (temperatureNum < 18) {
                tipText += ' 天气适宜，建议穿薄外套。';
            } else if (temperatureNum < 25) {
                tipText += ' 天气舒适，建议穿轻便衣物。';
            } else if (temperatureNum < 30) {
                tipText += ' 天气温暖，适宜短袖。';
            } else {
                tipText += ' 天气炎热，注意防暑降温。';
            }
        }
        
        document.getElementById('travel-tips').textContent = tipText;
    },
    
    // 设置位置
    setLocation(location) {
        this.currentLocation = location;
        localStorage.setItem('userLocation', location);
        
        // 同步更新简化天气管理器的位置
        if (window.SimpleWeatherManager) {
            window.SimpleWeatherManager.currentLocation = location;
        }
        
        this.fetchWeatherData();
    },
    
    // 刷新天气数据
    refreshWeather() {
        console.log('主天气管理器刷新数据...');
        this.fetchWeatherData();
    }
};

// 导出到全局作用域
window.WeatherManager = WeatherManager;