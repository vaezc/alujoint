// 搭建指南的数据：五个常见任务 → 候选连接方式。
// 说明尽量沿用 src/data/connections.ts 里各连接的定义和 note；
// 官方图档 / 适配没有逐点核对的字段统一标「待核对」，不要写死。

export type GuideStatus = "已核对" | "待核对"

export type ConnectionOption = {
  /** 对应 connections.ts / catalog.ts 里真实样品的 id */
  sampleId: string
  label: string
  /** 适用型材与槽型 */
  profile: string
  /** 加工要求 */
  machining: string
  /** T 型螺母能否后装 */
  nutAfter: string
  /** 紧固件从哪里装 */
  fastenerFrom: string
  /** 工具从哪一面进入 */
  toolFrom: string
  status: GuideStatus
  /** 官方图档（PDF）或使用示例入口 */
  drawing?: string
  /** 图档来源标签，默认「官方图档」 */
  drawingLabel?: string
}

export type GuideTask = {
  id: string
  title: string
  summary: string
  /** 该任务下的候选连接 */
  options: ConnectionOption[]
}

const P20 = "欧标 20 系列 · 槽宽 6.2"

export const guideTasks: GuideTask[] = [
  {
    id: "beam-to-post",
    title: "横梁接立柱",
    summary: "把一根横梁的端面接到另一根立柱的侧面或端面，做成 T 形或直角。",
    options: [
      {
        sampleId: "scene-end-to-end",
        label: "端面连接件（TPDH-206，L 形）",
        profile: P20,
        machining: "型材端面通常要攻丝，配沉头螺钉；装饰盖未建模。",
        nutAfter: "无需 T 型螺母，螺钉直接进端面螺纹。",
        fastenerFrom: "从连接件内侧装入沉头螺钉。",
        toolFrom: "内六角从连接件开口一侧进入。",
        status: "待核对",
        drawing: "https://static.jlcfa.com/Serial/T02/TPDH/480529780873224194.pdf",
      },
      {
        sampleId: "scene-side-tee",
        label: "内置端面贴侧面（TPDF-206）",
        profile: P20,
        machining: "在支接型材靠近端部的侧面加工连接件座孔。下料前按所购型号和截面核对加工尺寸。",
        nutAfter: "先将 T 型螺母从贯通型材开放的槽端送到接头位置。",
        fastenerFrom: "将连接件放入支接型材侧孔，螺钉沿支接杆轴向穿过连接件，拧入贯通杆槽内的螺母。",
        toolFrom: "在支接侧的连接件开口处给内六角留出操作空间。",
        status: "待核对",
        drawing: "https://static.jlcfa.com/Serial/T02/TPDF/311673618140880898.pdf",
      },
      {
        sampleId: "scene-corner-slot",
        label: "角槽件（TPDG-206，内角）",
        profile: P20,
        machining: "两颗紧定螺钉顶住槽口，型材端面按方切；侧面是否加工以图档为准。",
        nutAfter: "紧定螺钉直接压槽，不使用 T 型螺母。",
        fastenerFrom: "从内角一侧拧两颗紧定螺钉。",
        toolFrom: "内六角从内角正上方进入。",
        status: "待核对",
        drawing: "https://static.jlcfa.com/Serial/T02/TPDG/478716395518472193.pdf",
      },
      {
        sampleId: "scene-corner",
        label: "角部角码（角座，教学组）",
        profile: P20,
        machining: "教学示意，未按官方套件核对孔位和攻丝。",
        nutAfter: "示意图中 T 型螺母从槽端滑入，能否后装待核对。",
        fastenerFrom: "从外侧穿螺钉。",
        toolFrom: "外侧内六角。",
        status: "待核对",
      },
    ],
  },
  {
    id: "splice",
    title: "两根型材接长",
    summary: "两根型材端面对接成一条直线，用槽内连接条把接缝拉住。",
    options: [
      {
        sampleId: "scene-straight-splice",
        label: "槽内一字连接（TPLH-206）",
        profile: P20,
        machining: "连接条从开放端插入同一道 T 槽，两侧各两颗紧定螺钉。",
        nutAfter: "使用紧定螺钉，不涉及 T 型螺母后装。",
        fastenerFrom: "紧定螺钉从槽口方向拧入。",
        toolFrom: "内六角沿槽口方向进入。",
        status: "待核对",
        drawing: "https://static.jlcfa.com/Serial/T02/TPLH/212808204705853441.pdf",
      },
    ],
  },
  {
    id: "three-way",
    title: "三根型材汇在一角",
    summary: "三根型材在同一角点相交，分别从两个方向接到第三个方向。",
    options: [
      {
        sampleId: "scene-three-way-corner",
        label: "三向端面连接（TPDH-206-T）",
        profile: P20,
        machining: "三个承接面各一颗沉头螺钉，端面攻丝。",
        nutAfter: "无需 T 型螺母，螺钉进端面螺纹。",
        fastenerFrom: "从连接件内侧逐颗装入。",
        toolFrom: "内六角从对应开口进入。",
        status: "待核对",
        drawing: "https://static.jlcfa.com/Serial/T02/TPDH/480529780873224194.pdf",
      },
      {
        sampleId: "scene-three-way-3d",
        label: "三维连接件（TPDJ-206）",
        profile: P20,
        machining: "三颗紧定螺钉顶住三个方向的槽口，型材端面方切。",
        nutAfter: "紧定螺钉压槽，不用 T 型螺母。",
        fastenerFrom: "从连接件各面拧紧定螺钉。",
        toolFrom: "内六角分别从三个面进入。",
        status: "待核对",
        drawing: "https://static.jlcfa.com/Serial/T02/TPDJ/572565793034117121.pdf",
      },
    ],
  },
  {
    id: "panel",
    title: "安装板件",
    summary: "把面板、封板固定到型材槽口上。",
    options: [
      {
        sampleId: "scene-panel-corner",
        label: "面板角槽连接件（TPCT-206）",
        profile: P20,
        machining: "面板厚度和槽深没有在目录里建模，需按实际板厚核对。",
        nutAfter: "待核对：GLB 是 4 颗紧定螺钉，官方图档写 2 颗 M5。",
        fastenerFrom: "从外侧拧紧定螺钉夹住面板。",
        toolFrom: "外侧内六角。",
        status: "待核对",
        drawing: "https://static.jlcfa.com/Serial/T02/TPCT/640337112526262273.pdf",
      },
    ],
  },
  {
    id: "brace",
    title: "增加斜撑",
    summary: "用斜撑限制框架侧摆，或按摆放条件加防前后倾覆。X 撑按需要后装。",
    options: [
      {
        sampleId: "scene-external-plate-45",
        label: "45° 外置连接板（自建教学板）",
        profile: P20,
        machining: "自建 4 mm 板、四个 Ø4.5 通孔，孔位为教学设计，非厂家件。",
        nutAfter: "槽内 M4 螺母需从槽端滑入，能否后装取决于槽是否已封口。",
        fastenerFrom: "板面外侧四颗螺钉。",
        toolFrom: "板面外侧。",
        status: "待核对",
        drawing: "https://resources.ooznest.co.uk/aluminium-extrusion-system/connectors/plate-connectors/45-degree-plate-connectors/",
        drawingLabel: "自建参考（Ooznest 原理）",
      },
      {
        sampleId: "scene-angle-135",
        label: "135° 挤压角码（TPDC-206）",
        profile: P20,
        machining: "外连接角码，型材端面不切角；按图档确认孔位。",
        nutAfter: "每个翼缘一颗 T 形螺母，需从槽端滑入。",
        fastenerFrom: "角码外侧 M5 螺钉。",
        toolFrom: "角码外侧。",
        status: "待核对",
        drawing: "https://static.jlcfa.com/Serial/T02/TPDC/613533886767161346.pdf",
      },
      {
        sampleId: "scene-miter-plate-45",
        label: "45° 型材连接板（TPDD-206-2020A-ZP）",
        profile: "本例对应 2020A 截面；其他截面需另核板孔与型材槽的位置。",
        machining: "5 孔板压顶面，型材端面为方切，未按 45° 斜接切角。",
        nutAfter: "5 只 M5 T 形螺母，需从槽端滑入。",
        fastenerFrom: "板面外侧 5 颗 M5 螺钉。",
        toolFrom: "顶面。",
        status: "待核对",
        drawing: "https://static.jlcfa.com/Serial/T02/TPDD/631296615830663169.pdf",
      },
    ],
  },
]

