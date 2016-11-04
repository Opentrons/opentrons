from setuptools import setup, find_packages

config = {
    'description':
        "A suite of tools for portable automated scientific protocols.",
    'author': "Opentrons",
    'author_email': 'engineering@opentrons.com',
    'url': 'http://opentrons.com',
    'version': '2.0',
    'packages': find_packages(exclude=["tests"]),
    'install_requires': ['pyserial==3.1.1'],
    'package_data': {
        "opentrons": [
            "config/containers/default-containers.json",
        ]
    },
    'scripts': [
        'bin/opentrons-compile'
    ],
    'name': 'opentrons',
    'test_suite': 'nose.collector',
    'zip_safe': False
}

setup(**config)
