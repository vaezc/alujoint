import json, os, sys, subprocess, trimesh
result = sys.argv[1]; outdir = sys.argv[2]; meta_out = sys.argv[3]
PYBIN = "/tmp/opencode/venv/bin/python"
os.makedirs(outdir, exist_ok=True)
rows = [json.loads(l) for l in open(result) if l.strip()]
rows = [r for r in rows if r.get("file") and os.path.exists(r["file"])]
print("to convert:", len(rows))
done = set()
if os.path.exists(meta_out):
    for l in open(meta_out):
        try:
            d = json.loads(l)
            if not d.get("err"): done.add(d["serial"])
        except: pass
for i, r in enumerate(rows, 1):
    if r["serial"] in done: continue
    safe = r["productModel"].replace("/", "_")
    glb = os.path.join(outdir, f"{r['serialCode']}-{safe}.glb")
    rec = {"serial": r["serial"], "serialCode": r["serialCode"], "productModel": r["productModel"], "step": r["file"], "glb": glb, "err": None}
    try:
        p = subprocess.run([PYBIN, "/tmp/opencode/convert_one.py", r["file"], glb], capture_output=True, timeout=120)
        if p.returncode != 0:
            rec["err"] = f"rc={p.returncode} " + (p.stderr.decode('utf-8','ignore')[-120:])
        else:
            scene = trimesh.load(glb)
            size = (scene.bounds[1] - scene.bounds[0])
            geoms = list(scene.geometry.values()) if isinstance(scene, trimesh.Scene) else [scene]
            rec.update({"glbBytes": os.path.getsize(glb), "bboxMm": [round(float(x)*1000,3) for x in size], "meshes": len(geoms)})
    except Exception as e:
        rec["err"] = str(e)[:160]
    with open(meta_out, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    if i % 20 == 0 or rec["err"]:
        print(f"[{i}/{len(rows)}] {rec['productModel']} {'ERR:'+rec['err'] if rec['err'] else rec.get('bboxMm')}")
print("DONE")
