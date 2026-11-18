export type Vec3 = [number, number, number]

export const screwReleaseProgress = 0.55

/** Roles a Euro 20 joint can contain. Absent roles stay in the bill and never become meshes. */
export type JointRole = "profile" | "connector" | "screw" | "tnut" | "washer" | "lock-washer" | "cover"

/**
 * Why a member moves when the explode slider goes from 0 to 1.
 * step-instance: direction comes from a STEP occurrence already in a downloaded file.
 * illustrative: the part is a real mesh, but the offset is only so the pieces can be told apart.
 * unsupported: no downloaded solid, so there is no axis and nothing is drawn.
 */
export type AxisBasis = "step-instance" | "illustrative" | "unsupported"

export type JointMember = {
  id: string
  role: JointRole
  label: string
  code: string
  quantity: number | null
  presence: "mesh" | "absent"
  assetId?: string
  nodeName?: string
  placementId?: string
  positionMm?: Vec3
  rotation?: Vec3
  /** Offset at explode = 1, in millimeters. Null when the part is absent or has no defensible direction. */
  travelMm: Vec3 | null
  explodeAfter?: number
  explodeUntil?: number
  explodeAsset?: boolean
  basis: AxisBasis
  note: string
}

export type JointDefinition = {
  id: string
  title: string
  status: "partial"
  statusLabel: string
  initialPoseLabel?: string
  summary: string
  drawing?: string
  install?: string
  machining?: string[]
  members: JointMember[]
}

/** GLB scene axes, directed from the screw tip toward the head. */
export const tpdhScrewTravelMm = {
  NAUO2: [55, 0, 0],
  NAUO3: [0, 0, 55],
  NAUO4: [0, 55, 0],
} as const satisfies Record<string, Vec3>

/** Bracket slot opening measured along the contact face, millimeters in the TYZC file. */
const slotCenter = 13.5
// The mounting planes are x = 0 and y = 0. The locating ribs enter the T-slots.
const stackX = slotCenter
const stackY = slotCenter
const innerFace = 4
const flatWasher = 1
const splitWasher = 0.9
const shank = 10

// Clear both screw heads before lifting the perpendicular washer stacks.
const screwAEnd = 0.16
const screwBEnd = 0.32
const washersAEnd = 0.48
const washersBEnd = 0.64
const bracketEnd = 0.82

const profileA: Vec3 = [-20, 0, -10]
const profileB: Vec3 = [0, 0, 10]
const bracketAt: Vec3 = [0, 0, 0]

const screwA: Vec3 = [stackX, innerFace + flatWasher + splitWasher - shank, 0]
const flatA: Vec3 = [stackX, innerFace + flatWasher, 0]
const splitA: Vec3 = [stackX, innerFace + flatWasher + splitWasher, 0]
const nutA: Vec3 = [stackX, -5.3, 0]

const screwB: Vec3 = [innerFace + flatWasher + splitWasher - shank, stackY, 0]
const flatB: Vec3 = [innerFace + flatWasher, stackY, 0]
const splitB: Vec3 = [innerFace + flatWasher + splitWasher, stackY, 0]
const nutB: Vec3 = [-5.3, stackY, 0]

const alongY: Vec3 = [Math.PI / 2, 0, 0]
const tipDownY: Vec3 = [0, 0, -Math.PI / 2]
const tipDownX: Vec3 = [0, 0, Math.PI]
const holeDownX: Vec3 = [0, -Math.PI / 2, 0]
const barBRot: Vec3 = [Math.PI, 0, -Math.PI / 2]

