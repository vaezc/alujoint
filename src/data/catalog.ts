import generatedCatalog from "./catalog.generated.json"
import { euroJoint, tpdhScrewTravelMm, type JointDefinition } from "./joint"

export type Vec3 = [number, number, number]

export type SampleKind = "profile" | "connector" | "fastener" | "accessory" | "scene"

export type FilterId = "all" | SampleKind

export type ModelNode = {
  name: string
  label: string
  detail: string
}

export type ModelAsset = {
  url: string
  units: "m"
  nodes: ModelNode[]
  explodeMm: Record<string, Vec3>
}

export type Placement = {
  id: string
  label: string
  assetId: string
  positionMm: Vec3
  rotation: Vec3
  explodeMm: Vec3
}

export type BomLine = {
  code: string
  what: string
  source: string
}

export type SourceLink = {
  label: string
  href: string
  note: string
}

export type Sample = {
  id: string
  code: string
  title: string
  kind: SampleKind
  badge: string
  summary: string
  caution: string | null
  search: string
  /** 抓取目录的分类。手写样品不填，列表里归到「手写样品」。 */
  category?: string
  placements: Placement[]
  geometry: string[]
  purpose: string[]
  bom: BomLine[]
  install: string[]
  machining: string[]
  sources: SourceLink[]
  absent: string[]
  assembly?: JointDefinition
}

const txcjPdf = "https://static.jlcfa.com/Serial/T01/TXCJ/590068920572575746.pdf"
const tyzcPdf = "https://static.jlcfa.com/Serial/T02/TYZC/595874960008077314.pdf"
const tpdhNew = "https://static.jlcfa.com/Serial/T02/TPDH/569305911508713474.pdf"
const tpdhOld = "https://static.jlcfa.com/Serial/T02/TPDH/480529780873224194.pdf"

const handAssets = {
  txcj: {
    url: "/models/TXCJ.glb",
    units: "m",
    nodes: [
      {
        name: "TXCJ-H6-2020-L100_body_node",
        label: "型材本体",
        detail: "STEP 里唯一的实体。节点名来自转换后的 GLB。",
      },
      {
        name: "TXCJ-H6-2020-L100_axial_R2.5_feature_node",
        label: "轴向 Ø5 特征",
        detail: "同一实体被拆出的第二块网格，包围盒 100×5×5 mm，对应半径 2.5 mm 的中心孔，不是第二件产品。",
      },
    ],
    explodeMm: {},
  },
  tyzc: {
    url: "/models/TYZC.glb",
    units: "m",
    nodes: [
      {
        name: "TYZC-H6-206-2020-DZ",
        label: "角座本体",
        detail: "GLB 里唯一的节点。文件头产品名是 DZ，没有紧固件节点。",
      },
    ],
    explodeMm: {},
  },
  tpdh: {
    url: "/models/TPDH.glb",
    units: "m",
    nodes: [
      {
        name: "NAUO1",
        label: "本体 NAUO1",
        detail: "TPDH-T。实例原点在 (0, 0, 0)，局部包围盒 22×22×22 mm。",
      },
      {
        name: "NAUO2",
        label: "螺钉 NAUO2",
        detail: "EDLG-S1-M6-L12。实例原点 (−21, 0, 0) mm，旋转留在文件矩阵里。",
      },
      {
        name: "NAUO3",
        label: "螺钉 NAUO3",
        detail: "同一颗螺钉的第二个实例。原点 (0, 0, −21) mm。",
      },
      {
        name: "NAUO4",
        label: "螺钉 NAUO4",
        detail: "第三个实例。原点 (0, −21, 0) mm。",
      },
    ],
    explodeMm: tpdhScrewTravelMm,
  },
  tpaaD6M4: {
    url: "/models/TPAA-D-6-M4.glb",
    units: "m",
    nodes: [
      {
        name: "TPAA-D-6-M4",
        label: "螺母本体",
        detail: "单实体。外廓 10 × 4.5 × 6 mm。",
      },
      {
        name: "TPAA-D-6-M4_thread_feature",
        label: "螺纹简化圆柱",
        detail: "同一实体拆出的孔特征，测得约 Ø3.44 mm。不是螺纹公差，也不是第二件零件。",
      },
    ],
    explodeMm: {},
  },
  tpaaD6M5: {
    url: "/models/TPAA-D-6-M5.glb",
    units: "m",
    nodes: [
      {
        name: "TPAA-D-6-M5",
        label: "螺母本体",
        detail: "单实体。外廓与 M4 相同，10 × 4.5 × 6 mm。",
      },
      {
        name: "TPAA-D-6-M5_thread_feature",
        label: "螺纹简化圆柱",
        detail: "同一实体拆出的孔特征，测得约 Ø4.30 mm。不是螺纹公差。",
      },
    ],
    explodeMm: {},
  },
  edla: {
    url: "/models/EDLA-S1-M4-L10.glb",
    units: "m",
    nodes: [
      {
        name: "EDLA-S1-M4-L10",
        label: "螺钉",
        detail: "网格包围盒 14 × 7 × 7 mm。轴沿文件 X，尖端在 0，内六角端面在 −14。",
      },
      {
        name: "EDLA-S1-M4-L10_feature_1",
        label: "杆部特征",
        detail: "同一只螺钉拆出的杆，不是第二颗零件。",
      },
    ],
    explodeMm: {},
  },
  epda: {
    url: "/models/EPDA-S1W-K-4.glb",
    units: "m",
    nodes: [
      {
        name: "EPDA-S1W-K-4",
        label: "平垫",
        detail: "网格 12 × 12 × 1 mm。孔轴为文件 Z，z = 0 到 1。",
      },
    ],
    explodeMm: {},
  },
  epdb: {
    url: "/models/EPDB-S1W-B1-4.glb",
    units: "m",
    nodes: [
      {
        name: "EPDB-S1W-B1-4",
        label: "弹垫",
        detail: "网格约 7.6 × 7.6 × 0.9 mm。孔轴为文件 Z。实体是平面开口环。",
      },
    ],
    explodeMm: {},
  },
  tpbt: {
    url: "/models/TPBT-G-M5-L10.glb",
    units: "m",
    nodes: [
      {
        name: "TPBT-G-M5-L10",
        label: "T 形螺栓",
        detail: "网格 10 × 13.2 × 6 mm。杆轴为文件 Y，尖端在 +10，T 头在负 Y。",
      },
    ],
    explodeMm: {},
  },
} as const satisfies Record<string, ModelAsset>

