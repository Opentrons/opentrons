# Inspired by:
# https://hynek.me/articles/sharing-your-labor-of-love-pypi-quick-and-dirty/
import sys
import codecs
import os
import os.path

from setuptools import setup, find_packages

HERE = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(HERE, "..", "scripts"))

from python_build_utils import normalize_version  # noqa: E402

# make stdout blocking since Travis sets it to nonblocking
if os.name == "posix":
    import fcntl

    flags = fcntl.fcntl(sys.stdout, fcntl.F_GETFL)
    fcntl.fcntl(sys.stdout, fcntl.F_SETFL, flags & ~os.O_NONBLOCK)


def get_version():
    buildno = os.getenv("BUILD_NUMBER")
    project = os.getenv("OPENTRONS_PROJECT", "robot-stack")
    git_dir = os.getenv("OPENTRONS_GIT_DIR", None)
    if buildno:
        normalize_opts = {"extra_tag": buildno}
    else:
        normalize_opts = {}
    return normalize_version("api", project, git_dir=git_dir, **normalize_opts)


VERSION = get_version()

DISTNAME = "opentrons"
LICENSE = "Apache 2.0"
AUTHOR = "Opentrons"
EMAIL = "engineering@opentrons.com"
URL = "https://github.com/OpenTrons/opentrons"
DOWNLOAD_URL = ""
CLASSIFIERS = [
    "Development Status :: 5 - Production/Stable",
    "Environment :: Console",
    "Operating System :: OS Independent",
    "Intended Audience :: Science/Research",
    "Programming Language :: Python",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.7",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Topic :: Scientific/Engineering",
]
KEYWORDS = ["robots", "protocols", "synbio", "pcr", "automation", "lab"]
DESCRIPTION = (
    "The Opentrons API is a simple framework designed to make "
    "writing automated biology lab protocols easy."
)
PACKAGES = find_packages(where="src")
INSTALL_REQUIRES = [
    f"opentrons-shared-data=={VERSION}",
    "aionotify>=0.2.0,<1",
    "anyio>=3.3.0,<4",
    "jsonschema>=3.0.2,<5",
    "numpy>=1.15.1,<2",
    "pydantic>=1.8.2,<2",
    "pyserial>=3.5,<4",
    "typing-extensions>=4.0.0,<5",
    "click>=8.0.0,<9",
    'importlib-metadata >= 1.0 ; python_version < "3.8"',
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
        python_requires=">=3.7",
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
        package_dir={"": "src"},
        package_data={"opentrons": ["py.typed"]},
        entry_points={
            "console_scripts": [
                "opentrons_simulate = opentrons.simulate:main",
                "opentrons_execute = opentrons.execute:main",
            ]
        },
        project_urls={
            "opentrons.com": "https://www.opentrons.com",
            "Source Code On Github": "https://github.com/Opentrons/opentrons/tree/edge/api",
            "Documentation": "https://docs.opentrons.com",
        },
    )
