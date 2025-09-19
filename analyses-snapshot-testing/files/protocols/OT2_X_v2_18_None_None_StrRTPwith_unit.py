metadata = {
    "protocolName": "Str RTP with unit",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.18"}

just_right: str = "This is a description"


def add_parameters(parameters):
    parameters.add_str(
        display_name="display name",
        variable_name="variable_a",
        default="one",
        choices=[
            {"value": "one", "display": "one"},
            {"value": "two", "display": "two"},
        ],
        description=just_right,
        unit="unit",  # I cause the error
    )
    ## TODO: str with unit,min,max


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
