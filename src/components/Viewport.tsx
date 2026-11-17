import { Grid, Html, OrbitControls, useGLTF } from "@react-three/drei"
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { Component, memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import {
  Box3,
  Color,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Vector3,
  type Group,
  type Material,
  type Object3D,
} from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import { assets, type Sample, type Vec3 } from "../data/catalog"

export type Selection = {
  placementId: string
  nodeName: string
}

export type BoundsMm = {
  x: number
  y: number
  z: number
}

useGLTF.preload("/models/TXCJ.glb")
useGLTF.preload("/models/TYZC.glb")
useGLTF.preload("/models/TPDH.glb")
useGLTF.preload("/models/TPAA-D-6-M4.glb")
useGLTF.preload("/models/TPAA-D-6-M5.glb")
useGLTF.preload("/models/EDLA-S1-M4-L10.glb")
useGLTF.preload("/models/EPDA-S1W-K-4.glb")
useGLTF.preload("/models/EPDB-S1W-B1-4.glb")
useGLTF.preload("/models/TPBT-G-M5-L10.glb")

const emptyLabels: Record<string, string> = {}

const nodeLabelsByUrl: Record<string, Record<string, string>> = {}
for (const asset of Object.values(assets)) {
  const labels: Record<string, string> = {}
  for (const node of asset.nodes) {
    if (Object.prototype.hasOwnProperty.call(asset.explodeMm, node.name)) labels[node.name] = node.label
  }
  nodeLabelsByUrl[asset.url] = labels
}

type ViewportProps = {
  sample: Sample
  explodeRef: RefObject<number>
  selection: Selection | null
  frameToken: number
  onSelect: (selection: Selection | null) => void
  onBounds: (bounds: BoundsMm | null) => void
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
  } catch {
    return false
  }
}

export const Viewport = memo(function Viewport(props: ViewportProps) {
  if (!hasWebGL()) {
    return (
      <div className="grid h-full place-items-center bg-[#e4dfd6] px-6 text-center text-sm text-[#3c3832]">
        这个浏览器没有可用的 WebGL，三维视图打不开。目录和说明仍然可以读。
      </div>
    )
  }

  return (
    <ModelErrorBoundary key={props.sample.id}>
      <Canvas
        camera={{ fov: 32, position: [180, 120, 210], near: 0.5, far: 8000 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        onPointerMissed={() => props.onSelect(null)}
      >
        <color attach="background" args={["#e4dfd6"]} />
        <Studio />
        <hemisphereLight args={["#f7f4ee", "#b7b1a6", 0.55]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[80, 140, 60]} intensity={1.35} />
        <directionalLight position={[-70, 40, -80]} intensity={0.45} />
        <Stage {...props} />
      </Canvas>
    </ModelErrorBoundary>
  )
})

function Studio() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = texture
    return () => {
      scene.environment = null
      texture.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

function Stage({ sample, explodeRef, selection, frameToken, onSelect, onBounds }: ViewportProps) {
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((state) => state.camera)
  const [lift, setLift] = useState(0)
  const pendingFrame = useRef(true)
  const seenMeshes = useRef(0)

  useEffect(() => {
    pendingFrame.current = true
    seenMeshes.current = 0
  }, [frameToken, sample.id])

  useLayoutEffect(() => {
    const content = inner.current
    if (!content) return
    const box = localBox(content)
    const next = box.isEmpty() ? 0 : -box.min.y
    setLift((current) => (Math.abs(current - next) < 0.05 ? current : next))
  }, [frameToken, sample.id])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const target = outer.current
      const orbit = controls.current
      if (!target) return
      const box = new Box3().setFromObject(target)
      if (box.isEmpty()) {
        onBounds(null)
        return
      }
      const size = box.getSize(new Vector3())
      onBounds({ x: size.x, y: size.y, z: size.z })
      const meshCount = countMeshes(target)
      if (meshCount > seenMeshes.current) {
        seenMeshes.current = meshCount
        pendingFrame.current = true
      }
      if (!pendingFrame.current || !orbit || !(camera instanceof PerspectiveCamera)) return
      pendingFrame.current = false
      frameObject(camera, orbit, target)
    })
    return () => cancelAnimationFrame(frame)
  }, [camera, frameToken, lift, onBounds, sample.id])

  return (
    <>
      <Grid
        args={[400, 400]}
        cellSize={10}
        cellThickness={0.6}
        cellColor="#c9c2b6"
        sectionSize={50}
        sectionThickness={1.15}
        sectionColor="#8d867c"
        fadeDistance={700}
        fadeStrength={1}
        infiniteGrid
        raycast={() => null}
      />
      <group ref={outer} position={[0, lift, 0]}>
      <group ref={inner}>
        {sample.placements.map((placement) => (
          <PlacedModel
            key={placement.id}
            placementId={placement.id}
            label={placement.label}
            showLabels={explodeRef.current > 0.18}
            url={assets[placement.assetId].url}
            nodeNames={assets[placement.assetId].nodes.map((node) => node.name)}
            positionMm={placement.positionMm}
            rotation={placement.rotation}
            groupExplodeMm={placement.explodeMm}
            nodeExplodeMm={assets[placement.assetId].explodeMm}
            explodeRef={explodeRef}
            selection={selection}
            onSelect={onSelect}
          />
        ))}
      </group>
      </group>
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.14}
        minDistance={28}
        maxDistance={1200}
      />
    </>
  )
}

