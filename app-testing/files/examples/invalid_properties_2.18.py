metadata = {
    "protocolName": "Add invalid properties to an RTP",
}

requirements = {"robotType": "Flex", "apiLevel": "2.18"}


def add_parameters(parameters):
    parameters.add_int(
        display_name="Washes",
        variable_name="washes",
        default=6,
        description="How many washes to perform.",
        choices=[
            {"display_name": "1X", "value": 6},
            {"display_name": "2X", "value": 12},
        ],
        magic="🪄🪄🪄🪄",
    )


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
