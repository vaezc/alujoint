import { Box, ChevronRight, FolderOpen, Link2, Search, X } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { filters, kindLabel, matchesFilter, type FilterId, type Sample } from "../data/catalog"

type CatalogListProps = {
  samples: Sample[]
  activeId: string
  filter: FilterId
  query: string
  inputId?: string
  onFilter: (filter: FilterId) => void
  onQuery: (query: string) => void
  onSelect: (id: string) => void
}

const handCategory = "手写样品"

// 连接相关分类排在前面，其余靠后。
const categoryOrder = [
  "设计项目",
  "连接方式",
  "铝型材",
  "型材连接配件",
  "型材专用紧固件",
  "支脚·地脚板·底座·角件",
  "型材装饰配件",
  "封板配件",
  "铝型材框架",
  "机械防护栏",
  "倍速链系列型材",
  "精益管及配件",
  "悬臂/悬臂组件/控制箱",
  "板材",
  handCategory,
]

function categoryOf(sample: Sample): string {
  return sample.category ?? handCategory
}

function orderOf(category: string): number {
  const index = categoryOrder.indexOf(category)
  return index === -1 ? categoryOrder.length : index
}

export function CatalogList({
  samples,
  activeId,
  filter,
  query,
  inputId = "catalog-search",
  onFilter,
  onQuery,
  onSelect,
}: CatalogListProps) {
  const [open, setOpen] = useState(() => {
    const active = samples.find((sample) => sample.id === activeId)
    return new Set(["设计项目", "连接方式", ...(active ? [categoryOf(active)] : [])])
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const needle = query.trim().toLowerCase()

  const grouped = useMemo(() => {
    const byCategory = new Map<string, Sample[]>()
    for (const sample of samples) {
      if (!matchesFilter(sample, filter)) continue
      if (needle && !`${sample.code} ${sample.title} ${sample.search}`.toLowerCase().includes(needle)) continue
      const key = categoryOf(sample)
      const list = byCategory.get(key)
      if (list) list.push(sample)
      else byCategory.set(key, [sample])
    }
    const rows = [...byCategory.entries()]
      .map(([category, items]) => {
        const sorted = [...items].sort((a, b) => {
          const byTitle = a.title.localeCompare(b.title, "zh-Hans-CN")
          return byTitle !== 0 ? byTitle : a.code.localeCompare(b.code)
        })
        return { category, items: sorted }
      })
      .sort((a, b) => orderOf(a.category) - orderOf(b.category))
    return rows
  }, [samples, filter, needle])

  const total = grouped.reduce((sum, row) => sum + row.items.length, 0)
  const searching = needle.length > 0

  function toggle(category: string) {
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  return (
    <div className="catalog">
      <div className="catalog-tools">
        <h2 className="rail-heading"><FolderOpen aria-hidden="true" size={17} />模型目录</h2>
        <label className="sr-only" htmlFor={inputId}>检索型号、连接方式或用途</label>
        <div className="search-field">
          <Search aria-hidden="true" size={16} />
          <input
            ref={inputRef}
            id={inputId}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="搜索型号或连接方式"
            aria-keyshortcuts="/"
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              aria-label="清空检索"
              onClick={() => {
                onQuery("")
                inputRef.current?.focus()
              }}
            >
              <X aria-hidden="true" size={15} />
            </button>
          ) : <kbd aria-hidden="true">/</kbd>}
        </div>
        <div className="catalog-filters" role="group" aria-label="筛选">
          {filters.map((item) => {
            const pressed = item.id === filter
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => onFilter(item.id)}
                className="filter-button"
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="catalog-results scroll-panel">
        {grouped.length === 0 ? (
          <div className="catalog-empty">
            <Search aria-hidden="true" size={22} />
            <p>没有对上的条目。</p>
          </div>
        ) : (
          grouped.map((row) => {
            const expanded = searching || open.has(row.category)
            return (
              <section key={row.category} className="catalog-group">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-disabled={searching || undefined}
                  onClick={() => {
                    if (!searching) toggle(row.category)
                  }}
                  className="catalog-group-toggle"
                >
                  <ChevronRight className="catalog-chevron" aria-hidden="true" size={14} />
                  <span>{row.category}</span>
                  <span className="catalog-count">{row.items.length}</span>
                </button>
                {expanded ? (
                  <ul className="catalog-items">
                    {row.items.map((sample) => {
                      const active = sample.id === activeId
                      const Icon = row.category === "连接方式" ? Link2 : Box
                      return (
                        <li key={sample.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!open.has(row.category)) setOpen(new Set([...open, row.category]))
                              onSelect(sample.id)
                            }}
                            aria-current={active ? "true" : undefined}
                            className="catalog-item"
                          >
                            <span className="catalog-item-icon"><Icon size={15} aria-hidden="true" /></span>
                            <div className="catalog-item-text">
                              <div className="catalog-item-title">{sample.title}</div>
                              <div className="catalog-item-meta">
                                <span>{sample.code}</span>
                                {sample.kind !== "scene" ? <span>{kindLabel(sample.kind)}</span> : null}
                              </div>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </section>
            )
          })
        )}
      </div>
      <p className="catalog-footer" role="status">{total} / {samples.length} 个条目</p>
    </div>
  )
}
