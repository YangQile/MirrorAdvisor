import requests
import json
import base64
import os

# 配置信息 - 请确保这些信息正确
API_KEY = "Your_API_Key"  # 替换为您的API Key
API_SECRET = "Your_API_Secret"  # 替换为您的API Secret
API_URL = "Your_API_URL"
IMAGE_PATH = "backend/test1.jpg"  # 替换为您的图片路径

# 可选参数配置
RETURN_MAPS = "red_area,brown_area"  # 需要返回的检测图谱
RETURN_MARKS = "melanin_mark,wrinkle_mark,dark_circle_outline"  # 需要返回的坐标信息
ROI_OUTLINE_COLOR = {
    "pores_color": "0000FF",
    "blackhead_color": "FF0000",
    "wrinkle_color": "6E9900",
    "fine_line_color": "8DFE2A",
    "closed_comedones_color": "00FF00",
    "acne_pustule_color": "9F21F6",
    "acne_nodule_color": "FF00FD",
    "acne_color": "FE0100",
    "brown_spot_color": "7E2A28"
}


# 准备请求数据
def prepare_payload(image_path):
    try:
        # 检查文件是否存在
        if not os.path.exists(image_path):
            return {"error": f"图片文件不存在: {image_path}"}

        # 检查文件大小
        file_size = os.path.getsize(image_path) / (1024 * 1024)  # MB
        if file_size > 8:
            return {"error": f"图片文件过大 ({file_size:.2f}MB > 8MB)"}

        with open(image_path, 'rb') as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode('utf-8')

        # 创建payload
        payload = {
            'api_key': API_KEY,
            'api_secret': API_SECRET,
            'image_base64': image_base64,
            'return_maps': RETURN_MAPS,
            'return_marks': RETURN_MARKS,
            'roi_outline_color': json.dumps(ROI_OUTLINE_COLOR),
            'return_side_results': 'jawline_info'
        }

        # 打印调试信息（生产环境中应移除）
        print(f"Payload大小: {len(str(payload))} 字符")
        print(f"图片Base64长度: {len(image_base64)} 字符")

        return payload

    except Exception as e:
        return {"error": f"图片处理失败: {str(e)}"}


# 调用API并处理结果
def analyze_skin(image_path):
    # 准备请求数据
    payload = prepare_payload(image_path)

    # 检查是否已经有错误
    if "error" in payload:
        return payload

    try:
        # 发送POST请求
        print(f"正在发送请求到: {API_URL}")
        response = requests.post(API_URL, data=payload)

        # 打印详细的响应信息
        print(f"HTTP状态码: {response.status_code}")
        print(f"响应头: {response.headers}")
        print(f"响应内容 (前500字符): {response.text[:500]}")

        # 检查HTTP错误
        response.raise_for_status()

        # 解析JSON响应
        result = response.json()

        # 检查API错误
        if 'error_message' in result:
            return {
                "error": f"API返回错误: {result['error_message']}",
                "full_response": result
            }

        # 返回成功结果
        return {
            'request_id': result.get('request_id', ''),
            'time_used': result.get('time_used', 0),
            'result': result.get('result', {}),
            'full_response': result
        }

    except requests.exceptions.RequestException as e:
        # 捕获并处理请求异常
        error_info = {"error": f"网络请求失败: {str(e)}"}

        if hasattr(e, 'response') and e.response is not None:
            error_info.update({
                "status_code": e.response.status_code,
                "response_headers": dict(e.response.headers),
                "response_body": e.response.text[:1000]  # 截取部分响应体
            })

        return error_info

    except json.JSONDecodeError:
        return {"error": "API响应不是有效的JSON格式"}

    except Exception as e:
        return {"error": f"未知错误: {str(e)}"}


