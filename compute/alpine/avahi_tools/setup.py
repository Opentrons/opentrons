from setuptools import setup

INSTALL_REQUIRES = []

setup(name='avahi_tools',
      version='0.1',
      description='Tools for service publishing over mdns / dns-sd',
      url='http://github.com/opentrons/opentrons',
      author='Opentrons Labworks',
      author_email='engineering@opentrons.com',
      license='APACHE 2.0',
      packages=['avahi_tools'],
      install_requires=INSTALL_REQUIRES,
      zip_safe=False)
