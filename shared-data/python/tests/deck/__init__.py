from typing import List
from pathlib import Path


def list_deck_def_paths(version: int) -> List[str]:
    loadnames = [deffile for deffile in
                 (Path(__file__).parent / '..' / '..' / '..'
                  / 'deck' / 'definitions' / f'{version}').iterdir()]
    return [loadname.stem for loadname in loadnames]
