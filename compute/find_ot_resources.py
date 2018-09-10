#!/usr/bin/env python
""" Simple python script to find the most salient opentrons resources directory.

The first thing we try is just using find_python_module.py to find whatever
opentrons module takes priority. However, if somebody installed a 3.2 api on the
system, that module may not have a /resources subdirectory. In this case, we
fall back to what we know will be there in /usr/local/lib.
"""
import importlib
import os
import sys
import find_python_module_path

def find_resources_dir():
    ideal = find_python_module_path.find_module('opentrons')
    if not os.path.exists(os.path.join(ideal, 'resources')):
        new_path = []
        for item in sys.path:
            if '/data' not in item:
                new_path += item
        sys.path = new_path
        fallback = find_python_module_path.find_module('opentrons')
        # Here we return whatever we get and trust the caller to fail
        return os.path.join(fallback, 'resources')
    else:
        return os.path.join(ideal, 'resources')

if __name__ == '__main__':
    print(find_resources_dir())
