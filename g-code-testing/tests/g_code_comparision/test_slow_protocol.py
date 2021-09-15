import pytest

from g_code_parsing.g_code_differ import GCodeDiffer
from g_code_parsing.g_code_engine import GCodeEngine
from g_code_parsing.g_code_program.supported_text_modes import SupportedTextModes
from opentrons.hardware_control.emulation.settings import Settings, SmoothieSettings
from tests.g_code_comparision.utils import get_master_file


@pytest.fixture
def two_modules_settings() -> Settings:
    smoothie = SmoothieSettings(
        left={"model": "p300_single_v2.1", "id": "P20SV202020070101"},
        right={"model": "p20_multi_v2.1", "id": "P20SV202020070101"}
    )
    return Settings(smoothie=smoothie)


@pytest.fixture()
def swift_settings() -> Settings:
    smoothie = SmoothieSettings(
        left={"model": "p20_single_v2.0", "id": "P20SV202020070101"},
        right={"model": "p300_multi_v2.1", "id": "P20SV202020070101"},
    )
    return Settings(smoothie=smoothie)


TWO_MODULES_S3_FILE_NAME = '2-modules-1s-1m-v2.txt'
TWO_MODULES_PATH = "protocols/2_modules_1s_1m_v2.py"

SWIFT_SMOKE_FILE_NAME = 'swift-smoke.txt'
SWIFT_SMOKE_PATH = "protocols/swift_smoke.py"

SWIFT_TURBO_FILE_NAME = 'swift-turbo.txt'
SWIFT_TURBO_PATH = "protocols/swift_turbo.py"


def run_test(settings: SmoothieSettings, master_file_name: str, path: str) -> None:
    expected_output = get_master_file(master_file_name)
    with GCodeEngine(settings).run_protocol(path=path) as program:
        actual_output = program.get_text_explanation(SupportedTextModes.CONCISE)

    assert actual_output == expected_output, \
        GCodeDiffer(actual_output, expected_output).get_html_diff()


@pytest.mark.g_code_confirm
@pytest.mark.slow
def test_two_modules_protocol(two_modules_settings):
    run_test(two_modules_settings, TWO_MODULES_S3_FILE_NAME, TWO_MODULES_PATH)


@pytest.mark.g_code_confirm
@pytest.mark.slow
def test_swift_smoke(swift_settings):
    run_test(swift_settings, SWIFT_SMOKE_FILE_NAME, SWIFT_SMOKE_PATH)


@pytest.mark.g_code_confirm
@pytest.mark.slow
def test_swift_turbo(swift_settings):
    run_test(swift_settings, SWIFT_TURBO_FILE_NAME, SWIFT_TURBO_PATH)

