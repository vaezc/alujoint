import sys

import cascadio

tol_linear = float(sys.argv[3]) if len(sys.argv) > 3 else 0.05
tol_angular = float(sys.argv[4]) if len(sys.argv) > 4 else 0.35
cascadio.step_to_glb(sys.argv[1], sys.argv[2], tol_linear=tol_linear, tol_angular=tol_angular)
