import { ArrowLeft, ArrowUpRight, Box, Download, ExternalLink, ListChecks } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { SiteHeader } from "../components/SiteHeader"
import { clothesRack } from "../data/clothesRack"
import { rackAssembly } from "../data/rackAssembly"
import { AssemblyDiagram } from "../components/AssemblyDiagram"

const assemblyText = [
  "V20 衣架装配清单",
  "按设计稿整理的试装顺序。角码、板托位置与紧固要求请对照随件图。",
  ...rackAssembly.map((step, index) => `${index + 1}. ${step.title}\n${step.detail}\n检查：${step.check}`),
].join("\n\n")

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
        <header className="guide-intro case-intro">
          <div className="case-intro-copy">
            <p className="guide-kicker">完整案例 · 嘉立创 V20</p>
            <h2>铝型材落地衣架</h2>
            <p>{clothesRack.summary}</p>
            <p className="case-links">
              <Link className="ui-button case-primary" to="/guide/step/clothes-rack"><Box size={16} aria-hidden="true" />跟着 3D 装衣架</Link>
              <a className="ui-button" href="#assembly"><ListChecks size={16} aria-hidden="true" />查看完整装配清单</a>
              <a download="V20-衣架装配清单.txt" href={`data:text/plain;charset=utf-8,${encodeURIComponent("\uFEFF" + assemblyText)}`}><Download size={15} aria-hidden="true" />保存离线清单</a>
            </p>
            <p className="case-related">
              <Link to="/guide/beam-to-post">上框短梁怎么接</Link>
              <a href="#bottom">底板怎么固定</a>
            </p>
          </div>
          <Link className="case-preview" to="/?sample=clothes-rack">
            <img src="/guide/v20-assembly.png" alt="V20 衣架整架视图，光轴位于顶板下方，底板嵌在下框内" />
            <small>框架平面 · 900 × 420 mm</small>
            <span>在 3D 中查看整架 <ArrowUpRight aria-hidden="true" size={15} /></span>
          </Link>
        </header>

        <section className="case-block">
          <h3>结构总览</h3>
          <ul className="case-bullets">
            {clothesRack.geometry.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>

        <section className="case-block">
          <h3>购物车（套装及另购件，共 5 项）</h3>
          <div className="case-table-wrap" tabIndex={0} role="region" aria-label="购物车明细">
          <table className="case-table">
            <thead><tr><th scope="col">料号</th><th scope="col">数量</th><th scope="col">说明</th></tr></thead>
            <tbody>
              {cart.map((row) => (
                <tr key={row.code}><th scope="row">{row.code}</th><td>{row.qty}</td><td>{row.note}</td></tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="case-foot">光轴和两只支座另购。固定支座的螺钉购 100 颗、螺母购 20 只，各装 4 个；框架套内件见下表。</p>
        </section>

        <section className="case-block">
          <h3>套装内明细</h3>
          <div className="case-table-wrap" tabIndex={0} role="region" aria-label="套装内明细">
          <table className="case-table">
            <thead><tr><th scope="col">项目</th><th scope="col">规格</th><th scope="col">备注</th></tr></thead>
            <tbody>
              {kit.map((row) => (
                <tr key={row.group}><th scope="row">{row.group}</th><td>{row.what}</td><td>{row.note}</td></tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        <section className="case-block" id="bottom">
          <h3>底板与板托</h3>
          <ul className="case-bullets">
            <li>嵌平底板 858 × 378 × 12 mm，四角已按原稿轮廓避让（长直段 796 mm、短直段 316 mm）。</li>
            <li>V20 用 12 mm 板托托住底板，不是面板角槽件；板托沿型材槽分布，位置按示意。</li>
            <li>先把槽内板托预装到位，再把底板落下；落板时确认四角避让不与立柱干涉。</li>
            <li>工具从板内侧伸入拧紧板托；支座锁紧时检查 T 型螺母横跨槽肩、底脚贴实、螺钉未提前顶到槽底。</li>
            <li>以上为试装建议；板托数量、孔位和实际配合待实物核对。</li>
            <li>支座底脚、角码、板托用的 T 型螺母，需在合框、封堵槽端之前从槽端滑入；框架锁死后能否后装待核对。</li>
            <li>盖板托用于固定覆盖式顶板，孔位和紧固方式以随件图为准。</li>
          </ul>
        </section>

        <section className="case-block" id="assembly">
          <h3>V20 衣架装配清单</h3>
          <p>按 V20 设计稿整理的试装顺序。角码与板托的位置以随货图为准。</p>
          <Link to="/guide/step/clothes-rack">逐步查看 3D 位置</Link>
          <ol className="case-steps">
            {rackAssembly.map((step, index) => (
              <li key={step.title} id={index === rackAssembly.length - 1 ? "top-board" : undefined}>
                <span className="case-step-index">{index + 1}</span>
                <div>
                  <p className="case-step-title">{step.title}</p>
                  <p>{step.detail}</p>
                  {step.diagram && <AssemblyDiagram kind={step.diagram} />}
                  <p><strong>检查</strong>　{step.check}</p>
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
