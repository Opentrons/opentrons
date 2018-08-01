#!/usr/bin/env python
""" Simple python script to find the path of a module _without_ importing it.

This allows us to keep around the path to opentrons (and therefore its contents)
without having to do the bootstrapping of global state and possible database
migrations that happen when it is actually loaded.

Usage: find_module_path.py <module name>. If the module is not found, raises an
exception
"""
import importlib
import os
import sys

def find_module(mod_name):
    mod = importlib.find_loader(mod_name)
    if not mod:
        raise RuntimeError('Module not found')
    return os.path.dirname(mod.get_filename())

if __name__ == '__main__':
    print(find_module(sys.argv[1]))
