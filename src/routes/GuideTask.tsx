import { ArrowLeft, ExternalLink } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { SiteHeader } from "../components/SiteHeader"
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
        </p>
        <header className="guide-intro">
          <p className="guide-kicker">搭建任务</p>
          <h2>{task.title}</h2>
          <p>{task.summary}</p>
        </header>
        <ul className="guide-options">
          {task.options.map((option) => (
            <li key={option.sampleId} className="guide-option">
              <div className="guide-option-head">
                <h3>{option.label}</h3>
                <span className={"guide-status " + (option.status === "已核对" ? "is-ok" : "is-todo")}>{option.status}</span>
              </div>
              <dl className="guide-fields">
                {fields.map((field) => (
                  <div key={field.key} className="guide-field">
                    <dt>{field.label}</dt>
                    <dd>{option[field.key]}</dd>
                  </div>
                ))}
              </dl>
              <div className="guide-option-actions">
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
