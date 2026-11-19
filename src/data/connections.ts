import { screwReleaseProgress, type JointDefinition, type JointMember, type Vec3 } from "./joint"

const profile = "txcj"

const PROFILE = "TXCJ-H6-2020-L100"
// Offsets are in the GLB scene axes. A NAUO occurrence moves with all its meshes.
export const connectorExplode = {
  "2162889907245": {
    nodes: [
      { name: "NAUO1", label: "端面连接件本体", detail: "沿用 STEP 原始姿态。" },
      { name: "NAUO2", label: "Z 向沉头螺钉", detail: "沿 +Z 向头部退出。" },
      { name: "NAUO3", label: "X 向沉头螺钉", detail: "沿 +X 向头部退出。" },
    ],
    explodeMm: { NAUO2: [0, 0, 55], NAUO3: [55, 0, 0] },
    explodeSequence: ["NAUO2", "NAUO3"],
  },
  "1182062735845": {
    nodes: [
      { name: "NAUO1", label: "内置连接件本体", detail: "沿用 STEP 原始姿态。" },
      { name: "NAUO2", label: "圆柱头螺钉", detail: "沿 −Z 向头部退出。" },
      { name: "NAUO3", label: "T 形螺母", detail: "在单件视图中沿连接轴展示。" },
    ],
    explodeMm: { NAUO2: [0, 0, -24], NAUO3: [0, 0, 18] },
  },
  "1904527487835": {
    nodes: [
      { name: "NAUO1", label: "角槽件本体", detail: "沿用 STEP 原始姿态。" },
      { name: "NAUO2", label: "X 向紧定螺钉", detail: "沿 +X 向内角退出。" },
      { name: "NAUO3", label: "Y 向紧定螺钉", detail: "沿 +Y 向内角退出。" },
    ],
    explodeMm: { NAUO2: [10, 0, 0], NAUO3: [0, 10, 0] },
  },
  "1104341568934": {
    nodes: [
      { name: "NAUO1", label: "一字连接条", detail: "两端分别插入同轴型材的 T 槽。" },
      ...["NAUO2", "NAUO3", "NAUO4", "NAUO5"].map((name, index) => ({
        name,
        label: "紧定螺钉 " + (index + 1),
        detail: "沿槽口法向向外退出，子网格一起移动。",
      })),
    ],
    explodeMm: { NAUO2: [0, 22, 0], NAUO3: [0, 22, 0], NAUO4: [0, 22, 0], NAUO5: [0, 22, 0] },
  },
} satisfies Record<string, {
  nodes: { name: string; label: string; detail: string }[]
  explodeMm: Record<string, [number, number, number]>
  explodeSequence?: string[]
}>

// The shoulders are at X/Z = -10 mm. Their locating ribs project another 2 mm.
export const endToEndJoint: JointDefinition = {
  id: "end-to-end",
  title: "端面连接 · L 形（TPDH-206）",
  status: "partial",
  statusLabel: "教学示意。零件是真网格，位置不是官方装配。",
  summary: "两根 20 型材的端面分别贴在连接件的两个承接面上，沉头螺钉从连接件内侧装入型材端面。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPDH/480529780873224194.pdf",
  install: "先沿各自轴线向连接件内侧退出螺钉，再沿型材长度方向分开两根型材。",
  machining: ["型材网格保留原始中心孔。螺钉配合需要端面加工模型，装饰盖也未建模。"],
  members: [
    {
      id: "bar-h", role: "profile", label: "型材（水平）", code: PROFILE, quantity: 1,
      presence: "mesh", assetId: profile, nodeName: "*", placementId: "bar-h",
      positionMm: [-110, 10, -10], travelMm: [-45, 0, 0], explodeAfter: screwReleaseProgress, basis: "illustrative",
      note: "端面贴在 x = −10 mm 的承接面，中心孔与 X 向沉头螺钉同轴。",
    },
    {
      id: "bar-v", role: "profile", label: "型材（竖直）", code: PROFILE, quantity: 1,
      presence: "mesh", assetId: profile, nodeName: "*", placementId: "bar-v",
      positionMm: [10, 10, -110], rotation: [0, -Math.PI / 2, 0], travelMm: [0, 0, -45], explodeAfter: screwReleaseProgress, basis: "illustrative",
      note: "端面贴在 z = −10 mm 的承接面，中心孔与 Z 向沉头螺钉同轴。",
    },
    {
      id: "connector", role: "connector", label: "端面连接件", code: "TPDH-206-B-ZP", quantity: 1,
      presence: "mesh", assetId: "catalog-2162889907245", nodeName: "*", placementId: "connector",
      positionMm: [0, 0, 0], travelMm: null, basis: "step-instance",
      note: "B 型，套件里是两颗沉头螺钉。装配面上的定位凸缘伸出约 2 mm。",
    },
  ],
}


