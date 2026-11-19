import type { ModelAsset, Placement, Sample, Vec3 } from "./catalog"

const assets = {
  rackBoard: "/models/rack-board.glb",
  rackInsetBoard: "/models/rack-inset-board.glb",
  rackFoot: "/models/rack-foot.glb",
  rackGusset: "/models/rack-gusset.glb",
  rackClip: "/models/rack-clip.glb",
  rackShaft: "/models/rack-shaft.glb",
  rackSupport: "/models/rack-support.glb",
}

export const clothesRackAssets: Record<string, ModelAsset> = Object.fromEntries(
  Object.entries(assets).map(([id, url]) => [id, { url, units: "m", nodes: [], explodeMm: {} }]),
)

const footHeight = 40
const uprightLength = 1450
const upperSurface = footHeight + uprightLength
const lowerSurface = upperSurface - 1300
const railColor = "#936038"
const signs = [-1, 1] as const
const placements: Placement[] = []

function place(
  id: string,
  label: string,
  assetId: string,
  positionMm: Vec3,
  rotation: Vec3 = [0, 0, 0],
  scale?: Vec3,
  tint?: string,
) {
  placements.push({ id, label, assetId, positionMm, rotation, explodeMm: [0, 0, 0], scale, tint })
}

function rail(id: string, label: string, length: number, positionMm: Vec3, rotation: Vec3) {
  place(id, `${label} · 2020 × ${length} mm`, "txcj", positionMm, rotation, [length / 100, 1, 1], railColor)
}

for (const x of signs) {
  for (const z of signs) {
    const corner = `${x}-${z}`
    rail(`upright-${corner}`, "立柱", uprightLength, [x * 440 - 10, footHeight, z * 200 - 10], [0, 0, Math.PI / 2])
    place(`foot-${corner}`, "Ø40 M6 脚杯 · 外形近似", "rackFoot", [x * 440, 0, z * 200])
    const inwardXRotation = x === 1 ? Math.PI : 0
    for (const [tier, surface] of [["upper", upperSurface], ["lower", lowerSurface]] as const) {
      place(`${tier}-gusset-under-x-${corner}`, "长梁下方角码 · 布置示意", "rackGusset",
        [x * 430, surface - 20, z * 200], [Math.PI, inwardXRotation, 0])
      place(`${tier}-gusset-under-z-${corner}`, "短梁下方角码 · 布置示意", "rackGusset",
        [x * 440, surface - 20, z * 190], [Math.PI, -z * Math.PI / 2, 0])
      place(`${tier}-gusset-inset-${corner}`, "框内水平角码 · 布置示意", "rackGusset",
        [x * 430, surface - 10, z * 190], [x * z * Math.PI / 2, 0, inwardXRotation])
    }
    place(`lower-gusset-above-x-${corner}`, "下框长梁上方角码 · 布置示意", "rackGusset",
      [x * 430, lowerSurface, z * 200], [0, inwardXRotation, 0])
    place(`lower-gusset-above-z-${corner}`, "下框短梁上方角码 · 布置示意", "rackGusset",
      [x * 440, lowerSurface, z * 190], [0, z * Math.PI / 2, 0])
  }
}

for (const [tier, surface] of [["upper", upperSurface], ["lower", lowerSurface]] as const) {
  for (const side of signs) {
    rail(`${tier}-long-${side}`, "横梁", 860, [-430, surface, side * 200 - 10], [0, 0, 0])
    rail(`${tier}-short-${side}`, "侧梁", 380, [side * 440 + 10, surface, -190], [0, -Math.PI / 2, 0])
    const clipY = tier === "upper" ? surface : surface - 12
    const clipLabel = tier === "upper" ? "2020 盖板托 · 分布示意" : "12 mm 板托 · 分布示意"
    for (const x of [-255, 0, 255]) {
      place(`${tier}-long-clip-${side}-${x}`, clipLabel, "rackClip",
        [x, clipY, side * 185], [0, side === 1 ? 0 : Math.PI, 0])
    }
    for (const z of [-100, 100]) {
      place(`${tier}-short-clip-${side}-${z}`, clipLabel, "rackClip",
        [side * 425, clipY, z], [0, side * Math.PI / 2, 0])
    }
  }
}

place("top-board", "覆盖式海洋板 · 900 × 420 × 12 mm", "rackBoard", [0, upperSurface + 6, 0],
  [0, 0, 0], [9, 1, 4.2])
place("lower-board", "嵌平式海洋板 · 858 × 378 × 12 mm · 四角避让", "rackInsetBoard", [0, lowerSurface - 6, 0])

// The shaft runs through both support bores under the two short top rails.
const supportFace = upperSurface - 20
const shaftCenterDrop = 50
for (const side of signs) {
  place(`shaft-support-${side}`, "BETV-C2N1-GP-D16-H50 · 支座及安装紧固件", "rackSupport", [side * 440, supportFace, 0])
}
place("shaft", "BAGA-C2-A-A-N-D16-L900 · Ø16 × 900 mm", "rackShaft", [0, supportFace - shaftCenterDrop, 0])

