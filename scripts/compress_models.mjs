import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import { dedup, meshopt, prune, weld } from "@gltf-transform/functions"
import fs from "node:fs"
import path from "node:path"
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer"

// Rewrites public/models/*.glb in place with meshopt compression, which the
// bundled drei/three-stdlib loader decodes without extra configuration.
// Usage: node scripts/compress_models.mjs [--dry] [--limit N]
const args = process.argv.slice(2)
const dry = args.includes("--dry")
const limitIndex = args.indexOf("--limit")
const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : Infinity

const root = path.resolve(import.meta.dirname, "..")
const dir = path.join(root, "public/models")
const files = fs
  .readdirSync(dir)
  .filter((file) => file.toLowerCase().endsWith(".glb"))
  .sort()

await MeshoptEncoder.ready
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder })

let before = 0
let after = 0
let done = 0
let skipped = 0
const failures = []

for (const file of files) {
  if (done >= limit) break
  const input = path.join(dir, file)
  const original = fs.statSync(input).size
  before += original
  try {
    const doc = await io.read(input)
    const compressed = doc
      .getRoot()
      .listExtensionsUsed()
      .some((extension) => extension.extensionName === "EXT_meshopt_compression")
    if (compressed) {
      skipped += 1
      after += original
      continue
    }
    await doc.transform(dedup(), weld(), prune(), meshopt({ encoder: MeshoptEncoder, level: "medium" }))
    const tmp = `${input}.tmp.glb`
    await io.write(tmp, doc)
    await io.read(tmp) // decodes the meshopt buffers, so a broken file never replaces the original
    const size = fs.statSync(tmp).size
    if (!dry) fs.renameSync(tmp, input)
    else fs.unlinkSync(tmp)
    after += size
    done += 1
    console.log(`${file} ${original} -> ${size} (${Math.round((size / original) * 100)}%)`)
  } catch (error) {
    after += original
    failures.push(`${file}: ${String(error).slice(0, 160)}`)
    console.error("FAIL", file, String(error).slice(0, 160))
  }
}

console.log(`\nfiles=${files.length} compressed=${done} skipped=${skipped} failed=${failures.length} dry=${dry}`)
console.log(`total ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`)
if (failures.length) {
  console.error(failures.join("\n"))
  process.exitCode = 1
}