export const euroJoint: JointDefinition = {
  id: "euro20-corner-joint",
  title: "欧标 20 角部连接",
  status: "partial",
  statusLabel: "教学摆放。零件是真网格，位置不是官方装配。",
  summary: "两根型材在角上相遇，角座贴在两侧槽口外。螺钉、垫圈和 T 形螺母沿槽口方向排成一串。",
  members: [
    {
      id: "profile-x",
      role: "profile",
      label: "型材，沿 X",
      code: "TXCJ-H6-2020-L100",
      quantity: 1,
      presence: "mesh",
      assetId: "txcj",
      nodeName: "*",
      placementId: "bar-x",
      positionMm: profileA,
      rotation: [0, 0, 0],
      travelMm: [42, 0, 0],
      explodeAfter: bracketEnd,
      basis: "illustrative",
      note: "槽口朝向角座。拉开时沿长度移出，不是切断或让位。",
    },
    {
      id: "profile-y",
      role: "profile",
      label: "型材，沿 Y",
      code: "TXCJ-H6-2020-L100",
      quantity: 1,
      presence: "mesh",
      assetId: "txcj",
      nodeName: "*",
      placementId: "bar-y",
      positionMm: profileB,
      rotation: barBRot,
      travelMm: [0, 42, 0],
      explodeAfter: bracketEnd,
      basis: "illustrative",
      note: "同一只型材转到另一条边。两端没有切角，角上只是靠在一起。",
    },
    {
      id: "corner-body",
      role: "connector",
      label: "角座",
      code: "TYZC-H6-206-2020-DZ",
      quantity: 1,
      presence: "mesh",
      assetId: "tyzc",
      nodeName: "*",
      placementId: "bracket",
      positionMm: bracketAt,
      rotation: [0, 0, 0],
      travelMm: [22, 22, 0],
      explodeAfter: washersBEnd,
      explodeUntil: bracketEnd,
      basis: "illustrative",
      note: "H6 的 DZ 本体，不是图上的 X6 带盖角座。两条安装槽中点取 13.5 mm，定位凸缘伸入型材槽口。",
    },
    {
      id: "screw-a",
      role: "screw",
      label: "螺钉，X 向型材",
      code: "EDLA-S1-M4-L10",
      quantity: 1,
      presence: "mesh",
      assetId: "edla",
      nodeName: "*",
      placementId: "screw-a",
      positionMm: screwA,
      rotation: tipDownY,
      travelMm: [0, 60, 0],
      explodeUntil: screwAEnd,
      basis: "illustrative",
      note: "文件轴是 X，尖端在 0、头在 −14。这里把尖端朝向型材。使用示例印的是 EDLG，这只是 EDLA。",
    },
    {
      id: "split-a",
      role: "lock-washer",
      label: "弹垫，X 向型材",
      code: "EPDB-S1W-B1-4",
      quantity: 1,
      presence: "mesh",
      assetId: "epdb",
      nodeName: "*",
      placementId: "split-a",
      positionMm: splitA,
      rotation: alongY,
      travelMm: [0, 50, 0],
      explodeAfter: screwBEnd,
      explodeUntil: washersAEnd,
      basis: "illustrative",
      note: "网格是厚 0.9 mm 的平面开口环，孔轴为文件 Z。不是螺旋弹簧，也没有自由高度。",
    },
    {
      id: "flat-a",
      role: "washer",
      label: "平垫，X 向型材",
      code: "EPDA-S1W-K-4",
      quantity: 1,
      presence: "mesh",
      assetId: "epda",
      nodeName: "*",
      placementId: "flat-a",
      positionMm: flatA,
      rotation: alongY,
      travelMm: [0, 40, 0],
      explodeAfter: screwBEnd,
      explodeUntil: washersAEnd,
      basis: "illustrative",
      note: "Ø12 × 1 mm，孔轴为文件 Z，垫在弹垫和角座内侧面之间。图上的料号与这只相同。",
    },
    {
      id: "nut-a",
      role: "tnut",
      label: "T 形螺母，X 向型材",
      code: "TPAA-D-6-M4",
      quantity: 1,
      presence: "mesh",
      assetId: "tpaaD6M4",
      nodeName: "*",
      placementId: "nut-a",
      positionMm: nutA,
      rotation: [0, 0, 0],
      travelMm: [42, 0, 0],
      explodeAfter: bracketEnd,
      basis: "illustrative",
      note: "镀锌 D，放在槽口里当形状示意。不是清单上的镀镍 TPAA-N-6-M4。拉开时随型材移动，仍留在槽内。",
    },
    {
      id: "screw-b",
      role: "screw",
      label: "螺钉，Y 向型材",
      code: "EDLA-S1-M4-L10",
      quantity: 1,
      presence: "mesh",
      assetId: "edla",
      nodeName: "*",
      placementId: "screw-b",
      positionMm: screwB,
      rotation: tipDownX,
      travelMm: [60, 0, 0],
      explodeAfter: screwAEnd,
      explodeUntil: screwBEnd,
      basis: "illustrative",
      note: "另一条边上的同一只 EDLA。尖端朝向这根型材，不和 M5 螺栓混用。",
    },
    {
      id: "split-b",
      role: "lock-washer",
      label: "弹垫，Y 向型材",
      code: "EPDB-S1W-B1-4",
      quantity: 1,
      presence: "mesh",
      assetId: "epdb",
      nodeName: "*",
      placementId: "split-b",
      positionMm: splitB,
      rotation: holeDownX,
      travelMm: [50, 0, 0],
      explodeAfter: washersAEnd,
      explodeUntil: washersBEnd,
      basis: "illustrative",
      note: "与第一条边相同的平面弹垫，沿这根螺钉的轴分开。",
    },
    {
      id: "flat-b",
      role: "washer",
      label: "平垫，Y 向型材",
      code: "EPDA-S1W-K-4",
      quantity: 1,
      presence: "mesh",
      assetId: "epda",
      nodeName: "*",
      placementId: "flat-b",
      positionMm: flatB,
      rotation: holeDownX,
      travelMm: [40, 0, 0],
      explodeAfter: washersAEnd,
      explodeUntil: washersBEnd,
      basis: "illustrative",
      note: "与第一条边相同的平垫。",
    },
    {
      id: "nut-b",
      role: "tnut",
      label: "T 形螺母，Y 向型材",
      code: "TPAA-D-6-M4",
      quantity: 1,
      presence: "mesh",
      assetId: "tpaaD6M4",
      nodeName: "*",
      placementId: "nut-b",
      positionMm: nutB,
      rotation: barBRot,
      travelMm: [0, 42, 0],
      explodeAfter: bracketEnd,
      basis: "illustrative",
      note: "同样是镀锌 TPAA-D-6-M4，拉开时随型材留在槽内。",
    },
    {
      id: "cover",
      role: "cover",
      label: "盖板",
      code: "盖板",
      quantity: null,
      presence: "absent",
      travelMm: null,
      basis: "unsupported",
      note: "使用示例左图印了盖板，没有料号，也没有网格。",
    },
  ],
}

export function basisLabel(basis: AxisBasis): string {
  switch (basis) {
    case "step-instance":
      return "实例轴"
    case "illustrative":
      return "示意分开"
    case "unsupported":
      return "没有轴"
    default: {
      const exhaustive: never = basis
      return exhaustive
    }
  }
}