function nutSample(
  code: "TPAA-D-6-M4" | "TPAA-D-6-M5",
  assetId: "tpaaD6M4" | "tpaaD6M5",
  thread: "M4" | "M5",
  hole: string,
  radius: string,
  stepSha: string,
  glbSha: string,
  nickelSku: string,
): Sample {
  return {
    id: code.toLowerCase(),
    code,
    title: `T 形螺母，镀锌，${thread}`,
    kind: "fastener",
    badge: "STEP 单实体",
    summary: `碳钢镀锌的欧标 20 T 形螺母，槽系列 6，螺纹 ${thread}。网格是这份 STEP 的 GLB。`,
    caution: `这是 TPAA-D，不是角座 ZP 清单里的镀镍 ${nickelSku}。孔是简化圆柱，不是螺纹公差。没有装进型材槽的坐标。`,
    search: `${code} T形螺母 镀锌 碳钢 槽6 ${thread} ${nickelSku}`,
    placements: [
      {
        id: "nut",
        label: "螺母",
        assetId,
        positionMm: [0, 0, 0],
        rotation: [0, 0, 0],
        explodeMm: [0, 0, 0],
      },
    ],
    geometry: [
      "STEP 与 GLB 的外廓都是 10 × 4.5 × 6 mm。GLB 按米存放，0.010 m = 10 mm。",
      `螺纹在 STEP 里是一段简化圆柱，测得半径 ${radius} mm（${hole}）。这不是官方螺纹公差等级。`,
      "转换拆成本体和螺纹特征两块网格，仍是同一个 PRODUCT，没有装配实例。顶点里有 3.2 mm，与图档相符。",
    ],
    purpose: [
      "产品页把它放在欧标 20、槽系列 6 的 T 形螺母家族里，对应槽宽 6.2 mm。这是目录对应，文件里没有插入 TXCJ 槽口的坐标。",
      "表面处理是镀锌，材料是碳钢。同一张规格表还有 TPAA-N、TPAA-G、TPAA-X6。N 是镀镍。",
    ],
    bom: [],
    install: ["图纸上的用法是放进型材槽，再由螺栓拉紧。这份文件只有螺母自己，没有入槽姿态。"],
    machining: ["没有追加工步骤。孔的圆柱是建模简化，不能当成攻丝底孔的公差。"],
    sources: [
      {
        label: "产品页 · T 形螺母",
        href: "https://www.jlcfa.com/serial/1914989413112.html",
        note: `STEP SHA-256 ${stepSha}。GLB SHA-256 ${glbSha}，21508 字节。`,
      },
    ],
    absent: [
      `不是 ${nickelSku}。角部示意只是把这只镀锌螺母摆进槽口，不是镀镍套件。`,
      "没有载荷，没有与型材或角座的配合约束。",
    ],
  }
}

function hardwareSample(input: {
  id: string
  code: string
  title: string
  assetId: string
  summary: string
  caution: string
  search: string
  geometry: string[]
  purpose: string[]
  install: string[]
  machining: string[]
  sourceHref: string
  sourceNote: string
  absent: string[]
}): Sample {
  return {
    id: input.id,
    code: input.code,
    title: input.title,
    kind: "fastener",
    badge: "STEP 单实体",
    summary: input.summary,
    caution: input.caution,
    search: input.search,
    placements: [
      {
        id: "part",
        label: input.code,
        assetId: input.assetId,
        positionMm: [0, 0, 0],
        rotation: [0, 0, 0],
        explodeMm: [0, 0, 0],
      },
    ],
    geometry: input.geometry,
    purpose: input.purpose,
    bom: [],
    install: input.install,
    machining: input.machining,
    sources: [{ label: "产品页", href: input.sourceHref, note: input.sourceNote }],
    absent: input.absent,
  }
}

