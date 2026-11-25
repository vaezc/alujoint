import { ArrowLeft, ExternalLink } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { SiteHeader } from "../components/SiteHeader"
import { AssemblyDiagram } from "../components/AssemblyDiagram"
import { assembleSteps, guideTaskById } from "../data/guide"

const fields: { key: "profile" | "machining" | "nutAfter" | "fastenerFrom" | "toolFrom"; label: string }[] = [
  { key: "profile", label: "适用型材 · 槽型" },
  { key: "machining", label: "加工要求" },
  { key: "nutAfter", label: "螺母能否后装" },
  { key: "fastenerFrom", label: "紧固件从哪里装" },
  { key: "toolFrom", label: "工具从哪面进入" },
]

export function GuideTask() {
  const { task: taskId } = useParams()
  const task = guideTaskById(taskId)

  if (!task) {
    return (
      <div className="app-shell">
        <SiteHeader active="guide" />
        <main className="guide-page">
          <p className="guide-kicker">搭建指南</p>
          <h2>没有这个任务</h2>
          <p><Link className="ui-button" to="/guide"><ArrowLeft aria-hidden="true" size={15} /> 回到全部任务</Link></p>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <SiteHeader active="guide" />
      <main className="guide-page" id="guide-main">
        <p className="guide-back">
          <Link to="/guide"><ArrowLeft aria-hidden="true" size={15} /> 全部任务</Link>
          {task.id === "beam-to-post" && <Link to="/case/clothes-rack">返回 V20 衣架案例</Link>}
        </p>
        <header className="guide-intro">
          <p className="guide-kicker">搭建任务</p>
          <h2>{task.title}</h2>
          <p>{task.summary}</p>
        </header>
        <ul className="guide-options">
          {task.options.map((option) => (
            <li key={option.label} className="guide-option">
              <div className="guide-option-head">
                <h3>{option.label}</h3>
                <span className={"guide-status " + (option.status.endsWith("已核") ? "is-ok" : "is-todo")}>{option.status}</span>
              </div>
              {option.sampleId === "scene-side-tee" && <figure className="guide-example">
                <img src="/guide/tpdf-install.png" alt="竖直的支接型材端部侧面开孔，T 型螺母装入下方水平贯通型材的顶槽。" />
                <figcaption>嘉立创使用示例：竖杆开孔，横杆槽内放螺母。左右旋转整个接头时，两根杆的作用不变。</figcaption>
              </figure>}
              <dl className="guide-fields">
                {fields.map((field) => (
                  <div key={field.key} className="guide-field">
                    <dt>{field.label}</dt>
                    <dd>{option[field.key]}</dd>
                  </div>
                ))}
                {option.evidence && <div className="guide-field"><dt>核对依据</dt><dd>{option.evidence}</dd></div>}
                {option.pending && <div className="guide-field"><dt>动手前确认</dt><dd>{option.pending}</dd></div>}
              </dl>
              {option.panel && <AssemblyDiagram kind={option.panel} />}
              <div className="guide-option-actions">
                {option.sampleId === "clothes-rack" && <a className="ui-button" href={option.panel === "inset" ? "/case/clothes-rack#bottom" : "/case/clothes-rack#top-board"}>查看 V20 安装步骤</a>}
                {assembleSteps[option.sampleId.replace(/^scene-/, "")] ? (
                  <Link className="ui-button" to={`/guide/step/${option.sampleId.replace(/^scene-/, "")}`}>
                    分步装配<ExternalLink aria-hidden="true" size={14} />
                  </Link>
                ) : null}
                <Link className="ui-button" to={`/?sample=${option.sampleId}`}>
                  在 3D 中查看<ExternalLink aria-hidden="true" size={14} />
                </Link>
                {option.drawing ? (
                  <a className="ui-button" href={option.drawing} target="_blank" rel="noreferrer">
                    {option.drawingLabel ?? "官方图档"}<ExternalLink aria-hidden="true" size={14} />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
