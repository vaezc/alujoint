import { ArrowLeft, ChevronLeft, ChevronRight, Maximize, RotateCcw } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { SiteHeader } from "../components/SiteHeader"
import { Viewport, type Selection } from "../components/Viewport"
import { sampleHasExplode, samples } from "../data/catalog"
import { assembleSteps } from "../data/guide"
import { clothesRack } from "../data/clothesRack"
import { rackAssembly } from "../data/rackAssembly"

const stepJoints = ["corner", "end-to-end", "side-tee"]

export function Assemble() {
  const { joint } = useParams()
  // 切换示例时用 key 重建，回到第一步并清空爆炸。
  return <AssembleView key={joint ?? ""} jointId={joint} />
}

function AssembleView({ jointId }: { jointId?: string }) {
  const isRack = jointId === clothesRack.id
  const sample = useMemo(() => isRack ? clothesRack : samples.find((item) => item.id === `scene-${jointId}`), [jointId, isRack])
  const steps = isRack ? rackAssembly : jointId ? assembleSteps[jointId] : undefined
  const [index, setIndex] = useState(0)
  const [frameToken, setFrameToken] = useState(0)
  const [explode, setExplode] = useState(0)
  const explodeRef = useRef(0)

  if (!sample || !steps) {
    return (
      <div className="app-shell">
        <SiteHeader active="guide" />
        <main className="guide-page">
          <p className="guide-kicker">分步装配</p>
          <h2>这个节点还没做分步</h2>
          <p>目前有：{stepJoints.map((id) => `scene-${id}`).join("、")}。</p>
          <p><Link className="ui-button" to="/guide"><ArrowLeft aria-hidden="true" size={15} /> 回到搭建指南</Link></p>
        </main>
      </div>
    )
  }

  const safeIndex = Math.min(index, steps.length - 1)
  const step = steps[safeIndex]
  const selection: Selection[] = step.highlight.map((id) => ({ placementId: id, nodeName: "*" }))
  const installed = isRack ? rackAssembly[safeIndex].installed : undefined
  const ghosted = installed ? new Set(sample.placements.map(({ id }) => id).filter((id) => !installed.includes(id))) : undefined
  const labels = step.highlight.map((id) => sample.placements.find((p) => p.id === id)?.label ?? id)
  const canExplode = sampleHasExplode(sample)
  const last = safeIndex === steps.length - 1
  const stepList = (
    <ol className="step-list">
      {steps.map((item, i) => (
        <li key={item.title} className={i === safeIndex ? "is-current" : i < safeIndex ? "is-done" : ""}>
          <button type="button" onClick={() => setIndex(i)}>
            <span className="case-step-index">{i + 1}</span>
            <span>{item.title}</span>
          </button>
        </li>
      ))}
    </ol>
  )

  function publishExplode(next: number) {
    const clamped = Math.min(1, Math.max(0, next))
    explodeRef.current = clamped
    setExplode(clamped)
  }

  return (
    <div className="app-shell">
      <SiteHeader active="guide" />
      <div className="step-layout">
        <div className="step-stage">
          <Viewport
            sample={sample}
            explodeRef={explodeRef}
            showExplodeLabels={explode > 0.18}
            selection={selection}
            ghosted={ghosted}
            frameToken={frameToken}
            onSelect={() => {}}
            onBounds={() => {}}
          />
          <div className="step-controls" role="group" aria-label="视图操作">
            <button type="button" className="ui-button" onClick={() => setFrameToken((v) => v + 1)}>
              <Maximize aria-hidden="true" size={15} />取景
            </button>
            <button type="button" className="ui-button" onClick={() => { publishExplode(0); setFrameToken((v) => v + 1) }}>
              <RotateCcw aria-hidden="true" size={15} />复位
            </button>
            {canExplode ? (
              <>
                <button type="button" className="ui-button" onClick={() => publishExplode(0)}>合拢</button>
                <button type="button" className="ui-button" onClick={() => publishExplode(1)}>拉开</button>
                <label className="step-slider">
                  分开
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(explode * 100)}
                    aria-label="爆炸程度"
                    onChange={(event) => publishExplode(Number(event.target.value) / 100)}
                  />
                </label>
              </>
            ) : null}
          </div>
        </div>
        <aside className={isRack ? "step-panel rack-steps" : "step-panel"} aria-label="装配步骤">
          <p className="guide-back">
            <Link to={isRack ? "/case/clothes-rack" : "/guide"}><ArrowLeft aria-hidden="true" size={15} /> {isRack ? "返回 V20 衣架案例" : "搭建指南"}</Link>
          </p>
          <p className="guide-kicker">分步装配 · {steps.length} 步</p>
          <h2>{sample.title}</h2>
          {!isRack && stepList}
          <div className="step-detail">
            <p className="step-detail-title">{isRack && `${safeIndex + 1} / ${steps.length}　`}{step.title}</p>
            <p>{step.detail}</p>
            {isRack ? <p className="step-hint"><strong>检查</strong>　{rackAssembly[safeIndex].check}</p> : <p className="step-hint">本步高亮：{labels.join("、")}</p>}
            {ghosted && ghosted.size > 0 ? <p className="step-ghost-hint">灰色轮廓是这一步还没装的零件。</p> : null}
          </div>
          <div className="step-nav">
            <button type="button" className="ui-button" disabled={safeIndex === 0} onClick={() => setIndex((v) => Math.max(0, v - 1))}>
              <ChevronLeft aria-hidden="true" size={15} /> 上一步
            </button>
            <button type="button" className="ui-button" disabled={last} onClick={() => setIndex((v) => Math.min(steps.length - 1, v + 1))}>
              下一步 <ChevronRight aria-hidden="true" size={15} />
            </button>
          </div>
          {isRack && <details className="rack-step-index"><summary>查看八步目录</summary>{stepList}</details>}
        </aside>
      </div>
    </div>
  )
}
