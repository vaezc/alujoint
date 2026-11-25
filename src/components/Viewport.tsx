import { Grid, Html, OrbitControls, useGLTF } from "@react-three/drei"
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { Component, memo, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import {
  Box3,
  Color,
  Matrix3,
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
import { screwReleaseProgress } from "../data/joint"

export type Selection = {
  placementId: string
  nodeName: string
}

export type BoundsMm = {
  x: number
  y: number
  z: number
}

declare global {
  interface Window {
    __ALUJOINT_FRAME__?: {
      root: Object3D
      camera: PerspectiveCamera
      canvas: HTMLCanvasElement
    }
  }
}

const emptyLabels: Record<string, string> = {}
const noNodeExplode: Record<string, Vec3> = {}

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
  showExplodeLabels: boolean
  selection: Selection | Selection[] | null
  frameToken: number
  onSelect: (selection: Selection | null) => void
  onBounds: (bounds: BoundsMm | null) => void
  /** Placements drawn as translucent outlines, e.g. parts not yet installed in a step-by-step guide. */
  ghosted?: ReadonlySet<string>
  solidNodes?: Record<string, string>
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
      <div className="viewport-message">
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
        <Studio />
        <hemisphereLight args={["#f7f4ee", "#b7b1a6", 0.55]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[80, 140, 60]} intensity={1.35} />
        <directionalLight position={[-70, 40, -80]} intensity={0.45} />
        <Suspense fallback={null}>
          <Stage {...props} />
        </Suspense>
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

function Stage({ sample, explodeRef, showExplodeLabels, selection, frameToken, onSelect, onBounds, ghosted, solidNodes }: ViewportProps) {
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
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
      const canvas = gl.domElement
      if (!pendingFrame.current || !orbit || !(camera instanceof PerspectiveCamera) || !(canvas instanceof HTMLCanvasElement)) return
      pendingFrame.current = false
      frameObject(camera, orbit, target, canvas, sample.viewDirection)
      window.__ALUJOINT_FRAME__ = { root: target, camera, canvas }
    })
    return () => cancelAnimationFrame(frame)
  }, [camera, frameToken, gl, lift, onBounds, sample.id, sample.viewDirection])

  return (
    <>
      <Grid
        args={[400, 400]}
        cellSize={10}
        cellThickness={0.6}
        cellColor="#a7b7ac"
        sectionSize={50}
        sectionThickness={1.15}
        sectionColor="#849b8d"
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
            showLabels={showExplodeLabels}
            url={assets[placement.assetId].url}
            nodeNames={assets[placement.assetId].nodes.map((node) => node.name)}
            positionMm={placement.positionMm}
            rotation={placement.rotation}
            scale={placement.scale}
            tint={placement.tint}
            groupExplodeMm={placement.explodeMm}
            explodeAfter={placement.explodeAfter}
            explodeUntil={placement.explodeUntil}
            nodeSequence={assets[placement.assetId].explodeSequence}
            nodeExplodeMm={placement.explodeAsset === false ? noNodeExplode : assets[placement.assetId].explodeMm}
            nodeExplodeUntil={sample.assembly ? screwReleaseProgress : 1}
            explodeRef={explodeRef}
            selection={selection}
            ghost={ghosted?.has(placement.id) ?? false}
            solidNode={solidNodes?.[placement.id]}
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
        maxDistance={8000}
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
  scale,
  tint,
  groupExplodeMm,
  explodeAfter = 0,
  explodeUntil = 1,
  nodeSequence,
  nodeExplodeMm,
  nodeExplodeUntil,
  explodeRef,
  selection,
  ghost = false,
  solidNode,
  onSelect,
}: {
  placementId: string
  label: string
  showLabels: boolean
  url: string
  nodeNames: readonly string[]
  positionMm: Vec3
  rotation: Vec3
  scale?: Vec3
  tint?: string
  groupExplodeMm: Vec3
  explodeAfter?: number
  explodeUntil?: number
  nodeSequence?: string[]
  nodeExplodeMm: Record<string, Vec3>
  nodeExplodeUntil: number
  explodeRef: RefObject<number>
  selection: Selection | Selection[] | null
  ghost?: boolean
  solidNode?: string
  onSelect: (selection: Selection | null) => void
}) {
  const gltf = useGLTF(url)
  const clone = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const root = useRef<Group>(null)
  const motions = useRef<NodeMotion[]>([])
  const names = useMemo(() => new Set(nodeNames), [nodeNames])
  const nodeLabels = nodeLabelsByUrl[url] ?? emptyLabels
  const partLabel = useMemo(() => {
    const center = new Box3().setFromObject(gltf.scene).getCenter(new Vector3())
    return [center.x * 1000 * (scale?.[0] ?? 1), center.y * 1000 * (scale?.[1] ?? 1) + 16, center.z * 1000 * (scale?.[2] ?? 1)] satisfies Vec3
  }, [gltf.scene, scale])

  useFrame(() => {
    applyExplode(root.current, motions.current, positionMm, groupExplodeMm, explodeAfter, explodeUntil, nodeExplodeUntil, explodeRef.current)
  })

  useLayoutEffect(() => {
    clone.updateWorldMatrix(true, true)
    const sceneFromWorld = clone.parent?.matrixWorld.clone().invert() ?? new Matrix4()
    const nextMotions: NodeMotion[] = []
    clone.traverse((object) => {
      const mesh = asMesh(object)
      if (mesh) mesh.material = cloneMaterial(mesh.material, tint)
      const offset = Object.hasOwn(nodeExplodeMm, object.name) ? nodeExplodeMm[object.name] : undefined
      if (!offset) return

      // Convert a direction in GLB scene coordinates into the node's parent coordinates.
      const sceneFromParent = object.parent
        ? new Matrix4().multiplyMatrices(sceneFromWorld, object.parent.matrixWorld)
        : new Matrix4()
      const parentFromScene = new Matrix3().setFromMatrix4(sceneFromParent).invert()
      const travel = new Vector3(...offset).multiplyScalar(0.001).applyMatrix3(parentFromScene)
      const order = nodeSequence?.indexOf(object.name) ?? -1
      const steps = nodeSequence?.length ?? 0
      const start = order >= 0 ? order / steps : 0
      const end = order >= 0 ? (order + 1) / steps : 1
      nextMotions.push({ object, base: object.position.clone(), travel, start, end })
    })
    motions.current = nextMotions
    return () => {
      for (const { object, base } of nextMotions) object.position.copy(base)
    }
  }, [clone, nodeExplodeMm, nodeSequence, tint])

  useLayoutEffect(() => {
    applyExplode(root.current, motions.current, positionMm, groupExplodeMm, explodeAfter, explodeUntil, nodeExplodeUntil, explodeRef.current)
    clone.traverse((object) => {
      const mesh = asMesh(object)
      if (!mesh) return
      const ghostMesh = ghost && !(solidNode && mesh.userData.name === solidNode)
      paint(mesh.material, !ghostMesh && chosen(object, placementId, selection), ghostMesh)
    })
  }, [clone, explodeAfter, explodeRef, explodeUntil, ghost, solidNode, groupExplodeMm, nodeExplodeMm, nodeExplodeUntil, placementId, positionMm, selection])

  return (
    <group ref={root} position={positionMm} rotation={rotation}>
      <group scale={scale ? [1000 * scale[0], 1000 * scale[1], 1000 * scale[2]] : 1000}>
        <primitive
          object={clone}
          onClick={(event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation()
            if (names.size === 0) {
              onSelect({ placementId, nodeName: "*" })
              return
            }
            const nodeName = selectableName(event.object, names)
            if (!nodeName) return
            onSelect({ placementId, nodeName })
          }}
        />
      </group>
      {showLabels && !ghost ? <PartLabel text={label} position={partLabel} /> : null}
      {showLabels && !ghost ? Object.entries(nodeLabels).map(([name, text]) => {
        const node = clone.getObjectByName(name)
        return node ? <PartLabel key={name} text={text} anchor={node} /> : null
      }) : null}
    </group>
  )
}

