import { useEffect, useRef, useState } from "react"
import { CatalogList } from "./components/CatalogList"
import { DetailPanel } from "./components/DetailPanel"
import { Viewport, type BoundsMm, type Selection } from "./components/Viewport"
import { sampleHasExplode, samples, type FilterId } from "./data/catalog"

type Sheet = "none" | "catalog" | "notes"

export function App() {
  const [activeId, setActiveId] = useState(samples[0]?.id ?? "")
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
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
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
  }, [])

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

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#f4f1ea] text-[#241f1a]">
      <header className="flex items-center justify-between gap-4 border-b border-[#ddd6cb] px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.16em] text-[#6d675f]">个人研究 · 欧标 20</p>
          <h1 className="truncate text-base font-medium">铝构 · AluJoint</h1>
        </div>
        <div className="flex gap-2 lg:hidden">
          <button type="button" className="bg-[#efeae2] px-2.5 py-1 text-xs" onClick={() => setSheet("catalog")}>
            目录
          </button>
          <button type="button" className="bg-[#efeae2] px-2.5 py-1 text-xs" onClick={() => setSheet("notes")}>
            说明
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <aside className="hidden min-h-0 border-r border-[#ddd6cb] bg-[#f7f4ee] lg:block">
          <CatalogList
            samples={samples}
            activeId={sample.id}
            filter={filter}
            query={query}
            onFilter={setFilter}
            onQuery={setQuery}
            onSelect={selectSample}
          />
        </aside>

        <main className="relative min-h-0 min-w-0">
          {sample.placements.length === 0 ? (
            <EmptyModel sampleTitle={sample.title} />
          ) : (
            <Viewport
              sample={sample}
              explodeRef={explodeRef}
              selection={selection}
              frameToken={frameToken}
              onSelect={setSelection}
              onBounds={setBounds}
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-3">
            {sample.caution ? (
              <p className="pointer-events-auto max-w-xl bg-[#24302f]/92 px-3 py-2 text-xs leading-5 text-[#f4f1ea]">
                {sample.caution}
              </p>
            ) : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 border-t border-[#ddd6cb]/80 bg-[#f4f1ea]/92 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="bg-white px-2.5 py-1 text-xs" onClick={() => setFrameToken((value) => value + 1)}>
                取景
              </button>
              <button
                type="button"
                className="bg-white px-2.5 py-1 text-xs"
                onClick={() => {
                  setPlaying(false)
                  publishExplode(0)
                  setSelection(null)
                  setFrameToken((value) => value + 1)
                }}
              >
                复位
              </button>
              {canExplode ? (
                <>
                  <button
                    type="button"
                    className="bg-white px-2.5 py-1 text-xs"
                    onClick={() => {
                      setPlaying(false)
                      publishExplode(0)
                      setFrameToken((value) => value + 1)
                    }}
                  >
                    合拢
                  </button>
                  <button
                    type="button"
                    className="bg-white px-2.5 py-1 text-xs"
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
                    className="bg-white px-2.5 py-1 text-xs"
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
                    {playing ? "暂停" : "播放"}
                  </button>
                  <label className="flex items-center gap-2 text-xs text-[#3d3832]">
                    分开
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
                  </label>
                </>
              ) : (
                <span className="text-xs text-[#6d675f]">这件没有可分开的零件。</span>
              )}
            </div>
            <p className="font-mono text-[11px] text-[#6d675f]">
              {bounds
                ? `包围盒 X ${formatMm(bounds.x)} · Y ${formatMm(bounds.y)} · Z ${formatMm(bounds.z)} mm`
                : "网格 10 mm，粗线 50 mm"}
              <span className="ml-3 hidden sm:inline">拖拽旋转 · 右键平移 · 滚轮缩放</span>
            </p>
          </div>
        </main>

        <aside className="hidden min-h-0 border-l border-[#ddd6cb] bg-[#fbfaf7] lg:block">
          <DetailPanel sample={sample} selection={selection} onSelect={setSelection} />
        </aside>
      </div>

      {sheet !== "none" ? (
        <div className="fixed inset-0 z-20 bg-[#f4f1ea] lg:hidden">
          <div className="flex items-center justify-between border-b border-[#ddd6cb] px-4 py-2.5">
            <p className="text-sm">{sheet === "catalog" ? "目录" : "说明"}</p>
            <button type="button" className="text-sm text-[#0f6e6b]" onClick={() => setSheet("none")}>
              回到视图
            </button>
          </div>
          <div className="h-[calc(100dvh-45px)]">
            {sheet === "catalog" ? (
              <CatalogList
                samples={samples}
                activeId={sample.id}
                filter={filter}
                query={query}
                onFilter={setFilter}
                onQuery={setQuery}
                onSelect={selectSample}
              />
            ) : (
              <DetailPanel sample={sample} selection={selection} onSelect={setSelection} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EmptyModel({ sampleTitle }: { sampleTitle: string }) {
  return (
    <div className="grid h-full place-items-center bg-[#e4dfd6] px-8">
      <div className="max-w-md">
        <p className="text-[11px] tracking-[0.14em] text-[#6d675f]">没有网格</p>
        <h2 className="mt-2 text-xl font-medium">{sampleTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-[#3c3832]">
          这件没有可显示的网格。用途和清单在说明里，视图不拿别的模型代替。
        </p>
      </div>
    </div>
  )
}

function formatMm(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
