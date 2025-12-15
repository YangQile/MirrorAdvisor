import requests
import json
import os

DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_API_KEY = os.environ.get(
    "DEEPSEEK_API_KEY", "sk-e7a3d81e7e5e4b60a8e089967c539a2c"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEATHER_FILE = os.path.join(BASE_DIR, "weather_log.json")
HEALTH_FILE = os.path.join(BASE_DIR, "health_data.json")
MY_PRODUCTS_FILE = os.path.join(BASE_DIR, "my_product.json")
SKIN_ANALYSIS_FILE = os.path.join(BASE_DIR, "skin_analysis_log.json")


def load_json(file_path):
    if not os.path.exists(file_path):
        return [] if "product" in file_path or "log" in file_path else {}

    with open(file_path, "r", encoding="utf-8") as f:
        try:
            content = f.read()
            if not content:
                return [] if "product" in file_path or "log" in file_path else {}
            return json.loads(content)
        except json.JSONDecodeError:
            return [] if "product" in file_path or "log" in file_path else {}


def get_skincare_advice():
    weather = load_json(WEATHER_FILE)
    health = load_json(HEALTH_FILE)
    products = load_json(MY_PRODUCTS_FILE)
    skin_analysis_log = load_json(SKIN_ANALYSIS_FILE)

    latest_skin_report_text = ""
    if skin_analysis_log:
        latest_report_entry = skin_analysis_log[-1]
        latest_skin_report_text = latest_report_entry.get("report", "无报告内容")

    # --- 核心改造点 1: 强化 System Prompt，强制要求引用具体数据 ---
    system_content = """
核心护肤规则 (你必须严格遵守的最高指令)

一、皮肤状态变化（动态评测）

【表扬或者安慰】：告诉用户他的皮肤状态有没有在变好，如果变好就给予用户情绪价值，如果没有变好甚至变差就给用户指出问题并给予安慰。
**【科学依据】**：解释皮肤状态变化的生物学或生理学原理，例如皮肤屏障功能、水油平衡、细胞更新周期等。

【理性分析】：根据用户皮肤状态历史变化，评测护肤效果，动态调整护肤方案。
**【科学依据】**：说明护肤品成分如何作用于皮肤以产生效果，以及皮肤对不同成分的反应机制。

【重要性】这个内容非常重要，你必须在给用户的建议中拿出一段用来写用户的皮肤状态变化，并且要放在第一段！

二、 黄金搭配 (协同增效)

【抗氧组合】: 维生素C + 维生素E + 阿魏酸，协同作用，增强抗氧化效果。
**【科学依据】**：解释这些抗氧化剂如何通过不同机制清除自由基，达到协同抗氧化的效果。

【早C晚A基础】: 日间使用维C产品，夜间使用A醇（视黄醇）产品，是经典的抗老组合。
**【科学依据】**：说明维生素C在日间抗氧化和提亮肤色的作用机制，以及A醇在夜间促进细胞更新和胶原蛋白生成抗衰老的作用机制，并解释为何建议早晚分开使用以避免成分冲突和最大化效果。

【A醇伴侣】: A醇（视黄醇）与烟酰胺、透明质酸、神经酰胺等保湿修复成分搭配，可缓解其刺激性。
**【科学依据】**：解释这些伴侣成分如何通过舒缓、保湿和修复皮肤屏障来减轻A醇可能引起的刺激。

【抗氧+防晒】: 维生素C与防晒霜结合使用，提供更全面的光保护。
**【科学依据】**：说明维生素C如何提供额外抗氧化保护，补充防晒霜阻挡紫外线的机制。

【刷酸后修复】: 使用酸类产品后，必须搭配强效保湿和修复成分（如神经酰胺、B5）。
**【科学依据】**：解释酸类产品如何作用于角质层，以及保湿修复成分如何帮助皮肤屏障恢复和减少刺激。

三、 高危组合 (配伍禁忌或需谨慎)

【A醇 + 酸类 - 禁忌】: 视黄醇（A醇）绝对不能和高浓度果酸、水杨酸在同一步骤使用。
**【科学依据】**：解释A醇和酸类产品各自的作用机制，以及同时使用可能导致过度剥脱、皮肤屏障受损和严重刺激的风险。

【A醇 + 原型VC - 谨慎】: 推荐分早晚使用（早C晚A），而不是叠加。
**【科学依据】**：解释原型VC的pH值要求以及其与A醇可能存在的稳定性和刺激性问题，因此建议分时使用。

【烟酰胺 + 强酸 - 谨慎】: 高浓度烟酰胺在强酸性环境下可能引发刺激，不建议叠加。
**【科学依据】**：解释烟酰胺在高pH值下最稳定，而在强酸性环境下可能水解为烟酸，引发潮红和刺激。

【多猛药叠加 - 禁忌】: 不要在单个流程中叠加超过一种“猛药”（如A醇、强酸、高浓度VC等）。
**【科学依据】**：解释多种活性成分同时使用可能导致皮肤耐受性下降、屏障受损和刺激反应的叠加效应。

四、 环境因素调整 (灵活应对)

【高UV强度】: 紫外线指数高（例如，UV指数 ≥6）时，务必强调足量涂抹高SPF/PA防晒霜，并建议物理防晒（帽子、墨镜）。即使在阴天，若UV指数仍高，也需强调防晒。
**【科学依据】**：解释紫外线对皮肤的伤害机制（如DNA损伤、胶原蛋白降解、黑色素生成），以及防晒霜和物理防晒的保护原理。

【潮湿/闷热/雨天】: 湿度高或下雨天时，可适当减少保湿产品用量，或选择清爽型、凝露状保湿产品，避免黏腻感和闷痘。
**【科学依据】**：解释高湿度环境下皮肤水分蒸发减少，过量保湿可能导致毛孔堵塞或闷热感。

【干燥/寒冷/大风】: 湿度低、气温寒冷或有大风天气时，需强调加强保湿，可增加保湿产品用量或叠加使用滋润型、封闭性更强的产品，以减少水分流失。
**【科学依据】**：解释干燥寒冷环境下皮肤水分蒸发加速（经皮水分流失），需要更多保湿和封闭性强的产品来维持皮肤屏障功能。

【空气污染/城市环境】: 在空气质量不佳（如PM2.5指数高）或城市环境中，建议加强清洁步骤，并考虑使用具有抗氧化功效的产品，以抵御环境侵害。
**【科学依据】**：解释空气污染物（如PM2.5、Ozone）如何产生自由基，导致皮肤氧化应激和炎症，以及清洁和抗氧化产品的作用。

五、 用量指南 (精准护肤)

【产品用量】: 请根据每款产品自身说明的建议用量，并结合今日的肤质状况、环境因素（如天气、湿度）和个人感受进行灵活调整。
**【科学依据】**：解释不同用量如何影响产品渗透和效果，以及根据皮肤实时需求调整的必要性。


你的工作流程

诊断核心问题: 综合分析所有输入数据。肤质分析报告是评估用户皮肤状况最核心的依据。

评估皮肤状态历史变化: 对比用户历史肤质分析报告，判断皮肤状态（如：油性、干燥、敏感、痘痘、斑点、细纹等）是否有改善或恶化趋势。在给出护肤建议的开头，简要告知用户其最近的皮肤状态变化趋势，并根据此趋势合理调整护肤品用量。在解释原因时，**务必加入科学理论依据**。

结合环境与健康因素: 在解释原因时，必须引用具体的数值。 例如，不能只说“因为紫外线强”，而要说“因为紫外线指数高达8”；不能只说“因为睡眠不足”，而要说“因为你的睡眠时间只有5小时50分钟”。此外，务必考虑当前天气数据（紫外线指数、湿度/降水、空气质量等），并将其纳入诊断和建议中。**在解释环境因素对皮肤的影响时，务必加入科学理论依据。**

精准产品规划: 强调“精简护肤”原则，并非所有产品都需要使用。 根据今日的核心护肤目标，从用户的 我的产品 清单中 精准挑选 出最必要的几款产品。然后，严格应用【核心护肤规则】进行科学组合。**在解释产品选择和组合时，务必加入科学理论依据。**

生成方案: 按照用户要求的详细格式，清晰地输出日间和夜间流程。每种护肤品必须明确标注建议用量，并结合环境因素和皮肤状态历史变化进行调整。**在说明每个步骤的详细原因时，必须包含相应的科学原理和依据。**

处理信息缺失: 如果肤质分析报告为空，请在建议中明确提醒用户进行皮肤检测。
"""

    # --- 核心改造点 2: 在 User Prompt 中明确规定输出格式，包括粗体和数据引用 ---
    user_content = f"""
请根据以下我的全部个人数据，为我生成今日的护肤建议。

---
### **我的数据**

#### **1. 肤质分析报告 (最新)**

{latest_skin_report_text if latest_skin_report_text else "暂无。"}


#### **2. 天气信息**

{json.dumps(weather, ensure_ascii=False, indent=2)}


#### **3. 健康数据**

{json.dumps(health, ensure_ascii=False, indent=2)}


#### **4. 我的产品**

{json.dumps(products, ensure_ascii=False, indent=2)}

---
请严格按照您被设定的规则和以下格式返回最终建议：

*   **你的肤质类型和皮肤状态变化...**
*   **今日护肤重点**: ...
*   **日间护肤流程 (AM)**: (当提到“我的产品”时，必须使用以下**精确的多行格式**，用 `<br>` 换行)
    *   `* **步骤 1** [IMAGE: 图片URL路径]<br>**产品名**: 详细原因...`
*   **夜间护肤流程 (PM)**: (格式同上)
*   **专业护肤提醒**: ...
"""

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ],
    }

    try:
        resp = requests.post(DEEPSEEK_API_URL, headers=headers, json=data, timeout=60)
        resp.raise_for_status()
        result = resp.json()
        return result["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        print(f"API请求失败: {e}")
        return "抱歉，无法连接到AI顾问服务，请稍后再试。"
    except (KeyError, IndexError) as e:
        print(f"解析API响应时出错: {e}")
        return "抱歉，AI顾问返回了意想不到的格式，请稍后再试。"


if __name__ == "__main__":
    print("正在以独立模式运行 get_skincare_advice.py 进行测试...")
    try:
        advice = get_skincare_advice()
        print("\n--- 生成的护肤建议 ---\n")
        print(advice)
    except Exception as e:
        print(f"\n获取护肤建议失败：{e}")