const sampleList: Sample[] = [
  {
    id: "txcj-h6-2020-l100",
    code: "TXCJ-H6-2020-L100",
    title: "欧标 20 型材，100 mm",
    kind: "profile",
    badge: "STEP 单实体",
    summary: "本色喷砂氧化的 20×20 型材，按订货号切成 100 mm。网格是这份 STEP 转出的 GLB。",
    caution: "GLB 按米存放，0.020 m = 20 mm。轴向那块网格是 Ø5 孔的特征，不是另一根型材。",
    search: "TXCJ-H6-2020-L100 型材 欧标20 A6063 2020",
    placements: [
      {
        id: "profile",
        label: "型材",
        assetId: "txcj",
        positionMm: [0, 0, 0],
        rotation: [0, 0, 0],
        explodeMm: [0, 0, 0],
      },
    ],
    geometry: [
      "STEP 顶点包围盒与 GLB 一致：100 × 20 × 20 mm。原点在一端，截面占 Y −20–0、Z 0–20。",
      "文件里只有一个 MANIFOLD_SOLID_BREP，产品名 TXCJ-H6-2020-L100。转换拆成两块网格：本体，以及 100 × 5 × 5 mm 的轴向特征。后者对上半径 2.5 mm（Ø5）的中心孔。",
      "圆角半径 1.5 mm 与选型图上的 4-R1.5 对得上。这两项和外形都来自 STEP 半径和官方图档。",
      "槽宽 6.2 mm 写在选型图的槽口详图上。这次没有另做钳口到钳口的测量。截面标注里的 6.1 / 7.8 也出现在 STEP 顶点坐标里，没有单独收成一项特征尺寸。",
    ],
    purpose: [
      "H6 在选型图上是本色喷砂氧化，材料栏写 A6063-T5。切断面不做表面处理。",
      "整条标准长度 6000–6020 mm，最大使用长度 5800–5850 mm。这根是切短的样品，不是整条。",
      "表格里的理论线密度是 0.48 kg/m。按这个数，100 mm 对应 0.048 kg。这是换算，不是称重。",
    ],
    bom: [],
    install: [
      "这根本身没有连接件。它是后面两件的被连接对象，文件里也没有和它们的配合约束。",
      "长度公差写的是：L≤1000 mm 时 L±0.3，L>1000 mm 时 ±0.5。100 mm 落在前一档。",
    ],
    machining: [
      "订货号没有 LA、RA、DA。那些追加工不在这根上。",
      "图纸对追加工的说明是：Ø5 通孔改为螺孔 M6 深 15。带 Ø4.2 的截面另有改为 M5 深 12。2020 基本型标的是 Ø5。",
    ],
    sources: [
      {
        label: "产品页 · TXCJ",
        href: "https://www.jlcfa.com/serial/2021388190883.html",
        note: "研究记录里的系列入口。STEP 文件名 TXCJ-H6-2020-L100嘉立创FA（www.jlcfa.com）.step，SHA-256 d259f5eafed4466966bc5dc1356ea4e51e3237d2393aabb0a3ec426d16bc891c。",
      },
      {
        label: "TXCJ 欧标 20 选型图",
        href: txcjPdf,
        note: "H6、A6063-T5、4-R1.5、Ø5、线密度 0.48 kg/m、截面积 172.64 mm²。",
      },
    ],
    absent: [
      "没有载荷、挠度或推荐跨距。",
      "槽宽 6.2 mm 没有在这份网格上重新量过。",
      "GLB 没有单独写金属度和粗糙度。视图只补了环境反射，网格顶点没有改。",
    ],
  },
  {
    id: "tyzc-bracket",
    code: "TYZC-H6-206-2020-DZ",
    title: "压铸角座，文件内为 DZ",
    kind: "connector",
    badge: "DZ 单体",
    summary: "下载名带 ZP-OB，STEP 头和产品名是 TYZC-H6-206-2020-DZ。网格只有角座本体。",
    caution: "这不是 ZP 套件。没有螺钉、T 形螺母和垫圈，也不能当成已经装到型材上的角。",
    search: "TYZC 角座 ZP-OB DZ EDLA TPAA ABB11-206-2020",
    placements: [
      {
        id: "bracket",
        label: "角座本体",
        assetId: "tyzc",
        positionMm: [0, 0, 0],
        rotation: [0, 0, 0],
        explodeMm: [0, 0, 0],
      },
    ],
    geometry: [
      "STEP 与 GLB 的包围盒都是 32 × 32 × 19 mm，范围 X −2–30、Y −2–30、Z −9.5–9.5。",
      "内部实体名 ABB11-206-2020。一个 PRODUCT，零个装配实例。GLB 因此只有一个节点 TYZC-H6-206-2020-DZ。",
      "STEP 里读到的半径：2.65 mm（折成 Ø5.3，孔，提取出的图档文字没有单独标这一个数）、1.5 mm 圆角、0.5 mm 小圆角。",
      "官方图上的 ZP 范例是 TYZC-H6-206-2020-ZP。文件名里的 OB 没有在产品页上核对到含义。",
    ],
    purpose: [
      "图纸原句：用于型材固定角度的外连接、内连接的加固。将螺母放置型材槽内，用螺栓将角座与型材连接紧固。",
      "这句话说的是这种角座的用法。当前这个文件里没有那些螺母和螺栓。",
      "H6 对应喷砂。表头同时列出压铸铝合金和锌合金，锌合金排在 N6 / N7 一侧。不把 H6 写成锌合金。",
    ],
    bom: [
      {
        code: "EDLA-S1-M4-L10",
        what: "螺钉",
        source: "选型图 ZP 栏。不在这个 STEP / GLB 里。",
      },
      {
        code: "TPAA-N-6-M4",
        what: "T 形螺母",
        source: "选型图 ZP 栏。放进槽宽 6 mm 的槽里。不在这个文件里。",
      },
      {
        code: "EPDA-S1W-K-4",
        what: "垫圈",
        source: "选型图 ZP 栏。不在这个文件里。",
      },
      {
        code: "EPDB-S1W-B1-4",
        what: "弹垫",
        source: "选型图 ZP 栏。不在这个文件里。",
      },
    ],
    install: [
      "图纸上的安装是：螺母放进型材槽，螺栓穿过角座孔把角座和型材拉紧。当前模型没有这些零件，所以视图里没有这一步。",
      "DZ 和 SZ 的技术说明都是「去掉压铸角座一面的限位角」。图上没有写两者的差别，也没有非 DZ 的实体可对照。",
      "使用示例里还出现 EDLG-S1-M4-L10、EDLJ-S1-M5-L10 和 TPAE-D-6-M5。那是图上其他规格的画法，不并进 ZP 清单。",
    ],
    machining: [
      "Z：截面螺纹孔加工。指定范例 TYZC-H6-306-2020-Z。图上标了 12、12 和 M5。这只 DZ 文件的订货后缀不是 Z。",
      "没有拧紧力矩，没有限位角去掉之后的剩余壁厚。",
    ],
    sources: [
      {
        label: "产品页 · TYZC",
        href: "https://www.jlcfa.com/serial/1562067181103.html",
        note: "下载名 TYZC-H6-206-2020-ZP-OB。STEP 头文件名却是 TYZC-H6-206-2020-DZ，SHA-256 dec4c551ef2425942168a8af8bf593421a42b95d952f9570e75bb92d5c145e44。",
      },
      {
        label: "TYZC 欧标 20 压铸角座选型图",
        href: tyzcPdf,
        note: "用途、ZP 清单、DZ/SZ 说明。重量表是不带 ZP 的型号。",
      },
    ],
    absent: [
      "这只 DZ 文件里仍然没有螺钉、镀镍 T 形螺母和垫圈，所以角座本身没有爆炸。镀锌 TPAA-D 在另一条目录，不是这套 ZP。",
      "重量表给的是不带 ZP 的型号：H6-206-2020、H7-206-2020、X6-206-2020G 为 16 g/pcs；N6-206-20A 与图上写成 TYZC-H7-206-20A 的一行为 17 g/pcs。不把 16 g 安到这个 DZ 文件上。",
      "图纸有一句「TYZA-H7-206 的配件螺母无黑色」，原文就是 TYZA。",
      "不能当作角座与型材已经配合的样品。没有载荷。",
      "再次下载并勾选 ZP、OB、DZ 后，STEP 的 SHA-256 仍是 dec4c551…45e44，内部还是 DZ 单体。不另计一只角座，也不把它当成套件。",
    ],
  },
  nutSample("TPAA-D-6-M4", "tpaaD6M4", "M4", "Ø3.44", "1.72", "dff0a4855a6cb3ed92ede30f8d8021ede9ffa0992bd30124a14de464df4fc24f", "c711ad0b400d915e1d34b772c36936fb1a69d973285b580c991069b9fc25348d", "TPAA-N-6-M4"),
  nutSample("TPAA-D-6-M5", "tpaaD6M5", "M5", "Ø4.30", "2.15", "4416de50a5d18dac5817b109c22b8792d78cfb1d7e0aa88a6fffd13c5d258954", "14723de82956bfeb53573a5cf993f3f2b5ae1198e28f8fe7b42c2224d6ce9c9b", "TPAA-N-6-M5"),
  {
    id: "tpdh-206-t-zp",
    code: "TPDH-206-T-ZP",
    title: "端面连接件，规格 T，ZP",
    kind: "connector",
    badge: "STEP 装配",
    summary: "官方装配：本体 TPDH-T 加三颗 EDLG-S1-M6-L12。层级按 STEP 的 NAUO1–4 留在 GLB 里。",
    caution: "三颗螺钉的位置是套件内部的实例，不是与型材的配合约束。拉开只沿这三根实例轴再移出 40 mm。",
    search: "TPDH-206-T-ZP NAUO EDLG EDLJ 端面连接件",
    placements: [
      {
        id: "kit",
        label: "套件",
        assetId: "tpdh",
        positionMm: [0, 0, 0],
        rotation: [0, 0, 0],
        explodeMm: [0, 0, 0],
      },
    ],
    geometry: [
      "合拢后的包围盒是 31 × 31 × 31 mm，范围各轴 −21–10。这与 STEP 实例平移后的结果一致。未变换的局部实体并在一起是 25.3 × 22 × 22 mm，那个数不是装配尺寸。",
      "NAUO1 是本体，局部包围盒 22 × 22 × 22 mm（−12–10）。选型图 T 视图文字层里的「20」是系列规格，不要和这只 22 mm 的实体包围盒看成同一个数。",
      "本体上的圆有 r = 6.0 mm（Ø12）和 r = 3.5 mm（Ø7），与图档标注相符。",
      "三颗螺钉是同一个零件的三个实例：NAUO2 (−21, 0, 0)、NAUO3 (0, 0, −21)、NAUO4 (0, −21, 0)，单位 mm。矩阵里还有 0.5 和 0.866 的旋转项。局部包围盒 15.3 × 10.5 × 10.5 mm：长度 15.3 = 12 + 3.3，与 M6×12 沉头的头高 3.3 mm 相符；10.5 mm 对上半径 5.25 mm 的头部。",
    ],
    purpose: [
      "用在型材端面。使用示例画的是它和 TXCJ 放在一起，示例里的型材写法是 TXCJ-H6-6-2020。这个 STEP 里没有那根型材。",
      "规格 T 的重量栏是 26.50 g/pcs，规格 B 是 32.50 g/pcs。表没有把螺钉重量单独拆出来。",
    ],
    bom: [
      {
        code: "TPDH-T",
        what: "本体，NAUO1",
        source: "STEP 产品名。重量栏按规格 T 记 26.50 g/pcs，没有把螺钉拆出。",
      },
      {
        code: "EDLG-S1-M6-L12",
        what: "沉头螺钉 × 3，NAUO2 / NAUO3 / NAUO4",
        source: "STEP 产品名，也是两份选型图 ZP 栏写的螺钉。",
      },
    ],
    install: [
      "示例把本体放在型材端面一侧，旁边有螺钉和装饰盖。这份 STEP 没有装饰盖，也没有型材，图上没有贴合余量。",
      "ZP 表示适配沉头螺钉。指定范例印成了 TPDD-206-B-ZP，比系列号 TPDH 多了一处笔误。",
      "拉开时 NAUO2 再沿 −X、NAUO3 再沿 −Z、NAUO4 再沿 −Y 各移出 40 mm。这是为了看清三颗螺钉，不是安装距离。",
    ],
    machining: [
      "这两份选型图没有给这件单独的机加步骤。不写拧紧力矩，图纸没有给。",
      "螺钉代号不一致写在图上：较新的一份（材质栏 ADC12）里，B 侧示例标 EDLJ-S1-M6-L12，T 侧示例标 EDLG-S1-M6-L12。较早的一份（材质栏铝合金）里，两处示例都标 EDLJ。两份 ZP 栏都写 EDLG。这份 ZP STEP 与 ZP 配件行一致，是 EDLG。没有 EDLJ 的实体，不能判断两者是不是同一零件。",
    ],
    sources: [
      {
        label: "产品页 · TPDH",
        href: "https://www.jlcfa.com/serial/2162889907245.html",
        note: "STEP 文件名 TPDH-206-T-ZP嘉立创FA（www.jlcfa.com）.step，SHA-256 5264afa6bd78e46cd2e5e2bcbf96f26ce1fce5a57ea071e08db1908f27c495f5。",
      },
      {
        label: "TPDH 选型图，材质栏为 ADC12",
        href: tpdhNew,
        note: "T/B 重量、Ø7 与 Ø12，以及 B 侧 EDLJ、T 侧 EDLG。",
      },
      {
        label: "TPDH 选型图，材质栏为铝合金",
        href: tpdhOld,
        note: "示例两处都是 EDLJ，ZP 栏仍是 EDLG。两份都写喷油。",
      },
    ],
    absent: [
      "没有型材，没有配合约束，没有载荷上限。",
      "使用示例里的装饰盖没有作为 PRODUCT 出现在这个 STEP 里。",
      "两份 PDF 对材质的写法不同：ADC12，以及铝合金。这里不挑选其中一个当作唯一材质。",
    ],
  },
  hardwareSample({
    id: "edla-s1-m4-l10",
    code: "EDLA-S1-M4-L10",
    title: "圆柱头螺钉，M4×10",
    assetId: "edla",
    summary: "DIN912 内六角圆柱头，M4，L=10，全牙，SUS304 A2-70。网格按这只 STEP 测量。",
    caution: "使用示例左图印的是 EDLG-S1-M4-L10。这只是 EDLA，不要改标。",
    search: "EDLA-S1-M4-L10 DIN912 圆柱头 M4 EDLG",
    geometry: [
      "网格包围盒 14 × 7 × 7 mm。不要用 STEP 顶点当头的直径：顶点 Y 只有 ±1.732，漏了 Ø7 的头。",
      "轴是文件 X。内六角端面在 x=−14，支承面在 x=−10，尖端在 x=0。头高 4 mm，杆半径 2 mm。",
    ],
    purpose: ["产品页是圆柱头螺钉自己的页面。可以拿来看形状，不能说使用示例上的那颗已经按图下到。"],
    install: ["尖端朝 +X 拧入。角部示意里把这个方向转到型材槽口。"],
    machining: ["没有拧紧力矩。内六角对边测得约 3.0 mm，深度大约 2 mm，这是网格测量。"],
    sourceHref: "https://www.jlcfa.com/serial/2129403909149.html",
    sourceNote: "STEP SHA-256 c45c2dafc66235dc92fa9f0e589c7849bfb9a83c23a89b819169c78151f283bb。GLB SHA-256 131d645d19ac1b3decafb8389dfd0ac5bc56687e4c8e7c014a5c482f73d6337e。",
    absent: ["不是 EDLG-S1-M4-L10，也不是 EDLJ-S1-M5-L10。没有和角座或型材的配合。"],
  }),
  hardwareSample({
    id: "epda-s1w-k-4",
    code: "EPDA-S1W-K-4",
    title: "宽平垫，M4",
    assetId: "epda",
    summary: "DIN9021 宽型平垫，M4，SUS304。使用示例左图印的就是这个料号。",
    caution: "两面都是平面，文件里看不出哪一面朝上。",
    search: "EPDA-S1W-K-4 平垫 DIN9021 M4",
    geometry: ["网格 12 × 12 × 1 mm。外半径 6 mm，内半径 2.15 mm。孔轴是文件 Z，厚度 z=0 到 1。"],
    purpose: ["垫在螺钉头和被连接件之间。这只文件只有垫圈自己。"],
    install: ["叠放方向沿孔轴。角部示意里孔轴与 EDLA 的杆对齐。"],
    machining: ["没有。"],
    sourceHref: "https://www.jlcfa.com/serial/1876808811244.html",
    sourceNote: "STEP SHA-256 6dac9f818e0813c0ecb24dc8681e01fe64b5f5bf7b5c69fa2cb39b93f2d32037。GLB SHA-256 188d3b5f6476af8fa1845b3b4b07f0f30d256af8c6b712c5b7fbc3135fb0f215。",
    absent: ["没有和螺钉或角座的装配坐标。"],
  }),
  hardwareSample({
    id: "epdb-s1w-b1-4",
    code: "EPDB-S1W-B1-4",
    title: "弹垫，M4，平面开口环",
    assetId: "epdb",
    summary: "DIN127，M4，SUS304。使用示例左图印的就是这个料号。网格是平面开口环。",
    caution: "厚 0.9 mm，不是三维螺旋。不要从这个文件读自由高度或弹力。",
    search: "EPDB-S1W-B1-4 弹垫 DIN127 开口环 M4",
    geometry: [
      "网格约 7.60 × 7.60 × 0.90 mm。外半径 3.8 mm，内半径 2.05 mm。Z 只有 0 和 0.9。",
      "切口在网格上大约 10°，靠近 +X。这是网格测量，不是标准开口尺寸。",
    ],
    purpose: ["图上把它放在螺钉头一侧。这里按测得的平面环显示，不改成螺旋。"],
    install: ["孔轴是文件 Z。角部示意里与平垫、螺钉同轴。"],
    machining: ["没有载荷，没有扭矩。"],
    sourceHref: "https://www.jlcfa.com/serial/2135521331445.html",
    sourceNote: "STEP SHA-256 1049e43ee8531a08b92df644596f19628ae87d4dbd29632872018ffee9bf2a82。GLB SHA-256 ad91669e771e50252a85f23f9f224c77e710f69790875835a9df30d8ac15f163。",
    absent: ["不是螺旋自由高度。没有工作载荷。"],
  }),
  hardwareSample({
    id: "tpbt-g-m5-l10",
    code: "TPBT-G-M5-L10",
    title: "T 形螺栓，M5×10",
    assetId: "tpbt",
    summary: "页面选型是镀铬、M5、L=10，适用欧标 20。单独陈列，不放进 M4 角连接。",
    caution: "页面是 G，STEP 实体名是 TPBT-D-M5-L10。不能把这只几何当成已证明的镀铬专用体。槽系列 6 页面没有单独写。",
    search: "TPBT-G-M5-L10 T形螺栓 M5 镀铬",
    geometry: [
      "网格 10 × 13.2 × 6 mm。杆轴是文件 Y，尖端在 y=+10，T 头在负 Y。头沿 X 长 10 mm，沿 Z 宽 6 mm。",
      "M5 杆半径 2.5 mm。三角面很密，约 2.36 MB，形状按原网格保留。",
    ],
    purpose: ["页面写适用欧标 20 系列。没有写槽宽系列 6，6 mm 头宽只是测得的尺寸，也没有插入 TXCJ 的坐标。"],
    install: ["尖端朝 +Y。不与角座这组 M4 螺钉、螺母混在同一个连接里。"],
    machining: ["没有载荷。y=0 到 1.6 有一段更宽的过渡，是测量，不是官方台肩标注。"],
    sourceHref: "https://www.jlcfa.com/serial/2051658501549.html",
    sourceNote: "STEP SHA-256 258f51d95e4c8ea1f1925a5a23fbbe7f92b1bea4903c31c331d7979c6a01e814。GLB SHA-256 74ce41036582e0586a647d345e51c74d32a7dbc605553339eb1ecdb652173589。",
    absent: ["不进入角部示意。没有槽系列 6 的页面确认，也没有和型材的配合。"],
  }),
  {
    id: "scene-corner",
    code: "整组爆炸",
    title: "角部连接",
    kind: "scene",
    badge: "未验证配合",
    summary: euroJoint.summary,
    caution: "装配位置为教学示意，非官方套件或承载验证",
    search: "整组爆炸 角部连接 未验证配合 角座 EDLA TPAA EPDA EPDB",
    assembly: euroJoint,
    placements: placementsFromJoint(euroJoint),
    geometry: [
      "两根型材用的是同一只 TXCJ。槽口相对，角上没有切角。角座是 TYZC 的 H6 DZ 本体，外廓 32×32×19 mm。",
      "角座靠型材的两条边上各有一条槽口，测得开口大约 x 或 y 从 6.5 到 20.5 mm、中面 z=0、高度约 Ø5.3。教学位置取中点 13.5 mm。",
      "EDLA 的杆轴是文件 X。平垫和弹垫的孔轴是文件 Z。摆进场景时把这些轴转到槽口方向：尖端朝型材，垫圈在头和角座内侧面之间。",
      "弹垫按网格原样显示，厚 0.9 mm 的平面开口环。螺钉杆长 10 mm，尖端探进槽里的螺母，这不是测得的旋合长度。",
    ],
    purpose: ["用来看角部零件怎样沿安装方向分开。不能当成可以受力的接头，也不能当成厂家套件。"],
    bom: jointBom(euroJoint),
    install: [
      "合拢时型材、角座、垫圈、螺钉和螺母靠在一起。拉开后型材沿长度退出，角座沿分角线离开，螺钉和垫圈沿螺钉轴退回，螺母沿槽口滑出。",
      "每条边各放了一组 M4。数量是这条示意用的，不是从清单抄来的件数。",
    ],
    machining: ["没有在这组里切角、攻丝或让位。"],
    sources: [
      {
        label: "角座产品页",
        href: "https://www.jlcfa.com/serial/1562067181103.html",
        note: "使用示例左图印着 EDLG、EPDB、盖板、EPDA、X6 角座、TPAA-N 和 TXCJ。本页用的料号见右侧清单。",
      },
    ],
    absent: [
      "不是官方 ZP 套件：螺母是镀锌 TPAA-D，不是镀镍 TPAA-N。螺钉是 EDLA，图上印的是 EDLG-S1-M4-L10。角座是 H6 的 DZ 本体，不是 TYZC-X6-206-2020G。",
      "盖板没有网格。M5 的 T 形螺栓单独在目录里，不放进这组 M4 连接。",
      "没有配合约束，没有载荷。",
    ],
  },
]

