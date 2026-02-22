#!/usr/bin/env python3
"""Write dist/manifest.json listing all wheel files in dist/."""

import json
import os

dist_dir = os.environ.get("DIST_DIR", os.path.join(os.path.dirname(__file__), "dist"))
wheels = sorted(f for f in os.listdir(dist_dir) if f.endswith(".whl"))
manifest = os.path.join(dist_dir, "manifest.json")
with open(manifest, "w") as fp:
    json.dump(wheels, fp, indent=2)
print(json.dumps(wheels, indent=2))