def translate_skin_analysis(result):
    """
    将Face++肤质分析API返回的JSON结果翻译成通俗易懂的中文解释

    参数:
        result (dict): API返回的result字段内容

    返回:
        str: 自然语言描述的肤质分析报告
    """
    if not isinstance(result, dict):
        return "无效的肤质分析结果"

    # 初始化报告内容
    report = "✨ 您的肤质分析报告 ✨\n\n"

    # 1. 图片质量分析
    quality = result.get('image_quality', {})
    if quality:
        glasses = "检测到眼镜" if quality.get('glasses', 0) == 1 else "未检测到眼镜"
        orientation = quality.get('face_orientation', {})

        report += f"📷 图片质量:\n"
        report += f"- 人脸占比: {quality.get('face_ratio', 0) * 100:.1f}%\n"
        report += f"- 刘海遮挡: {quality.get('hair_occlusion', 0) * 100:.1f}%\n"
        report += f"- {glasses}\n"
        report += f"- 人脸角度: 左右偏转{orientation.get('yaw', 0):.1f}°, 上下倾斜{orientation.get('pitch', 0):.1f}°\n\n"

    # 2. 出油分析
    oily = result.get('oily_intensity', {})
    if oily:
        intensity_map = {
            0: "轻微",
            1: "中度",
            2: "严重"
        }
        full_face = oily.get('full_face', {})
        intensity = intensity_map.get(full_face.get('intensity', 0), "未知")

        report += f"🛢️ 出油分析:\n"
        report += f"- 全脸油光面积: {full_face.get('area', 0) * 100:.1f}%\n"
        report += f"- 出油程度: {intensity}\n\n"

    # 3. 水分分析
    water = result.get('water', {})
    if water:
        severity = water.get('water_severity', 0)
        severity_desc = "良好" if severity < 30 else "轻微缺水" if severity < 50 else "中度缺水" if severity < 70 else "严重缺水"

        report += f"💧 水分分析:\n"
        report += f"- 缺水程度评分: {severity}/100 ({severity_desc})\n"
        report += f"- 缺水区域占比: {water.get('water_area', 0) * 100:.1f}%\n\n"

    # 4. 色素沉着分析
    melanin = result.get('melanin', {})
    if melanin:
        concentration = melanin.get('melanin_concentration', 0)
        concentration_desc = "轻微" if concentration < 20 else "中度" if concentration < 40 else "严重"

        report += f"🔬 色素沉着分析:\n"
        report += f"- 色素沉着程度: {concentration}/100 ({concentration_desc})\n"
        report += f"- 色素沉着区域: {melanin.get('brown_area', 0) * 100:.1f}%\n\n"

    # 5. 毛孔和黑头分析
    pores = {
        "forehead": result.get('pores_forehead', {}),
        "left_cheek": result.get('pores_left_cheek', {}),
        "right_cheek": result.get('pores_right_cheek', {}),
        "jaw": result.get('pores_jaw', {})
    }

    pores_count = result.get('enlarged_pore_count', {})
    blackhead = result.get('blackhead', {})

    if any(pores.values()) or pores_count or blackhead:
        report += f"🔍 毛孔和黑头分析:\n"

        # 毛孔严重程度
        severity_map = {0: "无", 1: "轻度", 2: "中度", 3: "重度"}
        for area, data in pores.items():
            if data:
                area_name = {
                    "forehead": "额头",
                    "left_cheek": "左脸颊",
                    "right_cheek": "右脸颊",
                    "jaw": "下巴"
                }.get(area, area)
                severity = severity_map.get(data.get('value', 0), "未知")
                report += f"- {area_name}毛孔问题: {severity}\n"

        # 毛孔数量
        if pores_count:
            total_pores = sum(pores_count.values()) if isinstance(pores_count, dict) else 0
            report += f"- 粗大毛孔数量: {total_pores}\n"

        # 黑头分析
        if blackhead:
            blackhead_value = blackhead.get('value', 0)
            blackhead_desc = {
                0: "无黑头问题",
                1: "轻度黑头",
                2: "中度黑头",
                3: "重度黑头"
            }.get(blackhead_value, "黑头情况未知")
            report += f"- {blackhead_desc}\n"

        report += "\n"

    # 6. 痘痘分析
    acne = result.get('acne', {})
    if acne:
        count = len(acne.get('rectangle', [])) if acne.get('rectangle') else 0

        report += f"❗ 痘痘分析:\n"
        report += f"- 检测到痘痘数量: {count}\n"

        if count > 0:
            severity_map = {
                0: "无痘痘问题",
                1: "少量痘痘",
                2: "中度痘痘问题",
                3: "严重痘痘问题"
            }
            severity = severity_map.get(min(count // 5, 3), "痘痘情况未知")
            report += f"- {severity}\n"

        report += "\n"

    # 7. 黑眼圈分析
    dark_circle = result.get('dark_circle', {})
    if dark_circle:
        circle_type_map = {
            0: "无黑眼圈",
            1: "色素型黑眼圈",
            2: "血管型黑眼圈",
            3: "结构型黑眼圈"
        }
        circle_type = circle_type_map.get(dark_circle.get('value', 0), "未知类型")

        severity = result.get('dark_circle_severity', {}).get('value', 0)
        severity_desc = {
            0: "轻微",
            1: "中度",
            2: "严重"
        }.get(severity, "未知程度")

        report += f"👁️ 黑眼圈分析:\n"
        report += f"- 类型: {circle_type}\n"
        report += f"- 严重程度: {severity_desc}\n\n"

    # 8. 皱纹分析
    wrinkles = {
        "抬头纹": result.get('forehead_wrinkle_severity', {}).get('value', 0),
        "鱼尾纹(左)": result.get('left_crows_feet_severity', {}).get('value', 0),
        "鱼尾纹(右)": result.get('right_crows_feet_severity', {}).get('value', 0),
        "眼部细纹(左)": result.get('left_eye_finelines_severity', {}).get('value', 0),
        "眼部细纹(右)": result.get('right_eye_finelines_severity', {}).get('value', 0),
        "法令纹(左)": result.get('left_nasolabial_fold_severity', {}).get('value', 0),
        "法令纹(右)": result.get('right_nasolabial_fold_severity', {}).get('value', 0),
    }

    if any(value > 0 for value in wrinkles.values()):
        report += f"🧓 皱纹分析:\n"

        severity_map = {0: "无", 1: "轻度", 2: "中度", 3: "重度"}

        for area, severity in wrinkles.items():
            if severity > 0:
                report += f"- {area}: {severity_map.get(severity, '未知')}\n"

        report += "\n"

    # 9. 综合评分
    scores = result.get('score_info', {})
    if scores:
        total_score = scores.get('total_score', 0)
        score_desc = "优秀" if total_score >= 90 else "良好" if total_score >= 70 else "一般" if total_score >= 50 else "较差"

        report += f"📊 皮肤综合评分:\n"
        report += f"- 总分: {total_score}/100 ({score_desc})\n"
        report += f"- 肤质: {scores.get('skin_type_score', 0)}/100\n"
        report += f"- 水分: {scores.get('water_score', 0)}/100\n"
        report += f"- 毛孔: {scores.get('pores_score', 0)}/100\n"
        report += f"- 痘痘: {scores.get('acne_score', 0)}/100\n"
        report += f"- 色素: {scores.get('melanin_score', 0)}/100\n"
        report += f"- 皱纹: {scores.get('wrinkle_score', 0)}/100\n"

    # 10. 肤龄分析
    skin_age = result.get('skin_age', {}).get('value')
    if skin_age:
        report += f"\n🧓 肤龄分析:\n"
        report += f"- 您的皮肤年龄大约为 {skin_age} 岁\n"

    # 2.1 推测肤质类型
    # 获取水分和出油数据
    water = result.get('water', {})
    oily = result.get('oily_intensity', {})
    skin_type_guess = "无法判断"

    # 默认值
    water_score = water.get('water_severity', 100)  # 越高越缺水
    oily_score = oily.get('full_face', {}).get('intensity', 0)  # 0:轻微 1:中度 2:严重

    # 规则判断
    if oily_score == 2:
        if water_score < 50:
            skin_type_guess = "油性皮肤"
        else:
            skin_type_guess = "油性缺水皮肤"
    elif oily_score == 0:
        if water_score < 50:
            skin_type_guess = "中性皮肤"
        else:
            skin_type_guess = "干性皮肤"
    elif oily_score == 1:
        if water_score < 50:
            skin_type_guess = "混合型皮肤"
        else:
            skin_type_guess = "混合偏干皮肤"

    report += f"🧴 推测肤质类型:\n- {skin_type_guess}\n\n"

    # 如果没有分析结果
    if len(report) < 30:
        return "未能获取有效的肤质分析结果，请检查输入数据"

    return report


# 执行分析
if __name__ == "__main__":
    print("=" * 50)
    print("Face++肤质分析调试工具")
    print("=" * 50)

    # 检查API密钥格式
    if API_KEY == "your_api_key" or API_SECRET == "your_api_secret":
        print("\n错误: 请先配置您的API_KEY和API_SECRET")
        exit(1)

    # 检查图片路径
    if IMAGE_PATH == "path_to_your_image.jpg":
        print("\n错误: 请配置正确的图片路径")
        exit(1)

    # 执行分析
    print(f"\n开始分析图片: {IMAGE_PATH}")
    analysis_result = analyze_skin(IMAGE_PATH)

    # 输出结果
    print("\n" + "=" * 50)
    print("分析结果:")
    print("=" * 50)

    if "error" in analysis_result:
        print(f"\n❌ 错误: {analysis_result['error']}")

        # 打印调试信息
        if "status_code" in analysis_result:
            print(f"HTTP状态码: {analysis_result['status_code']}")
        if "response_body" in analysis_result:
            print(f"API响应内容:\n{analysis_result['response_body']}")
    else:
        print("\n✅ 请求成功!")
        print(f"请求ID: {analysis_result.get('request_id', '')}")
        print(f"处理时间: {analysis_result.get('time_used', 0)} 毫秒")

        # 保存完整结果
        try:
            with open('skin_analysis_full.json', 'w', encoding='utf-8') as f:
                json.dump(analysis_result.get('full_response', {}), f, ensure_ascii=False, indent=2)
            print("\n完整结果已保存到 skin_analysis_full.json")
        except Exception as e:
            print(f"保存完整结果失败: {str(e)}")
    if "error" not in analysis_result:
        result_data = analysis_result.get('result', {})
        report = translate_skin_analysis(result_data)
        print(report)
    # 保存报告到文本文件
    report_filename = 'skin_analysis_report.txt'
    try:
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"\n肤质分析报告已保存到 {report_filename}")
    except Exception as e:
        print(f"保存报告失败: {str(e)}")