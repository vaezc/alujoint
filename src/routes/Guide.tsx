import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { SiteHeader } from "../components/SiteHeader"
import { guideTasks } from "../data/guide"

export function Guide() {
  return (
    <div className="app-shell">
      <SiteHeader active="guide" />
      <main className="guide-page" id="guide-main">
        <header className="guide-intro">
          <p className="guide-kicker">搭建指南</p>
          <h2>从一个结构出发，选连接方式</h2>
          <p>
            先选你要做的结构，再看每种连接的适用型材、加工要求和装配方向。官方图档或适配没有逐点核对的字段，
            统一标「待核对」，不写死。
          </p>
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
            <span className="guide-card-title">衣架 · 嘉立创 V20</span>
            <span className="guide-card-summary">2020 落地框架 + Ø16 光轴。含切料、购物车、加工核对、装配顺序和收尾检查。</span>
            <span className="guide-card-meta">打开案例<ChevronRight aria-hidden="true" size={15} /></span>
          </Link>
        </section>
      </main>
    </div>
  )
}
