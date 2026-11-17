import json
import os
import struct
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "sources", "pipeline")
out_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "src", "data", "catalog.generated.json")
models_dir = os.path.join(ROOT, "public", "models")


def glb_stats(path):
    """Return (mesh count, primitive count, byte size) from the GLB container."""
    if not os.path.exists(path):
        return None
    with open(path, "rb") as handle:
        data = handle.read()
    if len(data) < 20 or data[:4] != b"glTF":
        return None
    offset = 12
    while offset + 8 <= len(data):
        length, kind = struct.unpack_from("<II", data, offset)
        offset += 8
        if kind == 0x4E4F534A:
            try:
                gltf = json.loads(data[offset : offset + length])
            except ValueError:
                return None
            meshes = gltf.get("meshes", [])
            primitives = sum(len(mesh.get("primitives", [])) for mesh in meshes)
            return len(meshes), primitives, len(data)
        offset += length
        if offset % 4:
            offset += 4 - offset % 4
    return None


def rows(name):
    path = os.path.join(src_dir, name)
    with open(path) as handle:
        for line in handle:
            try:
                yield json.loads(line)
            except ValueError:
                continue


s2cat = {}
for r in rows("serials.jsonl"):
    for s in r.get("serials", []):
        s2cat[s] = {"group": r["title"], "category": r["category"]}

ok = {}
for r in rows("all_ok.jsonl"):
    ok[r["serial"]] = r


def kind_of(cat, code):
    if code in ("T01",):
        return "profile"
    if cat and ("型材" in cat and "配件" not in cat and "紧固" not in cat):
        return "profile"
    if cat and ("紧固" in cat or "连接" in cat or "支脚" in cat or "装饰" in cat or "封板" in cat):
        return "connector"
    return "accessory"


items = []
for r in rows("glb_meta.jsonl"):
    if r.get("err"):
        continue
    s = r["serial"]
    c = s2cat.get(s, {})
    o = ok.get(s, {}) or {}
    catname = c.get("category", "未分类")
    glb_name = os.path.basename(r["glb"])
    stats = glb_stats(os.path.join(models_dir, glb_name))
    items.append(
        {
            "id": s,
            "code": r["serialCode"],
            "model": r["productModel"],
            "group": c.get("group", ""),
            "category": catname,
            "kind": kind_of(catname, o.get("category")),
            "glb": "/models/" + glb_name,
            "bboxMm": r.get("bboxMm"),
            # Count primitives, matching the converter's mesh report; read the
            # final file so compression is reflected in size and counts.
            "meshes": stats[1] if stats else r.get("meshes"),
            "bytes": stats[2] if stats else r.get("glbBytes"),
        }
    )

items.sort(key=lambda x: (x["category"], x["code"], x["model"]))
out = {"generatedAt": "2026-11-17", "count": len(items), "items": items}
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "w") as handle:
    json.dump(out, handle, ensure_ascii=False, separators=(",", ":"))

print("items", len(items))
print("by kind", dict(Counter(i["kind"] for i in items)))
print("by category", dict(Counter(i["category"] for i in items)))
print("json bytes", os.path.getsize(out_path), "->", out_path)
