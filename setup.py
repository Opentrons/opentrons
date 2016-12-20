# Inspired by:
# https://hynek.me/articles/sharing-your-labor-of-love-pypi-quick-and-dirty/
import codecs
import versioneer
import os
from setuptools import setup, find_packages

VERSION = versioneer.get_version()

DISTNAME = 'opentrons'
LICENSE = 'Apache 2.0'
AUTHOR = "Opentrons"
EMAIL = "engineering@opentrons.com"
URL = "https://github.com/OpenTrons/opentrons-api"
DOWNLOAD_URL = ''
CLASSIFIERS = [
    'Development Status :: 5 - Production/Stable',
    'Environment :: Console',
    'Operating System :: OS Independent',
    'Intended Audience :: Science/Research',
    'Programming Language :: Python',
    'Programming Language :: Python :: 3',
    'Programming Language :: Python :: 3.4',
    'Programming Language :: Python :: 3.5',
    'Topic :: Scientific/Engineering',
]
KEYWORDS = ["robots", "protocols", "synbio", "pcr", "automation", "lab"]
DESCRIPTION = (
    "The Opentrons API is a simple framework designed to make "
    "writing automated biology lab protocols easy.")
PACKAGES = find_packages(where='.', exclude=["tests.*", "tests"])
INSTALL_REQUIRES = ['dill==0.2.5', 'requests==2.12.3', 'pyserial==3.2.1']
TEST_SUITE = 'nose.collector'

HERE = os.path.abspath(os.path.dirname(__file__))


def read(*parts):
    """
    Build an absolute path from *parts* and and return the contents of the
    resulting file.  Assume UTF-8 encoding.
    """
    with codecs.open(os.path.join(HERE, *parts), "rb", "utf-8") as f:
        return f.read()


if __name__ == "__main__":
    setup(
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
        long_description=read("README.rst"),
        packages=PACKAGES,
        zip_safe=False,
        classifiers=CLASSIFIERS,
        install_requires=INSTALL_REQUIRES,
        cmdclass=versioneer.get_cmdclass(),
        include_package_data=True,
        test_suite=TEST_SUITE
    )
