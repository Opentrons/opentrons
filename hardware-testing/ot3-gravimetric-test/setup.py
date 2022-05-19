from setuptools import setup, find_packages

setup(
    name='ot3-gravimetric-test',
    version='0.0.1',
    packages=find_packages(where=".", exclude=["tests.*", "tests"]),
    url='',
    license='',
    author='opentrons',
    author_email='engineering@opentrons.com',
    description='tools for running gravimetric tests on ot3'
)
