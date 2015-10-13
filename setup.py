try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

config = {
    'description': "Python implementations of labware.",
    'author': "OpenTrons",
    'url': 'http://opentrons.com',
    'version': '0.1',
    'install_requires': ['nose', 'pyyaml'],
    'packages': ['labware'],
    'name': 'opentrons',
    'test_suite': 'nose.collector'
}

setup(**config)