const tpdf = "catalog-1182062735845"
const tpdg = "catalog-1904527487835"

// Keep the unmachined branch clear of the kit until the required bore is modeled.
export const sideTeeJoint: JointDefinition = {
  id: "side-tee",
  title: "端面贴侧面 · 内置（TPDF-206）",
  status: "partial",
  statusLabel: "预装示意 · 缺型材加工模型",
  initialPoseLabel: "预装位置",
  summary: "接收型材侧面开加工孔，T 型螺母放在支接型材槽内。支接型材留在预装位置，便于看清内置连接件及其朝向。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPDF/311673618140880898.pdf",
  install: "支接型材沿连接轴退开，随后套件整体退出。查看螺钉和螺母的分解，可打开 TPDF 单件。",
  machining: ["按官方图档核对接收（被顶）型材侧面的加工孔；T 型螺母在支接（顶入）型材的槽内。孔径、孔深和实际配合待核对；当前型材网格未加工，因此预留了装入距离。"],
  members: [
    {
      id: "bar-v", role: "profile", label: "支接型材", code: PROFILE, quantity: 1,
      presence: "mesh", assetId: profile, nodeName: "*", placementId: "bar-v",
      positionMm: [10, 10, -100], rotation: [0, -Math.PI / 2, 0], travelMm: [0, 0, -60], basis: "illustrative",
      note: "中心线与连接轴同轴，端面贴在 z = 0 的接收面上。",
    },
    {
      id: "bar-h", role: "profile", label: "贯通型材", code: PROFILE, quantity: 1,
      presence: "mesh", assetId: profile, nodeName: "*", placementId: "bar-h",
      positionMm: [-50, 10, 0], travelMm: null, basis: "illustrative",
      note: "接收支接型材的一面在 z = 0，槽沿 X。",
    },
    {
      id: "connector", role: "connector", label: "内置连接件", code: "TPDF-206-D4.5-ZP", quantity: 1,
      presence: "mesh", assetId: tpdf, nodeName: "*", placementId: "connector",
      positionMm: [0, -4.25, -10], travelMm: [0, 0, -25], explodeAfter: 0.35, explodeAsset: false, basis: "illustrative",
      note: "保留螺钉和 T 形螺母的 STEP 姿态，螺母长边对准贯通型材槽，套件整体留在槽外。",
    },
  ],
}

