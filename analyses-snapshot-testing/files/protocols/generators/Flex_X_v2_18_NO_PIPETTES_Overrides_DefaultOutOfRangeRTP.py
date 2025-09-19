# I am going to get added to in the test runner
# type_to_test = default_greater_than_maximum
# protocol.override_variable_name = type_to_test

metadata = {
    "protocolName": "Default not in range",
}

requirements = {"robotType": "Flex", "apiLevel": "2.18"}


# change me to test that a bad type is caught
# for each field of parameter.
# protocol.overrides is a list of these strings
default_greater_than_maximum = "default_greater_than_maximum"
default_less_than_minimum = "default_less_than_minimum"


def add_parameters(parameters):
    match type_to_test:
        case str() if type_to_test == default_greater_than_maximum:
            parameters.add_int(
                display_name="display name",
                variable_name="dilutions",
                default=4,
                minimum=1,
                maximum=3,
                description="This is a description.",
            )
        case str() if type_to_test == default_less_than_minimum:
            parameters.add_int(
                display_name="display name",
                variable_name="dilutions",
                default=0,
                minimum=1,
                maximum=3,
                description="This is a description.",
            )


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
