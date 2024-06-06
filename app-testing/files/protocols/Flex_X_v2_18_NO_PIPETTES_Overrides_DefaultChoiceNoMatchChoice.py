# I am going to get added to in the test runner
# type_to_test = wrong_type_in_display_name
# protocol.override_variable_name = type_to_test

metadata = {
    "protocolName": "default choice does not match a choice",
}

requirements = {"robotType": "Flex", "apiLevel": "2.18"}


# change me to test that a bad type is caught
# for each field of parameter.
# protocol.overrides is a list of these strings
str_default_no_matching_choices = "str_default_no_matching_choices"
float_default_no_matching_choices = "float_default_no_matching_choices"
int_default_no_matching_choices = "int_default_no_matching_choices"


def add_parameters(parameters):
    match type_to_test:
        case str() if type_to_test == int_default_no_matching_choices:
            parameters.add_int(
                display_name="Mixing Volume in µL",
                variable_name="mix_in_volume",
                default=10,
                choices=[
                    {"display_name": "Low Volume ⬇️", "value": 9},
                    {"display_name": "Medium Volume 🟰", "value": 15},
                    {"display_name": "High Volume ⬆️", "value": 20},
                ],
                description="This is a description.",
            )
        case str() if type_to_test == float_default_no_matching_choices:
            parameters.add_float(
                display_name="Mixing Volume in µL",
                variable_name="mix_in_volume",
                default=150.0,
                choices=[
                    {"display_name": "Low Volume ⬇️", "value": 100.0},
                    {"display_name": "Medium Volume 🟰", "value": 160.0},
                    {"display_name": "High Volume ⬆️", "value": 200.0},
                ],
                description="This is a description.",
            )
        case str() if type_to_test == str_default_no_matching_choices:
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": "1channel", "value": "flex_1channel_50"},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default="I am not in the choices",
                description="This is a description.",
            )


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
