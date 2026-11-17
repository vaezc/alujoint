import { filters, kindLabel, matchesFilter, type FilterId, type Sample } from "../data/catalog"

type CatalogListProps = {
  samples: Sample[]
  activeId: string
  filter: FilterId
  query: string
  onFilter: (filter: FilterId) => void
  onQuery: (query: string) => void
  onSelect: (id: string) => void
}

export function CatalogList({
  samples,
  activeId,
  filter,
  query,
  onFilter,
  onQuery,
  onSelect,
}: CatalogListProps) {
  const needle = query.trim().toLowerCase()
  const visible = samples.filter((sample) => {
    if (!matchesFilter(sample, filter)) return false
    if (!needle) return true
    return `${sample.code} ${sample.title} ${sample.search}`.toLowerCase().includes(needle)
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#ddd6cb] px-4 py-3">
        <label className="block text-[11px] tracking-[0.14em] text-[#6d675f]" htmlFor="catalog-search">
          检索
        </label>
        <input
          id="catalog-search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="型号、螺钉或用途"
          className="mt-1.5 w-full border border-[#d3cdc2] bg-white px-2.5 py-1.5 text-sm text-[#241f1a] outline-none focus:border-[#0f6e6b]"
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="筛选">
          {filters.map((item) => {
            const pressed = item.id === filter
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => onFilter(item.id)}
                className={
                  pressed
                    ? "bg-[#24302f] px-2 py-1 text-xs text-[#f4f1ea]"
                    : "bg-[#efeae2] px-2 py-1 text-xs text-[#3d3832] hover:bg-[#e4ddd2]"
                }
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <li className="px-4 py-6 text-sm text-[#6d675f]">没有对上的条目。</li>
        ) : (
          visible.map((sample) => {
            const active = sample.id === activeId
            return (
              <li key={sample.id}>
                <button
                  type="button"
                  onClick={() => onSelect(sample.id)}
                  className={
                    active
                      ? "w-full border-l-2 border-[#0f6e6b] bg-[#f7f4ee] px-4 py-3 text-left"
                      : "w-full border-l-2 border-transparent px-4 py-3 text-left hover:bg-[#f3efe8]"
                  }
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[12px] text-[#0f6e6b]">{sample.code}</span>
                    <span className="text-[11px] text-[#6d675f]">{kindLabel(sample.kind)}</span>
                  </div>
                  <div className="mt-1 text-sm text-[#241f1a]">{sample.title}</div>
                  <div className="mt-1 text-xs leading-5 text-[#6d675f]">{sample.badge}</div>
                </button>
              </li>
            )
          })
        )}
      </ul>
      <p className="border-t border-[#ddd6cb] px-4 py-3 text-[11px] leading-5 text-[#6d675f]">
        共 {samples.length} 条，当前 {visible.length} 条。手写的几件带完整说明；抓取目录的条目只有包围盒和网格数，没有逐件核对。
      </p>
    </div>
  )
}
