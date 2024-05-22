metadata = {
    "protocolName": "Multiple RTP Variables with Same Name",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.18"}

just_right: str = "This is a description"


def add_parameters(parameters):
    parameters.add_int(
        display_name="int 1",
        variable_name="variable_a",
        default=1,
        minimum=1,
        maximum=3,
        description=just_right,
    )
    parameters.add_int(
        display_name="int 2",
        variable_name="variable_b",
        default=1,
        minimum=1,
        maximum=3,
        description=just_right,
    )

    parameters.add_int(
        display_name="int 3",
        variable_name="variable_a",  # duplicate variable name
        default=1,
        minimum=1,
        maximum=3,
        description=just_right,
    )


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
