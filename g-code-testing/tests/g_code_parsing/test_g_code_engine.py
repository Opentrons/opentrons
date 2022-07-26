import pytest
import os

from opentrons import APIVersion

from g_code_parsing.g_code_engine import GCodeEngine
from g_code_parsing.g_code_program.supported_text_modes import (
    SupportedTextModes,
)
from opentrons.hardware_control.emulation.settings import (
    Settings,
    SmoothieSettings,
    PipetteSettings,
)

from g_code_parsing.utils import get_configuration_dir

CONFIG = Settings(
    smoothie=SmoothieSettings(
        left=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
    ),
)

PROTOCOL_PATH = os.path.join(
    get_configuration_dir(), "protocol", "protocols", "fast", "smoothie_protocol.py"
)


@pytest.fixture
def protocol_g_code_engine() -> GCodeEngine:
    return GCodeEngine(CONFIG)


async def test_watcher_command_list_is_cleared(protocol_g_code_engine: GCodeEngine):
    """
    If everything is cleaning up correctly then 2 runs of the same protocol
    should return the same exact G-Code
    """
    with protocol_g_code_engine.run_protocol(PROTOCOL_PATH, APIVersion(2, 13)) as run_1:
        run_1_desc = run_1.get_text_explanation(SupportedTextModes.G_CODE)
    with protocol_g_code_engine.run_protocol(PROTOCOL_PATH, APIVersion(2, 13)) as run_2:
        run_2_desc = run_2.get_text_explanation(SupportedTextModes.G_CODE)

    assert run_1_desc == run_2_desc