// 角槽件：L 形件卡在两根型材相交的内角。
export const cornerSlotJoint: JointDefinition = {
  id: "corner-slot",
  title: "角部 · 角槽件（TPDG-206）",
  status: "partial",
  statusLabel: "教学示意。零件是真网格，位置不是官方装配。",
  summary: "两根型材端面对侧面形成直角，角槽件的两条腿沿内角的 T 槽插入，由两颗紧定螺钉锁住。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPDG/478716395518472193.pdf",
  install: "先朝内角退出两颗紧定螺钉，再沿两道槽的长度方向抽开型材。",
  members: [
    {
      id: "bar-h", role: "profile", label: "型材（水平）", code: PROFILE, quantity: 1,
      presence: "mesh", assetId: profile, nodeName: "*", placementId: "bar-h",
      positionMm: [-15, 5, -10], travelMm: [45, 0, 0], explodeAfter: screwReleaseProgress, basis: "illustrative",
      note: "槽口位于 y = 5 mm，开口朝 +Y，沿 X 方向套进角槽件。",
    },
    {
      id: "bar-v", role: "profile", label: "型材（竖直）", code: PROFILE, quantity: 1,
      presence: "mesh", assetId: profile, nodeName: "*", placementId: "bar-v",
      positionMm: [-15, 5, -10], rotation: [0, 0, Math.PI / 2], travelMm: [0, 45, 0], explodeAfter: screwReleaseProgress, basis: "illustrative",
      note: "端面与水平型材侧面相贴，槽口位于 x = 5 mm，沿 Y 方向套进角槽件。",
    },
    {
      id: "connector", role: "connector", label: "角槽连接件", code: "TPDG-206-D5-ZP", quantity: 1,
      presence: "mesh", assetId: tpdg, nodeName: "*", placementId: "connector",
      positionMm: [0, 0, 0], travelMm: null, basis: "step-instance",
      note: "保持 STEP 中的本体和两颗紧定螺钉实例。两侧翼缘落在型材槽口以下。",
    },
  ],
}

function rail(
  id: string,
  label: string,
  positionMm: Vec3,
  rotation: Vec3,
  travelMm: Vec3 | null,
  note: string,
): JointMember {
  return {
    id, role: "profile", label, code: PROFILE, quantity: 1, presence: "mesh",
    assetId: profile, nodeName: "*", placementId: id, positionMm, rotation, travelMm,
    explodeAfter: screwReleaseProgress, basis: "illustrative", note,
  }
}

const straightSplice: JointDefinition = {
  id: "straight-splice",
  title: "直线延长 · 槽内一字连接",
  status: "partial",
  statusLabel: "教学示意 · 槽内连接条与四颗紧定螺钉",
  summary: "两根型材端面对接，100 mm 连接条从开放端插入同一道 T 槽，两侧各有两颗紧定螺钉。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPLH/212808204705853441.pdf",
  install: "先由槽口方向解锁四颗紧定螺钉，再顺槽抽开两根型材。动画增加了螺钉退出距离，便于查看。",
  members: [
    rail("splice-left", "左侧型材", [-100, 0, -10], [0, 0, 0], [-62, 0, 0], "右端面在接缝处，槽口朝 +Y。"),
    rail("splice-right", "右侧型材", [0, 0, -10], [0, 0, 0], [62, 0, 0], "左端面在接缝处，槽口与左侧型材同轴。"),
    {
      id: "splice-kit", role: "connector", label: "一字连接条及紧定螺钉", code: "TPLH-206-Y-ZP",
      quantity: 1, presence: "mesh", assetId: "catalog-1104341568934", nodeName: "*", placementId: "splice-kit",
      positionMm: [0, -0.4, 0], rotation: [0, Math.PI / 2, 0], travelMm: null, basis: "step-instance",
      note: "槽肩位于槽唇下方，连接条各有约 50 mm 插入两侧型材。",
    },
  ],
}

const angle = Math.PI / 4
const diagonalStart: Vec3 = [35, 10 + 10 * Math.SQRT1_2, -20]
const diagonalHole = (distance: number): [number, number] => [
  diagonalStart[0] + distance * Math.SQRT1_2,
  diagonalStart[1] + distance * Math.SQRT1_2,
]
const plateFixings = [
  { x: 40, y: 0, slotAngle: 0 },
  { x: 60, y: 0, slotAngle: 0 },
  ...[12, 32].map((distance) => {
    const [x, y] = diagonalHole(distance)
    return { x, y, slotAngle: angle }
  }),
]

