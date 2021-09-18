import pytest
import os
from g_code_parsing.g_code_engine import GCodeEngine
from g_code_parsing.g_code_program.supported_text_modes import (
    SupportedTextModes,
)
from opentrons.hardware_control.emulation.settings import (
    Settings,
    SmoothieSettings,
    PipetteSettings,
)

from g_code_parsing.g_code_test_data import ProtocolTestData
from g_code_parsing.utils import get_configuration_dir

CONFIG = Settings(
    host="0.0.0.0",
    smoothie=SmoothieSettings(
        left=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
    ),
)

PROTOCOL_PATH = os.path.join(
    get_configuration_dir(), "protocols", "smoothie_protocol.py"
)


@pytest.fixture
def protocol_g_code_engine() -> GCodeEngine:
    return GCodeEngine(CONFIG)


@pytest.fixture
def g_code_test_data() -> ProtocolTestData:
    return ProtocolTestData(name="test", path=PROTOCOL_PATH)


async def test_watcher_command_list_is_cleared(
    protocol_g_code_engine: GCodeEngine, g_code_test_data: ProtocolTestData
):
    """
    If everything is cleaning up correctly then 2 runs of the same protocol
    should return the same exact G-Code
    """
    with protocol_g_code_engine.run_protocol(g_code_test_data) as run_1:
        run_1_desc = run_1.get_text_explanation(SupportedTextModes.G_CODE)
    with protocol_g_code_engine.run_protocol(g_code_test_data) as run_2:
        run_2_desc = run_2.get_text_explanation(SupportedTextModes.G_CODE)

    assert run_1_desc == run_2_desc
