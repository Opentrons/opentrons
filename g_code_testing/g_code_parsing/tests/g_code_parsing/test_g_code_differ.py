import pytest
from textwrap import dedent
from opentrons.hardware_control.g_code_parsing.g_code_differ import GCodeDiffer
from opentrons.hardware_control.g_code_parsing.g_code import GCode
from opentrons.hardware_control.g_code_parsing.g_code_program.g_code_program import (
    GCodeProgram,
)
from opentrons.hardware_control.g_code_parsing.g_code_program.supported_text_modes import (  # noqa: E501
    SupportedTextModes,
)

# Naive Strings
HELLO = "Hello"
HELLO_WORLD = "Hello World"

# G-Codes Only
G_CODE_1 = dedent(
    """
    G28.2 ABC
    G0 F5.005
    """
).strip()
G_CODE_2 = dedent(
    """
    G28.2 ABC
    M400
    G0 F5.005
    """
).strip()


# Concise G-Code Text Explanations
@pytest.fixture
def first_g_code_explanation() -> str:
    g_code_line_1 = GCode.from_raw_code(
        "G28.2 ABCXYZ", GCode.SMOOTHIE_IDENT, "ok\r\nok\r\n"
    )[0]
    g_code_line_2 = GCode.from_raw_code(
        "G38.2 F420Y-40.0",
        GCode.SMOOTHIE_IDENT,
        "G38.2 F420Y-40.0\r\n\r\n[PRB:296.825,292.663,218.000:1]\nok\r\nok\r\n",
    )[0]
    g_code_line_3 = GCode.from_raw_code(
        "M203.1 A125 B40 C40 X600 Y400 Z125\r\n\r\n", GCode.SMOOTHIE_IDENT, ""
    )[0]
    mode = SupportedTextModes.get_text_mode(SupportedTextModes.CONCISE.value)
    return "\n".join(
        [mode.builder(line) for line in [g_code_line_1, g_code_line_2, g_code_line_3]]
    )


@pytest.fixture
def second_g_code_explanation() -> str:
    g_code_line_1 = GCode.from_raw_code(
        "G28.2 ABCXYZ", GCode.SMOOTHIE_IDENT, "ok\r\nok\r\n"
    )[0]
    g_code_line_2 = GCode.from_raw_code(
        "M203.1 A125 B40 C40 X600 Y400 Z125\r\n\r\n", GCode.SMOOTHIE_IDENT, ""
    )[0]

    mode = SupportedTextModes.get_text_mode(SupportedTextModes.CONCISE.value)
    return "\n".join([mode.builder(line) for line in [g_code_line_1, g_code_line_2]])


@pytest.fixture
def first_g_code_program() -> GCodeProgram:
    raw_codes = [
        ["G28.2 ABCXYZ", "ok\r\nok\r\n"],
        ["G0 X113.38 Y11.24", "ok\r\nok\r\n"],
        ["G4 P555", "ok\r\nok\r\n"],
        ["M114.2", "M114.2\r\n\r\nok MCS: A:218.0 B:0.0 C:0.0 X:418.0 Y:-3.0 Z:218.0"],
    ]

    g_code_list = [
        GCode.from_raw_code(code, "smoothie", response) for code, response in raw_codes
    ]

    program = GCodeProgram()
    program.add_g_codes([code[0] for code in g_code_list])
    return program


@pytest.fixture
def second_g_code_program() -> GCodeProgram:
    raw_codes = [
        ["G28.2 ABCXYZ", "ok\r\nok\r\n"],
        ["G0 X113.01 Y11.24", "ok\r\nok\r\n"],
        ["G4 P555", "ok\r\nok\r\n"],
    ]

    g_code_list = [
        GCode.from_raw_code(code, "smoothie", response) for code, response in raw_codes
    ]

    program = GCodeProgram()
    program.add_g_codes([code[0] for code in g_code_list])
    return program


def test_naive_insertion():
    diff = GCodeDiffer(HELLO, HELLO_WORLD).get_diff()
    hello = diff[0]
    world = diff[1]
    assert GCodeDiffer.get_diff_type(hello) == GCodeDiffer.EQUALITY_TYPE
    assert GCodeDiffer.get_diff_content(hello) == "Hello"
    assert GCodeDiffer.get_diff_type(world) == GCodeDiffer.INSERTION_TYPE
    assert GCodeDiffer.get_diff_content(world) == " World"