const plateHardware: JointMember[] = plateFixings.flatMap(({ x, y, slotAngle }, index): JointMember[] => [
  {
    id: "plate-screw-" + index, role: "screw", label: "板螺钉 " + (index + 1), code: "EDLA-S1-M4-L10",
    quantity: 1, presence: "mesh", assetId: "edla", nodeName: "*", placementId: "plate-screw-" + index,
    positionMm: [x, y, -6], rotation: [0, Math.PI / 2, 0], travelMm: [0, 0, 45], explodeUntil: 0.45,
    basis: "illustrative", note: "穿过通孔后与槽内 M4 螺母相对，沿板面法向退出。",
  },
  {
    id: "plate-nut-" + index, role: "tnut", label: "槽内螺母 " + (index + 1), code: "TPAA-N-6-M4",
    quantity: 1, presence: "mesh", assetId: "catalog-1914989413112", nodeName: "*", placementId: "plate-nut-" + index,
    positionMm: [x, y, -6.3], rotation: [Math.PI / 2, slotAngle, 0], travelMm: null,
    basis: "illustrative", note: "长边沿所在槽口，分解时留在型材槽内。",
  },
])

const externalPlate: JointDefinition = {
  id: "external-plate-45",
  title: "斜接 · 45° 外置连接板（自建教学板）",
  status: "partial",
  statusLabel: "教学示意 · 自建四孔连接板",
  summary: "四孔板贴在两根型材的共面侧面，每根型材通过两颗螺钉和槽内螺母固定。型材轴线夹角为 45°。",
  drawing: "https://resources.ooznest.co.uk/aluminium-extrusion-system/connectors/plate-connectors/45-degree-plate-connectors/single-slot-20-series-45-degree-plate-connector-aluminium-var-pc-45-ss-20-a-s",
  install: "先垂直板面退出四颗螺钉，再取下连接板。两根型材留在原位，便于比较两排孔与槽线的关系。",
  machining: ["自建 4 mm 厚板，四个 Ø4.5 mm 通孔，每排孔距 20 mm。参考 Ooznest 的外置斜接原理，板形和孔位为本项目教学设计。"],
  members: [
    rail("plate-base", "基准型材", [0, 10, -20], [0, 0, 0], null, "板侧平面在 z = 0，槽沿 X 方向。"),
    rail("plate-diagonal", "斜向型材",
      [diagonalStart[0] - 10 * Math.SQRT1_2, diagonalStart[1] + 10 * Math.SQRT1_2, diagonalStart[2]],
      [0, 0, angle], null, "保留方切端面，近端角点贴近基准型材侧边。"),
    {
      id: "outside-plate", role: "connector", label: "45° 四孔板", code: "自建教学板",
      quantity: 1, presence: "mesh", assetId: "teachingPlate45", nodeName: "*", placementId: "outside-plate",
      positionMm: [0, 0, 0], travelMm: [0, 0, 24], explodeAfter: 0.45, basis: "illustrative",
      note: "板背面贴两根型材的同一侧，通孔中心与槽中心重合。",
    },
    ...plateHardware,
  ],
}

const threeWayCorner: JointDefinition = {
  id: "three-way-corner",
  title: "立体角 · 三向端面连接",
  status: "partial",
  statusLabel: "教学示意 · 三向端面定位",
  summary: "三根型材分别接到 TPDH-206-T-ZP 的三个承接面。每个型材端面对应一颗沉头螺钉。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPDH/480529780873224194.pdf",
  install: "先逐颗从连接件内侧退出三颗螺钉，再沿 X、Y、Z 各自的方向分开型材。",
  machining: ["型材端部保留原始中心孔，端面螺纹和装饰盖尚未建模。"],
  members: [
    rail("corner-x", "X 向型材", [-110, 10, -10], [0, 0, 0], [-45, 0, 0], "端面位于 x = −10 mm。"),
    rail("corner-y", "Y 向型材", [-10, -110, -10], [0, 0, Math.PI / 2], [0, -45, 0], "端面位于 y = −10 mm。"),
    rail("corner-z", "Z 向型材", [10, 10, -110], [0, -Math.PI / 2, 0], [0, 0, -45], "端面位于 z = −10 mm。"),
    {
      id: "corner-cube", role: "connector", label: "三向端面连接套件", code: "TPDH-206-T-ZP",
      quantity: 1, presence: "mesh", assetId: "tpdh", nodeName: "*", placementId: "corner-cube",
      positionMm: [0, 0, 0], travelMm: null, basis: "step-instance",
      note: "保留本体和 NAUO2–4 三颗沉头螺钉的原始实例姿态。",
    },
  ],
}

