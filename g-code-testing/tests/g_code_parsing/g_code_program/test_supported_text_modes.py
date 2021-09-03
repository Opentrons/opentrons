import pytest

from g_code_parsing.errors import InvalidTextModeError
from g_code_parsing.g_code import GCode
from g_code_parsing.g_code_program.supported_text_modes import (  # noqa: E501
    SupportedTextModes,
    TextMode,
    default_builder,
    concise_builder,
)


@pytest.fixture
def concise_mode() -> TextMode:
    return SupportedTextModes.get_text_mode("Concise")


@pytest.fixture
def default_mode() -> TextMode:
    return SupportedTextModes.get_text_mode("Default")


@pytest.fixture
def g_code() -> GCode:
    return GCode.from_raw_code(
        "M92 X80.0 Y80.0 Z400 A400",
        "smoothie",
        "X:80.000000 Y:80.000000 Z:400.000000 A:400.000000 B:955.000000 "
        "C:768.000000 \r\nok\r\nok\r\n",
    )[0]


@pytest.mark.parametrize(
    "input_mode,name,builder_function",
    [
        [SupportedTextModes.CONCISE.value, "Concise", concise_builder],
        [SupportedTextModes.DEFAULT.value, "Default", default_builder],
    ],
)
def test_mode_lookup(input_mode, name, builder_function):
    assert SupportedTextModes.get_text_mode(input_mode).name == name
    assert SupportedTextModes.get_text_mode(input_mode).builder == builder_function


@pytest.mark.parametrize(
    "input_mode,name,builder_function",
    [
        [SupportedTextModes.CONCISE, "Concise", concise_builder],
        [SupportedTextModes.DEFAULT, "Default", default_builder],
    ],
)
def test_mode_lookup_by_enum(input_mode, name, builder_function):
    assert SupportedTextModes.get_text_mode_by_enum_value(input_mode).name == name
    assert (
        SupportedTextModes.get_text_mode_by_enum_value(input_mode).builder
        == builder_function
    )


def test_invalid_mode_name():
    with pytest.raises(InvalidTextModeError):
        SupportedTextModes.get_text_mode("INVALID MODE")


def test_concise_mode(concise_mode, g_code):
    expected = (
        "smoothie: M92 X80.0 Y80.0 Z400.0 A400.0 -> "
        "Setting the following axes steps per mm: "
        "X-Axis: 80.0 steps per mm "
        "Y-Axis: 80.0 steps per mm "
        "Z-Axis: 400.0 steps per mm "
        "A-Axis: 400.0 steps per mm -> "
        "Current set steps per mm: "
        "X Axis: 80.000000 "
        "Y Axis: 80.000000 "
        "Z Axis: 400.000000 "
        "A Axis: 400.000000 "
        "B Axis: 955.000000 "
        "C Axis: 768.000000"
    )

    assert concise_mode.builder(g_code) == expected


def test_default_mode(default_mode, g_code):
    expected = (
        "Device: smoothie"
        "\nCode: M92 X80.0 Y80.0 Z400.0 A400.0"
        "\nExplanation: Setting the following axes steps per mm:"
        "\n\tX-Axis: 80.0 steps per mm"
        "\n\tY-Axis: 80.0 steps per mm"
        "\n\tZ-Axis: 400.0 steps per mm"
        "\n\tA-Axis: 400.0 steps per mm"
        "\nResponse: Current set steps per mm:"
        "\n\tX Axis: 80.000000"
        "\n\tY Axis: 80.000000"
        "\n\tZ Axis: 400.000000"
        "\n\tA Axis: 400.000000"
        "\n\tB Axis: 955.000000"
        "\n\tC Axis: 768.000000"
        "\n-----------------------------------------"
    )

    assert default_mode.builder(g_code) == expected
