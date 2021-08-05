from distutils.core import setup
INSTALL_REQUIRES = [
    'bmap-tools==3.6',
    'certifi==2021.5.30',
    'charset-normalizer==2.0.4',
    'docopt==0.6.2',
    'idna==3.2',
    'pipreqs==0.4.10',
    'requests==2.26.0',
    'six==1.16.0',
    'urllib3==1.26.6',
    'yarg==0.1.9'
]     

setup(name='RootFS',
      version='1.0',
      description='Python class for manipulating OT3 RootFS',
      author='Aatir Manzur',
      url='https://www.github.com/Opentrons/opentrons/update-server/ot3-rootfs',
      packages=['RootFS'],
      install_requires=INSTALL_REQUIRES
     )
