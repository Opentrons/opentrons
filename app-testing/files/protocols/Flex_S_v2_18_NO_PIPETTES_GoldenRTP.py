metadata = {
    "protocolName": "Golden RTP Examples",
}

requirements = {"robotType": "Flex", "apiLevel": "2.18"}

description: str = "Reused description for all parameters."
unit: str = "unit"

# parameters with choice having non unique values is acceptable and covered in another protocol
# parameters with display_name="" and description="" is acceptable but silly - no good rule possible to protect against that


def add_parameters(parameters):
    ###################INT#####################
    ### int min/max with all fields ###
    parameters.add_int(
        display_name="int min/max all",
        variable_name="min_max_all_fields",
        default=6,
        minimum=1,
        maximum=12,
        description=description,
        unit=unit,
    )
    #### int min/max without unit ###
    parameters.add_int(
        display_name="int min/max no unit",
        variable_name="int_min_max_without_unit",
        default=1,
        minimum=1,
        maximum=3,
        description=description,
        # unit is missing
    )
    #### int min/max without description ###
    parameters.add_int(
        display_name="int min/max no description",
        variable_name="int_min_max_without_description",
        default=1,
        minimum=1,
        maximum=3,
        # description is missing
        unit=unit,
    )
    #### int min/max without unit and description ###
    parameters.add_int(
        display_name="int min/max no unit,desc",
        variable_name="int_min_max_without_unit_and_description",
        default=1,
        minimum=1,
        maximum=3,
        # description is missing
        # unit is missing
    )
    #### int choices with all fields and unique choice values ###
    parameters.add_int(
        display_name="int choices all",
        variable_name="int_choices_all_fields",
        description=description,
        unit=unit,
        default=20,
        choices=[
            {"display_name": "20", "value": 20},
            {"display_name": "16", "value": 16},
        ],
    )
    #### int choices without unit and unique choice values ###
    parameters.add_int(
        display_name="int choice no unit",
        variable_name="int_choice_no_unit",
        default=6,
        description=description,
        # unit is missing
        choices=[
            {"display_name": "1X", "value": 6},
            {"display_name": "2X", "value": 12},
        ],
    )
    #### int choices without unit or description and unique choice values ###
    parameters.add_int(
        display_name="int choice no unit, desc",
        variable_name="int_choice_no_unit_desc",
        default=10,
        # description is missing
        # unit is missing
        choices=[
            {"display_name": "10X", "value": 10},
            {"display_name": "100X", "value": 100},
        ],
    )
    ###################FLOAT#####################
    #### float min/max with all fields ###
    parameters.add_float(
        display_name="float min/max all fields",
        variable_name="float_min_max_all_fields",
        default=30.0,
        minimum=20.0,
        maximum=30.0,
        description=description,
        unit=unit,
    )
    #### float min/max without unit ###
    parameters.add_float(
        display_name="float min/max no unit",
        variable_name="float_min_max_no_unit",
        default=1.8,
        minimum=1.5,
        maximum=3.0,
        description=description,
        # unit is missing
    )
    #### float min/max without unit or description ###
    parameters.add_float(
        display_name="float min/max no unit,desc",
        variable_name="float_min_max_no_unit_or_desc",
        default=1.8,
        minimum=1.5,
        maximum=3.0,
        # description is missing
        # unit is missing
    )
    #### float choices with all and unique choice values ###
    parameters.add_float(
        display_name="float choices all",
        variable_name="float_choices_all_fields",
        default=20.0,
        choices=[
            {"display_name": "Low Volume (10.0µL)", "value": 10.0},
            {"display_name": "Medium Volume (20.0µL)", "value": 20.0},
            {"display_name": "High Volume (50.0µL)", "value": 50.0},
        ],
        description=description,
        unit=unit,
    )
    #### float choices with without unit and unique choice values ###
    parameters.add_float(
        display_name="float choices no unit",
        variable_name="float_choices_no_unit",
        default=10.0,
        choices=[
            {"display_name": "Low Volume (10.0µL)", "value": 10.0},
            {"display_name": "High Volume (50.0µL)", "value": 50.0},
        ],
        description=description,
        # unit is missing
    )
    #### float choices with without description and unique choice values ###
    parameters.add_float(
        display_name="float choices no description",
        variable_name="float_choices_no_description",
        default=20.0,
        choices=[
            {"display_name": "Low Volume (10.0µL)", "value": 10.0},
            {"display_name": "Medium Volume (20.0µL)", "value": 20.0},
            {"display_name": "High Volume (50.0µL)", "value": 50.0},
        ],
        # description is missing
        unit=unit,
    )
    #### float choices with without unit or description and unique choice values ###
    parameters.add_float(
        display_name="float choices no unit,desc",
        variable_name="float_choices_no_unit_or_desc",
        default=20.0,
        choices=[
            {"display_name": "Low Volume (10.0µL)", "value": 10.0},
            {"display_name": "Medium Volume (20.0µL)", "value": 20.0},
            {"display_name": "High Volume (50.0µL)", "value": 50.0},
        ],
        # description is missing
        # unit is missing
    )
    ###################BOOL#####################
    parameters.add_bool(
        display_name="bool all fields",
        variable_name="bool_all_fields",
        default=False,
        description="When on, skip aspirate and dispense steps.",
    )
    parameters.add_bool(
        display_name="bool no description",
        variable_name="bool_no_desc",
        default=False,
        # description is missing
    )
    ###################STR#####################
    #### str all fields and unique choice values ###
    parameters.add_str(
        display_name="str choices all",
        variable_name="str_choices_all_fields",
        choices=[
            {"display_name": "Single channel 50µL", "value": "flex_1channel_50"},
            {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
        ],
        default="flex_1channel_50",
        description="What pipette to use during the protocol.",
    )
    #### str all fields and unique choice values ###
    parameters.add_str(
        display_name="str choices all many",
        variable_name="str_choices_all_many_fields",
        choices=[
            {"display_name": "A", "value": "A"},
            {"display_name": "B", "value": "B"},
            {"display_name": "C", "value": "C"},
            {"display_name": "D", "value": "D"},
            {"display_name": "E", "value": "E"},
            {"display_name": "F", "value": "F"},
        ],
        default="E",
        description=description,
    )
    #### str no description and unique choice values ###
    parameters.add_str(
        display_name="str choices no desc",
        variable_name="str_choices_no_desc",
        choices=[
            {"display_name": "Single channel 50µL", "value": "flex_1channel_50"},
            {"display_name": "Eight Channel 50µL", "value": "flex_8channel_50"},
        ],
        default="flex_1channel_50",
        # description is missing
    )


def run(context):
    for variable_name, value in context.params.get_all().items():
        context.comment(f"variable {variable_name} has value {value}")
