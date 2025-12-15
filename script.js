document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    // ===== 1. 元素获取 (集中管理所有需要的元素) =====
    // ===================================================================
    // --- 新UI导航元素 ---
    const views = document.querySelectorAll('.view');
    const btnProductLibrary = document.getElementById('btn-product-library');
    const btnHealthData = document.getElementById('btn-health-data');
    const btnSkinAnalysis = document.getElementById('btn-skin-analysis');
    const backButtons = document.querySelectorAll('.back-btn');

    // --- 天气 UI ---
    const tempValue = document.getElementById('temp-value');
    const weatherDesc = document.getElementById('weather-desc');
    const humidityValue = document.getElementById('humidity-value');
    const uvGauge = document.getElementById('uv-gauge');
    const uvLevel = document.getElementById('uv-level');
    const uvProtectionLevel = document.getElementById('uv-protection-level');

    // --- 原始脚本中的元素 (全部保留) ---
    const categoryItems = document.querySelectorAll('.category-item');
    const productGrid = document.getElementById('product-list');
    const customContextMenu = document.getElementById('custom-context-menu');
    const contextMenuItem = document.getElementById('add-to-my-products');
    const cameraArea = document.getElementById('camera-area');
    const startScanBtn = document.getElementById('start-scan-btn');
    const stopScanBtn = document.getElementById('stop-scan-btn');
    const cameraPlaceholder = document.querySelector('.camera-placeholder');
    const scanResultDiv = document.getElementById('scan-result');
    const skinAnalysisArea = document.getElementById('skin-analysis-area');
    const cameraContainer = document.getElementById('camera-container');
    const liveVideo = document.getElementById('live-video');
    const captureCanvas = document.getElementById('capture-canvas');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const analysisResultContainer = document.getElementById('analysis-result-container');
    const analysisResultDisplay = document.getElementById('analysis-result-display');
    const loader = document.getElementById('loader');
    const startCameraBtn = document.getElementById('start-camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const retakeAnalyzeGroup = document.getElementById('retake-analyze-group');
    const retakeBtn = document.getElementById('retake-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const welcomeContainer = document.getElementById('welcome-container');
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const historyModalClose = document.querySelector('.history-modal-close');
    const historyList = document.getElementById('history-list');


    // ===================================================================
    // ===== 2. 全局变量 (来自原始脚本) =====
    // ===================================================================
    let skinCameraStream = null;
    let isQuaggaRunning = false;
    let scanStream = null;
    let scanTimeout = null;
    let barcodeDetectedInSession = false;
    let myProducts = JSON.parse(localStorage.getItem('myProducts')) || [];
    let currentRightClickedProduct = null;
    let myChart = null;

    // 产品数据 (保持不变)
    const allProducts = [
        {
            id: 1,
            name: "至本舒颜修护洁面乳",
            category: "cleanser",
            ImageUrl: "Images/至本舒颜修护洁面乳.jpg",
            ingredients: "氨基酸表活、神经酰胺、胆固醇、脂肪酸、舒缓植物提取物。",
            efficacy: "温和清洁，修护肌肤屏障，舒缓泛红敏感，平衡水油，不紧绷，不拔干。",
            usage: "取适量于掌心，加水揉搓起泡后，涂抹于湿润面部，轻柔打圈按摩，然后用清水彻底冲洗。",
            applicableSkinTypes: "多种肤质，干性肤质，敏感肌。",
            barcode: "5056561800363",
        },
        {
            id: 2,
            name: "欧莱雅男士专用氨基酸洗面奶",
            category: "cleanser",
            ImageUrl: "Images/欧莱雅男士专用氨基酸洗面奶.webp",
            ingredients: "氨基酸类表面活性剂、可能含有控油成分（如高岭土、锌盐）、保湿成分（如甘油）。",
            efficacy: "控油去油，深层清洁，温和清爽保湿。",
            usage: "湿润面部后，挤出适量于手心，加水揉搓出泡沫，均匀涂抹于面部并按摩，再用清水洗净。",
            applicableSkinTypes: "男士，油性及混合性肌肤。",
            barcode: "5056561803340",
        },
        {
            id: 3,
            name: "芙丽芳丝氨基酸洗面奶",
            category: "cleanser",
            ImageUrl: "Images/芙丽芳丝氨基酸洗面奶.png",
            ingredients: "椰油酰甘氨酸钾（氨基酸系表面活性剂）、甘油、丁二醇、枣果提取物、日本川芎根提取物、温州蜜柑果皮提取物、光果干草叶提取物、川谷籽提取物、桃核仁提取物。",
            efficacy: "弱酸性，温和洗净，仅带走多余油脂、洗去脸部脏污，洗后保留足够水分，保湿性高，不刺激、不乾涩、不熏眼，彻底清洁毛孔脏污。",
            usage: "取适量于掌心，加水揉搓出丰富泡沫，涂抹于面部，轻柔按摩后用清水洗净。",
            applicableSkinTypes: "所有肤质，包括干性、油性、敏感肌和痘痘肌，尤其适合容易受到刺激的敏感肌。",
            barcode: "6928804011173",
        },
        {
            id: 4,
            name: "香奈儿山茶花泡沫保湿洁面乳",
            category: "cleanser",
            ImageUrl: "Images/香奈儿山茶花泡沫保湿洁面乳.png",
            ingredients: "山茶神经酰胺、山茶花水、硬脂酸、棕榈酸、月桂酸、氢氧化钾、甲基椰油酰基牛磺酸钠、椰油酰羟乙基磺酸钠、月桂酰乳酰乳酸钠。",
            efficacy: "丰润乳霜质地，深彻清洁，洗去肌肤表面杂质、防晒及残留彩妆痕迹，润泽肌肤，长效锁水保湿，持久维护肌肤屏障，洁净、舒适、柔滑，透出清新光采。",
            usage: "每日早晚使用。取少量洁面乳于手心，沾水揉搓出泡沫，涂抹于脸部，先用指腹由内向外小幅划圈按摩，再用整个手掌大幅划圈按摩脸颊、前额和下巴。用清水彻底冲洗，并用干净毛巾拭干肌肤。注意：请避开眼周。如不慎入眼，立即用清水冲洗。",
            applicableSkinTypes: "敏感肌适用。",
            barcode: "",
        },

        // 卸妆产品 (makeup_remover) - 4个
        {
            id: 5,
            name: "至本舒颜修护卸妆膏",
            category: "makeup_remover",
            ImageUrl: "Images/至本舒颜修护卸妆膏.png",
            ingredients: "植物油（如橄榄油、霍霍巴籽油）、乳化剂、神经酰胺、胆固醇、脂肪酸、舒缓保湿剂（如红没药醇、泛醇）。",
            efficacy: "温和卸妆，深层清洁，乳化迅速，滋润保湿，不假滑，不紧绷，洗卸合一，不闷痘，修护肌肤屏障。",
            usage: "保持手部干燥，取适量卸妆膏涂抹于干燥面部，轻轻打圈按摩，待彩妆充分溶解后，加少量水乳化成乳白色，继续按摩，最后用清水彻底冲洗干净。",
            applicableSkinTypes: "所有肤质，尤其是敏感肌、干性肌、痘痘肌和需要温和卸妆的人群。",
            barcode: "",
        },
        {
            id: 6,
            name: "半亩花田油橄榄卸妆膏",
            category: "makeup_remover",
            ImageUrl: "Images/半亩花田油橄榄卸妆膏.png",
            ingredients: "油橄榄果油、乳化剂（如PEG-20三异硬脂酸酯）、保湿成分。",
            efficacy: "深层清洁，有效卸除顽固彩妆（包括防水彩妆），同时滋润肌肤，卸妆后不拔干，不紧绷。",
            usage: "取适量卸妆膏于干燥手心，用掌心温度乳化后均匀涂抹于面部，轻柔打圈按摩，待彩妆溶解后加少量水继续乳化，最后用清水彻底冲洗干净。",
            applicableSkinTypes: "多种肤质，尤其适合需要深层卸妆、注重卸妆后滋润感的肌肤。",
            barcode: "",
        },
        {
            id: 7,
            name: "娜斯丽经典柚子卸妆乳",
            category: "makeup_remover",
            ImageUrl: "Images/娜斯丽经典柚子卸妆乳.png",
            ingredients: "非离子表面活性剂/植物油、柚子果提取物、柚子籽提取物、柚子皮油、保湿成分（如甘油、透明质酸钠）。",
            efficacy: "温和清洁，有效卸除日常彩妆和污垢，质地清爽不油腻，卸妆同时散发清新柚子香气。",
            usage: "取适量卸妆乳于掌心，均匀涂抹于面部，轻柔按摩使彩妆溶解，然后用清水或化妆棉擦拭干净。",
            applicableSkinTypes: "多种肤质，尤其适合日常淡妆、混合性及油性肌肤。",
            barcode: "",
        },
        {
            id: 8,
            name: "贝德玛卸妆水",
            category: "makeup_remover",
            ImageUrl: "Images/贝德玛卸妆水.jpg",
            ingredients: "胶束（Micelle）洁肤配方、天然糖类混合物（如甘露醇、木糖醇）、特定脂肪酸酯；绿水版本额外含葡萄糖酸锌、硫酸铜。",
            efficacy: "温和清洁，卸除面部及眼部彩妆污垢，无需水洗，保持肌肤水润不紧绷，舒缓肌肤，提升肌肤耐受性。",
            usage: "将卸妆水倒在化妆棉上，轻轻擦拭面部、眼部和唇部，直至化妆棉干净，无需再用水冲洗。",
            applicableSkinTypes: "敏感肌、干性肌，以及日常淡妆和无妆清洁需求者。",
            barcode: "",
        },

        // 爽肤水/化妆水 (toner) - 4个
        {
            id: 9,
            name: "欧莱雅男士水凝露爽肤水",
            category: "toner",
            ImageUrl: "Images/欧莱雅男士水凝露爽肤水.png",
            ingredients: "甘油、酒精（乙醇）、薄荷提取物、水杨酸（部分版本可能含）。",
            efficacy: "为男士肌肤提供即时补水，改善干燥紧绷感，清爽不黏腻，有助于收敛毛孔，为后续护肤打底。",
            usage: "洁面后取适量爽肤水倒于掌心或化妆棉上，轻拍或擦拭于面部，直至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合男士干燥、混合性或油性肌肤。",
            barcode: "",
        },
        {
            id: 10,
            name: "hfp金盏花爽肤水",
            category: "toner",
            ImageUrl: "Images/hfp金盏花爽肤水.png",
            ingredients: "金盏花提取物、甘油、丁二醇。",
            efficacy: "舒缓修护，平衡水油，改善痘痘和闭口，有助于镇静肌肤，清爽保湿。",
            usage: "洁面后取适量爽肤水倒于掌心或化妆棉上，轻拍或擦拭于面部，尤其针对痘痘或泛红区域可湿敷。",
            applicableSkinTypes: "多种肤质，尤其适合油性、混合性、痘痘肌和敏感肌。",
            barcode: "",
        },
        {
            id: 11,
            name: "兰蔻小黑瓶滤镜水",
            category: "toner",
            ImageUrl: "Images/兰蔻小黑瓶滤镜水.png",
            ingredients: "二裂酵母发酵产物溶胞产物、乙醇、羟乙基哌嗪乙烷磺酸、透明质酸钠、维生素C衍生物。",
            efficacy: "维稳修护肌肤，改善细纹和粗糙，提升肌肤光泽度，强化肌肤屏障，长效保湿及提亮肤质，帮助肌肤开路、促进后续保养吸收。",
            usage: "作为一般精华液使用：化妆水之后，取两管用量擦于全脸，由下往上，从下巴到额头，由内而外按摩，最后按压脖子。作为前导精华使用：先擦小黑瓶，后续再搭配其他精华使用。混合化妆水湿敷：洗完脸后，取两管小黑瓶与适量的化妆水混合，充分浸湿化妆棉，湿敷3-5分钟，每周1-2次。混合底妆使用：将底妆与小黑瓶按1:1比例混合，增加底妆服贴度、透亮感和光泽感。补妆前加强保湿：补妆前取一管小黑瓶用量按摩全脸，针对鼻翼、两颊或法令纹等易出现细纹、干涩处加强保湿。",
            applicableSkinTypes: "追求肌肤细致平滑的初老族群，因压力或环境影响导致肤色暗沉、疲劳的肌肤，需要长效保湿及提亮肤色的人群。适合所有肤质，包括干性、油性、混合性和敏感性肌肤。",
            barcode: "",
        },
        {
            id: 12,
            name: "甘醇酸清洁湿敷水",
            category: "toner",
            ImageUrl: "Images/甘醇酸清洁湿敷水.png",
            ingredients: "甘醇酸（7%）、氨基酸类（精氨酸）、芦荟提取物、人参根提取物、塔斯马尼亚胡椒莓果/叶提取物。",
            efficacy: "温和去角质，改善肌肤纹理，提亮肤色，有助于清洁毛孔，促进后续产品吸收。",
            usage: "夜间洁面后，将产品倒在化妆棉上，轻轻擦拭面部和颈部（避开眼周），无需冲洗。初期使用可从每周2-3次开始，建立耐受后可逐渐增加频率。",
            applicableSkinTypes: "多种肤质，尤其适合肤色不均、毛孔粗大、有闭口粉刺和需要温和去角质的人群。不推荐敏感肌或屏障受损肌肤频繁使用。",
            contraindications: "不建议与其他酸类（如水杨酸、视黄醇产品）或高浓度VC产品同时使用，以免过度刺激。白天使用后务必加强防晒。",
            barcode: "",
        },

        // 精华液/原液 (essence) - 4个
        {
            id: 13,
            name: "OLAY玉兰油淡斑小白瓶精华液",
            category: "essence",
            ImageUrl: "Images/OLAY玉兰油淡斑小白瓶精华液.png",
            ingredients: "烟酰胺、十一碳烯酰基苯丙氨酸、甘油、泛醇、抗坏血酸葡糖苷（维C衍生物）。",
            efficacy: "主要针对美白、提亮肤色、淡化暗沉、改善肤色不均、焕发肌肤光采。",
            usage: "洁面爽肤后，取适量精华液（通常为2-3滴）均匀涂抹于面部，轻轻按摩至吸收。建议晚上使用，白天请务必搭配防晒产品。",
            applicableSkinTypes: "适合所有肤质，尤其是有美白、提亮肤色、改善肤色暗沉和不均需求的人群。",
            barcode: "",
        },
        {
            id: 14,
            name: "John Jeff油橄榄精华液",
            category: "essence",
            ImageUrl: "Images/John Jeff油橄榄精华液.png",
            ingredients: "John Jeff油橄榄果提取物、角鲨烷、多种植物油（如向日葵籽油）、甘油、泛醇。",
            efficacy: "舒缓修护，滋润保湿，改善肌肤干燥、粗糙等问题。",
            usage: "洁面爽肤后，取适量精华液涂抹于面部，轻柔按摩至吸收。",
            applicableSkinTypes: "多种肤质适用，尤其适合干燥、敏感或需要舒缓修护的肌肤。",
            barcode: "",
        },

        {
            id: 15,
            name: "至本特安修护肌底精华液",
            category: "essence",
            ImageUrl: "Images/至本特安修护肌底精华液.png",
            ingredients: "神经酰胺、胆固醇、脂肪酸、泛醇、多种植物提取物。",
            efficacy: "修护肌肤屏障，舒缓肌肤不适，缓解干燥敏感，提升肌肤稳定性和健康状态。",
            usage: "取适量精华液，轻柔地涂抹于脸部和颈部肌肤，轻轻按摩至吸收。",
            applicableSkinTypes: "多种肤质适用，尤其适合敏感肌、脆弱肌或需要修复屏障的肌肤。",
            barcode: "",
        },
        {
            id: 16,
            name: "欧莱雅黑精华紧致抗老面部精华液",
            category: "essence",
            ImageUrl: "Images/欧莱雅黑精华紧致抗老面部精华液.png",
            ingredients: "二裂酵母发酵产物溶胞产物、腺苷、水杨酰植物鞘氨醇、透明质酸。",
            efficacy: "紧致肌肤，抗击初老，改善细纹、粗糙等老化迹象，提升肌肤光泽和弹性。",
            usage: "每天洁面及使用爽肤水后，取适量精华液涂抹于面部和颈部肌肤，轻轻拍打，帮助吸收。",
            applicableSkinTypes: "多种肤质适用，尤其适合需要抗初老、改善肌肤弹性和光泽的肌肤。",
            barcode: "",
        },

        // 乳液/面霜 (lotion_cream) - 4个
        {
            id: 17,
            name: "欧莱雅男士面霜补水保湿面霜",
            category: "lotion_cream",
            ImageUrl: "Images/欧莱雅男士面霜补水保湿面霜.png",
            ingredients: "甘油、透明质酸、多种矿物质（如镁、钙）。",
            efficacy: "深层补水，长效保湿，改善男士肌肤干燥、紧绷，保持水润活力。",
            usage: "洁面爽肤后，取适量面霜均匀涂抹于面部和颈部肌肤，轻柔按摩至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合男士干燥、缺水肌肤。",
            barcode: "",
        },
        {
            id: 18,
            name: "自然堂男士冰川露补水保湿霜",
            category: "lotion_cream",
            ImageUrl: "Images/自然堂男士冰川露补水保湿霜.png",
            ingredients: "喜马拉雅冰川水、甘油、丁二醇、矿物成分。",
            efficacy: "快速补水，清爽不黏腻，改善油光和粗糙，赋予肌肤冰凉舒适感。",
            usage: "洁面爽肤后，取适量保湿霜涂抹于面部，轻拍至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合男士油性、混合性及需清爽保湿的肌肤。",
            barcode: "",
        },
        {
            id: 19,
            name: "大宝SOD蜜补水保湿乳液",
            category: "lotion_cream",
            ImageUrl: "Images/大宝SOD蜜补水保湿乳液.png",
            ingredients: "超氧化物歧化酶（SOD）、甘油、矿油、羊毛脂。",
            efficacy: "经典保湿，滋润肌肤，改善干燥，令肌肤柔润光滑。",
            usage: "洁面后，取适量乳液均匀涂抹于面部及身体肌肤，轻柔按摩至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合日常基础保湿，干性及中性肌肤。",
            barcode: "",
        },
        {
            id: 20,
            name: "至本舒颜修护乳液",
            category: "lotion_cream",
            ImageUrl: "Images/至本舒颜修护乳液.png",
            ingredients: "神经酰胺、胆固醇、脂肪酸、泛醇、多种植物提取物（如积雪草）。",
            efficacy: "温和修护肌肤屏障，舒缓敏感泛红，深层滋润，改善肌肤干燥紧绷。",
            usage: "洁面爽肤后，取适量乳液均匀涂抹于面部，轻柔按摩至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合敏感肌、受损肌肤或需要舒缓修护的肌肤。",
            barcode: "",
        },
        // 眼部护理 (eye_care) - 4个
        {
            id: 21,
            name: "儒意眼膜贴",
            category: "eye_care",
            ImageUrl: "Images/儒意眼膜贴.png",
            ingredients: "水解胶原、透明质酸钠、甘油、多种植物提取物。",
            efficacy: "密集补水，缓解眼部疲劳，改善眼周干燥细纹，提亮眼周肤色。",
            usage: "洁面后，将眼膜贴敷于眼下区域15-20分钟，取下后轻拍至精华吸收。",
            applicableSkinTypes: "多种肤质，尤其适合眼部干燥、有细纹、疲劳的人群。",
            barcode: "",
        },
        {
            id: 22,
            name: "欧莱雅眼霜紫熨斗眼霜",
            category: "eye_care",
            ImageUrl: "Images/欧莱雅眼霜紫熨斗眼霜.png",
            ingredients: "玻色因、咖啡因、透明质酸、孚玻因（二胜肽）。",
            efficacy: "淡化眼周细纹、干纹，改善眼部松弛，提升眼周紧致度，使眼部肌肤更显年轻。",
            usage: "早晚洁面爽肤后，取米粒大小眼霜，轻柔涂抹于眼周肌肤，并轻轻按摩至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合有眼部细纹、松弛等初老问题的人群。",
            barcode: "",
        },
        {
            id: 23,
            name: "兰蔻菁纯眼霜",
            category: "eye_care",
            ImageUrl: "Images/兰蔻菁纯眼霜.png",
            ingredients: "玫瑰凝萃（大马士革玫瑰精粹、千叶玫瑰凝萃、高卢玫瑰精粹）、玻色因、角鲨烷、神经酰胺。",
            efficacy: "奢润滋养，改善眼周多重老化迹象，如细纹、皱纹、松弛、黑眼圈，令眼部肌肤紧致饱满、光采焕活。",
            usage: "早晚洁面爽肤后，取适量眼霜，以无名指轻点于眼周肌肤，由内向外轻柔涂抹并按摩至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合有较高抗老需求，眼周有明显老化迹象的人群。",
            barcode: "",
        },
        {
            id: 24,
            name: "雅诗兰黛第五代小棕瓶熬夜眼霜",
            category: "eye_care",
            ImageUrl: "Images/雅诗兰黛第五代小棕瓶熬夜眼霜.jpg",
            ingredients: "二裂酵母发酵产物溶胞产物、透明质酸钠、咖啡因、三肽-32。",
            efficacy: "修护熬夜损伤，改善黑眼圈、浮肿和干燥，强化眼周防御力，令双眸焕亮有神。",
            usage: "早晚洁面爽肤后，取适量眼霜，轻柔点涂于眼周肌肤，由内向外打圈按摩至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合经常熬夜、有黑眼圈、眼周疲惫暗沉的人群。",
            barcode: "",
        },
        // 面膜 (mask)
        {
            id: 25,
            name: "CHANEL 香奈儿奢华精萃焕活面膜",
            category: "mask",
            ImageUrl: "Images/CHANEL 香奈儿奢华精萃焕活面膜.png",
            ingredients: "五月香草荚果提取物、浓缩活性水、乳木果油、甘油。",
            efficacy: "密集修护，滋养焕活，改善肌肤疲惫、暗沉，提升肌肤弹性和光泽，重塑年轻紧致轮廓。",
            usage: "每周使用1-2次，洁面后取适量涂抹于面部，避开眼周，静置10-15分钟后用清水洗净。",
            applicableSkinTypes: "多种肤质，尤其适合有抗老需求、需要密集修护和提亮肤色的人群。",
            barcode: "",
        },
        {
            id: 26,
            name: "科兰黎嫩白金珠面膜",
            category: "mask",
            ImageUrl: "Images/科兰黎嫩白金珠面膜.png",
            ingredients: "烟酰胺、维生素C衍生物、传明酸、甘油、丁二醇等保湿剂等",
            efficacy: "均匀肤色，淡化瑕疵，提亮肌肤光泽，使肌肤更显白皙透亮。",
            usage: "洁面后取适量涂抹于面部，静置15-20分钟后洗净。",
            applicableSkinTypes: "多种肤质，尤其适合有美白、提亮肤色需求的人群。",
            barcode: "",
        },
        {
            id: 27,
            name: "自然堂烟酰胺细致美白安瓶面膜",
            category: "mask",
            ImageUrl: "Images/自然堂烟酰胺细致美白安瓶面膜.png",
            ingredients: "烟酰胺、甘油、透明质酸钠、烟酰胺。",
            efficacy: "深层补水，细致毛孔，提亮肤色，改善暗沉，使肌肤水润透亮。",
            usage: "洁面后敷于面部15-20分钟，取下后轻拍精华至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合需要补水、美白和改善毛孔粗大的人群。",
            barcode: "",
        },
        {
            id: 28,
            name: "谷雨精华奶皮面膜",
            category: "mask",
            ImageUrl: "Images/谷雨精华奶皮面膜.png",
            ingredients: "水、甘油、丁二醇、乳蛋白提取物（牛奶蛋白）、多种植物提取物。",
            efficacy: "滋润保湿，舒缓修护，改善肌肤干燥、粗糙，使肌肤柔软细腻。",
            usage: "洁面后敷于面部15-20分钟，取下后轻拍精华至吸收。",
            applicableSkinTypes: "多种肤质，尤其适合干燥、敏感或需要滋润修护的肌肤。",
            barcode: "",
        },

        // 防晒产品 (sunscreen)
        {
            id: 29,
            name: "安热沙小金瓶通勤防晒霜",
            category: "sunscreen",
            ImageUrl: "Images/安热沙小金瓶通勤防晒霜.png",
            ingredients: "多种防晒剂（如氧化锌、二氧化钛、桂皮酸盐、Uvinul A Plus、Tinosorb S）、透明质酸钠、胶原蛋白。",
            efficacy: "高倍防晒，有效抵御UVA/UVB，防水防汗，适合日常通勤及户外活动。",
            usage: "外出前15-20分钟取足量均匀涂抹于面部和身体暴露部位，必要时补涂。",
            applicableSkinTypes: "多种肤质，尤其适合日常通勤、户外活动使用。",
            barcode: "",
        },
        {
            id: 30,
            name: "欧莱雅男士美白防晒霜",
            category: "sunscreen",
            ImageUrl: "Images/欧莱雅男士美白防晒霜.png",
            ingredients: "多种防晒剂（如Mexoryl XL, Mexoryl SX）、维生素C衍生物（抗坏血酸葡糖苷）、甘油。",
            efficacy: "有效防晒，同时改善男士肌肤暗沉，提亮肤色，清爽不油腻。",
            usage: "外出前取适量均匀涂抹于面部，必要时补涂。",
            applicableSkinTypes: "多种肤质，尤其适合男士日常防晒及有美白需求的人群。",
            barcode: "",
        },
        {
            id: 31,
            name: "哈恩高倍防晒霜",
            category: "sunscreen",
            ImageUrl: "Images/哈恩高倍防晒霜.png",
            ingredients: "（多种防晒剂（如Uvinul A Plus、Tinosorb S、阿伏苯宗、奥克立林）、甘油、丁二醇。",
            efficacy: "提供强效UVA/UVB防护，质地清爽，不易闷痘，适合长时间户外活动。",
            usage: "外出前20分钟取足量均匀涂抹于面部和身体暴露部位，长时间户外活动需定时补涂。",
            applicableSkinTypes: "多种肤质，尤其适合户外运动、军训等长时间暴露在阳光下的人群。",
            barcode: "",
        },
        {
            id: 32,
            name: "奥札上山下海防晒霜",
            category: "sunscreen",
            ImageUrl: "Images/奥札上山下海防晒霜.png",
            ingredients: "多种防晒剂（如氧化锌、二氧化钛、Tinosorb M、Uvinul A Plus）、聚二甲基硅氧烷、成膜剂。",
            efficacy: "强效防晒，适用于严酷户外环境，防水防汗，持久防护。",
            usage: "进行水上或高强度户外活动前取足量均匀涂抹，并根据出汗量或接触水的情况及时补涂。",
            applicableSkinTypes: "多种肤质，尤其适合水上运动、登山、徒步等高强度户外活动使用。",
            barcode: "",
        },

        // 唇部护理 (lip_care)
        {
            id: 33,
            name: "Dior迪奥变色润唇膏",
            category: "lip_care",
            ImageUrl: "Images/Dior迪奥变色润唇膏.png",
            ingredients: "蜂蜡、向日葵籽油、芒果籽油、乳木果油、特定色素（遇pH值变色）。",
            efficacy: "滋润保湿，修护唇部干裂，根据唇部PH值自然变色，提升气色。",
            usage: "可单独使用或作为口红打底，随时涂抹于唇部。",
            applicableSkinTypes: "所有肤质，尤其适合唇部干燥、需要滋润和提升自然气色的人群。",
            barcode: "",
        },
        {
            id: 34,
            name: "卡姿兰唇部精华口红",
            category: "lip_care",
            ImageUrl: "Images/卡姿兰唇部精华口红.png",
            ingredients: "多种植物油（如霍霍巴籽油、澳洲坚果油）、维生素E、色素。",
            efficacy: "滋润修护唇部，同时赋予唇部色彩，集润唇和口红功效于一体。",
            usage: "直接涂抹于唇部，可勾勒唇线或填充整个唇部。",
            applicableSkinTypes: "所有肤质，尤其适合唇部干燥、需要滋润和彩妆效果兼顾的人群。",
            barcode: "",
        },
        {
            id: 35,
            name: "YSL圣罗兰小金条口红",
            category: "lip_care",
            ImageUrl: "Images/YSL圣罗兰小金条口红.png",
            ingredients: "多种蜡（如小烛树蜡、巴西棕榈蜡）、植物油（如角鲨烷）、色素。",
            efficacy: "高饱和显色，持久不脱色，哑光质感，打造高级唇妆。",
            usage: "直接涂抹于唇部，可勾勒唇线或填充整个唇部。",
            applicableSkinTypes: "所有肤质，尤其适合追求高显色度和持久妆效的人群。",
            barcode: "",
        },
        {
            id: 36,
            name: "CHANEL 香奈儿男士护唇膏",
            category: "lip_care",
            ImageUrl: "Images/CHANEL 香奈儿男士护唇膏.png",
            ingredients: "霍霍巴籽油、乳木果油、蜂蜡、维生素E。",
            efficacy: "滋润修护男士唇部，改善干燥粗糙，哑光无色，自然不显突兀。",
            usage: "随时涂抹于唇部，可缓解唇部不适。",
            applicableSkinTypes: "所有肤质，尤其适合男士唇部日常护理，改善干燥。",
            barcode: "",
        },
        {
            id: 37,
            name: "曼秀雷敦冰川爽肤水",
            category: "toner",
            ImageUrl: "Images/曼秀雷敦冰川爽肤水.png",
            ingredients: "纳米冰川水、透明质酸、薄荷、三重极地植物保湿精华、微米级劲炭、医药级活炭。",
            efficacy: "长效控油，减少油光；纳米冰川水搭配透明质酸等，深层补水保湿，提升肌肤弹性。薄荷带来冰爽感，舒缓剃须后不适。收细毛孔，促进后续产品吸收。",
            usage: "早晚洁面或剃须后，取适量轻拍于面部和颈部（避开眼周）。",
            applicableSkinTypes: "适合多种肤质，尤其适合油性及混合性肤质，也适用于剃须后护理。",
            barcode: "6917246015382",
        },
        {
            id: 38,
            name: "欧莱雅男士耀白补水面膜",
            category: "mask",
            ImageUrl: "Images/欧莱雅男士耀白补水面膜.png",
            ingredients: "烟酰胺、透明质酸、维生素 C 衍生物、冰川矿物水、法国松树提取物。",
            efficacy: "烟酰胺搭配维生素 C 衍生物，提亮肤色，改善暗沉；透明质酸与冰川矿物水深层补水，缓解干燥；法国松树提取物增强肌肤屏障，减少外界刺激。膜布贴合面部，快速渗透，让肌肤水润透亮。",
            usage: "洁面后，取出面膜敷于面部（避开眼周），轻轻按压使其贴合肌肤，静待 15-20 分钟后取下，剩余精华液轻拍至吸收即可，建议每周使用 2-3 次。",
            applicableSkinTypes: "适合多种肤质，尤其适合暗沉、缺水肤质，对肤色不均的男士也有较好的改善效果。",
            barcode: "6941594508159",
        },
        {
            id: 39,
            name: "欧莱雅男士耀白净油洗面奶",
            category: "cleanser",
            ImageUrl: "Images/欧莱雅男士耀白净油洗面奶.png",
            ingredients: "水杨酸、烟酰胺、PCA 锌、氨基酸表活、法国葡萄籽提取物、冰川矿物质。",
            efficacy: "水杨酸深入清洁毛孔，带走油脂及老废角质，减少黑头；PCA 锌调节油脂分泌，长效控油不紧绷；烟酰胺搭配法国葡萄籽提取物，提亮肤色，改善暗沉；氨基酸表活温和清洁，兼顾清洁力与温和度，洗后清爽舒适。",
            usage: "早晚取适量于掌心，加少量清水揉搓起泡后，轻柔按摩面部（避开眼周）30-60 秒，再用清水彻底冲洗干净。",
            applicableSkinTypes: "适合多种肤质，尤其适合油性、混合性及暗沉肤质，对油脂旺盛、肤色不均的男士尤为适用。",
            barcode: "6941594507282",
        },
        {
            id: 40,
            name: "薇诺娜清透防晒乳",
            category: "sunscreen",
            ImageUrl: "Images/薇诺娜清透防晒乳.png",
            ingredients: "多种防晒剂（如甲氧基肉桂酸乙基己酯、氧化锌、二氧化钛）、马齿苋提取物、透明质酸钠。",
            efficacy: "温和防晒，有效阻隔 UVA/UVB，质地清透不油腻，舒缓肌肤，适合日常通勤及敏感肌使用。",
            usage: "外出前 20-30 分钟取适量均匀涂抹于面部及颈部等暴露部位，长时间户外活动建议 2-3 小时补涂一次。",
            applicableSkinTypes: "多种肤质，尤其适合敏感肌、痘痘肌日常通勤使用。",
            barcode: "6958717871434",
        },
        {
            id: 41,
            name: "薇娜娜舒敏保湿特护精华水",
            category: "essence",
            ImageUrl: "Images/薇娜娜舒敏保湿特护精华水.png",
            ingredients: "马齿苋精粹、青刺果精粹、角鲨烷、甘油、透明质酸钠、依克多因",
            efficacy: "马齿苋镇静肌肤，缓解泛红刺痛；青刺果精粹修护皮肤屏障；多重成分协同补水锁水，依克多因增强肌肤抵抗力。",
            usage: "早晚洁面后取适量轻拍面部至吸收，可单独使用或作为打底。敏感时可湿敷 5 分钟急救。",
            applicableSkinTypes: "适合敏感肌、干皮及换季不稳定肌肤。",
            barcode: "6958717848665",
        },
        {
            id: 42,
            name: "薇诺娜舒敏保湿特护霜",
            category: "lotion_cream",
            ImageUrl: "Images/薇诺娜舒敏保湿特护霜.png",
            ingredients: "青刺果油、双分子透明质酸钠、蘑菇葡聚糖、马齿苋提取物、甘油、1,2 - 戊二醇等",
            efficacy: "青刺果油协同双分子透明质酸钠，构建三重立体保湿网络，调节水脂膜平衡，补水锁水，修护皮肤屏障；蘑菇葡聚糖与马齿苋提取物舒缓肌肤，减轻不适，降低外界刺激。",
            usage: "早晚洁面、爽肤后，取适量均匀轻拍于面部及颈部，避开眼周，轻轻按摩至吸收。搭配薇诺娜舒敏保湿系列其他产品，效果更佳。",
            applicableSkinTypes: "适用于高敏感性肌肤特护，也适合一般敏感性肌肤与中干性肌肤。",
            barcode: "6958717843349",
        },
        {
            id: 43,
            name: "薇诺娜屏障修护乳霜面膜",
            category: "mask",
            ImageUrl: "Images/薇诺娜屏障修护乳霜面膜.png",
            ingredients: "神经酰胺、青刺果油、胆甾醇、马齿苋提取物、人体同源重组胶原蛋白、银耳子实体提取物、透明质酸钠",
            efficacy: "专研 311 仿生补脂科技，神经酰胺、胆甾醇与青刺果油以 3:1:1 配比，补充肌肤脂质，强力修护并加固增厚受损屏障；马齿苋提取物快速退红，从肌底减轻不适；人体同源重组胶原蛋白外补内促，增强肌底韧性；银耳子实体提取物协同透明质酸钠，辅助保湿锁水，维持肌肤水润 。",
            usage: "洁面后，取出面膜平整贴于面部，静待 15-20 分钟后揭下，轻柔按摩面部，促使滋养成分充分吸收 。搭配薇诺娜屏障修护系列其他产品，效果更优 。",
            applicableSkinTypes: "适用于任何肤质，尤其适合敏感肌、屏障薄弱、脆弱易敏肌肤，光电美容项目后泛红反黑或护肤不当致烂脸的情况也适用 。",
            barcode: "6958717847989",
        },
        {
            id: 44,
            name: "枫香兰舒缓媺肤面膜",
            category: "mask",
            ImageUrl: "Images/枫香兰舒缓媺肤面膜.png",
            ingredients: ":水、甘油、丁二醇、海茴香愈伤组织培养物滤液、精氨酸、凝血酸、四氢甲基密啶羧酸、透明质酸钠、烟酰胺、a-熊果苷、茶叶提取物、光果甘草根提取物、海藻糖、虎杖根提取物、黄苓根提取物、积雪草提取物、粉防己提取物、龙胆根提取物",
            efficacy: "补水保湿,舒缓媺肤,改善肌肤状态,呵护娇媺肌肤,令肌肤焕发青春光彩。",
            usage: "洁面后,将面膜敷于面部,用手指轻压至使其贴紧肌肤静置15-20分钟,取下面膜后轻轻按摩脸部肌肤,让精华完全吸收。",
            applicableSkinTypes: "适用于任何肤质，适用于敏感肌、干燥肌，以及因换季、外界刺激导致肌肤不适的人群。尤其适合敏感肌、屏障薄弱、脆弱易敏肌肤，光电美容项目后泛红反黑或护肤不当致烂脸的情况也适用 。",
            barcode: "6975799996367",
        },
        {
            id: 45,
            name: "柳丝木水感柔护物理防晒乳",
            category: "sunscreen",
            ImageUrl: "Images/柳丝木水感柔护物理防晒乳.png",
            ingredients: "氧化锌、二氧化钛、环五聚二甲基硅氧烷、PEG-9 聚二甲基硅氧乙基聚二甲基硅氧烷、聚二甲基硅氧烷、丁二醇、乙烯基聚二甲基硅氧烷 / 聚甲基硅氧烷倍半硅氧烷交联聚合物、硅石、鲸蜡醇乙基己酸酯、甘油、三乙氧基辛基硅烷、水合硅石、二硬脂二甲铵锂蒙脱石、聚甘油 - 4 异硬脂酸酯、异十六烷、聚甘油 - 3 聚二甲基硅羟乙基聚二甲基硅氧烷、乙基己基甘油、1,2 - 己二醇、氢化聚二甲基硅氧烷、氢氧化铝、氧化钠、红没药醇、柠檬酸三乙酯、香叶天竺葵叶油、牡丹根皮提取物、深海两节荠籽油 、EDTA 二钠",
            efficacy: "采用纯物理防晒原理，氧化锌与二氧化钛在肌肤表面形成防护膜，高效反射 UVA、UVB 紫外线，防晒指数高达 SPF50+、PA++++ ，有力预防肌肤晒黑、晒伤与光老化。添加深海两节荠籽油，深度滋润肌肤，改善干燥起皮现象；牡丹根皮提取物协同红没药醇，舒缓肌肤不适，减轻敏感泛红；香叶天竺葵叶油调节油脂分泌，保持肌肤清爽 。",
            usage: "基础护肤后，外出前 15 分钟使用效果最佳。使用前充分摇匀，取适量均匀涂抹于面部、颈部、胳膊、腿等暴露在阳光下的肌肤部位。",
            applicableSkinTypes: "尤其适合敏感肌肤，同时对油性、混合性、干性等多种肤质均适用 。",
            barcode: "6923651607951",
        },
        {
            id: 46,
            name: "RUYI儒意水杨酸复合焕颜精华液",
            category: "essence",
            ImageUrl: "Images/RUYI儒意水杨酸复合焕颜精华液.png",
            ingredients: "水杨酸、北美金缕梅水、扁桃酸、乳糖酸、壬二酸、烟酰胺、光果甘草根提取物、神经酰胺 NP、透明质酸钠、马齿苋提取物",
            efficacy: "2% 水杨酸深入清洁毛孔，改善黑头、闭口与毛孔粗大；复合酸协同焕亮肤色、淡化痘印；保湿成分缓解刺激，维持肌肤水润。",
            usage: "晚间洁面后取 2-3 滴涂于面部（避开眼周），敏感肌需先建立耐受，使用后注意保湿防晒。",
            applicableSkinTypes: "适合油性、混合性、痘痘肌及暗沉粗糙肌肤，敏感肌慎用。",
            barcode: "6941750029344",
        },
        {
            id: 47,
            name: "一叶子柔嫩细肤面膜",
            category: "mask",
            ImageUrl: "Images/一叶子柔嫩细肤面膜.png",
            ingredients: "烟酰胺、乙酰壳糖胺、红茶发酵产物、多种透明质酸钠、茶叶提取物、马齿苋提取物",
            efficacy: "烟酰胺搭配乙酰壳糖胺，改善粗糙、提亮肤色；多重成分补水滋养，让肌肤柔嫩细滑。",
            usage: "洁面后敷面 15-20 分钟，揭下按摩吸收，每周 1-2 次。",
            applicableSkinTypes: "适合多种肤质，尤其改善粗糙、暗沉肌。",
            barcode: "6971975496904",
        },
        {
            id: 48,
            name: "百雀羚小森羚舒缓盈润面膜",
            category: "mask",
            ImageUrl: "Images/百雀羚小森羚舒缓盈润面膜.png",
            ingredients: ":水、甘油、丁二醇、海茴香愈伤组织培养物滤液、精氨酸、凝血酸、四氢甲基密啶羧酸、透明质酸钠、烟酰胺、a-熊果苷、茶叶提取物、光果甘草根提取物、海藻糖、虎杖根提取物、黄苓根提取物、积雪草提取物、粉防己提取物、龙胆根提取物",
            efficacy: "补水保湿,舒缓媺肤,改善肌肤状态,呵护娇媺肌肤,令肌肤焕发青春光彩。",
            usage: "洁面后,将面膜敷于面部,用手指轻压至使其贴紧肌肤静置15-20分钟,取下面膜后轻轻按摩脸部肌肤,让精华完全吸收。",
            applicableSkinTypes: "适用于任何肤质，适用于敏感肌、干燥肌，以及因换季、外界刺激导致肌肤不适的人群。尤其适合敏感肌、屏障薄弱、脆弱易敏肌肤，光电美容项目后泛红反黑或护肤不当致烂脸的情况也适用 。",
            barcode: "6940079099175"
        },
        {
            id: 49,
            name: "百雀羚焕妍晶采精华眼膜",
            category: "eye_care",
            ImageUrl: "Images/百雀羚焕妍晶采精华眼膜.png",
            ingredients: "透明质酸、多种植物提取物（如茶叶提取物、马齿苋提取物等）、水解胶原蛋白",
            efficacy: "透明质酸深层补水锁水，缓解眼周干燥；植物提取物舒缓眼周肌肤，减轻黑眼圈、眼袋，淡化细纹；水解胶原蛋白增强眼周肌肤弹性，提升紧致度，让双眼焕发晶采 。",
            usage: "洁面爽肤后，取出眼膜贴于眼周肌肤，轻轻按压使其贴合紧密，避开眼周黏膜部位。静敷 15 - 20 分钟后揭下，将残留精华液轻拍至完全吸收，无需清洗。建议每周使用 3 - 4 次 。",
            applicableSkinTypes: "适合多种肤质，尤其适合眼周肌肤干燥、有黑眼圈、细纹及眼部疲劳人群 。",
            barcode: "6927006143941",
        }
    ];

    // =========================================================================
    //                         【纯净最终版】
    // =========================================================================

    // --- 数据同步 ---
    function syncMyProductsToServer() {
        const myProducts = JSON.parse(localStorage.getItem('myProducts')) || [];
        // 只有在有产品数据时才发送请求，避免空请求
        if (myProducts.length > 0) {
            fetch('/api/save_my_products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: myProducts })
            })
                .then(response => response.json())
                .then(data => console.log('产品数据已同步:', data.message))
                .catch(error => console.error('产品数据同步失败:', error));
        }
    }
    // 页面加载后立即同步一次
    syncMyProductsToServer();
    // 设置一个合理的后台同步间隔：5分钟
    setInterval(syncMyProductsToServer, 5 * 60 * 1000);


    // --- API 调用与动画控制 ---

    async function fetchSkincareAdvice() {
        const btn = document.getElementById('fetch-advice-btn');
        const resultDiv = document.getElementById('advice-result');
        const loadingAnim = document.getElementById('loading-animation');

        btn.disabled = true;
        resultDiv.innerHTML = ''; // 清空旧内容
        resultDiv.style.opacity = '0.3';
        if (loadingAnim) loadingAnim.classList.remove('hidden');

        try {
            const adviceDataRes = await fetch('/api/advice_data');
            const adviceData = await adviceDataRes.json();
            showLoadingAnimation(adviceData);

            const response = await fetch('/api/skincare_advice');
            const data = await response.json();

            if (data.status === 'success' && data.advice) {
                if (loadingAnim) completeAnimation(loadingAnim); // 传入loading元素以便控制
                await processAndStreamFullAdvice(data.advice, resultDiv);
            } else {
                throw new Error(data.message || '未知错误');
            }
        } catch (e) {
            if (loadingAnim) loadingAnim.classList.add('hidden');
            console.error('获取护肤建议时出错:', e);
            resultDiv.textContent = '请求出错: ' + e.message;
        } finally {
            btn.disabled = false;
            resultDiv.style.opacity = '1';
        }
    }

    function showLoadingAnimation(data) {
        const loading = document.getElementById('loading-animation');
        if (!loading) return;

        loading.classList.remove('hidden', 'fadeout');

        document.querySelector('.weather-data .data-display').innerHTML =
            `UV: ${data.weather.uv_index}<br>湿度: ${data.weather.humidity}%`;
        document.querySelector('.health-data .data-display').innerHTML =
            `睡眠: ${data.health.sleep}<br>压力: ${data.health.stress_level}%`;
        document.querySelector('.skin-data .data-display').innerHTML =
            `评分: ${data.skin.score}<br>肤龄: ${data.skin.age} 岁`;

        document.querySelectorAll('.data-stream').forEach(el => el.classList.add('active'));

        // 使用返回的 promise 来确保动画在建议获取前完成
        // 注意: 这里的时间需要根据你的实际情况调整
        return new Promise(resolve => {
            setTimeout(() => {
                const circle = document.querySelector('.fusion-circle');
                if (circle) circle.classList.add('halo');
                resolve(); // 动画的一个阶段完成
            }, 2000); // 假设动画持续2秒
        });
    }

    function completeAnimation(loadingElement) {
        if (!loadingElement) return;
        // 立即开始淡出，而不是等待固定时间
        loadingElement.classList.add('fadeout');
        setTimeout(() => loadingElement.classList.add('hidden'), 500); // 500ms是淡出动画的持续时间
    }


    /**
     * =========================================================================
     *                          【v10.0 终极无暇版】
     * =========================================================================
     */

    /**
     * 核心格式化函数 - 【现在只负责解析】
     * 它的职责被简化到极致：只管解析一个给定的、干净的Markdown字符串。
     * @param {string} cleanMarkdown - 不含任何自定义标记的、干净的Markdown文本。
     * @returns {string} - 这个块对应的HTML字符串。
     */
    function formatAdviceForBlock(cleanMarkdown) {
        // ▼▼▼【核心修正】▼▼▼
        // 使用强大的正则表达式，一次性移除所有行首的4个空格或制表符。
        // `^`  匹配一行的开始
        // `[ \t]{4}` 匹配4个空格或制-表符
        // `gm` g:全局匹配, m:多行模式 (让^能匹配每一行的开始)
        const dedentedMarkdown = cleanMarkdown.replace(/^[ \t]{4}/gm, '');

        // 使用 marked.js 解析
        marked.setOptions({ breaks: true, gfm: true });
        return marked.parse(dedentedMarkdown);
    }


    /**
     * 带有流式动画的总调度函数 - 【掌握所有控制权和正确的操作顺序】
     * @param {string} fullMarkdownText - 从API获取的完整建议。
     * @param {HTMLElement} container - 要渲染到的DOM容器。
     */
    async function processAndStreamFullAdvice(fullMarkdownText, container) {
        // 1. 清空容器
        container.innerHTML = '';
        container.style.opacity = '1';

        // 2. 按 "---" 分割成块
        const adviceBlocks = fullMarkdownText.split(/\n---\n/);

        // 3. 逐块处理和渲染
        for (const blockMarkdown of adviceBlocks) {
            if (blockMarkdown.trim() === '') continue;

            // ▼▼▼【核心修正：在这里完成所有预处理】▼▼▼
            const imageUrls = new Set();
            let markdownToParse = blockMarkdown; // 创建一个新变量用于处理

            // a. 优先处理 [IMAGE:...] 标记，提取URL并从文本中移除它
            const imageRegex = /\[IMAGE:\s*(.*?)\s*\]/gi;
            markdownToParse = markdownToParse.replace(imageRegex, (match, imageUrl) => {
                if (imageUrl) {
                    imageUrls.add(imageUrl.trim());
                }
                return ''; // 返回空字符串，即从文本中彻底删除这个标记
            });

            // b. 如果没有找到 [IMAGE:...] 标记，再尝试通过产品名匹配
            if (imageUrls.size === 0 && window.allProducts && window.allProducts.length > 0) {
                window.allProducts.forEach(product => {
                    if (markdownToParse.includes(product.name)) {
                        imageUrls.add(product.ImageUrl);
                    }
                });
            }

            // c. 现在，`markdownToParse` 是一个完全干净的、不含任何图片标记的Markdown文本
            // 我们可以安全地将它交给格式化函数了
            const textHtml = formatAdviceForBlock(markdownToParse);
            // ▲▲▲【核心修正结束】▲▲▲

            // d. 组装图片容器
            let imageContainerHtml = '<div class="advice-step-image-container">';
            if (imageUrls.size > 0) {
                imageUrls.forEach(url => {
                    imageContainerHtml += `<img src="${url}" alt="产品图片" class="advice-product-image">`;
                });
            }
            imageContainerHtml += '</div>';

            // e. 创建当前块的DOM结构
            const blockElement = document.createElement('div');
            blockElement.className = 'advice-step';
            blockElement.innerHTML = `
                ${imageContainerHtml}
                <div class="advice-step-text">
                    <div class="step-details"></div>
                </div>
            `;

            // f. 后续的打字机动画逻辑保持不变...
            container.appendChild(blockElement);
            const detailsDiv = blockElement.querySelector('.step-details');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = textHtml;
            const plainText = tempDiv.textContent || "";
            let currentText = '';
            for (let i = 0; i < plainText.length; i++) {
                currentText += plainText[i];
                detailsDiv.textContent = currentText + '▋';
                container.scrollTop = container.scrollHeight;
                if (i % 5 === 0) {
                    await new Promise(r => setTimeout(r, 15));
                }
            }
            detailsDiv.innerHTML = textHtml;
            await new Promise(r => setTimeout(r, 300));
        }
    }

    // --- 最终的、唯一的事件绑定 ---
    document.getElementById('fetch-advice-btn').onclick = fetchSkincareAdvice;

    // ===================================================================
    // 假设你已经拿到天气和湿度数据
    function updateWeather(weatherDesc, temp, humidity) {
        // 1. 天气图标切换
        let iconFile = "Images/weather/默认.svg";
        if (weatherDesc.includes("晴")) iconFile = "Images/weather/晴.svg";
        else if (weatherDesc.includes("多云")) iconFile = "Images/weather/多云.svg";
        else if (weatherDesc.includes("阴")) iconFile = "Images/weather/阴.svg";
        else if (weatherDesc.includes("小雨")) iconFile = "Images/weather/小雨.svg";
        else if (weatherDesc.includes("中雨")) iconFile = "Images/weather/中雨.svg";
        else if (weatherDesc.includes("大雨")) iconFile = "Images/weather/大雨.svg";
        else if (weatherDesc.includes("暴雨")) iconFile = "Images/weather/暴雨.svg";
        document.getElementById("weather-icon").src = iconFile;
        document.getElementById("weather-desc").textContent = weatherDesc;
        document.getElementById("temp-value").textContent = temp + "°";

        // 2. 湿度文本切换
        let humidityText = "--";
        if (humidity !== undefined && humidity !== null) {
            if (humidity < 40) {
                humidityText = "干燥";
            } else if (humidity <= 70) {
                humidityText = "舒适";
            } else {
                humidityText = "潮湿";
            }
            document.getElementById("humidity-value").textContent = humidity + "%";
            document.getElementById("humidity-text").textContent = humidityText;
        }
    }


    // --- 新的导航函数 ---
    function switchToView(viewId) {
        stopQuaggaScanner();
        stopSkinCamera(); // 切换视图时确保摄像头关闭
        views.forEach(view => view.classList.remove('active-view'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active-view');
    }

    // --- 天气获取函数 ---
    async function fetchWeather() {
        try {
            const response = await fetch('/api/weather');
            if (!response.ok) throw new Error(`服务器响应失败: ${response.status}`);
            const data = await response.json();
            if (data.status === 'success') updateWeatherUI(data);
            else throw new Error(data.message);
        } catch (error) {
            console.error("获取天气数据时出错:", error);
            tempValue.textContent = 'N/A';
            weatherDesc.textContent = '加载失败';
        }
    }

    function updateWeatherUI(data) {
        if (!data || typeof data.temperature === 'undefined') return;
        // 动态切换天气图标、描述、温度、湿度文本
        updateWeather(data.weather_description, data.temperature, data.humidity);

        // UV指数及防护等级
        const uv = parseFloat(data.uv_index);
        if (isNaN(uv)) return;
        uvLevel.textContent = Math.round(uv);
        const uvAngle = Math.min(uv * 15, 270);
        const uvGaugeArc = uvGauge.querySelector('.uv-gauge-arc');
        uvGauge.style.setProperty('--uv-angle', `${uvAngle}deg`);
        if (uv < 3) { uvProtectionLevel.textContent = '无需防护'; uvGaugeArc.style.borderTopColor = '#58d68d'; }
        else if (uv < 6) { uvProtectionLevel.textContent = '需要防护'; uvGaugeArc.style.borderTopColor = '#f5c542'; }
        else if (uv < 8) { uvProtectionLevel.textContent = '加强防护'; uvGaugeArc.style.borderTopColor = '#ff9f43'; }
        else if (uv < 11) { uvProtectionLevel.textContent = '注意避开'; uvGaugeArc.style.borderTopColor = '#ff6b6b'; }
        else { uvProtectionLevel.textContent = '避免外出'; uvGaugeArc.style.borderTopColor = '#a55eea'; }
    }


    // --- 摄像头关闭函数 (来自原始脚本) ---
    function stopSkinCamera() {
        if (skinCameraStream) {
            skinCameraStream.getTracks().forEach(track => track.stop());
            skinCameraStream = null;
        }
    }
    function stopQuaggaScanner() {
        if (isQuaggaRunning) { Quagga.stop(); isQuaggaRunning = false; }
        if (scanStream) { scanStream.getTracks().forEach(track => track.stop()); scanStream = null; }
        if (scanTimeout) { clearTimeout(scanTimeout); scanTimeout = null; }
        barcodeDetectedInSession = false;
    }

    // --- 产品库相关函数 (来自原始脚本) ---
    function renderProducts(category) {
        productGrid.innerHTML = '';
        const productsToDisplay = category === 'all' ? allProducts :
            category === 'My_Product' ? myProducts :
                allProducts.filter(product => product.category === category);
        if (productsToDisplay.length === 0) {
            const msg = category === 'My_Product' ? '您还没有添加任何产品到“我的产品”中。' : '此分类暂无产品。';
            productGrid.innerHTML = `<p class="no-products-message">${msg}</p>`;
            return;
        }
        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.setAttribute('data-product-id', product.id);
            productCard.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${product.ImageUrl}" alt="${product.name}">
            </div>
            <h3 class="product-name">${product.name}</h3>`;

            // 保持原有的 contextmenu 监听器
            productCard.addEventListener('contextmenu', (e) => onProductRightClick(e, product));

            // 保持原有的长按逻辑调用
            addLongPressListener(productCard, product); // 新增：长按支持

            // *** 新增：点击事件监听器 ***
            // 当点击产品卡片时，也触发 onProductRightClick 函数
            productCard.addEventListener('click', (e) => {
                // 在这里可以添加一个判断，防止长按或右键后的点击再次触发
                // 例如，如果菜单已经显示，就不再次触发
                if (customContextMenu.style.display !== 'block') {
                    onProductRightClick(e, product);
                }
            });

            productGrid.appendChild(productCard);
        });
    }

    function onProductRightClick(e, product) {
        e.preventDefault(); // 阻止默认的右键菜单，这个在点击事件中通常不必要，但保持兼容性
        currentRightClickedProduct = product;
        const isInMyProducts = myProducts.some(p => p.id === product.id);
        contextMenuItem.textContent = isInMyProducts ? '从我的产品移除' : '添加到我的产品';
        contextMenuItem.setAttribute('data-action', isInMyProducts ? 'remove' : 'add');
        customContextMenu.style.display = 'block';

        // 兼容触屏：如果是触摸事件，使用touches[0]，否则用鼠标 (此段代码保持不变)
        const x = e.touches ? e.touches[0].pageX : e.pageX;
        const y = e.touches ? e.touches[0].pageY : e.pageY;
        customContextMenu.style.left = `${x}px`;
        customContextMenu.style.top = `${y}px`;
    }

    // 长按逻辑函数保持不变，因为它还在 renderProducts 中被调用
    function addLongPressListener(element, product) {
        let timer = null;
        let moved = false;
        element.addEventListener('touchstart', function (e) {
            moved = false;
            timer = setTimeout(() => {
                onProductRightClick(e, product);
            }, 600); // 600ms为长按阈值
        });
        element.addEventListener('touchmove', function () {
            moved = true;
            if (timer) clearTimeout(timer);
        });
        element.addEventListener('touchend', function (e) {
            if (timer) clearTimeout(timer);
            if (!moved) {
                // 如果需要阻止点击穿透，可以在这里阻止默认
                // e.preventDefault();
            }
        });
    }

    // --- 修改：addToMyProducts 函数 ---
    function addToMyProducts(product) {
        if (!myProducts.some(p => p.id === product.id)) {
            myProducts.push(product);
            localStorage.setItem('myProducts', JSON.stringify(myProducts));

            // 新增：调用同步函数
            syncMyProductsToServer();

            if (document.querySelector('.category-item.active[data-category="My_Product"]')) {
                renderProducts('My_Product');
            }
            const myProductTab = document.querySelector('[data-category="My_Product"]');
            myProductTab.classList.add('addFlash');
            setTimeout(() => myProductTab.classList.remove('addFlash'), 1000);
        }
    }

    // --- 修改：removeFromMyProducts 函数 ---
    function removeFromMyProducts(product) {
        myProducts = myProducts.filter(p => p.id !== product.id);
        localStorage.setItem('myProducts', JSON.stringify(myProducts));

        // 新增：调用同步函数
        syncMyProductsToServer();

        if (document.querySelector('.category-item.active[data-category="My_Product"]')) {
            renderProducts('My_Product');
        }
        const myProductTab = document.querySelector('[data-category="My_Product"]');
        myProductTab.classList.add('removeFlash');
        setTimeout(() => myProductTab.classList.remove('removeFlash'), 1000);
    }

    // --- 肌肤检测UI控制 (来自原始脚本) ---
    function updateUIState(state) {
        cameraContainer.style.display = 'none';
        previewContainer.style.display = 'none';
        analysisResultContainer.style.display = 'none';
        loader.style.display = 'none';
        startCameraBtn.style.display = 'none';
        captureBtn.style.display = 'none';
        retakeAnalyzeGroup.style.display = 'none';
        welcomeContainer.style.display = 'none';
        const magnifier = document.getElementById('magnifier-anim');
        if (magnifier) magnifier.style.display = 'none';
        switch (state) {
            case 'preview':
                previewContainer.style.display = 'flex';
                retakeAnalyzeGroup.style.display = 'flex';
                analyzeBtn.style.display = 'block';
                if (magnifier) magnifier.style.display = 'flex'; // 预览时显示放大镜
                break;
            case 'initial':
                welcomeContainer.style.display = 'flex';
                startCameraBtn.style.display = 'block';
                break;
            case 'cameraActive':
                cameraContainer.style.display = 'flex';
                captureBtn.style.display = 'block';
                break;
            case 'preview':
                previewContainer.style.display = 'flex';
                retakeAnalyzeGroup.style.display = 'flex';
                analyzeBtn.style.display = 'block'; // 确保分析按钮可见
                break;
            case 'analyzing':
                previewContainer.style.display = 'flex';
                analysisResultContainer.style.display = 'flex';
                loader.style.display = 'block';
                analysisResultDisplay.textContent = '';
                break;
            case 'result':
                previewContainer.style.display = 'none'; // 结果页不显示预览图
                analysisResultContainer.style.display = 'flex';
                retakeAnalyzeGroup.style.display = 'flex';
                analyzeBtn.style.display = 'none'; // 结果页只留重拍
                break;
        }
    }

    function renderReport(reportText) {
        loader.style.display = 'none';
        analysisResultContainer.innerHTML = ''; // 清空加载动画
        const card = document.createElement('div');
        card.className = 'report-card';
        const title = document.createElement('h2');
        card.appendChild(title);
        const sections = reportText.trim().split(/\n\s*\n/);
        sections.forEach(sectionText => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'report-section';
            const lines = sectionText.trim().split('\n');
            const sectionTitleText = lines.shift() || "";
            const sectionTitle = document.createElement('h3');
            sectionTitle.innerHTML = sectionTitleText;
            sectionDiv.appendChild(sectionTitle);
            lines.forEach(line => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'report-item';
                const parts = line.split(/[:：-]/);
                if (parts.length >= 2 && parts[0].trim() !== '') {
                    const label = document.createElement('span');
                    label.className = 'label';
                    label.textContent = parts[0].replace('-', '').trim() + ':';
                    const value = document.createElement('span');
                    value.className = 'value';
                    value.textContent = parts.slice(1).join(':').trim();
                    itemDiv.appendChild(label);
                    itemDiv.appendChild(value);
                } else {
                    const singleValue = document.createElement('span');
                    singleValue.className = 'value';
                    singleValue.style.width = '100%';
                    singleValue.style.textAlign = 'center';
                    singleValue.textContent = line.trim();
                    itemDiv.appendChild(singleValue);
                }
                sectionDiv.appendChild(itemDiv);
            });
            card.appendChild(sectionDiv);
        });
        analysisResultContainer.appendChild(card);
    }


    // ===================================================================
    // ===== 4. 事件监听器设置 =====
    // ===================================================================

    // --- 新UI的核心导航 ---
    btnProductLibrary.addEventListener('click', () => switchToView('product-view'));
    btnSkinAnalysis.addEventListener('click', () => {
        switchToView('skin-analysis-area');
        // 确保肌肤检测页面总是从初始状态开始
        updateUIState('initial');
    });
    // 修改这里：切换到健康数据页面，而不是弹窗
    btnHealthData.addEventListener('click', () => switchToView('health-view'));
    backButtons.forEach(button => {
        button.addEventListener('click', (e) => switchToView(e.currentTarget.dataset.target));
    });

    // --- 产品库的内部导航 (来自原始脚本) ---
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const category = item.getAttribute('data-category');

            // 这是关键：这个导航只影响产品库内部的显示
            productGrid.style.display = 'grid';
            cameraArea.style.display = 'none';
            stopQuaggaScanner();

            if (category === 'scan_product') {
                productGrid.style.display = 'none';
                cameraArea.style.display = 'flex';
                startScanBtn.style.display = 'block';
                stopScanBtn.style.display = 'none';
                cameraPlaceholder.style.display = 'block';
                scanResultDiv.textContent = '';
            } else {
                renderProducts(category);
            }
        });
    });

    // --- 产品库右键菜单 (来自原始脚本) ---
    contextMenuItem.addEventListener('click', () => {
        if (currentRightClickedProduct) {
            const action = contextMenuItem.getAttribute('data-action');
            if (action === 'add') addToMyProducts(currentRightClickedProduct);
            else removeFromMyProducts(currentRightClickedProduct);
        }
        customContextMenu.style.display = 'none';
    });
    document.addEventListener('click', (e) => {
        if (!customContextMenu.contains(e.target)) {
            customContextMenu.style.display = 'none';
        }
    });

   // --- 产品扫描逻辑 (已修改，增加了超时后的默认条码) ---
    startScanBtn.addEventListener('click', () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(stream => {
                    scanStream = stream;
                    cameraPlaceholder.style.display = 'none';
                    startScanBtn.style.display = 'none';
                    stopScanBtn.style.display = 'block';
                    scanResultDiv.textContent = '正在扫描中...请保持条形码在画面中央';
                    barcodeDetectedInSession = false;
                    Quagga.init({
                        inputStream: { name: "Live", type: "LiveStream", target: cameraArea, constraints: { facingMode: "environment" } },
                        decoder: { readers: ["ean_reader", "code_128_reader"] }
                    }, function (err) {
                        if (err) { alert('无法启动条码扫描: ' + err.message); stopQuaggaScanner(); return; }
                        Quagga.start();
                        isQuaggaRunning = true;
                        scanTimeout = setTimeout(() => {
                            if (!barcodeDetectedInSession) {
                                // 5秒内未扫描到任何条码，执行默认逻辑
                                const defaultBarcode = '6940079099175'; // 设定好的默认条码
                                scanResultDiv.textContent = `5秒内未扫描到产品，已使用默认条码 ${defaultBarcode} 进行查询。`;
                                
                                // 调用处理条码的逻辑，就好像真的扫描到了这个条码一样
                                handleScannedBarcode(defaultBarcode);

                                // 即使使用了默认条码，也要停止Quagga，并恢复UI
                                stopQuaggaScanner();
                                startScanBtn.style.display = 'block';
                                cameraPlaceholder.style.display = 'block';
                                stopScanBtn.style.display = 'none';
                            }
                        }, 5000);
                    });
                }).catch(err => { alert("无法启动摄像头，请授予权限。"); });
        } else { alert('您的浏览器不支持摄像头访问。'); }
    });

    // --- 新增辅助函数，用于处理扫描到的条码 ---
    // 这个函数将把重复的逻辑（查找产品和更新UI）封装起来
    function handleScannedBarcode(barcode) {
        const product = allProducts.find(p => p.barcode === barcode);
        if (product) {
            scanResultDiv.textContent = `扫描成功！已添加产品 "${product.name}"`;
            addToMyProducts(product);
        } else {
            scanResultDiv.textContent = `扫描结果: 未找到条码为 ${barcode} 的产品`;
        }
    }

    Quagga.onDetected(function (data) {
        const barcode = data.codeResult.code;
        const product = allProducts.find(p => p.barcode === barcode);

        if (product) {
            barcodeDetectedInSession = true;
            clearTimeout(scanTimeout);
            
            stopQuaggaScanner();
            startScanBtn.style.display = 'block';
            cameraPlaceholder.style.display = 'block';
            stopScanBtn.style.display = 'none';
            
            scanResultDiv.textContent = `扫描成功！已添加产品 "${product.name}"`;
            addToMyProducts(product);
        }
    });

    stopScanBtn.addEventListener('click', () => {
        stopQuaggaScanner();
        clearTimeout(scanTimeout);
        startScanBtn.style.display = 'block';
        stopScanBtn.style.display = 'none';
        cameraPlaceholder.style.display = 'block';
        scanResultDiv.textContent = '';
    });

    // --- 肌肤检测逻辑 (来自原始脚本) ---
    startCameraBtn.addEventListener('click', async () => {
        stopSkinCamera();
        try {
            skinCameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            liveVideo.srcObject = skinCameraStream;
            updateUIState('cameraActive');
        } catch (err) {
            console.error("肌肤检测摄像头访问失败: ", err);
            alert("无法启动摄像头。请确保您已为此网站授予摄像头权限，并检查摄像头是否被其他程序占用。");
        }
    });

    captureBtn.addEventListener('click', () => {
        captureCanvas.width = liveVideo.videoWidth;
        captureCanvas.height = liveVideo.videoHeight;
        captureCanvas.getContext('2d').drawImage(liveVideo, 0, 0, captureCanvas.width, captureCanvas.height);
        imagePreview.src = captureCanvas.toDataURL('image/jpeg');
        stopSkinCamera();
        updateUIState('preview');
    });

    retakeBtn.addEventListener('click', () => {
        imagePreview.src = '';
        analysisResultDisplay.textContent = '';
        analysisResultContainer.innerHTML = ''; // 清空报告
        startCameraBtn.click();
    });

    analyzeBtn.addEventListener('click', () => {
        updateUIState('analyzing');
        captureCanvas.toBlob(blob => {
            const formData = new FormData();
            formData.append('image', new File([blob], "capture.jpg", { type: "image/jpeg" }));
            fetch('/analyze', {
                method: 'POST',
                body: formData,
            })
                .then(response => {
                    if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    updateUIState('result');
                    if (data.status === 'success') {
                        renderReport(data.report);
                    } else {
                        renderReport(`❌ 分析失败\n\n- 错误原因: ${data.message}`);
                    }
                })
                .catch(error => {
                    updateUIState('result');
                    renderReport(`🔌 请求出错\n\n- 错误详情: ${error.message}\n- 可能原因: 请检查后端服务是否正常运行。`);
                });
        }, 'image/jpeg');
    });

    // --- ▼▼▼ 用这个新版本完整替换掉您已有的 historyBtn 事件监听函数 ▼▼▼ ---

    historyBtn.addEventListener('click', async () => {
        try {
            historyList.innerHTML = '<div class="loader"></div>';
            historyModal.classList.remove('hidden');

            const response = await fetch('/api/historical_skin_analysis');
            if (!response.ok) throw new Error('服务器响应失败');
            const data = await response.json();

            if (data.status === 'success' && data.history.length > 0) {
                historyList.innerHTML = '';

                if (myChart) {
                    myChart.destroy();
                }

                const chronologicalHistory = data.history.slice().reverse();

                const labels = chronologicalHistory.map(entry => entry.timestamp);
                const scoresData = chronologicalHistory.map(entry => (entry.key_metrics || {}).total_score);
                const skinAgeData = chronologicalHistory.map(entry => (entry.key_metrics || {}).skin_age);

                // --- ▼▼▼ 核心改造点：动态计算Y轴范围 ▼▼▼ ---

                // 计算"综合评分"的动态范围
                let scoreMin = Math.min(...scoresData);
                let scoreMax = Math.max(...scoresData);
                // 添加 5 点的 "呼吸空间" (padding)
                let scoreScaleMin = Math.floor(scoreMin) - 5;
                let scoreScaleMax = Math.ceil(scoreMax) + 5;
                // 确保范围不超出 0-100
                scoreScaleMin = Math.max(0, scoreScaleMin);
                scoreScaleMax = Math.min(100, scoreScaleMax);
                // 如果只有一个数据点，给一个默认范围
                if (scoresData.length === 1) {
                    scoreScaleMin = Math.max(0, scoresData[0] - 10);
                    scoreScaleMax = Math.min(100, scoresData[0] + 10);
                }

                // 计算"肤龄"的动态范围
                let ageMin = Math.min(...skinAgeData);
                let ageMax = Math.max(...skinAgeData);
                // 添加 3 岁的 "呼吸空间"
                let ageScaleMin = Math.floor(ageMin) - 3;
                let ageScaleMax = Math.ceil(ageMax) + 3;
                ageScaleMin = Math.max(0, ageScaleMin); // 年龄不能为负
                if (skinAgeData.length === 1) {
                    ageScaleMin = Math.max(0, skinAgeData[0] - 5);
                    ageScaleMax = skinAgeData[0] + 5;
                }

                // --- ▲▲▲ 动态计算结束 ▲▲▲ ---

                const ctx = document.getElementById('history-chart').getContext('2d');
                myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: '综合评分',
                                data: scoresData,
                                borderColor: '#007bff',
                                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                                fill: true,
                                tension: 0.3,
                                yAxisID: 'y_score'
                            },
                            {
                                label: '肤龄',
                                data: skinAgeData,
                                borderColor: '#ff9f43',
                                backgroundColor: 'rgba(255, 159, 67, 0.1)',
                                fill: true,
                                tension: 0.3,
                                yAxisID: 'y_age'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            // --- ▼▼▼ 核心改造点：使用动态范围 ▼▼▼ ---
                            y_score: {
                                type: 'linear',
                                position: 'left',
                                min: scoreScaleMin, // 不再用 suggestedMin
                                max: scoreScaleMax, // 不再用 suggestedMax
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { color: '#f2f2f7' }
                            },
                            y_age: {
                                type: 'linear',
                                position: 'right',
                                min: ageScaleMin, // 使用动态年龄范围
                                max: ageScaleMax, // 使用动态年龄范围
                                grid: { drawOnChartArea: false },
                                ticks: { color: '#f2f2f7' }
                            },
                            // --- ▲▲▲ 动态范围应用结束 ▲▲▲ ---
                            x: {
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { color: '#f2f2f7' }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: '#f2f2f7' } }
                        }
                    }
                });

                // --- 渲染文字列表（逻辑不变） ---
                // 注意：我们遍历的是 `data.history`，因为列表需要最新的在最前面
                data.history.forEach(entry => {
                    const metrics = entry.key_metrics || {};
                    const entryDiv = document.createElement('div');
                    // 使用我们新 CSS 定义的类名
                    entryDiv.className = 'history-entry';

                    // 构建新的 HTML 结构：左边图片，右边是原有的指标列表
                    entryDiv.innerHTML = `
                        <!-- 左侧图片 -->
                        <div class="history-photo">
                            <img src="${entry.image_url}" alt="历史检测照片" loading="lazy">
                        </div>

                        <!-- 右侧指标信息 (这是您原有的结构) -->
                        <div class="history-details">
                            <div class="history-header">${entry.timestamp}</div>
                            <div class="history-metrics">
                                <p><span class="label">综合评分:</span> <span class="value">${metrics.total_score ?? 'N/A'}</span></p>
                                <p><span class="label">肤龄分析:</span> <span class="value">${metrics.skin_age ?? 'N/A'} 岁</span></p>
                                <p><span class="label">缺水程度:</span> <span class="value">${metrics.water_severity ?? 'N/A'}</span></p>
                                <p><span class="label">色素沉着:</span> <span class="value">${metrics.pigmentation_score ?? 'N/A'}</span></p>
                                <p><span class="label">痘痘数量:</span> <span class="value">${metrics.acne_count ?? 'N/A'}</span></p>
                                <p><span class="label">黑眼圈:</span> <span class="value">${metrics.dark_circle_severity || 'N/A'}</span></p>
                            </div>
                        </div>
                    `;
                    historyList.appendChild(entryDiv);
                });

            } else {
                document.getElementById('chart-container').innerHTML = '<canvas id="history-chart"></canvas>';
                historyList.innerHTML = '<p>没有找到历史分析记录。</p>';
            }
        } catch (error) {
            console.error('获取历史数据失败:', error);
            historyList.innerHTML = `<p style="color: #ff6b6b;">获取历史数据失败: ${error.message}</p>`;
        }
    });
    // 修复：让关闭按钮（叉叉）重新生效
    historyModalClose.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    // 修复：让点击弹窗外部的灰色区域也能关闭弹窗
    historyModal.addEventListener('click', (event) => {
        if (event.target === historyModal) {
            historyModal.classList.add('hidden');
        }
    });


    // ===================================================================
    // ===== 5. 初始化 =====
    // ===================================================================
    function initialize() {
        // 新增：在页面首次加载时，也同步一次产品列表，以确保服务器拥有最新的数据
        syncMyProductsToServer();
        fetchWeather();
        renderProducts('all');
        updateUIState('initial');
    }

    initialize();
    // 初始化完成
});