def test_naive_deletion():
    diff = GCodeDiffer(HELLO_WORLD, HELLO).get_diff()
    hello = diff[0]
    world = diff[1]
    assert GCodeDiffer.get_diff_type(hello) == GCodeDiffer.EQUALITY_TYPE
    assert GCodeDiffer.get_diff_content(hello) == "Hello"
    assert GCodeDiffer.get_diff_type(world) == GCodeDiffer.DELETION_TYPE
    assert GCodeDiffer.get_diff_content(world) == " World"


def test_g_code_insertion():
    diff = GCodeDiffer(G_CODE_1, G_CODE_2).get_diff()
    line_1 = diff[0]
    line_2 = diff[1]
    line_3 = diff[2]

    assert GCodeDiffer.get_diff_type(line_1) == GCodeDiffer.EQUALITY_TYPE
    assert GCodeDiffer.get_diff_content(line_1) == "G28.2 ABC\n"
    assert GCodeDiffer.get_diff_type(line_2) == GCodeDiffer.INSERTION_TYPE
    assert GCodeDiffer.get_diff_content(line_2) == "M400\n"
    assert GCodeDiffer.get_diff_type(line_3) == GCodeDiffer.EQUALITY_TYPE
    assert GCodeDiffer.get_diff_content(line_3) == "G0 F5.005"


def test_g_code_deletion():
    diff = GCodeDiffer(G_CODE_2, G_CODE_1).get_diff()
    line_1 = diff[0]
    line_2 = diff[1]
    line_3 = diff[2]

    assert GCodeDiffer.get_diff_type(line_1) == GCodeDiffer.EQUALITY_TYPE
    assert GCodeDiffer.get_diff_content(line_1) == "G28.2 ABC\n"
    assert GCodeDiffer.get_diff_type(line_2) == GCodeDiffer.DELETION_TYPE
    assert GCodeDiffer.get_diff_content(line_2) == "M400\n"
    assert GCodeDiffer.get_diff_type(line_3) == GCodeDiffer.EQUALITY_TYPE
    assert GCodeDiffer.get_diff_content(line_3) == "G0 F5.005"


def test_g_code_explanation_insertion(
    first_g_code_explanation, second_g_code_explanation
):
    diff = GCodeDiffer(second_g_code_explanation, first_g_code_explanation).get_diff()
    line_1 = diff[0]
    line_2 = diff[1]
    line_3 = diff[2]

    assert GCodeDiffer.get_diff_type(line_1) == GCodeDiffer.EQUALITY_TYPE
    assert (
        GCodeDiffer.get_diff_content(line_1) == "smoothie: G28.2 A B C X Y Z -> "
        "Homing the following axes: X, Y, Z, A, B, C ->"
        "\nsmoothie: "
    )

    assert GCodeDiffer.get_diff_type(line_2) == GCodeDiffer.INSERTION_TYPE
    assert (
        GCodeDiffer.get_diff_content(line_2)
        == "G38.2 F420.0 Y-40.0 -> Probing -40.0 on the Y axis, at a speed of 420.0 "
        "-> Probed to : X Axis: 296.825 Y Axis: 292.663 Z Axis: 218.000\nsmoothie: "
    )
    assert GCodeDiffer.get_diff_type(line_3) == GCodeDiffer.EQUALITY_TYPE
    assert (
        GCodeDiffer.get_diff_content(line_3)
        == "M203.1 A125.0 B40.0 C40.0 X600.0 Y400.0 Z125.0 -> "
        "Setting the max speed for the following axes: "
        "X-Axis: 600.0 Y-Axis: 400.0 Z-Axis: 125.0 "
        "A-Axis: 125.0 B-Axis: 40.0 C-Axis: 40.0 ->"
    )


def test_g_code_explanation_deletion(
    first_g_code_explanation, second_g_code_explanation
):
    diff = GCodeDiffer(first_g_code_explanation, second_g_code_explanation).get_diff()
    line_1 = diff[0]
    line_2 = diff[1]
    line_3 = diff[2]

    assert GCodeDiffer.get_diff_type(line_1) == GCodeDiffer.EQUALITY_TYPE
    assert (
        GCodeDiffer.get_diff_content(line_1) == "smoothie: G28.2 A B C X Y Z -> "
        "Homing the following axes: X, Y, Z, A, B, C ->"
        "\nsmoothie: "
    )

    assert GCodeDiffer.get_diff_type(line_2) == GCodeDiffer.DELETION_TYPE
    assert (
        GCodeDiffer.get_diff_content(line_2)
        == "G38.2 F420.0 Y-40.0 -> Probing -40.0 on the Y axis, at a speed of 420.0 "
        "-> Probed to : X Axis: 296.825 Y Axis: 292.663 Z Axis: 218.000\nsmoothie: "
    )
    assert GCodeDiffer.get_diff_type(line_3) == GCodeDiffer.EQUALITY_TYPE
    assert (
        GCodeDiffer.get_diff_content(line_3)
        == "M203.1 A125.0 B40.0 C40.0 X600.0 Y400.0 Z125.0 -> Setting the max speed "
        "for the following axes: X-Axis: 600.0 Y-Axis: 400.0 Z-Axis: 125.0 "
        "A-Axis: 125.0 B-Axis: 40.0 C-Axis: 40.0 ->"
    )


