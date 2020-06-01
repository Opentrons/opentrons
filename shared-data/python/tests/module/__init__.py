from pathlib import Path


def list_v2_defs():
    return [deffile.stem for deffile
            in (Path(__file__).parent
                / '..' / '..' / '..'
                / 'module' / 'definitions' / '2')
            .iterdir()]
