from opentrons.drivers.asyncio.communication import CommandBuilder


def test_builder_create_command_with_terminator() -> None:
    """It should create a command with terminator."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.build() == "terminator"


def test_builder_create_command_with_float() -> None:
    """It should create a command with a floating point value."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.with_float(
        prefix='Z', value=1.2342, precision=3
    ).build() == "Z1.234 terminator"


def test_builder_create_command_with_int() -> None:
    """It should create a command with an integer point value."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.with_int(
        prefix='Z', value=15
    ).build() == "Z15 terminator"


def test_builder_create_command_with_gcode() -> None:
    """It should create a command with a GCODE."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.with_gcode(
        gcode='G321'
    ).build() == "G321 terminator"


def test_builder_chain() -> None:
    """It should create a command using chaining."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.with_gcode(
        gcode='G321'
    ).with_float(
        prefix="X", value=321
    ).with_gcode(
        gcode="M321"
    ).with_int(
        prefix="Z", value=3
    ).with_gcode("G111").build() == "G321 X321 M321 Z3 G111 terminator"
