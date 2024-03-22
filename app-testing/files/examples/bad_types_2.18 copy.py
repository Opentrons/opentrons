metadata = {
    "protocolName": "Description Too Long 2.18",
}

requirements = {"robotType": "Flex", "apiLevel": "2.18"}


# change me to test that a bad description is caught
# for each type of parameter we can add.
type_to_test = 1


def add_parameters(parameters):
    match type_to_test:
        case 1:  # Wrong type in display_name
            parameters.add_int(
                display_name=5,
                variable_name="dilutions",
                default=1,
                minimum=1,
                maximum=3,
                description="This is a description.",
            )
        case 2:  # Wrong type in variable_name
            parameters.add_float(
                display_name="Mixing Volume in µL",
                variable_name={},
                default=150.0,
                choices=[
                    {"display_name": "Low Volume ⬇️", "value": 100.0},
                    {"display_name": "Medium Volume 🟰", "value": 150.0},
                    {"display_name": "High Volume ⬆️", "value": 200.0},
                ],
                description="This is a description.",
            )
        case 3:  # Wrong type in choice display_name
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": 6.0, "value": "flex_1channel_50"},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default="flex_1channel_50",
                description="This is a description.",
            )
        case 4:  # Wrong type in choice value
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": "50", "value": 5},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default="flex_1channel_50",
                description="This is a description.",
            )
        case 5:  # Wrong type in default
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": "50", "value": 5},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default=6,
                description="This is a description.",
            )
        case 6:  # Wrong type in description
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": "50", "value": 5},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default=6,
                description=(),
            )
        case 7:  # Wrong type in minimum
            parameters.add_int(
                display_name="Dilutions",
                variable_name="dilutions",
                default=1,
                minimum="1",
                maximum=3,
                description="This is a description.",
            )
        case 8:  # Wrong type in maximum
            parameters.add_int(
                display_name="Dilutions",
                variable_name="dilutions",
                default=1,
                minimum=1,
                maximum="3",
                description="This is a description.",
            )
        case 9:  # Wrong type in unit
            parameters.add_int(
                display_name="Dilutions",
                variable_name="dilutions",
                default=1,
                minimum=1,
                maximum=3,
                description="This is a description.",
                unit=5,
            )


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
