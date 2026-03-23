import asyncio
from typing import Any, Iterable

import pytest
from decoy import Decoy

from .util import AsyncioCSE


@pytest.fixture
def mock_asyncio_subprocess(decoy: Decoy, monkeypatch: Any) -> Iterable[AsyncioCSE]:
    decoy_cse = decoy.mock(func=asyncio.create_subprocess_exec)
    monkeypatch.setattr(asyncio, "create_subprocess_exec", decoy_cse)
    # the actual type of create_subprocess_exec is inaccessible and our protocol is
    # very tediously wrong in ways we don't care about
    return decoy_cse  # type: ignore[return-value]