def test_g_code_program_diff(first_g_code_program, second_g_code_program):
    diff = GCodeDiffer.from_g_code_program(
        first_g_code_program, second_g_code_program
    ).get_diff()
    line_1 = diff[0]
    remove_38 = diff[1]
    add_01 = diff[2]
    beginning_partial_response = diff[3]
    remove_response_38 = diff[4]
    add_response_01 = diff[5]
    remaining_partial_response = diff[6]
    remove_last_line = diff[7]

    assert GCodeDiffer.get_diff_type(line_1) == GCodeDiffer.EQUALITY_TYPE
    assert (
        GCodeDiffer.get_diff_content(line_1) == "smoothie: G28.2 A B C X Y Z -> "
        "Homing the following axes: X, Y, Z, A, B, C ->"
        "\nsmoothie: G0 X113."
    )

    assert GCodeDiffer.get_diff_type(remove_38) == GCodeDiffer.DELETION_TYPE
    assert GCodeDiffer.get_diff_content(remove_38) == "38"

    assert GCodeDiffer.get_diff_type(add_01) == GCodeDiffer.INSERTION_TYPE
    assert GCodeDiffer.get_diff_content(add_01) == "01"

    assert (
        GCodeDiffer.get_diff_type(beginning_partial_response)
        == GCodeDiffer.EQUALITY_TYPE
    )
    assert (
        GCodeDiffer.get_diff_content(beginning_partial_response)
        == " Y11.24 -> Moving the robot as follows: The gantry to 113."
    )

    assert GCodeDiffer.get_diff_type(remove_response_38) == GCodeDiffer.DELETION_TYPE
    assert GCodeDiffer.get_diff_content(remove_response_38) == "38"

    assert GCodeDiffer.get_diff_type(add_response_01) == GCodeDiffer.INSERTION_TYPE
    assert GCodeDiffer.get_diff_content(add_response_01) == "01"

    assert (
        GCodeDiffer.get_diff_type(remaining_partial_response)
        == GCodeDiffer.EQUALITY_TYPE
    )
    assert (
        GCodeDiffer.get_diff_content(remaining_partial_response)
        == " on the X-Axis The gantry to 11.24 on the Y-Axis ->"
        "\nsmoothie: G4 P555.0 -> Pausing movement for 555.0ms ->"
    )

    assert GCodeDiffer.get_diff_type(remove_last_line) == GCodeDiffer.DELETION_TYPE
    assert (
        GCodeDiffer.get_diff_content(remove_last_line)
        == "\nsmoothie: M114.2 -> Getting current position for all axes -> "
        "The current position of the robot is: A Axis: 218.0 B Axis: 0.0 "
        "C Axis: 0.0 X Axis: 418.0 Y Axis: -3.0 Z Axis: 218.0"
    )


def test_html_diff(first_g_code_explanation, second_g_code_explanation):
    expected_html = (
        "<span>smoothie: G28.2 A B C X Y Z -&gt; "
        "Homing the following axes: X, Y, Z, A, B, C -&gt;"
        "<br>smoothie: </span>"
        '<del style="background:#ffe6e6;font-size:large;'
        'font-weight:bold;">G38.2 F420.0 Y-40.0 -&gt; '
        "Probing -40.0 on the Y axis, at a speed of 420.0 "
        "-&gt; Probed to : X Axis: 296.825 Y Axis: 292.663 "
        "Z Axis: 218.000<br>smoothie: </del><span>M203.1 A125.0 B40.0 "
        "C40.0 X600.0 Y400.0 Z125.0 -&gt; Setting the max speed for the "
        "following axes: X-Axis: 600.0 Y-Axis: 400.0 Z-Axis: 125.0 "
        "A-Axis: 125.0 B-Axis: 40.0 C-Axis: 40.0 -&gt;</span>"
    )
    diff = GCodeDiffer(first_g_code_explanation, second_g_code_explanation)
    html = diff.get_html_diff()
    assert html == expected_html
