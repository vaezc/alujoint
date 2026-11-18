import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@ui-sdk/react/dialog"
import { Box, ChevronRight, Crosshair, FileText, Info, LibraryBig, Maximize, Pause, Play, RotateCcw, X } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { CatalogList } from "./components/CatalogList"
import { DetailPanel } from "./components/DetailPanel"
import { Viewport, type BoundsMm, type Selection } from "./components/Viewport"
import { sampleHasExplode, samples, type FilterId } from "./data/catalog"

type Sheet = "none" | "catalog" | "notes"

export function App() {
  const [activeId, setActiveId] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("sample")
    return samples.find((item) => item.id === requested)?.id ?? samples[0]?.id ?? ""
  })
  const [filter, setFilter] = useState<FilterId>("all")
  const [query, setQuery] = useState("")
  const [explode, setExplode] = useState(0)
  const explodeRef = useRef(0)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [frameToken, setFrameToken] = useState(0)
  const [bounds, setBounds] = useState<BoundsMm | null>(null)
  const [sheet, setSheet] = useState<Sheet>("none")
  const [playing, setPlaying] = useState(false)

  const sample = samples.find((item) => item.id === activeId) ?? samples[0]
  const canExplode = sample ? sampleHasExplode(sample) : false

  function publishExplode(next: number) {
    const clamped = Math.min(1, Math.max(0, next))
    explodeRef.current = clamped
    setExplode(clamped)
  }

  useEffect(() => {
    const desktop = window.matchMedia("(width >= 68rem)")
    function closeSheet(event: MediaQueryListEvent) {
      if (event.matches) setSheet("none")
    }
    desktop.addEventListener("change", closeSheet)
    return () => desktop.removeEventListener("change", closeSheet)
  }, [])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    let lastPublish = last
    let stopped = false
    const step = (now: number) => {
      if (stopped) return
      const delta = now - last
      last = now
      const next = Math.min(1, explodeRef.current + delta / 2600)
      explodeRef.current = next
      if (now - lastPublish >= 90 || next >= 1) {
        lastPublish = now
        setExplode(next)
      }
      if (next >= 1) {
        stopped = true
        setPlaying(false)
        setFrameToken((value) => value + 1)
        return
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
    }
  }, [playing])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey ||
        !(target instanceof HTMLElement) || target.isContentEditable ||
        target.matches("input, textarea, select") || sheet !== "none") return

      if (event.key === "/") {
        const input = document.querySelector<HTMLInputElement>("#catalog-search")
        event.preventDefault()
        if (input?.getClientRects().length) input.focus()
        else setSheet("catalog")
        return
      }
      if (event.key === "f" || event.key === "F") {
        setFrameToken((value) => value + 1)
      }
      if (event.key === "r" || event.key === "R") {
        setPlaying(false)
        publishExplode(0)
        setSelection(null)
        setFrameToken((value) => value + 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sheet])

  function selectSample(id: string) {
    setActiveId(id)
    setPlaying(false)
    publishExplode(0)
    setSelection(null)
    setBounds(null)
    setFrameToken((value) => value + 1)
    setSheet("none")
  }

  if (!sample) {
    return <p className="p-6 text-sm">目录是空的。</p>
  }

  const catalogProps = {
    samples,
    activeId: sample.id,
    filter,
    query,
    onFilter: setFilter,
    onQuery: setQuery,
    onSelect: selectSample,
  }
  const detailProps = { sample, selection, onSelect: setSelection }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#model-view">跳到三维视图</a>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark"><Box aria-hidden="true" size={20} /></span>
          <h1>铝构 <span>AluJoint</span></h1>
        </div>
        <span className="workspace-name">三维装配工作台</span>
        <div className="mobile-actions">
          <WorkspaceSheet
            title="目录"
            icon={<LibraryBig aria-hidden="true" size={16} />}
            open={sheet === "catalog"}
            onOpenChange={(open) => setSheet(open ? "catalog" : "none")}
            initialFocus="#mobile-catalog-search"
          >
            <CatalogList {...catalogProps} inputId="mobile-catalog-search" />
          </WorkspaceSheet>
          <WorkspaceSheet
            title="说明"
            icon={<FileText aria-hidden="true" size={16} />}
            open={sheet === "notes"}
            onOpenChange={(open) => setSheet(open ? "notes" : "none")}
          >
            <DetailPanel {...detailProps} />
          </WorkspaceSheet>
        </div>
      </header>

      <div className="workspace">
        <aside className="workspace-rail catalog-rail" aria-label="模型目录">
          <CatalogList {...catalogProps} />
        </aside>

        <main className="model-panel" id="model-view" tabIndex={-1} aria-labelledby="model-title">
          <div className="model-heading">
            <div className="model-context">
              <Box aria-hidden="true" size={14} />
              {sample.category ?? "手写样品"}
              <ChevronRight aria-hidden="true" size={13} />
              <span>{sample.code}</span>
            </div>
            <h2 id="model-title">{sample.title}</h2>
            {sample.caution ? <p className="model-note"><Info aria-hidden="true" size={15} />{sample.caution}</p> : null}
          </div>

          <div className="model-stage">
            {sample.placements.length > 0 ? <span className="stage-label"><span aria-hidden="true" />三维视图</span> : null}
            {sample.placements.length === 0 ? (
              <EmptyModel />
            ) : (
              <Viewport
                sample={sample}
                explodeRef={explodeRef}
                showExplodeLabels={explode > 0.18}
                selection={selection}
                frameToken={frameToken}
                onSelect={setSelection}
                onBounds={setBounds}
              />
            )}
          </div>

          <div className="viewer-controls">
            <div className="viewer-toolbar" role="group" aria-label="视图操作">
              <button type="button" className="ui-button" aria-keyshortcuts="F" onClick={() => setFrameToken((value) => value + 1)}>
                <Maximize aria-hidden="true" size={15} />
                取景
              </button>
              <button
                type="button"
                className="ui-button"
                aria-keyshortcuts="R"
                onClick={() => {
                  setPlaying(false)
                  publishExplode(0)
                  setSelection(null)
                  setFrameToken((value) => value + 1)
                }}
              >
                <RotateCcw aria-hidden="true" size={15} />
                复位
              </button>
              {canExplode ? (
                <div className="explode-controls" role="group" aria-label="爆炸视图">
                  <div className="pose-buttons">
                    <button
                      type="button"
                      className="ui-button"
                      aria-pressed={explode === 0}
                      onClick={() => {
                        setPlaying(false)
                        publishExplode(0)
                        setFrameToken((value) => value + 1)
                      }}
                    >
                      {sample.assembly?.initialPoseLabel ?? "合拢"}
                    </button>
                    <button
                      type="button"
                      className="ui-button"
                      aria-pressed={explode === 1}
                      onClick={() => {
                        setPlaying(false)
                        publishExplode(1)
                        setFrameToken((value) => value + 1)
                      }}
                    >
                      拉开
                    </button>
                    <button
                      type="button"
                      className="ui-button"
                      onClick={() => {
                        if (playing) {
                          setPlaying(false)
                          setFrameToken((value) => value + 1)
                          return
                        }
                        if (explodeRef.current >= 1) publishExplode(0)
                        setPlaying(true)
                      }}
                    >
                      {playing ? <Pause aria-hidden="true" size={14} /> : <Play aria-hidden="true" size={14} />}
                      {playing ? "暂停" : "播放"}
                    </button>
                  </div>
                  <label className="explode-range">
                    <span className="sr-only">爆炸程度</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(explode * 100)}
                      aria-label="爆炸程度"
                      onChange={(event) => {
                        setPlaying(false)
                        publishExplode(Number(event.target.value) / 100)
                      }}
                      onPointerUp={() => setFrameToken((value) => value + 1)}
                    />
                    <span aria-hidden="true">{Math.round(explode * 100)}%</span>
                  </label>
                </div>
              ) : null}
            </div>
            <div className="viewer-status">
              <p><Crosshair aria-hidden="true" size={14} />
                {bounds
                  ? `包围盒 X ${formatMm(bounds.x)} · Y ${formatMm(bounds.y)} · Z ${formatMm(bounds.z)} mm`
                  : "网格 10 mm，粗线 50 mm"}
              </p>
              <p className="mouse-hints">拖拽旋转 · 右键平移 · 滚轮缩放</p>
            </div>
          </div>
        </main>

        <aside className="workspace-rail detail-rail" aria-label="模型说明">
          <DetailPanel {...detailProps} />
        </aside>
      </div>

    </div>
  )
}

function WorkspaceSheet({ title, icon, open, onOpenChange, initialFocus, children }: {
  title: string
  icon: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFocus?: string
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} presentation="sheet">
      <DialogTrigger className="ui-button header-button">{icon}{title}</DialogTrigger>
      <DialogContent className="workspace-sheet" initialFocus={initialFocus}>
        <div className="sheet-header">
          <DialogTitle>{title}</DialogTitle>
          <DialogClose className="ui-button icon-button" aria-label="回到视图"><X aria-hidden="true" size={20} /></DialogClose>
        </div>
        <div className="sheet-body">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

function EmptyModel() {
  return (
    <div className="viewport-message">
      <Box aria-hidden="true" size={28} />
      <strong>没有网格</strong>
      <p>可以在说明中查看用途和配件清单。</p>
    </div>
  )
}

function formatMm(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
