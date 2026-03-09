"""Test comment command."""

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.comment import (
    CommentImplementation,
    CommentParams,
    CommentResult,
)


async def test_comment_implementation() -> None:
    """Confirm that comment command can be created and executed."""
    subject = CommentImplementation()

    data = CommentParams(message="hello world")

    result = await subject.execute(data)

    assert result == SuccessData(public=CommentResult())
