# I am going to get added to in the test runner
# type_to_test = wrong_type_in_display_name
# protocol.override_variable_name = type_to_test

metadata = {
    "protocolName": "Description Too Long 2.18",
}

requirements = {"robotType": "Flex", "apiLevel": "2.18"}


# change me to test that a bad type is caught
# for each field of parameter.
# protocol.overrides is a list of these strings
wrong_type_in_display_name: str = "wrong_type_in_display_name"
wrong_type_in_variable_name: str = "wrong_type_in_variable_name"
wrong_type_in_choice_display_name: str = "wrong_type_in_choice_display_name"
wrong_type_in_choice_value: str = "wrong_type_in_choice_value"
wrong_type_in_default: str = "wrong_type_in_default"
wrong_type_in_description: str = "wrong_type_in_description"
wrong_type_in_minimum: str = "wrong_type_in_minimum"
wrong_type_in_maximum: str = "wrong_type_in_maximum"
wrong_type_in_unit: str = "wrong_type_in_unit"  # we going unit or suffix?


def add_parameters(parameters):
    match type_to_test:
        case str() if type_to_test == wrong_type_in_display_name:
            parameters.add_int(
                display_name=5,
                variable_name="dilutions",
                default=1,
                minimum=1,
                maximum=3,
                description="This is a description.",
            )
        case str() if type_to_test == wrong_type_in_variable_name:
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
        case str() if type_to_test == wrong_type_in_choice_display_name:
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": 6.0, "value": "flex_1channel_50"},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default="flex_8channel_50",
                description="This is a description.",
            )
        case str() if type_to_test == wrong_type_in_choice_value:
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": "50", "value": 5},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default="flex_8channel_50",
                description="This is a description.",
            )
        case str() if type_to_test == wrong_type_in_default:
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": "50", "value": "flex_8channel_1000"},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default=6,
                description="This is a description.",
            )
        case str() if type_to_test == wrong_type_in_description:
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": "50", "value": "flex_8channel_1000"},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default="flex_8channel_50",
                description=(),
            )
        case str() if type_to_test == wrong_type_in_minimum:
            parameters.add_int(
                display_name="Dilutions",
                variable_name="dilutions",
                default=1,
                minimum="1",
                maximum=3,
                description="This is a description.",
            )
        case str() if type_to_test == wrong_type_in_maximum:
            parameters.add_int(
                display_name="Dilutions",
                variable_name="dilutions",
                default=1,
                minimum=1,
                maximum="3",
                description="This is a description.",
            )
        case str() if type_to_test == wrong_type_in_unit:
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
