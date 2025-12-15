# 肌刻｜MySkin MirrorAdvisor

一个集“肌肤检测 + 智能护肤建议 + 产品管理 + 天气/健康联动”为一体的本地应用。前端纯静态页面由 Flask 静态托管，后端整合 Face++ 肤质检测、DeepSeek 大模型生成建议、和风天气数据、阿里云 TTS 语音播放等能力。

> 运行后访问 http://127.0.0.1:5001 即可体验。

---

## 功能特性
- 肤质检测：上传/拍照，调用 Face++ 返回多维度肤质结果（出油、水分、痘痘、黑眼圈、皱纹、肤龄等），生成可读性强的中文报告，并保留历史记录与照片。
- 护肤建议：结合“最新肤质报告 + 天气 + 健康数据 + 我的产品”由 DeepSeek 生成“日/夜流程+科学依据”的个性化建议。
- 产品库与扫码：内置产品示例，右键加入“我的产品”；支持摄像头扫码（QuaggaJS）将条码匹配并加入。
- 天气联动：自动根据 IP 获取城市与紫外线/湿度等数据（和风天气）。
- 历史趋势：保存近 7 次分析记录，支持图表与图片回看。
- 语音体验：调用阿里云 TTS（可选）与本地等待音乐，提升交互沉浸感。

---

## 目录结构
```
backend/
  app.py                  # Flask 服务（静态托管 + API）
  get_weather.py          # 和风天气数据抓取（子进程常驻）
  faceplusplus_api.py     # Face++ 肤质分析封装 + 报告翻译
  get_skincare_advice.py  # DeepSeek 联动生成护肤建议
  aliyun_tts_player.py    # 阿里云 TTS 合成与播放（可选）
  health_data.json        # 示例健康数据
  my_product.json         # 示例“我的产品”
  weather_log.json        # 运行时生成的天气快照
  skin_analysis_log.json  # 运行时生成的肤质历史
  requirements.txt        # Python 依赖
  frontend/
    index.html
    script.js
    style.css
    Images/
      weather/QWeather-Icons-1.7.0/...
uploads/                 # 上传临时目录（运行时自动创建）
history_images/          # 历史照片保存目录（运行时自动创建）
```

---

## 环境准备
- 系统：macOS（Linux/Windows 原理相同）
- Python：3.9+ 推荐
- 浏览器：Chrome/Edge/Safari

依赖安装前建议使用虚拟环境。

```bash
# 创建与启用虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 安装后端依赖
pip install -r backend/requirements.txt
```

PyAudio 需要 PortAudio（macOS）：
```bash
# 如果安装 PyAudio 失败，先装 PortAudio 再重试
brew install portaudio
pip install pyaudio
```

---

## 必填配置（运行前）
请在下列文件/环境变量中填写自己的密钥或服务地址：

- 和风天气（QWeather）：
  - [backend/get_weather.py](backend/get_weather.py) 中设置 `QWEATHER_API_KEY` 与 `QWEATHER_API_HOST`（例如 `https://devapi.qweather.com`）。
- Face++ 肤质检测：
  - [backend/faceplusplus_api.py](backend/faceplusplus_api.py) 中设置 `API_KEY`、`API_SECRET`、`API_URL`。
- DeepSeek 大模型：
  - 环境变量：`DEEPSEEK_API_KEY`，或直接在 [backend/get_skincare_advice.py](backend/get_skincare_advice.py) 里替换默认值。
    ```bash
    export DEEPSEEK_API_KEY="your_deepseek_api_key"
    ```
- 阿里云 TTS（可选）：
  - [backend/aliyun_tts_player.py](backend/aliyun_tts_player.py) 中设置 `ALI_APPKEY`、`ALI_TOKEN`。
  - 等待音乐（可选）：在 [backend/app.py](backend/app.py) 中 `WAITING_MUSIC_FILE` 指向一段本地 WAV 文件，或留空以禁用。

> 安全提示：不要将真实密钥提交到公共仓库。推荐使用环境变量或 `.env`（自行实现加载）。

---

## 启动与访问
```bash
# 1) 进入项目根目录，启用虚拟环境（若尚未启用）
cd backend

# 2) 可选：设置 DeepSeek 密钥（或使用你已配置的 shell 环境）
export DEEPSEEK_API_KEY="your_deepseek_api_key"

# 3) 运行 Flask 服务（会后台拉起 get_weather.py）
python app.py
```
启动成功后，浏览器访问：
- 前端与控制台：http://127.0.0.1:5001

前端内置：
- 天气卡片（温度/湿度/UV）
- 产品库 / 健康数据 / 分析建议 三大入口
- 肌肤检测：打开摄像头拍照 → 上传 → 生成报告
- 获取护肤建议：综合数据调用大模型生成 AM/PM 流程

---

## 主要 API 列表
- GET `/api/advice_data`
  - 返回仪表盘所需聚合数据：天气（UV、湿度）、健康（睡眠、压力）、最新肤质评分/肤龄。
- GET `/api/skincare_advice`
  - 触发生成个性化护肤建议（DeepSeek）。服务端会在等待期间播放背景音乐（可选）。
- POST `/analyze`
  - 表单字段 `image`（`png/jpg/jpeg/gif`），调用 Face++ 分析后生成中文报告，保存历史与照片。
- GET `/api/historical_skin_analysis`
  - 返回最近 7 次的检测记录（含时间、核心指标、图片 URL）。
- GET `/api/weather`
  - 基于 IP 的城市定位 + 调用和风天气，返回温度/湿度/UV/天气文本概要。
- POST `/api/save_my_products`
  - body: `{ products: [...] }`，将“我的产品”保存到服务端 `my_product.json`。
- GET `/api/check_skin_analysis`
  - 返回是否已有任何肤质历史记录。

静态资源：
- GET `/` 与 `/<path>` → 托管 [backend/frontend](backend/frontend) 内容
- GET `/history_images/<filename>` → 历史检测图片

---

## 数据与持久化
- 天气快照：`backend/weather_log.json`
- 健康示例：`backend/health_data.json`
- 我的产品：`backend/my_product.json`
- 肤质历史：`backend/skin_analysis_log.json`（最多保留近 7 条，含 `image_url`）
- 照片：`history_images/`（永久保存），`uploads/`（临时，分析完成即删除）

---

## 常见问题（FAQ）
- PyAudio 安装失败（macOS）
  - 先运行 `brew install portaudio`，再 `pip install pyaudio`。
- `/api/weather` 返回错误
  - 请确认 `QWEATHER_API_KEY` 与 `QWEATHER_API_HOST` 已正确配置，且网络可访问。
- 深度建议为空/失败
  - 确认 `DEEPSEEK_API_KEY` 有效；若本地 `skin_analysis_log.json` 为空，会在文案中提示先做一次检测。
- 摄像头无法打开
  - 请在浏览器允许摄像头权限，或改用手动上传图片调试 `/analyze`。
- 背景等待音乐未播放
  - 检查 [backend/app.py](backend/app.py) 中 `WAITING_MUSIC_FILE` 指向的 WAV 是否存在；阿里云 TTS 与等待音乐互不依赖。

---

## 致谢
- Face++ 肤质分析 API
- 和风天气 (QWeather)
- DeepSeek Chat Completions API
- 阿里云智能语音（TTS）
- QWeather-Icons 图标集（见 `frontend/Images/weather/QWeather-Icons-1.7.0`）

---

## 许可协议
- 默认使用 MIT（可按团队需要替换）。

如需我帮你补充英文版 README、Dockerfile 或演示 Gif/截图，也可以继续告诉我。
