"""Smoke tests for the CommandExecutor class."""
import pytest
from datetime import datetime, timezone
from decoy import matchers
from math import isclose
from typing import Type, cast
from opentrons.protocol_engine import commands
from opentrons.protocol_engine.execution import CommandExecutor
from opentrons.protocols.models import LabwareDefinition

Uuid4Matcher = matchers.StringMatching(
    match=r"[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}"
)


class CloseToNow:
    """Matcher for any datetime that is close to now."""

    def __init__(self) -> None:
        """Initialize a CloseToNow matcher."""
        self._now = datetime.now(tz=timezone.utc)

    def __eq__(self, other: object) -> bool:
        """Check if a target object is a datetime that is close to now."""
        return isinstance(other, datetime) and isclose(
            self._now.timestamp(), other.timestamp(), rel_tol=5
        )

    def __repr__(self) -> str:
        """Represent the matcher as a string."""
        return f"<datetime close to {self._now}>"


@pytest.mark.parametrize(
    ("request", "expected_cls"),
    [
        (
            commands.AddLabwareDefinitionRequest(
                data=commands.AddLabwareDefinitionData.construct(
                    definition=cast(LabwareDefinition, {"mockDefintion": True})
                )
            ),
            commands.AddLabwareDefinition,
        )
    ],
)
def test_create_command(
    request: commands.CommandRequest,
    expected_cls: Type[commands.Command],
) -> None:
    """It should be able to create a command resource from a request."""
    subject = CommandExecutor()

    result = subject.create_command(request)

    assert result == expected_cls.construct(id)
