# chromium-browser --kiosk --disable-infobars --app=http://localhost:5001
import os
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import faceplusplus_api  # 导入我们刚刚重命名的模块
from get_weather import get_location_by_ip, get_weather_and_forecast_info
from get_skincare_advice import get_skincare_advice
import json
from datetime import datetime
import subprocess # 导入 subprocess 模块
import sys
from flask_cors import CORS
from werkzeug.utils import secure_filename
from aliyun_tts_player import speak

import re
import threading
import time

import pyaudio
import wave
import shutil # <-- 新增导入

def extract_key_metrics(result_data):
    """从Face++返回的完整结果中，提取出8个核心指标"""
    if not isinstance(result_data, dict):
        return {}
    dark_circle_map = {0: "轻微", 1: "中度", 2: "严重"}
    acne_rects = result_data.get('acne', {}).get('rectangle', [])
    acne_count = len(acne_rects) if isinstance(acne_rects, list) else 0
    key_metrics = {
        "total_score": result_data.get('score_info', {}).get('total_score'),
        "water_severity": result_data.get('water', {}).get('water_severity'),
        "pigmentation_score": result_data.get('melanin', {}).get('melanin_concentration'),
        "acne_count": acne_count,
        "dark_circle_severity": dark_circle_map.get(result_data.get('dark_circle_severity', {}).get('value'), "未知"),
        "skin_age": result_data.get('skin_age', {}).get('value'),
        "oiliness": {0: "轻微", 1: "中度", 2: "严重"}.get(result_data.get('oily_intensity', {}).get('full_face', {}).get('intensity'), "未知")
    }
    return key_metrics

class AudioPlayer:
    def __init__(self):
        self.p = pyaudio.PyAudio()
        self.stream = None
        self.is_playing = threading.Event()
        self.player_thread = None

    def _play_loop(self, filename, loop=False):
        try:
            wf = wave.open(filename, 'rb')
        except FileNotFoundError:
            print(f"❌ [AudioPlayer] 错误：找不到音频文件 {filename}")
            return
        self.stream = self.p.open(format=self.p.get_format_from_width(wf.getsampwidth()),
                                  channels=wf.getnchannels(), rate=wf.getframerate(), output=True)
        chunk = 1024
        data = wf.readframes(chunk)
        while self.is_playing.is_set() and data:
            self.stream.write(data)
            data = wf.readframes(chunk)
            if not data and loop:
                wf.rewind()
                data = wf.readframes(chunk)
        self.stream.stop_stream()
        self.stream.close()
        wf.close()
        print("✅ [AudioPlayer] 播放线程已停止。")

    def play(self, filename, loop=False):
        if self.is_playing.is_set():
            print("⚠️ [AudioPlayer] 播放器已在运行，请先停止。")
            return
        print(f"🎵 [AudioPlayer] 开始播放: {filename}")
        self.is_playing.set()
        self.player_thread = threading.Thread(target=self._play_loop, args=(filename, loop))
        self.player_thread.start()

    def stop(self):
        if not self.is_playing.is_set():
            return
        print("🛑 [AudioPlayer] 正在停止播放...")
        self.is_playing.clear()
        if self.player_thread:
            self.player_thread.join()
        print("✅ [AudioPlayer] 播放已停止。")
        
    def terminate(self):
        self.stop()
        self.p.terminate()

audio_player = AudioPlayer()
WAITING_MUSIC_FILE ="/home/mirror/Desktop/mirror/sound/Relax.wav"

# 初始化 Flask 应用
app = Flask(__name__, static_folder='frontend')
CORS(app)

# 配置上传文件夹和允许的文件扩展名
UPLOAD_FOLDER = 'uploads'
HISTORY_IMAGE_FOLDER = 'history_images' # <-- 新增：定义历史图片文件夹
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

SKIN_ANALYSIS_LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'skin_analysis_log.json')

# 确保所有需要的文件夹都存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(HISTORY_IMAGE_FOLDER, exist_ok=True) # <-- 修改：确保历史文件夹存在

if not os.path.exists(SKIN_ANALYSIS_LOG_FILE):
    with open(SKIN_ANALYSIS_LOG_FILE, 'w', encoding='utf-8') as f:
      json.dump([], f, ensure_ascii=False, indent=4)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
WEATHER_FILE = os.path.join(os.path.dirname(__file__), 'weather_log.json')
HEALTH_FILE = os.path.join(os.path.dirname(__file__), 'health_data.json')
SKIN_ANALYSIS_FILE = os.path.join(os.path.dirname(__file__), 'skin_analysis_log.json')

def load_json(file_path):
    if not os.path.exists(file_path):
        return [] if "log" in file_path else {}
    with open(file_path, "r", encoding="utf-8") as f:
        try:
            content = f.read()
            return json.loads(content) if content else ([] if "log" in file_path else {})
        except json.JSONDecodeError:
            return [] if "log" in file_path else {}
            