const angle135: JointDefinition = {
  id: "angle-135",
  title: "斜接 · 135° 挤压角码（TPDC-206）",
  status: "partial",
  statusLabel: "教学示意。零件是真网格，位置不是官方装配。",
  summary: "两根 2020 型材成 135° 外角，挤压角码骑在两根型材的外侧槽口上，每个翼缘一颗 M5 螺钉和一只 T 形螺母。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPDC/613533886767161346.pdf",
  install: "先退出两颗 M5 螺钉，再取下角码，最后沿 0° 和 135° 两个方向分开型材。",
  machining: ["角码本体已带 Z 加工；型材端面没有切角。"],
  members: [
    rail("angle-a", "0° 型材", [-20, 26, -17], [0, 0, 0], [-45, 0, 0], "槽口朝角码，型材沿 X 退出。"),
    rail("angle-b", "135° 型材", [-52.3, 32.6, -17], [0, 0, (3 * Math.PI) / 4], [31.8, 31.8, 0], "槽口朝角码，型材沿 135° 方向退出。"),
    {
      id: "angle-kit", role: "connector", label: "挤压角码及附件", code: "TPDC-206-70A14-Z-ZP",
      quantity: 1, presence: "mesh", assetId: "catalog-1291016987774", nodeName: "*", placementId: "angle-kit",
      positionMm: [0, 0, 0], travelMm: null, basis: "step-instance",
      note: "GLB 带 2 颗 M5 螺钉和 2 只 T 形螺母；官方 ZP 清单另列 M5 平垫和弹垫，GLB 里没有。",
    },
  ],
}

const plate45: JointDefinition = {
  id: "miter-plate-45",
  title: "斜接 · 45° 型材连接板（TPDD-206）",
  status: "partial",
  statusLabel: "教学示意。零件是真网格，位置不是官方装配。",
  summary: "两根 2020 型材成 45° 斜接，5 孔连接板压在两根型材的顶面槽口上，用 5 颗 M5 螺钉和 T 形螺母固定。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPDD/631296615830663169.pdf",
  install: "先退出 5 颗 M5 螺钉，再取下连接板，最后沿两根型材的轴线分开。",
  machining: ["型材端面为方切，没有按 45° 斜接切角；连接板孔位按官方 2020A 孔径。"],
  members: [
    rail("plate45-a", "0° 型材", [-20, 18, -20], [0, 0, 0], [-45, 0, 0], "顶部槽口朝上，连接板压在顶面。"),
    rail("plate45-b", "45° 型材", [0, 19, -20], [0, 0, Math.PI / 4], [31.8, 31.8, 0], "顶部槽口朝上，连接板压在顶面。"),
    {
      id: "plate45-kit", role: "connector", label: "45° 型材连接板及附件", code: "TPDD-206-2020A-ZP",
      quantity: 1, presence: "mesh", assetId: "catalog-1917564096862", nodeName: "*", placementId: "plate45-kit",
      positionMm: [0, 0, 2], travelMm: [0, 0, 26], explodeAfter: 0.45, basis: "step-instance",
      note: "GLB 带 5 颗 M5 螺钉和 5 只 TPAA-N-6-M5；官方 ZP 清单另列 M5 平垫，GLB 里没有。",
    },
  ],
}

