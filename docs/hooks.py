"""MkDocs hooks for the aggregated Opentrons docs site."""

from __future__ import annotations

import sys
from pathlib import Path

_DOCS_ROOT = Path(__file__).resolve().parent
if str(_DOCS_ROOT) not in sys.path:
    sys.path.insert(0, str(_DOCS_ROOT))

from scripts.generate_build_info import write_build_info_html  # noqa: E402


def on_post_build(config, **kwargs) -> None:
    """Write ``site/info/index.html`` after every MkDocs build or serve rebuild.

    Args:
        config: MkDocs config mapping; ``site_dir`` is the output directory.
        **kwargs: Additional MkDocs hook arguments (unused).
    """
    site_dir = Path(config["site_dir"])
    write_build_info_html(site_dir / "info" / "index.html")



def on_post_build(config, **kwargs) -> None:
    """Write ``site/info/index.html`` after every MkDocs build or serve rebuild.

    Args:
        config: MkDocs config mapping; ``site_dir`` is the output directory.
        **kwargs: Additional MkDocs hook arguments (unused).
    """
    site_dir = Path(config["site_dir"])
    write_build_info_html(site_dir / "info" / "index.html")
