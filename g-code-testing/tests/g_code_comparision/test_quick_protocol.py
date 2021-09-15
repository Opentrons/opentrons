import pytest

from g_code_parsing.g_code_differ import GCodeDiffer
from g_code_parsing.g_code_engine import GCodeEngine
from g_code_parsing.g_code_program.supported_text_modes import SupportedTextModes
from opentrons.hardware_control.emulation.settings import Settings, SmoothieSettings
from tests.g_code_comparision.utils import get_master_file


def protocol_smoothie_setup() -> Settings:
    smoothie = SmoothieSettings(
        left={"model": "p20_single_v2.0", "id": "P20SV202020070101"},
        right={"model": "p20_single_v2.0", "id": "P20SV202020070101"},
    )
    return Settings(smoothie=smoothie)


def two_single_channel_setup() -> Settings:
    smoothie = SmoothieSettings(
        left={"model": "p20_single_v2.0", "id": "P20SV202020070101"},
        right={"model": "p300_single_v2.1", "id": "P20SV202020070101"},
    )
    return Settings(smoothie=smoothie)


TEST_DATA = [
    [
        "smoothie-protocol-output.txt",
        "protocols/smoothie_protocol.py",
        protocol_smoothie_setup(),
    ],
    [
        "2-single-channel-v2.txt",
        "protocols/2_single_channel_v2.py",
        two_single_channel_setup(),
    ],
]


@pytest.mark.g_code_confirm
@pytest.mark.parametrize("master_file_name,path,settings", TEST_DATA)
def test_quick_protocols(master_file_name, path, settings):
    expected_output = get_master_file(master_file_name)
    with GCodeEngine(settings).run_protocol(path=path) as program:
        actual_output = program.get_text_explanation(SupportedTextModes.CONCISE)

    assert actual_output == expected_output, GCodeDiffer(
        actual_output, expected_output
    ).get_html_diff()
