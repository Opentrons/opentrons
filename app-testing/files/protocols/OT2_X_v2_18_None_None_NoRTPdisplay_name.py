metadata = {
    "protocolName": "No RTP Display Name",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.18"}

just_right: str = "This is a description"


def add_parameters(parameters):
    parameters.add_int(
        # display_name is missing
        variable_name="variable_a",
        default=1,
        minimum=1,
        maximum=3,
        description=just_right,
    )


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