export const clothesRack: Sample = {
  id: "clothes-rack",
  code: "衣架",
  title: "衣架 · 2020 框架和 Ø16 光轴",
  kind: "scene",
  category: "设计项目",
  badge: "嘉立创 V20 · 光轴直装",
  summary: "复建嘉立创 V20 设计稿的 2020 落地框架。按购物车的 Ø16 × 900 mm 光轴和两只支座，展示顶框左右短梁下方直装。",
  caution: "光轴顶面距短梁底面 42 mm，光轴居中时两端各伸出支座 5 mm。",
  search: "衣架 挂衣架 2020 海洋板 光轴 BAGA-C2-A-A-N-D16-L900 BETV-C2N1-GP-D16-H50 EDLA-S1-M4-L10 TPAA-N-6-M4",
  placements,
  viewDirection: [1.1, 0.24, 2.4],
  geometry: [
    "嘉立创购物车整架外廓为宽 920 × 深 440 × 高 1502 mm，含 Ø40 脚杯。",
    "型材框架外廓为 900 × 420 mm，四根立柱长 1450 mm。上下框各两根 860 mm 长梁及两根 380 mm 短梁。",
    "顶板为 900 × 420 × 12 mm 覆盖式海洋板，底板为 858 × 378 × 12 mm 嵌平式海洋板，四角按设计稿轮廓避让。",
    "两只支座沿顶框左右短梁底槽安装，中心距 880 mm，支座轴向厚度 10 mm。轴孔中心距梁底 50 mm，扣除 Ø16 光轴半径后，梁底下净空为 42 mm。",
    "每只支座有两个 Ø4.5 mm 安装孔，孔距 42 mm，底脚厚 6 mm。",
  ],
  purpose: [
    "优先检查前后倾覆、左右侧摆和支座连接。框架四周为空，顶板和底板的层板托能固定水平板，但没有形成竖向抗侧摆支撑。",
    "当前采购方案预留后装背面 X 撑及防倾倒固定件。",
  ],
  bom: [
    { code: "2020 欧标", what: "1450 mm × 4，860 mm × 4，380 mm × 4", source: "嘉立创衣架 V20 × 1 套，原木色烤漆加转印。网页用本地 2020 截面重建。" },
    { code: "海洋板 国产素板", what: "12 mm × 2 块", source: "嘉立创原稿，覆盖式顶板一块、嵌平式底板一块。" },
    { code: "欧标 20 压铸角码", what: "32 件", source: "按最近核对的设计稿重建上下框连接，角码位置和外形为示意。" },
    { code: "12 mm 板托 / 2020 盖板托", what: "各 10 件", source: "嘉立创原稿数量，位置和外形采用示意。" },
    { code: "Ø40 脚杯", what: "4 件，螺杆长 30 mm，带胶垫", source: "嘉立创原稿另列 4 个 M6 地脚螺孔。" },
    { code: "BAGA-C2-A-A-N-D16-L900", what: "实心导向轴 × 1", source: "购物车。Ø16 × 900 mm，左右 A 型轴端。" },
    { code: "BETV-C2N1-GP-D16-H50", what: "无定位孔型 Ø16 支座 × 2", source: "购物车。轴孔中心高 50 mm，每只自带光轴夹紧螺钉。" },
    { code: "EDLA-S1-M4-L10", what: "M4×10 内六角圆柱头螺钉，购 100 颗，装 4 颗", source: "购物车。100 颗起订，每只支座底脚用 2 颗。" },
    { code: "TPAA-N-6-M4", what: "欧标 20 系列槽 6 的 M4 T 型螺母，购 20 颗，装 4 颗", source: "购物车。每只支座底脚用 2 颗。" },
  ],
  install: [
    "每只支座的两个安装孔沿同一条短梁底槽排布。先把光轴穿过两只支座，再用 M4×10 螺钉和 T 型螺母把组件固定在型材下方。",
    "试装时确认螺钉能压紧底脚且末端没有提前顶到槽底。光轴居中、两端各伸出约 5 mm 后，再锁紧支座自带的夹紧螺钉。",
  ],
  machining: ["原稿列有 4 个 M6 螺纹孔和 4 个 M6 地脚螺孔。网页模型按示意展示，孔深及脚杯螺纹有效啮合长度待核。"],
  sources: [
    { label: "嘉立创 BETV 支座图档", href: "https://static.jlcfa.com/Serial/B09/BETV/610771510168879106.pdf", note: "无定位孔型，取 D16、H50 尺寸。" },
    { label: "嘉立创 M4×10 螺钉", href: "https://www.jlcfa.com/serial/2129403909149.html?codeModel=EDLA-S1&productModel=EDLA-S1-M4-L10&series=1", note: "支座底脚安装螺钉。" },
    { label: "嘉立创槽 6 M4 T 型螺母", href: "https://www.jlcfa.com/serial/1914989413112.html?codeModel=TPAA-N&productModel=TPAA-N-6-M4&series=1", note: "与螺钉配套，装入短梁底槽。" },
  ],
  absent: ["板托、脚杯、角码、光轴支座和安装紧固件采用简化外形。", "支座与型材的配合按图纸核对，尚未实装。未进行整架承重或抗倾覆试验。"],
}
