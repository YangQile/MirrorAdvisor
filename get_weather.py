import requests
from datetime import datetime, timedelta, timezone
import pytz
import json
import os 

# --- 配置你的和风天气 API Key ---
QWEATHER_API_KEY = 'Your API Key'

# --- 配置你的和风天气 API Host ---
QWEATHER_API_HOST = 'Your API Host'

# --- 数据保存文件 ---
WEATHER_LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'weather_log.json')

def get_location_by_ip():
    """
    通过 IP 地址获取大致的地理位置信息（纬度、经度、城市和时区）。
    此函数无需修改，因为它不依赖于天气 API。
    """
    try:
        response = requests.get('https://ipinfo.io/json')
        response.raise_for_status() 
        data = response.json()

        loc_str = data.get('loc', '0,0')
        latitude, longitude = loc_str.split(',')
        city = data.get('city', '未知城市')
        timezone_str = data.get('timezone', 'Asia/Shanghai')

        return float(latitude), float(longitude), city, timezone_str
    except requests.exceptions.RequestException as e:
        print(f"请求 ipinfo.io 失败: {e}")
        return None, None, None, None
    except Exception as e:
        print(f"获取位置信息时发生意外错误: {e}")
        return None, None, None, None

def get_weather_and_forecast_info(lat, lon, timezone_str):
    """
    通过经纬度调用和风天气 API 获取当前天气和未来预报。
    此版本已优化以处理可能缺失的JSON字段，并正确解析紫外线指数。
    """
    if not QWEATHER_API_KEY or QWEATHER_API_KEY == 'YOUR_QWEATHER_API_KEY':
        print("错误: 和风天气 API Key 未配置或为默认值。")
        return None, None, None
    if not QWEATHER_API_HOST:
        print("错误: 和风天气 API Host 未配置。")
        return None, None, None

    try:
        # 获取实时天气
        current_weather_url = f"{QWEATHER_API_HOST}/v7/weather/now?location={lon},{lat}&key={QWEATHER_API_KEY}&lang=zh"
        current_weather_response = requests.get(current_weather_url)
        current_weather_response.raise_for_status()
        current_weather_data = current_weather_response.json()
        
        # 获取未来24小时预报
        forecast_url = f"{QWEATHER_API_HOST}/v7/weather/24h?location={lon},{lat}&key={QWEATHER_API_KEY}&lang=zh"
        forecast_response = requests.get(forecast_url)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        # 获取紫外线指数
        indices_url = f"{QWEATHER_API_HOST}/v7/indices/1d?location={lon},{lat}&key={QWEATHER_API_KEY}&type=5"
        indices_response = requests.get(indices_url)
        indices_response.raise_for_status()
        indices_data = indices_response.json()
        
        # 紫外线指数描述到数值的映射
        uv_mapping = {
            '很弱': 1,
            '弱': 2,
            '中等': 4,
            '强': 7,
            '很强': 9,
            '极强': 11,
            'N/A': 7 # 新增：如果API返回N/A，则映射为7
        }
        
        uv_index_text = "N/A"
        uv_index_value = "N/A"
        if indices_data.get('code') == '200' and indices_data.get('daily'):
            uv_index_text = indices_data['daily'][0].get('text', 'N/A')
            uv_index_value = uv_mapping.get(uv_index_text, 7) # 如果API返回的值不在映射表中，也将其设为7

        # 解析实时天气数据
        now = current_weather_data.get('now')
        if not now:
            print("错误: 实时天气数据为空。")
            return None, None, None
            
        current_temp = now.get('temp', 'N/A')
        current_humidity = now.get('humidity', 'N/A')
        current_wind_speed = now.get('windSpeed', 'N/A')
        current_weather_desc = now.get('text', 'N/A')
        current_precipitation_status = "无"
        if '雨' in current_weather_desc:
            current_precipitation_status = "雨"
        elif '雪' in current_weather_desc:
            current_precipitation_status = "雪"

        current_weather_summary = {
            'temperature': current_temp,
            'humidity': current_humidity,
            'wind_speed': current_wind_speed,
            'weather_description': current_weather_desc,
            'uv_index': uv_index_value, # 返回映射后的数值
            'precipitation_status': current_precipitation_status
        }
        
        # 解析未来预报数据，查找降水情况
        rain_snow_forecast_today = []
        rain_snow_forecast_tomorrow = []

        local_timezone = None
        try:
            from zoneinfo import ZoneInfo
            local_timezone = ZoneInfo(timezone_str)
        except ImportError:
            try:
                local_timezone = pytz.timezone(timezone_str)
            except pytz.UnknownTimeZoneError:
                local_timezone = timezone.utc
        except Exception:
            local_timezone = timezone.utc

        if local_timezone is None:
            local_timezone = timezone.utc

        now_local = datetime.now(local_timezone)
        today_date = now_local.date()
        tomorrow_date = (now_local + timedelta(days=1)).date()
        
        forecast_hourly = forecast_data.get('hourly')
        if forecast_hourly and forecast_data.get('code') == '200':
            for entry in forecast_hourly:
                # 使用 .get() 来确保键存在
                fxTime_str = entry.get('fxTime', '')
                if not fxTime_str:
                    continue
                dt_local = datetime.fromisoformat(fxTime_str).astimezone(local_timezone)
                forecast_date = dt_local.date()
                forecast_time = dt_local.strftime('%H:%M')
                weather_desc = entry.get('text', 'N/A')
                
                is_precipitation = ('雨' in weather_desc) or ('雪' in weather_desc)
                
                if is_precipitation:
                    if forecast_date == today_date:
                        rain_snow_forecast_today.append(f"{forecast_time} - {weather_desc}")
                    elif forecast_date == tomorrow_date:
                        rain_snow_forecast_tomorrow.append(f"{forecast_time} - {weather_desc}")
                        
        return current_weather_summary, rain_snow_forecast_today, rain_snow_forecast_tomorrow

    except requests.exceptions.RequestException as e:
        print(f"请求和风天气 API 失败: {e}")
        return None, None, None
    except KeyError as e:
        print(f"解析天气数据时缺少键: {e}")
        return None, None, None
    except Exception as e:
        print(f"获取天气和预报信息时发生意外错误: {e}")
        return None, None, None

