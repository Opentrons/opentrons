# Inspired by:
# https://hynek.me/articles/sharing-your-labor-of-love-pypi-quick-and-dirty/
import codecs
import os
from setuptools import setup, find_packages
import json

HERE = os.path.abspath(os.path.dirname(__file__))


def get_version():
    with open(os.path.join(HERE, 'ot3usb', 'package.json')) as pkg:
        package_json = json.load(pkg)
        return package_json.get('version')


VERSION = get_version()

DISTNAME = 'ot3usb'
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
    'Programming Language :: Python :: 3.8',
    'Topic :: Scientific/Engineering',
]
KEYWORDS = ["robots", "automation", "lab"]
DESCRIPTION = (
    "A daemon to provide a bridge between the OT-3 USB port and "
    "the internal TCP server")
PACKAGES = find_packages(where='.', exclude=["tests.*", "tests"])
INSTALL_REQUIRES = [
    "pyserial==3.5",
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
        python_requires='>=3.8',
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
        long_description=read("README.md"),
        packages=PACKAGES,
        zip_safe=False,
        classifiers=CLASSIFIERS,
        install_requires=INSTALL_REQUIRES,
        tests_require=['pytest'],
        include_package_data=True,
        project_urls={
            "opentrons.com": "https://www.opentrons.com",
            "Source Code On Github": "https://github.com/Opentrons/opentrons/tree/edge/usb-bridge",
            "Documentation": "https://docs.opentrons.com",
        },
    )
