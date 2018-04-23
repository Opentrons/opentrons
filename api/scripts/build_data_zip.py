#!/usr/bin/env python
import os
import zipfile


def build_zip(path):
    with zipfile.ZipFile('data.zip', 'w') as zf:
        for root, dirs, files in os.walk(path):
            for file in files:
                zf.write(os.path.join(root, file))
    return zf

