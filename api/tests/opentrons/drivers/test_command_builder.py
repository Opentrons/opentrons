from opentrons.drivers.command_builder import CommandBuilder


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
    ).build() == f"Z1.234 {terminator}"


def test_builder_create_command_with_float_no_round() -> None:
    """It should create a command with a floating point value that is
    not rounded."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.with_float(
        prefix='Z', value=1.23442, precision=None
    ).build() == f"Z1.23442 {terminator}"


def test_builder_create_command_with_int() -> None:
    """It should create a command with an integer point value."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.with_int(
        prefix='Z', value=15
    ).build() == f"Z15 {terminator}"


def test_builder_create_command_with_gcode() -> None:
    """It should create a command with a GCODE."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.with_gcode(
        gcode='G321'
    ).build() == f"G321 {terminator}"


def test_builder_create_command_with_builder() -> None:
    """It should create a command words in another builder."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.with_gcode(
        gcode='G321'
    ).build() == f"G321 {terminator}"

    builder2 = CommandBuilder(terminator=terminator)
    assert builder2.with_builder(
        builder=builder
    ).with_gcode(
        gcode="G123"
    ).with_builder(
        builder=builder
    ).build() == f"G321 G123 G321 {terminator}"


def test_builder_chain() -> None:
    """It should create a command using chaining."""
    terminator = "terminator"
    builder = CommandBuilder(terminator=terminator)
    assert builder.with_gcode(
        gcode='G321'
    ).with_float(
        prefix="X", value=321, precision=3
    ).with_gcode(
        gcode="M321"
    ).with_int(
        prefix="Z", value=3
    ).with_gcode("G111").build() == f"G321 X321 M321 Z3 G111 {terminator}"
