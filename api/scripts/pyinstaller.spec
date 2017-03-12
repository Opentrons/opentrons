# -*- mode: python -*-

import os

import opentrons

block_cipher = None

a = Analysis(['../opentrons/server/main.py'],
             pathex=[],
             binaries=None,
             datas=[
                 ('../opentrons/server/templates/', 'templates'),
                 (os.path.join(opentrons.__path__[0], 'config'), 'opentrons/config')
             ],
             hiddenimports=[
                 'engineio.async_gevent',
                 'opentrons.config',
             ],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          name='otone_server',
          debug=False,
          strip=False,
          upx=True,
          console=True )
