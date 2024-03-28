metadata = {
    "protocolName": "Golden RTP Examples",
}

requirements = {"robotType": "Flex", "apiLevel": "2.18"}


def add_parameters(parameters):
    ###################INT#####################
    ### int min/max with all fields ###
    parameters.add_int(
        display_name="Sample count",
        variable_name="sample_count",
        default=6,
        minimum=1,
        maximum=12,
        description="How many samples to process.",
        unit="samples",
    )
    #### int min/max without unit ###
    parameters.add_int(
        display_name="Dilutions",
        variable_name="dilutions",
        default=1,
        minimum=1,
        maximum=3,
        description="How many dilutions of the sample.",
    )
    #### int choices with unit and unique choice values ###
    parameters.add_int(
        display_name="PCR Volume (µL)",
        variable_name="pcr_volume",
        default=20,
        description="PRC reaction volume.",
        unit="µL",
        choices=[
            {"display_name": "20", "value": 20},
            {"display_name": "16", "value": 16},
        ],
    )
    #### int choices without unit and non-unique choice values ###
    # TODO
    #### int choices without unit and unique choice values ###
    parameters.add_int(
        display_name="Washes",
        variable_name="washes",
        default=6,
        description="How many washes to perform.",
        choices=[
            {"display_name": "1X", "value": 6},
            {"display_name": "2X", "value": 12},
        ],
    )
    #### int choices without unit and non-unique choice values ###
    # TODO
    ###################FLOAT#####################
    #### float min/max with unit ###
    parameters.add_float(
        display_name="Elution Buffer Volume",
        variable_name="elution_buffer_volume",
        default=20.0,
        minimum=20.0,
        maximum=30.0,
        description="Volume of elution buffer to use.",
        unit="µL",
    )
    #### float min/max without unit ###
    parameters.add_float(
        display_name="Bead Ratio",
        variable_name="bead_ratio",
        default=1.8,
        minimum=1.5,
        maximum=3.0,
        description="How many samples to process.",
        unit="samples",
    )
    #### float choices with unit and unique choice values ###
    parameters.add_float(
        display_name="Pipette volume",
        variable_name="pipette_volume",
        default=20.0,
        choices=[
            {"display_name": "Low Volume (10.0µL)", "value": 10.0},
            {"display_name": "Medium Volume (20.0µL)", "value": 20.0},
            {"display_name": "High Volume (50.0µL)", "value": 50.0},
        ],
        description="How many microliters to pipette of each sample.",
        unit="µL",
    )
    #### float choices without unit and non-unique choice values ###
    # TODO
    #### float choices with unit and unique choice values###
    parameters.add_float(
        display_name="Pipette volume",
        variable_name="pipette_volume",
        default=20.0,
        choices=[
            {"display_name": "Low Volume (10.0µL)", "value": 10.0},
            {"display_name": "Medium Volume (20.0µL)", "value": 20.0},
            {"display_name": "High Volume (50.0µL)", "value": 50.0},
        ],
        description="How many microliters to pipette of each sample.",
        unit="µL",
    )
    #### float choices without unit ###
    parameters.add_float(
        display_name="Mixing Volume in µL",
        variable_name="mixing_volume",
        default=150.0,
        choices=[
            {"display_name": "Low Volume ⬇️", "value": 100.0},
            {"display_name": "Medium Volume 🟰", "value": 150.0},
            {"display_name": "High Volume ⬆️", "value": 200.0},
        ],
        description="Adjust the mixing volume.",
    )
    #### float choices without unit and non-unique choice values ###
    # TODO
    ###################BOOL#####################
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="dry_run",
        default=False,
        description="When on, skip aspirate and dispense steps.",
    )
    ###################STR#####################
    #### str with choices having all unique values ###
    parameters.add_str(
        display_name="Pipette Name",
        variable_name="pipette",
        choices=[
            {"display_name": "Single channel 50µL", "value": "flex_1channel_50"},
            {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
        ],
        default="flex_1channel_50",
        description="What pipette to use during the protocol.",
    )
    #### str with choices NOT having all unique values ###
    # TODO


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