function PlacedModel({
  placementId,
  label,
  showLabels,
  url,
  nodeNames,
  positionMm,
  rotation,
  groupExplodeMm,
  nodeExplodeMm,
  explodeRef,
  selection,
  onSelect,
}: {
  placementId: string
  label: string
  showLabels: boolean
  url: string
  nodeNames: readonly string[]
  positionMm: Vec3
  rotation: Vec3
  groupExplodeMm: Vec3
  nodeExplodeMm: Record<string, Vec3>
  explodeRef: RefObject<number>
  selection: Selection | null
  onSelect: (selection: Selection | null) => void
}) {
  const gltf = useGLTF(url)
  const clone = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const root = useRef<Group>(null)
  const bases = useRef(new Map<string, Vector3>())
  const names = useMemo(() => new Set(nodeNames), [nodeNames])
  const nodeLabels = nodeLabelsByUrl[url] ?? emptyLabels
  const [labelSpots, setLabelSpots] = useState<{ key: string; text: string; position: Vec3 }[]>([])

  useFrame(() => {
    applyExplode(root.current, clone, bases.current, positionMm, groupExplodeMm, nodeExplodeMm, explodeRef.current)
  })

  useLayoutEffect(() => {
    bases.current.clear()
    clone.traverse((object) => {
      const mesh = asMesh(object)
      if (mesh) mesh.material = cloneMaterial(mesh.material)
      if (object.name && Object.prototype.hasOwnProperty.call(nodeExplodeMm, object.name)) {
        bases.current.set(object.uuid, object.position.clone())
      }
    })
  }, [clone, nodeExplodeMm])

  useLayoutEffect(() => {
    applyExplode(root.current, clone, bases.current, positionMm, groupExplodeMm, nodeExplodeMm, explodeRef.current)
    clone.traverse((object) => {
      const mesh = asMesh(object)
      if (!mesh) return
      paint(mesh.material, chosen(object, placementId, selection))
    })
  }, [clone, explodeRef, groupExplodeMm, nodeExplodeMm, placementId, positionMm, selection])

  useLayoutEffect(() => {
    if (!showLabels) {
      setLabelSpots((current) => (current.length === 0 ? current : []))
      return
    }
    const spots: { key: string; text: string; position: Vec3 }[] = []
    const box = new Box3().setFromObject(clone)
    if (!box.isEmpty()) {
      const center = box.getCenter(new Vector3())
      spots.push({
        key: `${placementId}:part`,
        text: label,
        position: [center.x * 1000, center.y * 1000 + 16, center.z * 1000],
      })
    }
    clone.traverse((object) => {
      const text = nodeLabels[object.name]
      if (!text) return
      spots.push({
        key: `${placementId}:${object.name}`,
        text,
        position: [object.position.x * 1000, object.position.y * 1000 + 12, object.position.z * 1000],
      })
    })
    setLabelSpots(spots)
  }, [clone, label, nodeLabels, placementId, showLabels])

  const position = shift(positionMm, groupExplodeMm, explodeRef.current)

  return (
    <group ref={root} position={position} rotation={rotation}>
      <group scale={1000}>
        <primitive
          object={clone}
          onClick={(event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation()
            const nodeName = selectableName(event.object, names)
            if (!nodeName) return
            onSelect({ placementId, nodeName })
          }}
        />
      </group>
      {labelSpots.map((spot) => (
        <PartLabel key={spot.key} text={spot.text} position={spot.position} />
      ))}
    </group>
  )
}

