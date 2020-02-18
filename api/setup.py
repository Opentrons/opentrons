# Inspired by:
# https://hynek.me/articles/sharing-your-labor-of-love-pypi-quick-and-dirty/
import sys
import codecs
import os
import os.path
from setuptools import setup, find_packages
from setuptools.command import build_py, sdist

import json

# make stdout blocking since Travis sets it to nonblocking
if os.name == 'posix':
    import fcntl
    flags = fcntl.fcntl(sys.stdout, fcntl.F_GETFL)
    fcntl.fcntl(sys.stdout, fcntl.F_SETFL, flags & ~os.O_NONBLOCK)

HERE = os.path.abspath(os.path.dirname(__file__))

# Where we get our files from
SHARED_DATA_PATH = os.path.join('..', 'shared-data')
# The subdirectories of SHARED_DATA_PATH to scan for files
SHARED_DATA_SUBDIRS = ['deck',
                       'labware',
                       'module',
                       'pipette',
                       'protocol']
# Where, relative to the package root, we put the files we copy
DEST_BASE_PATH = 'shared_data'


def get_shared_data_files():
    to_include = []
    for subdir in SHARED_DATA_SUBDIRS:
        top = os.path.join(SHARED_DATA_PATH, subdir)
        for dirpath, dirnames, filenames in os.walk(top):
            from_source = os.path.relpath(dirpath, SHARED_DATA_PATH)
            to_include.extend([os.path.join(from_source, fname)
                               for fname in filenames])
    return to_include


class SDistWithSharedData(sdist.sdist):
    description = sdist.sdist.description\
        + " Also, include opentrons data files."

    def make_release_tree(self, base_dir, files):
        self.announce("adding opentrons data files to base dir {}"
                      .format(base_dir))
        for data_file in get_shared_data_files():
            sdist_dest = os.path.join(base_dir, DEST_BASE_PATH)
            self.mkpath(os.path.join(sdist_dest, 'opentrons',
                                     os.path.dirname(data_file)))
            self.copy_file(os.path.join(SHARED_DATA_PATH, data_file),
                           os.path.join(sdist_dest, data_file))
        super().make_release_tree(base_dir, files)


class BuildWithSharedData(build_py.build_py):
    description = build_py.build_py.description\
        + " Also, include opentrons data files"

    def _get_data_files(self):
        """
        Override of build_py.get_data_files that includes out of tree configs.
        These are currently hardcoded to include selected folders in
         ../shared-data/, which will move to opentrons/config/shared-data
        """
        files = super()._get_data_files()
        # We don’t really want to duplicate logic used in the original
        # implementation, but we can back out what it did with commonpath -
        # should be something ending in opentrons
        build_base = os.path.commonpath([f[2] for f in files])
        # We want a list of paths to only files relative to ../shared-data
        to_include = get_shared_data_files()
        destination = os.path.join(build_base, DEST_BASE_PATH)
        # And finally, tell the system about our files
        files.append(('opentrons', SHARED_DATA_PATH,
                      destination, to_include))
        return files


def get_version():
    with open(os.path.join(HERE, 'src', 'opentrons', 'package.json')) as pkg:
        package_json = json.load(pkg)
        return package_json.get('version')


VERSION = get_version()

DISTNAME = 'opentrons'
LICENSE = 'Apache 2.0'
AUTHOR = "Opentrons"
EMAIL = "engineering@opentrons.com"
URL = "https://github.com/OpenTrons/opentrons"
DOWNLOAD_URL = ''
CLASSIFIERS = [
    'Development Status :: 5 - Production/Stable',
    'Environment :: Console',
    'Operating System :: OS Independent',
    'Intended Audience :: Science/Research',
    'Programming Language :: Python',
    'Programming Language :: Python :: 3',
    'Programming Language :: Python :: 3.6',
    'Topic :: Scientific/Engineering',
]
KEYWORDS = ["robots", "protocols", "synbio", "pcr", "automation", "lab"]
DESCRIPTION = (
    "The Opentrons API is a simple framework designed to make "
    "writing automated biology lab protocols easy.")
PACKAGES = find_packages(where='src')
INSTALL_REQUIRES = [
    'pyserial==3.4',
    'aiohttp==3.4.4',
    'numpy>=1.15.1',
    'urwid==1.3.1',
    'jsonschema>=3.0.2,<4',
    'aionotify==0.2.0',
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
        python_requires='>=3.6',
        name=DISTNAME,
        description=DESCRIPTION,
        license=LICENSE,
        version=VERSION,
        author=AUTHOR,
        author_email=EMAIL,
        maintainer=AUTHOR,
        maintainer_email=EMAIL,
        keywords=KEYWORDS,
        long_description=read("pypi-readme.rst"),
        packages=PACKAGES,
        zip_safe=False,
        classifiers=CLASSIFIERS,
        install_requires=INSTALL_REQUIRES,
        include_package_data=True,
        package_dir={'': 'src'},
        cmdclass={
            'build_py': BuildWithSharedData,
            'sdist': SDistWithSharedData
        },
        entry_points={
            'console_scripts': [
                'opentrons_simulate = opentrons.simulate:main',
                'opentrons_execute = opentrons.execute:main',
            ]
        },
        project_urls={
            'opentrons.com': "https://www.opentrons.com",
            'Source Code On Github':
            "https://github.com/Opentrons/opentrons/tree/edge/api",
            'Documentation': "https://docs.opentrons.com"
        }
    )
