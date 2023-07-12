"""Setup script."""

from setuptools import setup, find_packages

setup(
    name="hardware_testing",
    version="0.0.1",
    packages=find_packages(where=".", exclude=["tests.*", "tests"]),
    url="",
    license="",
    author="opentrons",
    author_email="engineering@opentrons.com",
    description="tools for running hardware tests.",
)