def main():
    """主函数，执行获取位置和天气信息的流程。"""
    latitude, longitude, city_name, timezone_str = get_location_by_ip()

    if latitude is not None and longitude is not None:
        current_weather, today_forecast, tomorrow_forecast = get_weather_and_forecast_info(latitude, longitude, timezone_str)

        if current_weather:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "city": city_name,
                "current_weather": {
                    "temperature": current_weather['temperature'],
                    "humidity": current_weather['humidity'],
                    "wind_speed": current_weather['wind_speed'],
                    "weather_description": current_weather['weather_description'],
                    "uv_index": current_weather['uv_index'],
                    "precipitation_status": current_weather['precipitation_status']
                },
                "forecast": {
                    "today_precipitation": [],
                    "tomorrow_precipitation": []
                }
            }

            print(f"城市: {city_name}")
            print(f"温度: {current_weather['temperature']}°C")
            print(f"湿度: {current_weather['humidity']}%")
            print(f"风速: {current_weather['wind_speed']} m/s")
            print(f"天气状况: {current_weather['weather_description']}")
            print(f"紫外线指数: {current_weather['uv_index']}")
            if current_weather['precipitation_status'] == "雨":
                print(f"当前有雨")
            elif current_weather['precipitation_status'] == "雪":
                print(f"当前有雪")

            if today_forecast:
                first_today_forecast_time = today_forecast[0].split(' ')[0]
                today_precipitation_desc = today_forecast[0].split(' - ')[1]
                print(f"今天预计{first_today_forecast_time}有{today_precipitation_desc}")
                log_entry["forecast"]["today_precipitation"].append({
                    "time": first_today_forecast_time,
                    "description": today_precipitation_desc
                })

            if tomorrow_forecast:
                first_tomorrow_forecast_time = tomorrow_forecast[0].split(' ')[0]
                tomorrow_precipitation_desc = tomorrow_forecast[0].split(' - ')[1]
                print(f"明天预计{first_tomorrow_forecast_time}有{tomorrow_precipitation_desc}")
                log_entry["forecast"]["tomorrow_precipitation"].append({
                    "time": first_tomorrow_forecast_time,
                    "description": tomorrow_precipitation_desc
                })

            with open(WEATHER_LOG_FILE, 'w', encoding='utf-8') as f:
                json.dump([log_entry], f, ensure_ascii=False, indent=4)
        else:
            print("\n--- 无法获取天气数据（可能API Key错误或网络问题）。---")
    else:
        print("\n--- 无法获取您的位置信息，因此无法获取天气数据。---")

if __name__ == "__main__":
    import sys
    if len(sys.argv) == 1:
        main()