type CatalogItem = {
  id: string
  code: string
  model: string
  group: string
  category: string
  kind: string
  glb: string
  bboxMm: number[]
  meshes: number
  bytes: number
}

const generated = generatedCatalog as unknown as { generatedAt: string; count: number; items: CatalogItem[] }

const handCodes = new Set(sampleList.map((sample) => sample.code))

const generatedAssets: Record<string, ModelAsset> = {}
const generatedSamples: Sample[] = []

for (const item of generated.items) {
  if (handCodes.has(item.model)) continue
  const assetId = `catalog-${item.id}`
  const [x = 0, y = 0, z = 0] = item.bboxMm ?? []
  generatedAssets[assetId] = { url: item.glb, units: "m", nodes: [], explodeMm: {} }
  generatedSamples.push({
    id: `catalog-${item.id}`,
    code: catalogCode(item),
    title: item.group || item.category,
    kind: catalogKind(item.kind),
    badge: `抓取目录 · ${item.meshes} 网格`,
    summary: `${item.category}${item.group && item.group !== item.category ? ` / ${item.group}` : ""}。批量抓取条目，包围盒 ${millimeter(x)} × ${millimeter(y)} × ${millimeter(z)} mm。`,
    caution: "批量目录条目：只有包围盒和网格数，没有逐件核对。",
    search: `${item.model} ${item.code} ${item.group} ${item.category}`,
    category: item.category,
    placements: [
      {
        id: "part",
        label: catalogCode(item),
        assetId,
        positionMm: [0, 0, 0],
        rotation: [0, 0, 0],
        explodeMm: [0, 0, 0],
      },
    ],
    geometry: [
      `GLB 按米存放。网格包围盒 ${millimeter(x)} × ${millimeter(y)} × ${millimeter(z)} mm。`,
      `转换后 ${item.meshes} 个网格，文件 ${item.bytes} 字节。`,
    ],
    purpose: [`分类：${item.category}。`, item.group && item.group !== item.category ? `目录分组：${item.group}。` : ""].filter(
      (line): line is string => line !== "",
    ),
    bom: [],
    install: [],
    machining: [],
    sources: [
      {
        label: "产品页",
        href: `https://www.jlcfa.com/serial/${item.id}.html`,
        note: "抓取管线记录的 series id，未逐页复核。",
      },
    ],
    absent: ["没有配合约束、载荷或扭矩。", "没有逐件核对官方图档。"],
  })
}

