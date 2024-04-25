metadata = {
    "protocolName": "Duplicate choice value",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.18"}

# we allow duplicate choice values,even for the default
# validated this does not cause any issues in the app as well - 4/12/2014 ✅ it does not.


def add_parameters(parameters):
    parameters.add_str(
        display_name="Pipette Name",
        variable_name="pipette",
        choices=[
            {"display_name": "Single channel 50µL", "value": "flex_1channel_50"},
            {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
            {"display_name": "Single channel 50µL again", "value": "flex_1channel_50"},  # duplicate choice value
        ],
        default="flex_1channel_50",
        description="What pipette to use during the protocol.",
    )


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
