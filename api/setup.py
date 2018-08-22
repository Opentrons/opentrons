# Inspired by:
# https://hynek.me/articles/sharing-your-labor-of-love-pypi-quick-and-dirty/
import codecs
import os
import shutil
from setuptools import setup, find_packages
import json

HERE = os.path.abspath(os.path.dirname(__file__))


def get_version():
    with open(os.path.join(HERE, 'opentrons', 'package.json')) as pkg:
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
PACKAGES = find_packages(where='.', exclude=["tests.*", "tests"])
INSTALL_REQUIRES = [
    'pyserial==3.2.1',
    'aiohttp==2.3.8',
    'numpy==1.12.1',
    'urwid==1.3.1']

def read(*parts):
    """
    Build an absolute path from *parts* and and return the contents of the
    resulting file.  Assume UTF-8 encoding.
    """
    with codecs.open(os.path.join(HERE, *parts), "rb", "utf-8") as f:
        return f.read()


if __name__ == "__main__":
    pipette_config_filename = 'pipette-config.json'
    config_src = os.path.join(
        '..', 'shared-data', 'robot-data', pipette_config_filename)
    config_dst = os.path.join('opentrons', 'config')
    # If you add more copies like this in setup.py you must add them to the
    # Dockerfile as well, since this doesn’t work during a docker build
    try:
        pipette_config_file = os.path.join(config_dst, pipette_config_filename)
        if os.path.exists(pipette_config_file):
            os.remove(pipette_config_file)
        shutil.copy2(config_src, config_dst)
    except OSError:
        print('Unable to copy shared data directory due to exception:')

    setup(
        python_requires='>=3.6',
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
        setup_requires=['pytest-runner'],
        tests_require=['pytest'],
        include_package_data=True
    )
    if os.environ.get('RUNNING_ON_PI'):
        # This only applies to software updates: when `pip install` is invoked
        # on a running robot - not when `pip install` is invoked in the
        # Dockerfile and not when the server starts up on a robot.
        resource_dir = os.path.join(HERE, 'opentrons', 'resources')
        provision = os.path.join(resource_dir, 'provision.py')
        # We use a subprocess that invokes another python here to avoid
        # importing the opentrons module that we’re about to install, since this
        # is side-effect-heavy.
        import sys
        import subprocess
        subprocess.check_call([sys.executable, provision], stdout=sys.stdout)
