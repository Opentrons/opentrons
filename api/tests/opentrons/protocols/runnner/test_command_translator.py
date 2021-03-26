import pytest

from opentrons.protocols.runner.engine.command_translator import CommandTranslator
from opentrons_shared_data.protocol import dev_types


@pytest.fixture
def subject() -> CommandTranslator:
    return CommandTranslator()


@pytest.mark.parametrize(

)
def test_route_commands(subject: CommandTranslator, command: dev_types.Command) -> None:

