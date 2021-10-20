#!/usr/bin/env python

import re
from setuptools import setup, find_packages


def get_version():
    """Fetch the project version number from the 'bmaptool' file."""
    with open("bmaptools/CLI.py", "r") as fobj:
        for line in fobj:
            matchobj = re.match(r'^VERSION = "(\d+.\d+)"$', line)
            if matchobj:
                return matchobj.group(1)

    return None

setup(
    name="bmap-tools",
    description="Tools to generate block map (AKA bmap) and copy images "
                "using bmap",
    author="Artem Bityutskiy",
    author_email="artem.bityutskiy@linux.intel.com",
    version=get_version(),
    entry_points={
        'console_scripts': ['bmaptool=bmaptools.CLI:main'],
    },
    packages=find_packages(exclude=["test*"]),
    license='GPLv2',
    long_description="Tools to generate block map (AKA bmap) and flash "
                     "images using bmap. Bmaptool is a generic tool for "
                     "creating the block map (bmap) for a file, and copying "
                     "files using the block map. The idea is that large file "
                     "containing unused blocks, like raw system image files, "
                     "can be copied or flashed a lot faster with bmaptool "
                     "than with traditional tools like \"dd\" or \"cp\". See "
                     "source.tizen.org/documentation/reference/bmaptool for "
                     "more information.",
    classifiers=[
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3"
    ]
)
