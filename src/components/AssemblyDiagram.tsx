import { modelFrameSpacingMm } from "../data/clothesRack"

type Diagram = "nuts" | "height" | "inset" | "cover" | "slot"
const captions: Record<Diagram, string> = {
  nuts: "短梁底面朝向读者。两根短梁各预放两只螺母，支座到第 6 步再装。",
  height: "侧视定位示意。两条基准线均取横梁上表面，按随货图确认间距后再锁紧。",
  inset: "嵌平底板截面示意。板边位于框内，内侧板托从下方承托。",
  cover: "覆盖顶板截面示意。整板盖住框架上表面，用盖板托固定。",
  slot: "槽口面板位置示意。板边与连接件的夹持关系需按所购 TPCT 图档核对。",
}

export function AssemblyDiagram({ kind }: { kind: Diagram }) {
  return <figure className="assembly-diagram">
    <svg viewBox="0 0 360 146" role="img" aria-label={captions[kind]}>
      {kind === "nuts" ? <>
        <text x="18" y="23">顶部短梁 · 底槽视图</text>
        {[47, 92].map(y => <g key={y}>
          <rect x="74" y={y} width="256" height="24" fill="#dadbd3" />
          <path d={`M74 ${y+12}h256`} stroke="#616862" strokeWidth="6" />
          <path d={`M16 ${y+12}h46l-8 -5m8 5-8 5`} fill="none" stroke="#94451f" strokeWidth="2" />
          {[184, 221].map(x => <g key={x}><rect x={x} y={y+5} width="18" height="14" rx="2" fill="#934a25" /><circle cx={x+9} cy={y+12} r="3" fill="#fff2dd" /></g>)}
        </g>)}
        <text x="14" y="137">开放槽端</text><text x="172" y="137">每槽 2 只 M4</text>
      </> : kind === "height" ? <>
        <g fill="#afb2a9"><rect x="38" y="18" width="12" height="116" /><rect x="144" y="18" width="12" height="116" />
          <rect x="50" y="18" width="94" height="10" /><rect x="50" y="107" width="94" height="10" /></g>
        <path d="M144 18h174 M144 107h174" stroke="#94451f" strokeDasharray="4 3" />
        <path d="M185 18v89m-4-82 4-7 4 7m-8 75 4 7 4-7" fill="none" stroke="#94451f" strokeWidth="2" />
        <text x="205" y="37">上框上表面</text><text x="204" y="69">{modelFrameSpacingMm} mm¹</text><text x="205" y="99">下框上表面</text>
        <text x="16" y="145">¹ 网页模型参考值</text>
      </> : <>
        <rect x="62" y="68" width="57" height="52" rx="2" fill="#b0b5ae" />
        <path d="M86 68v9h10v-9m23 22h-9v10h9" fill="none" stroke="#505850" strokeWidth="3" />
        {kind === "slot" ? <>
          <rect x="86" y="20" width="10" height="55" fill="#d9af77" />
          <path d="M98 68V47h7v21" fill="#92643b" /><text x="149" y="57">面板边缘</text><text x="149" y="88">槽口连接件</text>
        </> : <>
          <rect x={kind === "inset" ? 120 : 62} y={kind === "inset" ? 68 : 49} width={kind === "inset" ? 100 : 158} height="19" fill="#d9af77" />
          <path d={kind === "inset" ? "M119 91h43v-4h-43z" : "M119 71h34v-3h-34z"} fill="#845632" />
          <text x="231" y="72">12 mm 板</text><text x="138" y="112">{kind === "inset" ? "内侧板托" : "盖板托"}</text>
        </>}
        <text x="60" y="139">2020 型材</text>
      </>}
    </svg>
    <figcaption>{captions[kind]}</figcaption>
  </figure>
}
