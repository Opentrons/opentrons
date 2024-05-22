metadata = {
    "protocolName": "Description Too Long 2.18",
}

requirements = {"robotType": "Flex", "apiLevel": "2.18"}


# change me to test that a bad description is caught
# for each type of parameter we can add.
type_to_test = 1


def add_parameters(parameters):
    too_long: str = "This is a description that is longer than 30 characters."
    match type_to_test:
        case 1:
            parameters.add_int(
                display_name="Dilutions",
                variable_name="dilutions",
                default=1,
                minimum=1,
                maximum=3,
                description=too_long,
            )
        case 2:
            parameters.add_float(
                display_name="Mixing Volume in µL",
                variable_name="mixing_volume",
                default=150.0,
                choices=[
                    {"display_name": "Low Volume ⬇️", "value": 100.0},
                    {"display_name": "Medium Volume 🟰", "value": 150.0},
                    {"display_name": "High Volume ⬆️", "value": 200.0},
                ],
                description=too_long,
            )
        case 3:
            parameters.add_str(
                display_name="Pipette Name",
                variable_name="pipette",
                choices=[
                    {"display_name": "Single channel 50µL", "value": "flex_1channel_50"},
                    {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
                ],
                default="flex_1channel_50",
                description=too_long,
            )
        case 4:
            parameters.add_bool(
                display_name="Dry Run",
                variable_name="dry_run",
                default=False,
                description=too_long,
            )


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
