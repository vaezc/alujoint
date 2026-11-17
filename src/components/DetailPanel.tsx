import { kindLabel, nodesForSample, type Sample } from "../data/catalog"
import { basisLabel, type JointMember } from "../data/joint"
import type { Selection } from "./Viewport"

type DetailPanelProps = {
  sample: Sample
  selection: Selection | null
  onSelect: (selection: Selection | null) => void
}

export function DetailPanel({ sample, selection, onSelect }: DetailPanelProps) {
  const nodes = nodesForSample(sample)
  const activeNode = nodes.find(
    (node) => node.placementId === selection?.placementId && node.name === selection.nodeName,
  )

  return (
    <article className="h-full overflow-y-auto px-4 py-4 text-sm text-[#2b2722]">
      <p className="font-mono text-[12px] text-[#0f6e6b]">{sample.code}</p>
      <h2 className="mt-1 text-lg font-medium leading-snug">{sample.title}</h2>
      <p className="mt-2 text-xs text-[#6d675f]">
        {kindLabel(sample.kind)} · {sample.badge}
      </p>
      <p className="mt-3 leading-6">{sample.summary}</p>

      {sample.assembly ? (
        <AssemblyList assembly={sample.assembly.members} selection={selection} onSelect={onSelect} />
      ) : nodes.length > 0 ? (
        <section className="mt-5">
          <h3 className="text-[11px] tracking-[0.14em] text-[#6d675f]">零件</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {nodes.map((node) => {
              const pressed = activeNode?.placementId === node.placementId && activeNode.name === node.name
              return (
                <button
                  key={`${node.placementId}:${node.name}`}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() =>
                    onSelect(pressed ? null : { placementId: node.placementId, nodeName: node.name })
                  }
                  className={
                    pressed
                      ? "bg-[#9a4e32] px-2 py-1 text-xs text-white"
                      : "bg-[#efeae2] px-2 py-1 text-xs text-[#3d3832] hover:bg-[#e4ddd2]"
                  }
                >
                  {node.label}
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      <Section title="几何">{sample.geometry}</Section>
      <Section title="用途">{sample.purpose}</Section>
      {sample.assembly ? null : <Bom sample={sample} />}
      <Section title="安装">{sample.install}</Section>
      <Section title="机加">{sample.machining}</Section>
      <Sources sample={sample} />
      <Section title="这里没有">{sample.absent}</Section>
    </article>
  )
}

function AssemblyList({
  assembly,
  selection,
  onSelect,
}: {
  assembly: JointMember[]
  selection: Selection | null
  onSelect: (selection: Selection | null) => void
}) {
  return (
    <section className="mt-5">
      <h3 className="text-[11px] tracking-[0.14em] text-[#6d675f]">清单与爆炸</h3>
      <ul className="mt-2 space-y-2">
        {assembly.map((member) => {
          const mesh = member.presence === "mesh" && member.placementId
          const nodeName = member.nodeName ?? "*"
          const pressed = Boolean(
            mesh && selection?.placementId === member.placementId && selection?.nodeName === nodeName,
          )
          return (
            <li key={member.id}>
              <button
                type="button"
                disabled={!mesh}
                aria-pressed={pressed}
                onClick={() => {
                  if (!mesh || !member.placementId) return
                  onSelect(pressed ? null : { placementId: member.placementId, nodeName })
                }}
                className={
                  pressed
                    ? "bg-[#9a4e32] px-2 py-1 text-left text-xs text-white"
                    : mesh
                      ? "bg-[#efeae2] px-2 py-1 text-left text-xs text-[#3d3832] hover:bg-[#e4ddd2]"
                      : "bg-transparent px-0 py-0.5 text-left text-xs text-[#6d675f]"
                }
              >
                <span className="font-mono">{member.code}</span>
                <span className="ml-2">{member.label}</span>
                <span className="ml-2">{mesh ? "有网格" : "缺模型"}</span>
              </button>
              <p className="mt-1 text-xs leading-5 text-[#6d675f]">
                {basisLabel(member.basis)}。{member.note}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Section({ title, children }: { title: string; children: string[] }) {
  if (children.length === 0) return null
  return (
    <section className="mt-5">
      <h3 className="text-[11px] tracking-[0.14em] text-[#6d675f]">{title}</h3>
      <ul className="mt-2 space-y-2 leading-6">
        {children.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  )
}

function Bom({ sample }: { sample: Sample }) {
  return (
    <section className="mt-5">
      <h3 className="text-[11px] tracking-[0.14em] text-[#6d675f]">硬件</h3>
      {sample.bom.length === 0 ? (
        <p className="mt-2 leading-6 text-[#6d675f]">这件样品没有附带紧固件清单。</p>
      ) : (
        <ul className="mt-2 space-y-2.5">
          {sample.bom.map((line) => (
            <li key={`${line.code}-${line.what}`}>
              <div className="font-mono text-[12px] text-[#241f1a]">{line.code}</div>
              <div className="text-[#3d3832]">{line.what}</div>
              <div className="text-xs leading-5 text-[#6d675f]">{line.source}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Sources({ sample }: { sample: Sample }) {
  return (
    <section className="mt-5">
      <h3 className="text-[11px] tracking-[0.14em] text-[#6d675f]">来源</h3>
      <ul className="mt-2 space-y-2.5">
        {sample.sources.map((source) => (
          <li key={source.href}>
            <a
              href={source.href}
              target="_blank"
              rel="noreferrer"
              className="text-[#0f6e6b] underline decoration-[#0f6e6b]/30 underline-offset-2"
            >
              {source.label}
            </a>
            <div className="text-xs leading-5 text-[#6d675f]">{source.note}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
