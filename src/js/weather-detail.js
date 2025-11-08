// 天气详情弹窗逻辑
(function(){
    function getExtraSuggestions(data) {
        // 穿衣建议
        let dress = '';
        if(data.temp >= 28) dress = '建议穿短袖、短裤等清凉衣物 🩳👕🌞';
        else if(data.temp >= 20) dress = '建议穿薄外套、长裤 🧥👖🌤️';
        else if(data.temp >= 10) dress = '建议穿夹克、卫衣等保暖衣物 🧥🧣🍂';
        else dress = '建议穿厚外套、羽绒服等防寒衣物 🧥🧤🧣❄️';
        // 紫外线
        let uv = '--';
        if(data.raw && data.raw.uv_index) {
            uv = data.raw.uv_index + '（' + (data.raw.uv_index >= 7 ? '强 ☀️😎' : data.raw.uv_index >= 4 ? '中等 🌤️' : '弱 🌥️') + '）';
        } else if(data.temp > 25 && data.icon && data.icon.includes('sun')) {
            uv = '较强 ☀️';
        }
        // 空气质量
        let aqi = '--';
        if(data.raw && (data.raw.aqi || data.raw.air_quality)) {
            aqi = (data.raw.aqi || data.raw.air_quality) + '';
        }
        // 生活建议
        let life = [];
        if(data.temp >= 30) life.push('高温天气，注意防晒补水 🥵☀️💧');
        if(data.temp <= 5) life.push('低温天气，注意防寒保暖 🥶🧤🧣');
        if((data.raw && data.raw.humidity > 80) || (data.humidity > 80)) life.push('湿度较大，注意防潮 💦🌧️');
        if(data.raw && data.raw.pm25) life.push('PM2.5较高，敏感人群减少外出 😷🌫️');
        if(data.raw && data.raw.uv_index >= 7) life.push('紫外线强，外出请涂抹防晒霜 🧴🕶️');
        if(data.raw && data.raw.tips) life.push('小贴士：' + data.raw.tips + ' 💡');
        return {dress, uv, aqi, life: life.join('；')};
    }
    function showWeatherDetailPopup(data) {
        if(document.getElementById('weather-detail-overlay')) return;
        const extra = getExtraSuggestions(data);
        const overlay = document.createElement('div');
        overlay.className = 'weather-detail-overlay';
        overlay.id = 'weather-detail-overlay';
        overlay.innerHTML = `
            <div class="weather-detail-popup">
                <button class="weather-detail-close" title="关闭">×</button>
                <button class="weather-detail-refresh" title="刷新" style="position:absolute;right:54px;top:16px;background:none;border:none;font-size:22px;color:#4caf50;cursor:pointer;border-radius:50%;transition:background 0.18s, color 0.18s;">⟳</button>
                <div class="weather-detail-header">
                    <span class="weather-detail-icon"><i class="fa-solid ${data.icon||'fa-sun'}"></i></span>
                    <span class="weather-detail-title">天气详情</span>
                    <div style="font-size: 8px; color: #666; margin-top: 5px;">📍 当前城市：${data.city||'--'}</div>
                </div>
                
                <!-- 城市切换区域 -->
                <div class="weather-city-switch" style="margin: 15px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                    <div style="margin-bottom: 10px; font-weight: bold; color: #333;">切换城市</div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="weather-city-input" placeholder="请输入城市名称" style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        <button id="weather-city-switch-btn" style="background: #4caf50; color: #fff; border: none; border-radius: 4px; padding: 8px 16px; font-size: 14px; cursor: pointer;">切换</button>
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; color: #666;">💡 支持国内城市，如：北京、上海等</div>
                </div>
                
                <div class="weather-detail-info">
                    <div class="weather-detail-info-item">温度：${data.temp}℃</div>
                    <div class="weather-detail-info-item">湿度：${data.humidity||'--'}%</div>
                    <div class="weather-detail-info-item">风力：${data.wind_power||'--'}</div>
                    <div class="weather-detail-info-item">风向：${data.wind_direction||'--'}</div>
                    ${extra.uv && extra.uv !== '--' ? `<div class="weather-detail-info-item">紫外线：${extra.uv}</div>` : ''}
                    ${extra.aqi && extra.aqi !== '--' ? `<div class="weather-detail-info-item">空气质量：${extra.aqi}</div>` : ''}
                </div>
                <div class="weather-detail-desc">${data.description||''}</div>
                <div class="weather-detail-desc"><b>穿衣建议：</b>${extra.dress}</div>
                <div class="weather-detail-desc"><b>生活建议：</b>${extra.life||'--'}</div>
                <div class="weather-detail-desc" style="font-size: 12px; color: #888; text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #eee;">
                    数据来自网络仅供参考
                </div>
                <div style="text-align:right;margin-top:10px;display:flex;gap:12px;justify-content:flex-end;">
                    <button id="weather-detail-copy-btn" style="background:#4caf50;color:#fff;border:none;border-radius:6px;padding:6px 18px;font-size:15px;cursor:pointer;">复制建议</button>
                    <button id="weather-detail-share-btn" style="background:#2196f3;color:#fff;border:none;border-radius:6px;padding:6px 18px;font-size:15px;cursor:pointer;">分享</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        // 关闭逻辑
        overlay.querySelector('.weather-detail-close').onclick = function(e){
            e.preventDefault();
            e.stopPropagation();
            overlay.remove();
        };
        overlay.onclick = function(e){
            e.preventDefault();
            if(e.target===overlay) {
                overlay.remove();
            }
        };
        // 刷新按钮
        overlay.querySelector('.weather-detail-refresh').onclick = function(e){
            e.preventDefault();
            e.stopPropagation();
            
            // 防止重复点击
            if (this.disabled) return;
            this.disabled = true;
            
            try {
                // 刷新简化天气管理器
                if(window.SimpleWeatherManager) {
                    window.SimpleWeatherManager.refreshWeather();
                }
                
                // 同时刷新主天气管理器
                if(window.WeatherManager) {
                    window.WeatherManager.fetchWeatherData();
                }
                
                // 显示刷新提示
                const refreshMsg = document.createElement('div');
                refreshMsg.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 10001;
                    font-size: 14px;
                `;
                refreshMsg.textContent = '正在刷新天气数据...';
                document.body.appendChild(refreshMsg);
                
                setTimeout(() => {
                    if (refreshMsg.parentNode) {
                        refreshMsg.remove();
                    }
                }, 2000);
                
                overlay.remove();
            } catch (error) {
                console.error('刷新天气时出错:', error);
                alert('刷新失败，请稍后重试');
            } finally {
                this.disabled = false;
            }
        };
        
        // 城市切换按钮
        overlay.querySelector('#weather-city-switch-btn').onclick = function(e){
            e.preventDefault();
            e.stopPropagation();
            
            // 防止重复点击
            if (this.disabled) return;
            this.disabled = true;
            
            const cityInput = overlay.querySelector('#weather-city-input');
            const cityName = cityInput.value.trim();
            
            try {
                if (!cityName) {
                    alert('请输入城市名称');
                    cityInput.focus();
                    return;
                }
                
                // 验证城市名称格式（支持中英文）
                if (!/^[\u4e00-\u9fa5a-zA-Z\s]+(市|省|自治区|特别行政区)?$/i.test(cityName)) {
                    alert('请输入有效的城市名称，如：北京、上海、广州、Beijing等');
                    cityInput.focus();
                    return;
                }
                
                // 使用简化天气管理器的setLocation方法，它会自动同步所有管理器
                if (window.SimpleWeatherManager) {
                    window.SimpleWeatherManager.setLocation(cityName);
                } else if (window.WeatherManager) {
                    // 如果简化管理器不存在，直接使用主管理器
                    window.WeatherManager.setLocation(cityName);
                } else {
                    // 都不存在时，至少保存到本地存储
                    localStorage.setItem('userLocation', cityName);
                }
                
                // 显示成功提示
                alert(`已切换到 ${cityName}，正在获取天气数据...`);
                
                // 关闭弹窗
                overlay.remove();
            } catch (error) {
                console.error('切换城市时出错:', error);
                alert('切换城市失败，请重试');
            } finally {
                this.disabled = false;
            }
        };
        
        // 城市输入框回车键支持
        overlay.querySelector('#weather-city-input').addEventListener('keypress', function(e){
            if (e.key === 'Enter') {
                overlay.querySelector('#weather-city-switch-btn').click();
            }
        });
        // 复制建议
        overlay.querySelector('#weather-detail-copy-btn').onclick = function(){
            let uvText = extra.uv && extra.uv !== '--' ? `🌞 紫外线：${extra.uv}` : '';
            let aqiText = extra.aqi && extra.aqi !== '--' ? `🏭 空气质量：${extra.aqi}` : '';
            let uvAqiLine = '';
            if (uvText && aqiText) uvAqiLine = uvText + '  ' + aqiText;
            else if (uvText) uvAqiLine = uvText;
            else if (aqiText) uvAqiLine = aqiText;
            const text = `【${data.city||''}天气】\n` +
                `🌡️ 温度：${data.temp}℃  💧湿度：${data.humidity||'--'}%  💨风力：${data.wind_power||'--'}  🧭风向：${data.wind_direction||'--'}\n` +
                `${data.description ? '📝 ' + data.description + '\n' : ''}` +
                `👕 穿衣建议：${extra.dress}\n` +
                `💡 生活建议：${extra.life||'--'}\n` +
                (uvAqiLine ? uvAqiLine : '');
            if(navigator.clipboard){
                navigator.clipboard.writeText(text);
                this.textContent = '已复制！';
                setTimeout(()=>{this.textContent='复制建议';}, 1200);
            }else{
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                this.textContent = '已复制！';
                setTimeout(()=>{this.textContent='复制建议';}, 1200);
            }
        };
        // 分享建议
        overlay.querySelector('#weather-detail-share-btn').onclick = function(){
            let uvText = extra.uv && extra.uv !== '--' ? `🌞 紫外线：${extra.uv}` : '';
            let aqiText = extra.aqi && extra.aqi !== '--' ? `🏭 空气质量：${extra.aqi}` : '';
            let uvAqiLine = '';
            if (uvText && aqiText) uvAqiLine = uvText + '  ' + aqiText;
            else if (uvText) uvAqiLine = uvText;
            else if (aqiText) uvAqiLine = aqiText;
            const text = `【${data.city||''}天气】\n` +
                `🌡️ 温度：${data.temp}℃  💧湿度：${data.humidity||'--'}%  💨风力：${data.wind_power||'--'}  🧭风向：${data.wind_direction||'--'}\n` +
                `${data.description ? '📝 ' + data.description + '\n' : ''}` +
                `👕 穿衣建议：${extra.dress}\n` +
                `💡 生活建议：${extra.life||'--'}\n` +
                (uvAqiLine ? uvAqiLine : '') + '\n✨—— 来自有数规划 ✨';
            if(window.plus && plus.share && plus.share.sendWithSystem){
                plus.share.sendWithSystem({content: text}, function(){}, function(e){
                    alert('系统分享失败：'+JSON.stringify(e));
                });
            }else if(navigator.share){
                navigator.share({title: `${data.city||''}天气`, text: text});
            }else if(navigator.clipboard){
                navigator.clipboard.writeText(text).then(() => {
                    alert('已复制到剪贴板，可粘贴分享');
                });
            }else{
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try{
                    document.execCommand('copy');
                    alert('已复制到剪贴板，可粘贴分享');
                }catch(err){
                    alert('复制失败，请手动复制');
                }
                document.body.removeChild(ta);
            }
        };
    }
    // 挂载到全局，供simple-weather调用
    window.showWeatherDetailPopup = showWeatherDetailPopup;
})();

