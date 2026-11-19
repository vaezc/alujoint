import { ArrowLeft, ExternalLink } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { SiteHeader } from "../components/SiteHeader"
import { clothesRack } from "../data/clothesRack"

// 单买件（购物车五项）。购 vs 装按任务书口径。
const cart = [
  { code: "嘉立创 V20 套装", qty: "1 套", note: "含 2020 框架、上下框角码、板托、脚杯等套内件。" },
  { code: "BAGA-C2-A-A-N-D16-L900", qty: "1 根", note: "Ø16 × 900 mm 实心导向轴，两端 A 型轴端。" },
  { code: "BETV-C2N1-GP-D16-H50", qty: "2 只", note: "Ø16 支座，倒装在两根顶部短梁下方。" },
  { code: "EDLA-S1-M4-L10", qty: "购 100 / 装 4", note: "支座底脚 M4×10 螺钉，每只支座 2 颗。" },
  { code: "TPAA-N-6-M4", qty: "购 20 / 装 4", note: "槽 6 M4 T 型螺母，每只支座 2 颗。" },
]

// 套装内明细（切料 / 板件 / 配件）。位置与外形多为示意。
const kit = [
  { group: "切料", what: "2020 欧标：1450 mm × 4，860 mm × 4，380 mm × 4", note: "网页用本地 2020 截面重建。" },
  { group: "板件", what: "覆盖式顶板 900 × 420 × 12，嵌平底板 858 × 378 × 12", note: "底板四角按原稿轮廓避让；长直段 796 mm、短直段 316 mm。" },
  { group: "配件", what: "压铸角码 32 件、板托/盖板托各 10 件、Ø40 脚杯 4 件", note: "位置和外形为示意。" },
  { group: "孔位", what: "原稿 4 个 M6 螺纹孔 + 4 个 M6 地脚螺孔", note: "孔深与脚杯螺纹啮合长度待核。" },
]

const assemblySteps = [
  { title: "预装脚杯与上下框", detail: "先把 4 只脚杯装到立柱底端，再把上下框的四组角码预紧到能微调的程度。", status: "试装建议" },
  { title: "校方并调水平", detail: "立起框架，靠脚杯调平，确认四根立柱垂直、上下框方正后再把角码完全锁紧。", status: "试装建议" },
  { title: "放入嵌平底板", detail: "嵌平底板 858 × 378 × 12 mm 落在下层 12 mm 板托上；先装好槽内板托再落板。", status: "试装建议" },
  { title: "预穿光轴与支座", detail: "先把 Ø16 × 900 mm 光轴穿进两只支座，再把组件抬到顶框下方。", status: "试装建议" },
  { title: "锁支座到短梁底槽", detail: "每只支座两个 M4×10 螺钉配 T 型螺母，沿同一条短梁底槽固定；确认螺母已横跨槽肩。", status: "试装建议" },
  { title: "轴居中后锁夹紧螺钉", detail: "光轴居中、两端各伸出约 5 mm，再锁支座自带的夹紧螺钉。", status: "试装建议" },
  { title: "最后装顶板", detail: "覆盖式顶板 900 × 420 × 12 mm 最后放上，避免先装挡手。", status: "试装建议" },
]

const checks = [
  { title: "接头松动", detail: "复查上下框角码、支座底脚螺钉、T 型螺母是否压紧；支座底脚要压到型材面上。" },
  { title: "框架弹性侧摆", detail: "四周为空、无竖向抗侧摆支撑，侧摆明显时按需后装背面 X 撑。" },
  { title: "前后倾覆", detail: "按最终摆放条件决定是否加防倾倒固定件；整架抗倾覆能力待实测，不要当成已验证。" },
]

export function Case() {
  const { id } = useParams()
  if (id !== clothesRack.id) {
    return (
      <div className="app-shell">
        <SiteHeader active="guide" />
        <main className="guide-page">
          <p className="guide-kicker">案例</p>
          <h2>没有这个案例</h2>
          <p><Link className="ui-button" to="/guide"><ArrowLeft aria-hidden="true" size={15} /> 回到搭建指南</Link></p>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <SiteHeader active="guide" />
      <main className="guide-page" id="case-main">
        <p className="guide-back">
          <Link to="/guide"><ArrowLeft aria-hidden="true" size={15} /> 搭建指南</Link>
        </p>
        <header className="guide-intro">
          <p className="guide-kicker">完整案例 · 嘉立创 V20</p>
          <h2>{clothesRack.title}</h2>
          <p>{clothesRack.summary}</p>
          <p className="case-links">
            <Link to="/?sample=clothes-rack">在 3D 中查看整架</Link>
            <Link to="/guide/beam-to-post">上框短梁怎么接</Link>
            <a href="#bottom">底板怎么固定</a>
          </p>
        </header>

        <section className="case-block">
          <h3>结构总览</h3>
          <ul className="case-bullets">
            {clothesRack.geometry.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>

        <section className="case-block">
          <h3>购物车（单买件，5 项）</h3>
          <table className="case-table">
            <thead><tr><th scope="col">料号</th><th scope="col">数量</th><th scope="col">说明</th></tr></thead>
            <tbody>
              {cart.map((row) => (
                <tr key={row.code}><th scope="row">{row.code}</th><td>{row.qty}</td><td>{row.note}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="case-foot">螺钉购 100 装 4、螺母购 20 装 4，其余按套装随附。</p>
        </section>

        <section className="case-block">
          <h3>套装内明细</h3>
          <table className="case-table">
            <thead><tr><th scope="col">项目</th><th scope="col">规格</th><th scope="col">备注</th></tr></thead>
            <tbody>
              {kit.map((row) => (
                <tr key={row.group}><th scope="row">{row.group}</th><td>{row.what}</td><td>{row.note}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="case-block" id="bottom">
          <h3>底板与板托</h3>
          <ul className="case-bullets">
            <li>嵌平底板 858 × 378 × 12 mm，四角已按原稿轮廓避让（长直段 796 mm、短直段 316 mm）。</li>
            <li>V20 用 12 mm 板托托住底板，不是面板角槽件；板托沿型材槽分布，位置按示意。</li>
            <li>先把槽内板托预装到位，再把底板落下；落板时确认四角避让不与立柱干涉。</li>
            <li>工具从板内侧伸入拧紧板托；支座锁紧时检查 T 型螺母横跨槽肩、底脚贴实、螺钉未提前顶到槽底。</li>
            <li>以上为试装建议；板托数量、孔位和实际配合待实物核对。</li>
          </ul>
        </section>

        <section className="case-block">
          <h3>装配顺序</h3>
          <ol className="case-steps">
            {assemblySteps.map((step, index) => (
              <li key={step.title}>
                <span className="case-step-index">{index + 1}</span>
                <div>
                  <p className="case-step-title">{step.title} <span className="guide-status is-todo">{step.status}</span></p>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="case-block">
          <h3>收尾检查</h3>
          <dl className="case-checks">
            {checks.map((check) => (
              <div key={check.title}><dt>{check.title}</dt><dd>{check.detail}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-block">
          <h3>来源与边界</h3>
          <ul className="case-bullets">
            {clothesRack.sources.map((source) => (
              <li key={source.href}>
                <a href={source.href} target="_blank" rel="noreferrer">{source.label} <ExternalLink aria-hidden="true" size={13} /></a>：{source.note}
              </li>
            ))}
            {clothesRack.absent.map((line) => <li key={line}>未覆盖：{line}</li>)}
          </ul>
        </section>
      </main>
    </div>
  )
}