function catalogKind(kind: string): SampleKind {
  if (kind === "profile") return "profile"
  if (kind === "connector") return "connector"
  return "accessory"
}

function catalogCode(item: CatalogItem): string {
  return item.model.startsWith(item.code) ? item.model : `${item.code}-${item.model}`
}

function millimeter(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export const assets: Record<string, ModelAsset> = { ...handAssets, ...generatedAssets }

export const samples: Sample[] = promoteJoint([...sampleList, ...generatedSamples])

function promoteJoint(list: Sample[]): Sample[] {
  const joint = list.find((item) => item.assembly)
  if (!joint) return list
  return [joint, ...list.filter((item) => item !== joint)]
}

function placementsFromJoint(joint: JointDefinition): Placement[] {
  const rows: Placement[] = []
  const seen = new Set<string>()
  for (const member of joint.members) {
    if (member.presence !== "mesh" || !member.placementId || !member.assetId || !member.positionMm) continue
    if (seen.has(member.placementId)) continue
    seen.add(member.placementId)
    rows.push({
      id: member.placementId,
      label: member.label,
      assetId: member.assetId,
      positionMm: member.positionMm,
      rotation: member.rotation ?? [0, 0, 0],
      explodeMm: member.travelMm ?? [0, 0, 0],
    })
  }
  return rows
}

function jointBom(joint: JointDefinition): BomLine[] {
  return joint.members.map((member) => ({
    code: member.code,
    what: member.presence === "mesh" ? `${member.label} · 有网格` : `${member.label} · 缺模型`,
    source: member.note,
  }))
}

export const filters: { id: FilterId; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "profile", label: "型材" },
  { id: "connector", label: "连接件" },
  { id: "fastener", label: "紧固件" },
  { id: "accessory", label: "配件" },
  { id: "scene", label: "示意" },
]

