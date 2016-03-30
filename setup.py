from setuptools import setup, find_packages

config = {
    'description': "A suite of tools for portable automated scientific protocols.",
    'author': "OpenTrons",
    'url': 'http://opentrons.com',
    'version': '0.2',
    'install_requires': ['pyyaml'],
    'packages': find_packages(),
    'package_data': { 
        "labsuite": [
            "config/containers/**/*.yml",
            "config/containers/legacy_containers.json"
        ]
    },
    'name': 'labsuite',
    'test_suite': 'nose.collector',
    'zip_safe': False
}

setup(**config)
