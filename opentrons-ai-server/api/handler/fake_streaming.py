"""Fake streaming responses for development and UI testing."""

import asyncio
import json
from typing import Any, AsyncGenerator, Dict, Optional

import structlog
from fastapi.responses import StreamingResponse

from api.domain.fake_responses import get_fake_response
from api.models.chat_response import ChatResponse

logger = structlog.stdlib.get_logger(__name__)

STREAMING_15S_FAKE_KEY = "streaming_15s"
STREAMING_3S_FAKE_KEY = "streaming_3s"

_DURATION_15S = 15.0
_DURATION_3S = 3.0
_CHUNK_INTERVAL_S = 0.5
_CHUNK_INTERVAL_3S_S = 0.3

_STREAMING_15S_CONTENT = """# Protocol overview

This is a **streaming test** with _mixed_ markdown so the UI can render it correctly.

## Setup steps

1. Load labware with `load_labware()`
2. Load a pipette with `load_instrument()`
3. Use the pipette to transfer liquid

Unordered options:

- Option A: use a single-channel pipette
- Option B: use a multi-channel pipette
- Option C: use both

> **Note:** Always pre-wet tips for accurate transfers. See the [Opentrons docs](https://docs.opentrons.com) for more.

---

## Python protocol

```python
from opentrons import protocol_api

metadata = {"apiLevel": "2.19"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", 1)
    tiprack = protocol.load_labware("opentrons_96_tiprack_300ul", 2)
    pipette = protocol.load_instrument("p300_single_gen2", "left", tip_racks=[tiprack])
    pipette.transfer(50, plate["A1"], plate["A2"])
```

## Shell command (optional)

```bash
# Run the protocol
opentrons_execute protocol.py
```

## Summary

| Step | Action        |
|------|---------------|
| 1    | Load labware  |
| 2    | Load pipette  |
| 3    | Transfer 50 µL|

Done. You can **edit** this in Protocol Designer or run it on the robot.
"""  # noqa: E501


_STREAMING_3S_CONTENT = """# Live test stream (3s)

This is a **short** streaming fake for live tests.

1. First step: load labware
2. Second step: load pipette
3. Third step: transfer

```python
from opentrons import protocol_api

def run(protocol: protocol_api.ProtocolContext) -> None:
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", 1)
    pipette = protocol.load_instrument("p300_single_gen2", "left")
    pipette.transfer(50, plate["A1"], plate["A2"])
```

Done.
"""


async def _stream_fake_15s(route: str) -> AsyncGenerator[str, Any]:
    """Yield SSE delta chunks over ~15 seconds for streaming UI tests."""
    logger.info("SSE stream started (15s fake)", extra={"route": route})
    text = _STREAMING_15S_CONTENT
    n = max(1, int(_DURATION_15S / _CHUNK_INTERVAL_S))
    chunk_size = max(1, len(text) // n)
    chunks = [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)] or [text]
    for chunk in chunks:
        await asyncio.sleep(_CHUNK_INTERVAL_S)
        yield f"data: {json.dumps({'delta': chunk})}\n\n"
    logger.info("SSE stream completed (15s fake)", extra={"route": route})
    yield 'data: {"done": true}\n\n'


async def _stream_fake_3s(route: str) -> AsyncGenerator[str, Any]:
    """Yield SSE delta chunks over ~3 seconds for live/test responses."""
    logger.info("SSE stream started (3s fake)", extra={"route": route})
    text = _STREAMING_3S_CONTENT
    n = max(1, int(_DURATION_3S / _CHUNK_INTERVAL_3S_S))
    chunk_size = max(1, len(text) // n)
    chunks = [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)] or [text]
    for chunk in chunks:
        await asyncio.sleep(_CHUNK_INTERVAL_3S_S)
        yield f"data: {json.dumps({'delta': chunk})}\n\n"
    logger.info("SSE stream completed (3s fake)", extra={"route": route})
    yield 'data: {"done": true}\n\n'


async def _stream_instant_fake(reply: str, route: str) -> AsyncGenerator[str, Any]:
    """Yield a single SSE event immediately for non-15s fakes."""
    logger.info("SSE stream started (fake)", extra={"route": route})
    yield f"data: {json.dumps({'delta': reply, 'done': True})}\n\n"
    logger.info("SSE stream completed (fake)", extra={"route": route})


def handle_fake_response(fake: bool, fake_key: Optional[str] = None) -> Optional[ChatResponse]:
    """Return a ChatResponse for fake/fake_key requests, or None for real requests."""
    if fake_key is not None:
        fake_resp = get_fake_response(fake_key)
        return ChatResponse(
            reply=fake_resp.chat_response.reply,
            fake=fake_resp.chat_response.fake,
            protocol_content=fake_resp.chat_response.protocol_content,
        )
    if fake:
        return ChatResponse(reply="Default fake response", fake=True)
    return None


def make_fake_streaming_response(
    fake: bool,
    fake_key: Optional[str],
    route: str,
    sse_headers: Dict[str, str],
) -> Optional[StreamingResponse]:
    """Return a fake StreamingResponse if fake flags are set, else None.

    Call at the top of every streaming route handler before real LLM logic:

        fake_stream = make_fake_streaming_response(body.fake, body.fake_key, "myRoute/stream", SSE_HEADERS)
        if fake_stream is not None:
            return fake_stream
    """
    if not fake:
        return None
    if str(fake_key or "") == STREAMING_15S_FAKE_KEY:
        return StreamingResponse(
            _stream_fake_15s(route),
            media_type="text/event-stream",
            headers=sse_headers,
        )
    if str(fake_key or "") == STREAMING_3S_FAKE_KEY:
        return StreamingResponse(
            _stream_fake_3s(route),
            media_type="text/event-stream",
            headers=sse_headers,
        )
    fake_resp = handle_fake_response(fake, fake_key)
    reply = fake_resp.reply if fake_resp is not None else "Fake response"
    return StreamingResponse(
        _stream_instant_fake(reply, route),
        media_type="text/event-stream",
        headers=sse_headers,
    )
