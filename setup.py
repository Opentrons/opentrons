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
    'extras_require': {
        'docs': ['numpydoc==0.6.0', 'Sphinx==1.4.8']
    },
    'package_data': {
        "opentrons": [
            "config/containers/legacy_containers.json",
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
