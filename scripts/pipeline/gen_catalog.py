import json
import os
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "sources", "pipeline")
out_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "src", "data", "catalog.generated.json")


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
    items.append(
        {
            "id": s,
            "code": r["serialCode"],
            "model": r["productModel"],
            "group": c.get("group", ""),
            "category": catname,
            "kind": kind_of(catname, o.get("category")),
            "glb": "/models/" + os.path.basename(r["glb"]),
            "bboxMm": r.get("bboxMm"),
            "meshes": r.get("meshes"),
            "bytes": r.get("glbBytes"),
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