document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('weather-card-btn');
    if(btn){
        btn.addEventListener('click', function(){
            if(window.SimpleWeatherManager && SimpleWeatherManager.weatherData){
                // 组装详情数据
                const data = SimpleWeatherManager.weatherData;
                
                // 根据时间和天气条件确定图标
                let icon = (window.SimpleWeatherManager.travelTips[data.condition]?.icon) || 'fa-sun';
                
                // 对于晴天，根据时间段决定显示太阳还是月亮图标
                if (data.condition === 'sunny') {
                    const hour = new Date().getHours();
                    // 晚上6点(18)到早上6点(6)之间显示月亮图标
                    if (hour >= 18 || hour < 6) {
                        icon = 'fa-moon'; // 晚上显示月亮
                    } else {
                        icon = 'fa-sun'; // 白天显示太阳
                    }
                }
                
                const detail = Object.assign({}, data, {
                    icon,
                    humidity: data.humidity || (data.raw && data.raw.humidity) || '--',
                    wind_power: data.wind_power || (data.raw && data.raw.wind_power) || '--',
                    wind_direction: data.wind_direction || (data.raw && data.raw.wind_direction) || '--',
                });
                window.showWeatherDetailPopup && window.showWeatherDetailPopup(detail);
            }else{
                alert('天气数据暂未加载，请稍后再试');
            }
        });
    }
});