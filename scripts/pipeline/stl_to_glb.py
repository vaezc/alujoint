"""Fallback converter for models whose STEP tessellation crashes or hangs.

The site can export STL directly. STL carries no units, but jlcfa writes it in
millimetres, so this scales to the metres used by public/models/*.glb.

Usage: python3 stl_to_glb.py <input.stl> <output.glb> [node name]
"""

import os
import sys

import trimesh

src, dst = sys.argv[1:3]
node_name = sys.argv[3] if len(sys.argv) > 3 else os.path.splitext(os.path.basename(dst))[0]

mesh = trimesh.load(src)
if isinstance(mesh, trimesh.Scene):
    mesh = mesh.dump(concatenate=True)
mesh.apply_scale(0.001)
scene = trimesh.Scene()
scene.add_geometry(mesh, node_name=node_name, geom_name="part")
scene.export(dst, file_type="glb")
size = (mesh.bounds[1] - mesh.bounds[0]) * 1000
print("OK", dst, os.path.getsize(dst), "bytes", [round(float(x), 3) for x in size])
