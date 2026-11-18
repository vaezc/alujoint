import { ArrowUpRight, FileText, Package } from "lucide-react"
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
  const manyNodes = nodes.length > 24
  const PartList = manyNodes ? "details" : "section"
  const activeNode = nodes.find(
    (node) => node.placementId === selection?.placementId && node.name === selection.nodeName,
  )

  return (
    <article className="detail scroll-panel">
      <header className="detail-header">
        <h2 className="rail-heading"><FileText aria-hidden="true" size={17} />模型说明</h2>
        <h3 className="sheet-model-title">{sample.title}</h3>
        <div className="detail-meta">
          <span className="kind-tag">{kindLabel(sample.kind)}</span>
          {sample.badge ? <span>{sample.badge}</span> : null}
        </div>
        <p className="detail-summary">{sample.summary}</p>
      </header>
      {manyNodes && !sample.assembly ? <Bom sample={sample} /> : null}

      {sample.assembly ? (
        <AssemblyList assembly={sample.assembly.members} selection={selection} onSelect={onSelect} />
      ) : nodes.length > 0 ? (
        <PartList className="detail-section">
          {manyNodes ? (
            <summary>逐件查看</summary>
          ) : (
            <h3>零件</h3>
          )}
          <div className="part-tags">
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
                  className="part-button"
                >
                  {node.label}
                </button>
              )
            })}
          </div>
        </PartList>
      ) : null}

      <Section title="几何">{sample.geometry}</Section>
      <Section title="用途">{sample.purpose}</Section>
      {sample.assembly || manyNodes ? null : <Bom sample={sample} />}
      <Section title="安装">{sample.install}</Section>
      <Section title="机加">{sample.machining}</Section>
      <Sources sample={sample} />
      <Section title="验证范围">{sample.absent}</Section>
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
    <section className="detail-section">
      <h3><Package aria-hidden="true" size={15} />清单与爆炸</h3>
      <ul className="bom-list">
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
                className="part-button"
              >
                <span className="font-mono">{member.code}</span>
                <span className="ml-2">{member.label}</span>
                <span className="ml-2">{mesh ? "有网格" : "缺模型"}</span>
              </button>
              <p className="bom-note">
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
    <section className="detail-section">
      <h3>{title}</h3>
      <ul className="detail-bullets">
        {children.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  )
}

function Bom({ sample }: { sample: Sample }) {
  return (
    <section className="detail-section">
      <h3><Package aria-hidden="true" size={15} />硬件清单</h3>
      {sample.bom.length === 0 ? (
        <p className="bom-note">这件样品没有附带紧固件清单。</p>
      ) : (
        <ul className="bom-list">
          {sample.bom.map((line) => (
            <li key={`${line.code}-${line.what}`}>
              <div className="bom-code">{line.code}</div>
              <div>{line.what}</div>
              <div className="bom-note">{line.source}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Sources({ sample }: { sample: Sample }) {
  if (sample.sources.length === 0) return null

  return (
    <section className="detail-section">
      <h3>来源</h3>
      <ul className="source-list">
        {sample.sources.map((source) => (
          <li key={source.href}>
            <a
              href={source.href}
              target="_blank"
              rel="noreferrer"
            >
              {source.label}
              <ArrowUpRight aria-hidden="true" size={14} />
            </a>
            <div className="bom-note">{source.note}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