const threeWay3D: JointDefinition = {
  id: "three-way-3d",
  title: "立体角 · 三维连接件（TPDJ-206）",
  status: "partial",
  statusLabel: "教学示意。零件是真网格，位置不是官方装配。",
  summary: "三根 2020 型材在一点相交，三维连接件坐在角上，三颗紧定螺钉分别顶住三个方向的槽口。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPDJ/572565793034117121.pdf",
  install: "先退出三颗紧定螺钉，再沿 X、Y、Z 三个方向分开型材。",
  machining: ["三根型材端面均为方切，没有为连接件让位。"],
  members: [
    rail("three3d-x", "X 向型材", [-110, 10, -10], [0, 0, 0], [-45, 0, 0], "端面在角上，槽口朝向连接件。"),
    rail("three3d-y", "Y 向型材", [-10, -110, -10], [0, 0, Math.PI / 2], [0, -45, 0], "端面在角上，槽口朝向连接件。"),
    rail("three3d-z", "Z 向型材", [10, 10, -110], [0, -Math.PI / 2, 0], [0, 0, -45], "端面在角上，槽口朝向连接件。"),
    {
      id: "three3d-kit", role: "connector", label: "三维连接件及紧定螺钉", code: "TPDJ-206-ZP-OB",
      quantity: 1, presence: "mesh", assetId: "catalog-1115469157358", nodeName: "*", placementId: "three3d-kit",
      positionMm: [0, 0, 0], travelMm: null, basis: "step-instance",
      note: "GLB 带 3 颗 EDLR-S1-X1-M4-L6 紧定螺钉；位置为教学摆放，未按官方图逐点核对。",
    },
  ],
}

const panelCorner: JointDefinition = {
  id: "panel-corner",
  title: "面板角 · 面板角槽连接件（TPCT-206）",
  status: "partial",
  statusLabel: "单件展示。当前目录没有面板网格，未做装配示意。",
  summary: "面板角槽连接件装在 2020 型材的角槽里，两条直角边分别夹住两块面板，用两颗 M5 紧定螺钉锁紧。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPCT/640337112526262273.pdf",
  install: "先把两块面板分别推进连接件的两条槽，再从外侧拧紧两颗紧定螺钉。",
  machining: ["面板厚度和槽深没有在目录里建模。"],
  members: [
    {
      id: "panel-kit", role: "connector", label: "面板角槽连接件及紧定螺钉", code: "TPCT-206-ZP",
      quantity: 1, presence: "mesh", assetId: "catalog-1485473999732", nodeName: "*", placementId: "panel-kit",
      positionMm: [0, 0, 0], travelMm: null, basis: "step-instance",
      note: "GLB 里是 4 颗 EDLR-S1-X1-M4-L6；官方图档写 2 颗 M5 紧定螺钉，型号可能随批次不同，未逐件核对。",
    },
  ],
}

const elastic: JointDefinition = {
  id: "elastic",
  title: "弹性 · 弹性连接件（TPDS-206）",
  status: "partial",
  statusLabel: "单件展示。只适用 2020D / 2020E 型材，当前目录没有这两种截面。",
  summary: "弹性连接件卡在 2020D / 2020E 型材的槽口里，靠弹片和一颗 M6×15 螺钉把两根型材端面对接。",
  drawing: "https://static.jlcfa.com/Serial/T02/TPDS/628131834412019714.pdf",
  install: "把弹片压进一端型材的槽口，对齐另一端后拧入 M6×15 螺钉。",
  machining: ["2020D / 2020E 型材不在当前抓取目录里，因此没有做型材装配。"],
  members: [
    {
      id: "elastic-kit", role: "connector", label: "弹性连接件", code: "TPDS-206-A-ZP",
      quantity: 1, presence: "mesh", assetId: "catalog-2083882010044", nodeName: "*", placementId: "elastic-kit",
      positionMm: [0, 0, 0], travelMm: null, basis: "step-instance",
      note: "STEP 是单实体，不含螺钉；官方图档另列 M6×15 螺钉。",
    },
  ],
}

export const connectionJoints: JointDefinition[] = [
  endToEndJoint, sideTeeJoint, cornerSlotJoint, straightSplice, externalPlate, threeWayCorner, angle135, plate45, threeWay3D, panelCorner, elastic,
]
