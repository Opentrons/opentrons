"""Test comment command."""
from opentrons.protocol_engine.commands.comment import (
    CommentParams,
    CommentResult,
    CommentImplementation,
)
from opentrons.protocol_engine.commands.command import SuccessData


async def test_comment_implementation() -> None:
    """Confirm that comment command can be created and executed."""
    subject = CommentImplementation()

    data = CommentParams(message="hello world")

    result = await subject.execute(data)

    assert result == SuccessData(public=CommentResult())
