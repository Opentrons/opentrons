try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

config = {
    'description': "A suite of tools for automated scientific protocols.",
    'author': "OpenTrons",
    'url': 'http://opentrons.com',
    'version': '0.1',
    'install_requires': ['pyyaml'],
    'packages': ['labsuite'],
    'name': 'labsuite',
    'test_suite': 'nose.collector'
}

setup(**config)
