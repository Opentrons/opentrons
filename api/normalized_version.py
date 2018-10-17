import json
import os
from setuptools.extern import packaging

pkg_json_path = os.path.join('src', 'opentrons', 'package.json')
old_ver = json.load(open(pkg_json_path))['version']
vers_obj = packaging.version.Version(old_ver)

print(str(vers_obj))
