from pathlib import Path
import os
import sys


def get_frozen_root():
    """
    :return: Returns app path when app is packaged by pyInstaller
    """
    return sys._MEIPASS if getattr(sys, 'frozen', False) else None


def get_assets(root, kind, ext, content=False):
    """
    Searches for html/js assets in an 'assets'
    folder start from the <root> dir.

    :param root: dir to start search from
    :param kind: html | js
    :param ext: extension type for the <kind> specified
    :param content: boolean, returns asset content as str else empty str
    :return: dict of asset name and content
    """
    assets = {}
    assets_path = os.path.join(root, 'assets')
    p = Path(os.path.join(assets_path, kind))
    for path in p.glob('**/*.{}'.format(ext)):
        name = str(path.relative_to(assets_path))
        if content:
            with open(str(path), encoding='utf8') as data:
                assets[name] = data.read()
        else:
            assets[name] = ''
    return assets
