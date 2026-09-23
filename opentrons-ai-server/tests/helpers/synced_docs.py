import os

import pytest
from api.utils.api_docs_struct_curated import DOCS_V2_DIR

_SYNCED_DOCS_MESSAGE = "Synced API docs not present; run make sync-api-docs first."


def require_synced_api_docs() -> None:
    if DOCS_V2_DIR.is_dir():
        return
    if os.environ.get("CI", "").lower() in {"1", "true", "yes"}:
        pytest.fail(_SYNCED_DOCS_MESSAGE)
    pytest.skip(_SYNCED_DOCS_MESSAGE)
