import pyaudio
import wave
import os
import sys
from contextlib import contextmanager
import http.client
import urllib.parse


# 阿里云 TTS 凭证 
ALI_APPKEY = 'Your_ALI_APPKEY'
ALI_TOKEN = 'Your_ALI_TOKEN'

# 音频文件临时保存路径
# 使用 /tmp 目录可以确保脚本在大多数系统上都有写入权限，且文件会在重启后自动清理。
OUTPUT_WAV_PATH = "/tmp/aliyun_tts_output.wav"

# 音频播放参数
CHUNK_SIZE = 1024


# --- 上下文管理器，用于抑制 ALSA 在树莓派上可能产生的无关紧要的错误信息 ---
@contextmanager
def ignore_stderr():
    """一个临时的标准错误重定向器，避免ALSA的调试信息刷屏。"""
    devnull = os.open(os.devnull, os.O_WRONLY)
    old_stderr = os.dup(2)
    sys.stderr.flush()
    os.dup2(devnull, 2)
    os.close(devnull)
    try:
        yield
    finally:
        os.dup2(old_stderr, 2)
        os.close(old_stderr)


def text_to_speech(text, save_path):
    """
    调用阿里云TTS服务，将文本转换为语音并保存为WAV文件。
    :param text: 需要转换的文本。
    :param save_path: WAV文件的保存路径。
    :return: 成功返回 True，失败返回 False。
    """
    print(f"🗣️ [TTS] 准备合成语音: '{text[:30]}...'")
    host = 'nls-gateway-cn-shanghai.aliyuncs.com'
    url = f'https://{host}/stream/v1/tts'

    # 对文本进行URL编码
    try:
        text_encoded = urllib.parse.quote_plus(text)
    except Exception as e:
        print(f"❌ [TTS] 文本编码失败: {e}")
        return False

    # 构造完整的请求URL
    # format=wav: 输出WAV格式
    # sample_rate=16000: 采样率，16k对于语音来说是常用且清晰的
    request_url = f"{url}?appkey={ALI_APPKEY}&token={ALI_TOKEN}&text={text_encoded}&format=wav&sample_rate=16000"

    try:
        conn = http.client.HTTPSConnection(host)
        conn.request(method='GET', url=request_url)
        response = conn.getresponse()

        if response.status == 200:
            body = response.read()
            with open(save_path, mode='wb') as f:
                f.write(body)
            print(f"✅ [TTS] 语音合成成功，已保存至: {save_path}")
            return True
        else:
            # 打印更详细的错误信息
            error_body = response.read().decode('utf-8')
            print(f"❌ [TTS] 请求失败: 状态码={response.status}, 原因={response.reason}, 详情={error_body}")
            return False
    except Exception as e:
        print(f"❌ [TTS] 语音合成时发生网络或IO错误: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()


def play_audio(filename):
    """
    使用 PyAudio 播放一个WAV文件。
    :param filename: 要播放的WAV文件路径。
    """
    if not os.path.exists(filename):
        print(f"❌ [播放] 文件不存在: {filename}")
        return

    print(f"🔊 [播放] 正在播放: {filename}")
    try:
        wf = wave.open(filename, 'rb')
        
        # 使用上下文管理器抑制ALSA错误
        with ignore_stderr():
            p = pyaudio.PyAudio()

        stream = p.open(format=p.get_format_from_width(wf.getsampwidth()),
                        channels=wf.getnchannels(),
                        rate=wf.getframerate(),
                        output=True)

        data = wf.readframes(CHUNK_SIZE)
        while data:
            stream.write(data)
            data = wf.readframes(CHUNK_SIZE)

        stream.stop_stream()
        stream.close()
        p.terminate()
        print("✅ [播放] 播放完成。")
    except Exception as e:
        print(f"❌ [播放] 播放音频时出错: {e}")


def speak(text_to_speak):
    """
    核心封装函数：接收文本，将其转换为语音，然后播放出来。
    这是你应该从其他脚本中调用的主要函数。
    :param text_to_speak: 需要朗读的字符串。
    """
    if not text_to_speak or not isinstance(text_to_speak, str):
        print("⚠️ [Speak] 输入内容无效，必须为非空字符串。")
        return
        
    print(f"\n--- 开始处理朗读任务 ---")
    # 步骤1: 文字转语音
    success = text_to_speech(text_to_speak, OUTPUT_WAV_PATH)
    
    # 步骤2: 如果转换成功，则播放音频
    if success:
        play_audio(OUTPUT_WAV_PATH)
    else:
        print("❌ [Speak] 由于语音合成失败，任务终止。")
    print("--- 朗读任务结束 ---\n")


# --- 主程序入口 ---
if __name__ == "__main__":
    print("--- 阿里云 TTS 播放器测试 ---")
    
    # 示例1: 朗读一句中文
    speak("你好，这是一个在树莓派上运行的文字转语音测试。")
    
    # 示例2: 朗读一句英文
    speak("Hello, this is a text-to-speech test running on Raspberry Pi.")
