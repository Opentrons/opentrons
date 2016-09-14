# -*- mode: python -*-

import os

import opentrons_sdk

block_cipher = None

a = Analysis(['../server/main.py'],
             pathex=[],
             binaries=None,
             datas=[
                 ('../server/assets/', 'assets'),
                 ('../server/static/', 'static'),
                 ('../server/templates/', 'templates'),
                 (os.path.join(opentrons_sdk.__path__[0], 'config'), 'opentrons_sdk/config')
             ],
             hiddenimports=[
                 'engineio.async_gevent',
                 'opentrons_sdk.config',
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
