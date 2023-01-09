"""Test pause command."""
from decoy import Decoy

from opentrons.protocol_engine.execution import RunControlHandler

from opentrons.protocol_engine.commands.comment import (
    CommentParams,
    CommentResult,
    CommentImplementation,
)


async def test_comment_implementation() -> None:
    subject = CommentImplementation()

    data = CommentParams(message="hello world")

    result = await subject.execute(data)

    assert result == CommentResult()