@app.route('/api/advice_data')
def advice_data():
    try:
        weather_log = load_json(WEATHER_FILE)
        current_weather = weather_log[0]['current_weather'] if weather_log else {}

        health_data = load_json(HEALTH_FILE)
        skin_log = load_json(SKIN_ANALYSIS_FILE)
        latest_skin = skin_log[-1]['key_metrics'] if skin_log else {}

        return jsonify({
            'weather': {
                'uv_index': current_weather.get('uv_index', 0),
                'humidity': current_weather.get('humidity', 0)
            },
            'health': {
                'sleep': f"{health_data['health_rings']['sleep']['hours']}h{health_data['health_rings']['sleep']['minutes']}m",
                'stress_level': health_data['health_rings']['mood']['stress_level']
            },
            'skin': {
                'score': latest_skin.get('total_score', 0),
                'age': latest_skin.get('skin_age', 0)
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500



@app.route("/api/skincare_advice", methods=["GET"])
def skincare_advice_endpoint():
    audio_player.play(WAITING_MUSIC_FILE, loop=True)
    try:
        print("🧠 正在向大模型请求护肤建议...")
        advice_raw = get_skincare_advice()
        print("✅ 已收到护肤建议。")
        return jsonify({"status": "success", "advice": advice_raw})
    except Exception as e:
        print(f"❌ 获取建议时发生错误: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        audio_player.stop()

@app.route('/api/save_my_products', methods=['POST'])
def save_my_products():
    try:
        data = request.get_json()
        products = data.get('products', [])
        save_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'my_product.json')
        with open(save_path, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=4)
        return jsonify({'status': 'success', 'message': '产品目录已在服务器端保存'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/check_skin_analysis')
def check_skin_analysis():
    path = os.path.join(os.path.dirname(__file__), 'skin_analysis_log.json')
    has_analysis = False
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                has_analysis = bool(data)
        except Exception:
            has_analysis = False
    return jsonify({'has_analysis': has_analysis})

@app.route('/api/weather')
def weather_endpoint():
    latitude, longitude, city, timezone_str = get_location_by_ip()
    if latitude and longitude:
        current_weather, _, _ = get_weather_and_forecast_info(latitude, longitude, timezone_str)
        if current_weather:
            response_data = {
                "status": "success", "city": city, "temperature": current_weather.get('temperature'),
                "humidity": current_weather.get('humidity'), "uv_index": current_weather.get('uv_index'),
                "weather_description": current_weather.get('weather_description')
            }
            return jsonify(response_data)
    return jsonify({"status": "error", "message": "无法获取天气信息"}), 500

@app.route('/analyze', methods=['POST'])
def analyze_skin_endpoint():
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "请求中未找到图片文件"}), 400
    
    file = request.files['image']

    if file.filename == '':
        return jsonify({"status": "error", "message": "未选择任何文件"}), 400

    if file and allowed_file(file.filename):
        # 1. 创建唯一的、带时间戳的文件名
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_filename = secure_filename(file.filename)
        unique_filename = f"{timestamp_str}_{original_filename}"
        
        # 2. 定义临时保存路径和永久保存路径
        temp_filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        permanent_filepath = os.path.join(HISTORY_IMAGE_FOLDER, unique_filename)
        
        # 3. 先将文件保存到临时路径
        file.save(temp_filepath)

        try:
            analysis_result = faceplusplus_api.analyze_skin(temp_filepath)

            if "error" in analysis_result:
                return jsonify({"status": "error", "message": analysis_result['error']})

            # 4. 分析成功后，将文件复制到永久历史目录
            shutil.copy2(temp_filepath, permanent_filepath)
            print(f"✅ 照片已永久保存到: {permanent_filepath}")
            
            result_data = analysis_result.get('result', {})
            report_text = faceplusplus_api.translate_skin_analysis(result_data)
            key_metrics_data = extract_key_metrics(result_data)

            try:
                with open(SKIN_ANALYSIS_LOG_FILE, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                existing_data = []
            
            # 5. 创建新的日志条目，并加入 image_url 字段
            image_url = f"/{HISTORY_IMAGE_FOLDER}/{unique_filename}"
            new_entry = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "report_text": report_text,
                "key_metrics": key_metrics_data,
                "image_url": image_url  # <-- 新增字段！
            }

            existing_data.append(new_entry)
            if len(existing_data) > 7:
                existing_data = existing_data[-7:]

            with open(SKIN_ANALYSIS_LOG_FILE, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, ensure_ascii=False, indent=4)
            print(f"皮肤分析结果及【核心指标】和【图片路径】已保存到 {SKIN_ANALYSIS_LOG_FILE}")
            
            return jsonify({"status": "success", "report": report_text})

        except Exception as e:
            print(f"服务器内部错误: {str(e)}")
            return jsonify({"status": "error", "message": f"服务器内部错误: {str(e)}"}), 500
        
        finally:
            # 6. 无论如何，都删除临时文件
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
    
    return jsonify({"status": "error", "message": "文件类型不被允许"}), 400

@app.route('/api/historical_skin_analysis')
def get_historical_analysis():
    try:
        with open(SKIN_ANALYSIS_LOG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify({"status": "success", "history": list(reversed(data))})
    except (FileNotFoundError, json.JSONDecodeError):
        return jsonify({"status": "success", "history": []})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- 新增的网页托管路由 ---
@app.route('/')
def serve_index():
    return send_from_directory('frontend', 'index.html')

# --- 新增：提供历史图片的路由 ---
@app.route('/history_images/<path:filename>')
def serve_history_image(filename):
    return send_from_directory(HISTORY_IMAGE_FOLDER, filename)

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('frontend', path)

import atexit
atexit.register(lambda: audio_player.terminate())

if __name__ == '__main__':
    print("="*50)
    print("智能护肤品管理系统已启动！")
    print("请在浏览器中打开: http://127.0.0.1:5001")
    print("="*50)
    if not os.environ.get('FLASK_RUN_FROM_CLI') or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        try:
            get_weather_script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'get_weather.py')
            subprocess.Popen([sys.executable, get_weather_script_path])
            print("get_weather.py 已在后台启动。")
        except FileNotFoundError:
            print("错误: get_weather.py 文件未找到。请确保它在正确的路径下。")
        except Exception as e:
            print(f"运行 get_weather.py 时发生错误: {e}")
    app.run(host='0.0.0.0', port=5001, debug=False)