import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { SiteHeader } from "../components/SiteHeader"
import { guideTasks } from "../data/guide"

export function Guide() {
  return (
    <div className="app-shell">
      <SiteHeader active="guide" />
      <main className="guide-page" id="guide-main">
        <header className="guide-intro material-intro">
          <div className="material-intro-copy">
            <p className="guide-kicker">搭建指南</p>
            <h2>铝型材怎么搭？</h2>
            <p>
              从接梁、装板或加斜撑开始，比较连接件、加工要求和工具进入方向。标有「待核对」的尺寸，动手前请对照对应型号的图纸。
            </p>
            <Link className="material-case-link" to="/case/clothes-rack">查看铝型材与海洋板衣架案例 <ChevronRight size={16} aria-hidden="true" /></Link>
          </div>
          <img className="material-photo" src="/guide/material-study.webp" alt="" />
        </header>
        <ul className="guide-tasks">
          {guideTasks.map((task) => (
            <li key={task.id}>
              <Link className="guide-card" to={`/guide/${task.id}`}>
                <img className="guide-card-thumb" src={`/guide/${task.id}.png`} alt="" loading="lazy" />
                <span className="guide-card-title">{task.title}</span>
                <span className="guide-card-summary">{task.summary}</span>
                <span className="guide-card-meta">
                  {task.options.length} 种候选连接
                  <ChevronRight aria-hidden="true" size={15} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <section className="guide-case">
          <h3>完整案例</h3>
          <Link className="guide-card" to="/case/clothes-rack">
            <img className="guide-rack-preview" src="/guide/v20-assembly.png" alt="" loading="lazy" />
            <span className="guide-card-title">衣架 · 嘉立创 V20</span>
            <span className="guide-card-summary">2020 落地框架 + Ø16 光轴。含切料、购物车、加工核对、装配顺序和收尾检查。</span>
            <span className="guide-card-meta">打开案例<ChevronRight aria-hidden="true" size={15} /></span>
          </Link>
        </section>
      </main>
    </div>
  )
}