function PartLabel({ text, position, anchor }: { text: string; position?: Vec3; anchor?: Object3D }) {
  const label = useRef<Group>(null)
  useFrame(() => {
    const group = label.current
    if (!anchor || !group?.parent) return
    anchor.getWorldPosition(group.position)
    group.parent.worldToLocal(group.position)
    group.position.y += 12
  })
  return (
    <group ref={label} position={position}>
      <Html center zIndexRange={[12, 0]} distanceFactor={140} style={{ pointerEvents: "none" }}>
        <span className="part-label pointer-events-none whitespace-nowrap">
          {text}
        </span>
      </Html>
    </group>
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

function cloneMaterial(material: Material | Material[], tint?: string): Material | Material[] {
  if (Array.isArray(material)) return material.map((entry) => viewMaterial(entry, tint))
  return viewMaterial(material, tint)
}

function viewMaterial(material: Material, tint?: string): Material {
  const next = material.clone()
  if (!(next instanceof MeshStandardMaterial) || next.map) return next
  if (next.metalness === 1 && next.roughness === 1) {
    next.metalness = 0.62
    next.roughness = 0.4
  }
  if (tint) next.color.set(tint)
  next.envMapIntensity = 0.9
  return next
}

function paint(material: Material | Material[], selected: boolean, ghost = false) {
  const list = Array.isArray(material) ? material : [material]
  for (const entry of list) {
    if (!(entry instanceof MeshStandardMaterial)) continue
    entry.emissive = new Color(selected ? "#b85a32" : "#000000")
    entry.emissiveIntensity = selected ? 0.55 : 0
    if (entry.transparent !== ghost) {
      entry.transparent = ghost
      entry.needsUpdate = true
    }
    entry.opacity = ghost ? 0.2 : 1
    entry.depthWrite = !ghost
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

function chosen(object: Object3D, placementId: string, selection: Selection | Selection[] | null): boolean {
  if (!selection) return false
  const list = Array.isArray(selection) ? selection : [selection]
  for (const item of list) {
    if (item.placementId !== placementId) continue
    if (item.nodeName === "*") return true
    let current: Object3D | null = object
    while (current) {
      if (current.name === item.nodeName) return true
      current = current.parent
    }
  }
  return false
}

type NodeMotion = {
  object: Object3D
  base: Vector3
  travel: Vector3
  start: number
  end: number
}

function applyExplode(
  root: Group | null,
  motions: NodeMotion[],
  positionMm: Vec3,
  groupExplodeMm: Vec3,
  explodeAfter: number,
  explodeUntil: number,
  nodeExplodeUntil: number,
  amount: number,
) {
  if (root) root.position.set(...shift(positionMm, groupExplodeMm, explodeProgress(amount, explodeAfter, explodeUntil)))
  for (const { object, base, travel, start, end } of motions) {
    const progress = explodeProgress(amount, start * nodeExplodeUntil, end * nodeExplodeUntil)
    object.position.copy(base).addScaledVector(travel, progress)
  }
}

function explodeProgress(amount: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (amount - start) / (end - start)))
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

function overlayInsets(canvas: HTMLCanvasElement): { top: number; bottom: number } {
  const canvasRect = canvas.getBoundingClientRect()
  const main = canvas.closest("main")
  if (!main || canvasRect.height < 1) return { top: 0, bottom: 0 }
  let top = 0
  let bottom = 0
  for (const child of main.children) {
    if (!(child instanceof HTMLElement) || child.contains(canvas)) continue
    const rect = child.getBoundingClientRect()
    if (rect.width < 8 || rect.height < 8) continue
    if (rect.bottom <= canvasRect.top || rect.top >= canvasRect.bottom) continue
    if (rect.top <= canvasRect.top + 8) top = Math.max(top, rect.bottom - canvasRect.top)
    if (rect.bottom >= canvasRect.bottom - 8) bottom = Math.max(bottom, canvasRect.bottom - rect.top)
  }
  return {
    top: clampInset(top, canvasRect.height),
    bottom: clampInset(bottom, canvasRect.height),
  }
}

function clampInset(inset: number, height: number): number {
  if (!Number.isFinite(inset) || inset <= 0) return 0
  return Math.min(inset, height * 0.45)
}

function frameObject(
  camera: PerspectiveCamera,
  controls: OrbitControlsImpl,
  object: Object3D,
  canvas: HTMLCanvasElement,
  viewDirection: Vec3 = [0.78, 0.48, 0.95],
): BoundsMm | null {
  const box = new Box3().setFromObject(object)
  if (box.isEmpty()) return null
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const radius = Math.max(Math.hypot(size.x, size.y, size.z) * 0.5, 1)
  const width = Math.max(canvas.clientWidth, 1)
  const height = Math.max(canvas.clientHeight, 1)
  const { top, bottom } = overlayInsets(canvas)
  const halfHeight = height / 2
  const verticalRoom = Math.max(32, Math.min(halfHeight - top, halfHeight - bottom))
  const verticalHalf = ((camera.fov * Math.PI) / 180) / 2
  const aspect = Math.max(camera.aspect > 0 ? camera.aspect : width / height, 0.05)
  const fittedVertical = Math.atan(Math.tan(verticalHalf) * (verticalRoom / halfHeight))
  const fittedHorizontal = Math.atan(Math.tan(verticalHalf) * aspect)
  const distance = (radius * 1.12) / Math.max(Math.sin(Math.min(fittedVertical, fittedHorizontal)), 0.02)
  const direction = new Vector3(...viewDirection).normalize()
  camera.position.copy(center).addScaledVector(direction, distance)
  camera.near = Math.max(0.2, distance / 300)
  camera.far = Math.max(distance * 30, radius * 40)
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
        <div className="viewport-message">
          模型文件没有载入。可以换一条目录，或刷新页面后再试。
        </div>
      )
    }
    return this.props.children
  }
}