function PartLabel({ text, position }: { text: string; position: Vec3 }) {
  return (
    <Html position={position} center zIndexRange={[12, 0]} distanceFactor={140} style={{ pointerEvents: "none" }}>
      <span className="pointer-events-none whitespace-nowrap bg-[#24302f]/90 px-1.5 py-0.5 text-[10px] leading-4 text-[#f4f1ea]">
        {text}
      </span>
    </Html>
  )
}

function countMeshes(object: Object3D): number {
  let count = 0
  object.traverse((child) => {
    if (child instanceof Mesh) count += 1
  })
  return count
}

function asMesh(object: Object3D): Mesh | null {
  if (object instanceof Mesh) return object
  return null
}

function cloneMaterial(material: Material | Material[]): Material | Material[] {
  if (Array.isArray(material)) return material.map((entry) => viewMaterial(entry))
  return viewMaterial(material)
}

function viewMaterial(material: Material): Material {
  const next = material.clone()
  if (!(next instanceof MeshStandardMaterial) || next.map) return next
  if (next.metalness === 1 && next.roughness === 1) {
    next.metalness = 0.62
    next.roughness = 0.4
  }
  next.envMapIntensity = 0.9
  return next
}

function paint(material: Material | Material[], selected: boolean) {
  const list = Array.isArray(material) ? material : [material]
  for (const entry of list) {
    if (!(entry instanceof MeshStandardMaterial)) continue
    entry.emissive = new Color(selected ? "#b85a32" : "#000000")
    entry.emissiveIntensity = selected ? 0.55 : 0
  }
}

function selectableName(object: Object3D, names: ReadonlySet<string>): string | null {
  let current: Object3D | null = object
  while (current) {
    if (current.name && names.has(current.name)) return current.name
    current = current.parent
  }
  return null
}

function chosen(object: Object3D, placementId: string, selection: Selection | null): boolean {
  if (!selection || selection.placementId !== placementId) return false
  if (selection.nodeName === "*") return true
  let current: Object3D | null = object
  while (current) {
    if (current.name === selection.nodeName) return true
    current = current.parent
  }
  return false
}

function applyExplode(
  root: Group | null,
  clone: Object3D,
  bases: Map<string, Vector3>,
  positionMm: Vec3,
  groupExplodeMm: Vec3,
  nodeExplodeMm: Record<string, Vec3>,
  amount: number,
) {
  if (root) {
    const next = shift(positionMm, groupExplodeMm, amount)
    root.position.set(next[0], next[1], next[2])
  }
  clone.traverse((object) => {
    const base = bases.get(object.uuid)
    if (!base || !object.name) return
    const offset = nodeExplodeMm[object.name]
    if (!offset) return
    object.position.set(
      base.x + (offset[0] * amount) / 1000,
      base.y + (offset[1] * amount) / 1000,
      base.z + (offset[2] * amount) / 1000,
    )
  })
}

function shift(position: Vec3, offset: Vec3, explode: number): Vec3 {
  return [
    position[0] + offset[0] * explode,
    position[1] + offset[1] * explode,
    position[2] + offset[2] * explode,
  ]
}

function localBox(object: Object3D): Box3 {
  const box = new Box3()
  object.updateWorldMatrix(true, true)
  const inverse = new Matrix4().copy(object.matrixWorld).invert()
  const relative = new Matrix4()
  object.traverse((child) => {
    if (!(child instanceof Mesh) || !child.geometry) return
    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
    const geometryBox = child.geometry.boundingBox
    if (!geometryBox) return
    relative.copy(inverse).multiply(child.matrixWorld)
    box.union(geometryBox.clone().applyMatrix4(relative))
  })
  return box
}

function frameObject(
  camera: PerspectiveCamera,
  controls: OrbitControlsImpl,
  object: Object3D,
): BoundsMm | null {
  const box = new Box3().setFromObject(object)
  if (box.isEmpty()) return null
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const radius = Math.max(size.x, size.y, size.z) * 0.62
  const fov = (camera.fov * Math.PI) / 180
  const distance = radius / Math.sin(fov / 2)
  const direction = new Vector3(0.78, 0.48, 0.95).normalize()
  camera.position.copy(center).addScaledVector(direction, distance)
  camera.near = Math.max(0.2, distance / 300)
  camera.far = distance * 30
  camera.updateProjectionMatrix()
  controls.target.copy(center)
  controls.update()
  return { x: size.x, y: size.y, z: size.z }
}

class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid h-full place-items-center bg-[#e4dfd6] px-6 text-center text-sm text-[#3c3832]">
          模型文件没有载入。可以换一条目录，或刷新页面后再试。
        </div>
      )
    }
    return this.props.children
  }
}
