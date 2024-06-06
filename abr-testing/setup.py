"""Setup script."""

import os
import sys

from setuptools import setup, find_packages

HERE = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(HERE, "..", "scripts"))
from python_build_utils import normalize_version  # noqa: E402


def _get_version() -> None:
    buildno = os.getenv("BUILD_NUMBER")
    project = os.getenv("OPENTRONS_PROJECT", "ot3")
    git_dir = os.getenv("OPENTRONS_GIT_DIR", None)
    if buildno:
        normalize_opts = {"extra_tag": buildno}
    else:
        normalize_opts = {}
    return normalize_version("abr-testing", project, git_dir=git_dir, **normalize_opts)


setup(
    name="abr_testing",
    version=_get_version(),
    packages=find_packages(where=".", exclude=["tests.*", "tests"]),
    url="",
    license="",
    author="opentrons",
    author_email="engineering@opentrons.com",
    description="tools for running application-based reliability tests.",
)