export function guideTaskById(id: string | undefined): GuideTask | undefined {
  return guideTasks.find((task) => task.id === id)
}

// 分步装配：每个连接方式一组步骤，highlight 是当前步骤要高亮的 placementId。
export type AssembleStep = {
  title: string
  detail: string
  highlight: string[]
}

export const assembleSteps: Record<string, AssembleStep[]> = {
  "corner": [
    { title: "预装角座", detail: "把 H6 角座放到两根型材要相交的角上，两个承接面朝向两根型材来的方向。", highlight: ["bracket"] },
    { title: "放入型材 X", detail: "沿 X 的型材槽口朝向角座，端部靠到角座的承接面。", highlight: ["bar-x", "bracket"] },
    { title: "放入型材 Y", detail: "沿 Y 的型材转到另一条边，槽口同样朝向角座。", highlight: ["bar-y", "bracket"] },
    { title: "装 X 向紧固件", detail: "先在螺钉上套弹垫，再套平垫，从角码孔穿入并旋进槽内螺母。从螺钉头向内依次为弹垫、平垫、角码。", highlight: ["screw-a", "split-a", "flat-a", "nut-a"] },
    { title: "装 Y 向紧固件", detail: "另一条边同样装一组螺钉、平垫、弹垫和 T 型螺母。", highlight: ["screw-b", "flat-b", "split-b", "nut-b"] },
    { title: "锁紧并检视", detail: "交替拧紧两条边的螺钉，确认螺母横跨槽肩、装配面无明显缝隙；工具从外侧内六角进入。", highlight: ["bracket", "bar-x", "bar-y"] },
  ],
  "end-to-end": [
    { title: "预装连接件", detail: "把 TPDH 放在角点，两个承接面分别朝向两根型材来的方向。", highlight: ["connector"] },
    { title: "放入水平型材", detail: "水平型材端面贴到连接件的 +X 承接面，中心孔对准 X 向沉头螺钉。", highlight: ["bar-h", "connector"] },
    { title: "放入竖直型材", detail: "竖直型材端面贴到连接件的 +Z 承接面，中心孔对准 Z 向沉头螺钉。", highlight: ["bar-v", "connector"] },
    { title: "锁紧沉头螺钉", detail: "从连接件内侧装入两颗沉头螺钉，交替拧紧，避免一侧先顶死。", highlight: ["connector"] },
    { title: "检视", detail: "确认两个端面贴合、螺钉沉头齐平，并留出内六角工具从开口进入的空间。", highlight: ["bar-h", "bar-v", "connector"] },
  ],
  "side-tee": [
    { title: "预装连接件", detail: "把 T 型螺母滑入贯通型材的槽；把 TPDF 本体放进支接型材端部附近已加工的侧孔。", highlight: ["connector", "bar-v", "bar-h"] },
    { title: "支接型材定位", detail: "支接型材沿连接轴靠近，端面顶在贯通型材的侧面上。", highlight: ["bar-v"] },
    { title: "装入螺钉", detail: "从支接侧的连接件开口操作内六角，使螺钉沿支接杆轴向穿过 TPDF，旋进贯通杆槽内的螺母。", highlight: ["connector"] },
    { title: "锁紧", detail: "拧紧螺钉，让 T 型螺母横跨槽肩压紧。", highlight: ["connector", "bar-h"] },
    { title: "检视", detail: "确认端面贴合、套件没有悬空；本节点缺型材加工模型，孔位以官方图档为准。", highlight: ["bar-v", "connector"] },
  ],
}
