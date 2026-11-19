import { clothesRack } from "./clothesRack"

function parts(...prefixes: string[]) {
  return clothesRack.placements
    .filter(({ id }) => prefixes.some((prefix) => id.startsWith(prefix)))
    .map(({ id }) => id)
}

export const rackAssembly = [
  {
    title: "分料，认清上下板",
    detail: "在平地铺软垫。分出 4 根 1450 mm 立柱、4 根 860 mm 长梁和 4 根 380 mm 短梁。四角有避让的 858 × 378 mm 板放下层；900 × 420 mm 整板最后盖顶。备好匹配螺钉的内六角扳手、卷尺和水平尺。",
    check: "对照 V20 配件表点清角码、板托、盖板托和脚杯。另取两只 H50 支座、一根 900 mm 光轴、4 颗 M4×10 和 4 只槽 6 M4 螺母。",
    highlight: ["lower-board", "top-board"],
  },
  {
    title: "趁槽端开放，预放螺母",
    detail: "挑出上框左右两根短梁，标出朝下的一面。每根底槽从端头滑入 2 只槽 6 M4 螺母，移到梁中部，留给一只支座。同一槽若还要装角码，按最终位置从远到近送入槽内件。按供货图在上下框和立柱相应槽内预放角码、下层板托及上层盖板托所需的槽内件。",
    check: "拿支座贴一次短梁，两孔都对同一底槽，孔距约 42 mm。把预留的 4 只螺母与角码用件分开确认，再合框。",
    highlight: parts("upper-short--1", "upper-short-1", "shaft-support"),
  },
  {
    title: "装脚杯，松装框架",
    detail: "认准立柱底端与脚杯匹配的 M6 地脚孔，先用手旋入四只脚杯，调到近似等高。平放拼起两个侧框，再由两人扶住，用长梁连接两侧。上下框各用两根长梁和两根短梁；按 V20 图安装上下框角码，先拧到连接能保持位置、仍可微调。",
    check: "两根已留支座螺母的短梁都在顶部，槽口朝下；四根下梁齐高，下框角码给底板四角留出避让位置。",
    highlight: parts("upright", "foot", "upper-long-", "lower-short-"),
  },
  {
    title: "校方、调平，固定板托",
    detail: "扶稳架子，在同一组角点量上下框各自的两条对角线，调到分别相等；再检查立柱垂直、横梁水平、四脚落地。分几次交替紧固角码并复测。按供货图安装下框内侧的 12 mm 板托，趁板还没落下从内侧紧固。",
    check: "用底板边缘试靠板托，确认各承托面共面，板面设计高度与下框上表面齐平。紧固件的扭矩以对应配件说明为准。",
    highlight: parts("lower-long-clip", "lower-short-clip", "foot"),
  },
  {
    title: "从架内落入嵌平底板",
    detail: "从开放的侧面将底板斜送入架内，在下框上方转平，对齐四角缺口，再水平慢慢落到板托上。遇到干涉就抬起板，检查框是否方正、角码方向和板托位置。",
    check: "逐角轻按，四角不翘，板边与下框齐平，各板托都实际接触板底。按随件说明完成板件固定。",
    highlight: ["lower-board", ...parts("lower-long-clip", "lower-short-clip")],
  },
  {
    title: "穿轴，托住组件装到梁下",
    detail: "在台面上略松两只支座自带的夹紧螺钉，把 Ø16 × 900 mm 光轴穿过两个轴孔。两只支座底脚朝上，分别对准左右短梁底槽。请一人持续托住组件，另一人将每只底脚的两颗 M4×10 拧入预留螺母，四颗先带上螺纹。",
    check: "支座位于短梁下方，底脚两孔沿同一条槽。确认每只螺母横跨槽肩，每颗螺钉均能压紧底脚且没有提前顶槽底。",
    highlight: ["shaft", ...parts("shaft-support")],
  },
  {
    title: "居中锁轴，试穿衣架钩",
    detail: "把两支座调到相同的前后位置，保持轴孔同轴，交替紧固底脚。沿轴向居中后，再锁紧两只支座自带的夹紧螺钉。居中参考值为轴两端各伸出支座外侧约 5 mm。",
    check: "轻推轴端确认没有窜动。短梁底面到光轴顶面的设计净空为 42 mm，拿平时用的最大衣架钩试挂、试取一次。",
    highlight: ["shaft", ...parts("shaft-support")],
  },
  {
    title: "装顶板，在使用位置复查",
    detail: "把覆盖式顶板放到上框，四边对正，按随件图用盖板托固定。移到使用位置后再调脚杯。先空架检查，再从少量衣物开始，沿杆均匀挂放，观察板件、挂杆、接头和脚杯。",
    check: "发现接头滑移、轴窜动或脚杯离地就先卸载。接头紧固后仍明显左右晃，可补背面 X 撑；前后有倾倒趋势，应先做适合现场的防倾倒固定。整架额定承重尚无实测值。",
    highlight: ["top-board", ...parts("upper-long-clip", "upper-short-clip", "foot")],
  },
]
