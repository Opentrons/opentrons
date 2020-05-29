import os
import json

from setuptools.command import build_py, sdist
from setuptools import setup

HERE = os.path.abspath(os.path.dirname(__file__))

DATA_ROOT = '..'
DATA_SUBDIRS = ['deck',
                'labware',
                'module',
                'pipette',
                'protocol']
DEST_BASE_PATH = 'data'

def get_shared_data_files():
    to_include = []
    for subdir in DATA_SUBDIRS:
        top = os.path.join(DATA_ROOT, subdir)
        for dirpath, dirnames, filenames in os.walk(top):
            from_source = os.path.relpath(dirpath, DATA_ROOT)
            to_include.extend([os.path.join(from_source, fname)
                               for fname in filenames])
    return to_include


class SDistWithData(sdist.sdist):
    description = sdist.sdist.description\
        + " Also, include data files."

    def make_release_tree(self, base_dir, files):
        self.announce("adding data files to base dir {}"
                      .format(base_dir))
        for data_file in get_shared_data_files():
            sdist_dest = os.path.join(base_dir, DEST_BASE_PATH)
            self.mkpath(os.path.join(sdist_dest, 'opentrons_shared_data',
                                     os.path.dirname(data_file)))
            self.copy_file(os.path.join(DATA_ROOT, data_file),
                           os.path.join(sdist_dest, data_file))
        # also grab our package.json
        self.copy_file(os.path.join(HERE, '..', 'package.json'),
                       os.path.join(base_dir, 'package.json'))
        super().make_release_tree(base_dir, files)


class BuildWithData(build_py.build_py):
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
        # should be something ending in opentrons_shared_data
        build_base = os.path.commonpath([f[2] for f in files])
        # We want a list of paths to only files relative to ../shared-data
        to_include = get_shared_data_files()
        destination = os.path.join(build_base, DEST_BASE_PATH)
        # And finally, tell the system about our files, including package.json
        files.extend([('opentrons_shared_data', DATA_ROOT,
                       destination, to_include),
                      ('opentrons_shared_data', '..',
                       build_base, ['package.json'])])
        return files


def get_version():
    with open(os.path.join(HERE, '..', 'package.json')) as pkg:
        package_json = json.load(pkg)
        return package_json['version']

VERSION = get_version()

DISTNAME = 'opentrons_shared_data'
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
    "A bundle of data and python binding that supports the Opentrons API. "
    "Does not need to be installed manually; only a dependency of the "
    "opentrons package")
PACKAGES = ['opentrons_shared_data']
INSTALL_REQUIRES = [
    'jsonschema>=3.0.2,<4',
]


if __name__ == "__main__":
    setup(
        python_requires='>=3.7',
        name=DISTNAME,
        description=DESCRIPTION,
        license=LICENSE,
        version=VERSION,
        author=AUTHOR,
        author_email=EMAIL,
        maintainer=AUTHOR,
        maintainer_email=EMAIL,
        keywords=KEYWORDS,
        packages=PACKAGES,
        zip_safe=False,
        classifiers=CLASSIFIERS,
        install_requires=INSTALL_REQUIRES,
        include_package_data=True,
        package_data={'opentrons_shared_data': ['py.typed']},
        cmdclass={
            'build_py': BuildWithData,
            'sdist': SDistWithData
        },
        project_urls={
            'opentrons.com': "https://www.opentrons.com",
            'Source Code On Github':
            "https://github.com/Opentrons/opentrons/tree/edge/shared-data",
            'Documentation': "https://docs.opentrons.com"
        }
    )
