# Inspired by:
# https://hynek.me/articles/sharing-your-labor-of-love-pypi-quick-and-dirty/
import sys
import codecs
import os
import os.path
from setuptools import setup, find_packages

import json

# make stdout blocking since Travis sets it to nonblocking
if os.name == 'posix':
    import fcntl
    flags = fcntl.fcntl(sys.stdout, fcntl.F_GETFL)
    fcntl.fcntl(sys.stdout, fcntl.F_SETFL, flags & ~os.O_NONBLOCK)

HERE = os.path.abspath(os.path.dirname(__file__))


def get_version():
    with open(os.path.join(HERE, 'robot_server', 'package.json')) as pkg:
        package_json = json.load(pkg)
        return package_json.get('version')


VERSION = get_version()

DISTNAME = 'robotserver'
LICENSE = 'Apache 2.0'
AUTHOR = "Opentrons"
EMAIL = "engineering@opentrons.com"
URL = "https://github.com/Opentrons/opentrons"
DOWNLOAD_URL = ''
CLASSIFIERS = [
    'Development Status :: 5 - Production/Stable',
    'Environment :: Console',
    'Operating System :: OS Independent',
    'Intended Audience :: Science/Research',
    'Programming Language :: Python',
    'Programming Language :: Python :: 3',
    'Programming Language :: Python :: 3.7',
    'Topic :: Scientific/Engineering',
]
KEYWORDS = ["robots", "protocols", "synbio", "pcr", "automation", "lab"]
DESCRIPTION = (
    "A server providing access to the Opentrons API")
PACKAGES = find_packages(where='.', exclude=["tests.*", "tests"])
INSTALL_REQUIRES = [
    'aiohttp==3.4.4',
    'fastapi==0.54.1',
    'python-multipart==0.0.5',
    'opentrons',
]


def read(*parts):
    """
    Build an absolute path from *parts* and and return the contents of the
    resulting file.  Assume UTF-8 encoding.
    """
    with codecs.open(os.path.join(HERE, *parts), "rb", "utf-8") as f:
        return f.read()


if __name__ == "__main__":
    setup(
        python_requires='>=3.7',
        name=DISTNAME,
        description=DESCRIPTION,
        license=LICENSE,
        url=URL,
        version=VERSION,
        author=AUTHOR,
        author_email=EMAIL,
        maintainer=AUTHOR,
        maintainer_email=EMAIL,
        keywords=KEYWORDS,
        long_description=__doc__,
        packages=PACKAGES,
        zip_safe=False,
        classifiers=CLASSIFIERS,
        install_requires=INSTALL_REQUIRES,
        include_package_data=True
    )
