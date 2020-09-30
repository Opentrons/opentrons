from typing import List, Tuple

from pathlib import Path


def get_ot_defs() -> List[Tuple[str, int]]:
    loadnames = [deffile for deffile
                 in (Path(__file__).parent
                     / '..' / '..' / '..'
                     / 'labware' / 'definitions' / '2').iterdir()]
    def yielder():
        for dirpath in loadnames:
            for fname in dirpath.iterdir():
                yield dirpath.name, fname.stem

    return list(yielder())