export function kindLabel(kind: SampleKind): string {
  switch (kind) {
    case "profile":
      return "型材"
    case "connector":
      return "连接件"
    case "fastener":
      return "紧固件"
    case "accessory":
      return "配件"
    case "scene":
      return "示意"
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

export function matchesFilter(sample: Sample, filter: FilterId): boolean {
  switch (filter) {
    case "all":
      return true
    case "profile":
    case "connector":
    case "fastener":
    case "accessory":
    case "scene":
      return sample.kind === filter
    default: {
      const exhaustive: never = filter
      return exhaustive
    }
  }
}

export function sampleHasExplode(sample: Sample): boolean {
  for (const placement of sample.placements) {
    if (placement.explodeMm.some((value) => value !== 0)) return true
    const asset = assets[placement.assetId]
    for (const offset of Object.values(asset.explodeMm)) {
      if (offset.some((value) => value !== 0)) return true
    }
  }
  return false
}

export function nodesForSample(sample: Sample): { placementId: string; name: string; label: string }[] {
  const rows: { placementId: string; name: string; label: string }[] = []
  for (const placement of sample.placements) {
    const asset = assets[placement.assetId]
    if (sample.placements.length > 1) {
      rows.push({ placementId: placement.id, name: "*", label: placement.label })
    }
    for (const node of asset.nodes) {
      rows.push({
        placementId: placement.id,
        name: node.name,
        label: sample.placements.length > 1 ? `${placement.label} · ${node.label}` : node.label,
      })
    }
    if (sample.placements.length === 1 && asset.nodes.length === 0) {
      rows.push({ placementId: placement.id, name: "*", label: placement.label })
    }
  }
  return rows
}
