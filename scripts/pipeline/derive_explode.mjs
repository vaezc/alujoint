// Derives illustrative explode offsets for fetched catalog items using three.js,
// so the emitted node names match exactly what the app's GLTFLoader produces.
// Reads public/models/*.glb (meshopt), pushes each mesh radially from assembly centre.
// Output: src/data/explode.generated.json  { [itemId]: { [meshName]: [x,y,z] } }
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { MeshoptDecoder } from "meshoptimizer"
import fs from "node:fs"
import path from "node:path"

await MeshoptDecoder.ready
const root = path.resolve(import.meta.dirname, "../..")
const catalog = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalog.generated.json"), "utf8"))
const items = Array.isArray(catalog) ? catalog : catalog.items || []

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)

function parse(buffer) {
  return new Promise((resolve, reject) => {
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    loader.parse(ab, "", resolve, reject)
  })
}

const result = {}
const stats = { total: 0, multi: 0, single: 0, failed: 0 }
const notes = []

for (const item of items) {
  stats.total++
  const glb = path.join(root, "public", item.glb)
  if (!fs.existsSync(glb)) { stats.failed++; notes.push(`${item.code}: missing`); continue }
  try {
    const gltf = await parse(fs.readFileSync(glb))
    const scene = gltf.scene
    scene.updateMatrixWorld(true)
    const meshes = []
    const overall = new THREE.Box3()
    scene.traverse((o) => {
      if (!o.isMesh) return
      const box = new THREE.Box3().setFromObject(o)
      if (box.isEmpty()) return
      overall.union(box)
      meshes.push({ name: o.name, center: box.getCenter(new THREE.Vector3()) })
    })
    if (meshes.length < 2) { stats.single++; continue }
    stats.multi++
    const oc = overall.getCenter(new THREE.Vector3())
    const size = overall.getSize(new THREE.Vector3())
    const maxDimMm = item.bboxMm ? Math.max(...item.bboxMm) : Math.max(size.x, size.y, size.z) * 1000
    const dist = maxDimMm * 0.55
    const explode = {}
    const seen = {}
    meshes.forEach((m, idx) => {
      const d = m.center.clone().sub(oc)
      let len = d.length()
      if (len < (Math.max(size.x, size.y, size.z) * 0.04)) {
        const a = (idx / meshes.length) * Math.PI * 2
        d.set(Math.cos(a) * 0.001, Math.sin(a) * 0.001, (idx % 2 ? 1 : -1) * 0.001)
        len = d.length()
      }
      let name = m.name
      if (seen[name] != null) { seen[name] += 1; name = `${name}#${seen[name]}` } else seen[name] = 0
      const dir = d.divideScalar(len)
      explode[name] = [Number((dir.x * dist).toFixed(2)), Number((dir.y * dist).toFixed(2)), Number((dir.z * dist).toFixed(2))]
    })
    result[item.id] = explode
  } catch (e) {
    stats.failed++
    notes.push(`${item.code}: ${String(e).slice(0, 70)}`)
  }
}

fs.writeFileSync(path.join(root, "src/data/explode.generated.json"), JSON.stringify(result))
console.log(JSON.stringify(stats), "exploded:", Object.keys(result).length)
if (notes.length) console.log("notes:", notes.slice(0, 10))
