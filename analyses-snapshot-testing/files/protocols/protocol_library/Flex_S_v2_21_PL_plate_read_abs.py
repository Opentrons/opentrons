metadata = {
    'protocolName': 'Plate Reading On Deck',
    'author': 'Boren Lin, Opentrons',
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.21"
}

########################

def add_parameters(parameters):
    parameters.add_str(variable_name="reader_loc",
                       display_name="Plate Reader Slot",
                       description="Where is the plate reader mounted?",
                       default="D3",
                      choices=[
                               {"display_name": "Slot D3", "value": "D3"},
                               {"display_name": "Slot C3", "value": "C3"},
                               {"display_name": "Slot B3", "value": "B3"},
                               {"display_name": "Slot A3", "value": "A3"}
                              ]
                       )
    parameters.add_str(variable_name="shaker_loc",
                      display_name="Shaker Slot",
                      description="If shake the plate before read, where is the shaker mounted?",
                      default="D1",
                      choices=[
                               {"display_name": "N/A", "value": "None"},
                               {"display_name": "Slot D1", "value": "D1"},
                               {"display_name": "Slot C1", "value": "C1"},
                               {"display_name": "Slot B1", "value": "B1"},
                               {"display_name": "Slot A1", "value": "A1"},
                               {"display_name": "Slot D3", "value": "D3"},
                               {"display_name": "Slot C3", "value": "C3"},
                               {"display_name": "Slot B3", "value": "B3"},
                               {"display_name": "Slot A3", "value": "A3"}
                              ]
                      )
    parameters.add_int(variable_name="wavelength",
                      display_name="Target Wavelength",
                      description="Select target wavelength",
                      default=562,
                      choices=[
                               {"display_name": "420", "value": 420},
                               {"display_name": "450", "value": 450},
                               {"display_name": "520", "value": 520},
                               {"display_name": "562", "value": 562},
                               {"display_name": "600", "value": 600},
                               {"display_name": "650", "value": 650}
                              ]
                      )  
    parameters.add_int(variable_name="wavelength_ref",
                      display_name="Reference Wavelength",
                      description="Select reference wavelength",
                      default=0,
                      choices=[
                               {"display_name": "N/A", "value": 0},
                               {"display_name": "420", "value": 420},
                               {"display_name": "450", "value": 450},
                               {"display_name": "520", "value": 520},
                               {"display_name": "562", "value": 562},
                               {"display_name": "600", "value": 600},
                               {"display_name": "650", "value": 650}
                              ]
                      )    
    parameters.add_bool(variable_name="data_on_screen",
                        display_name="Readings Preview",
                        description="Review all readings on the touchscreen?",
                        default=False
                        )
    
def run(ctx):

    global reader_loc 
    global shaker_loc

    global wavelength
    global wavelength_ref

    global data_on_screen

    reader_loc = ctx.params.reader_loc
    shaker_loc = ctx.params.shaker_loc

    wavelength = ctx.params.wavelength
    wavelength_ref = ctx.params.wavelength_ref

    data_on_screen = ctx.params.data_on_screen


    # deck layout
    reader = ctx.load_module("absorbanceReaderV1", reader_loc)

    if shaker_loc != "None":
        hs = ctx.load_module('heaterShakerModuleV1', shaker_loc)
        hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter')

    assay_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 'D2', 'ASSAY PLATE')        

    # protocol 
    ## shake
    if shaker_loc != "None":
        hs.open_labware_latch()

        ctx.move_labware(labware = assay_plate,
                         new_location = hs_adapter,
                         use_gripper=True,
                         pick_up_offset={'x':0, 'y':0, 'z':-7},
                         drop_offset={'x':0,'y':0,'z':-8}
                        )
    
        hs.close_labware_latch()
        hs.set_and_wait_for_shake_speed(rpm=1250)
        ctx.delay(seconds=10)
        hs.deactivate_shaker()
        hs.open_labware_latch()

    
    ## read plate   
    reader.close_lid()

    if wavelength_ref != 0:
        reader.initialize('single', [wavelength], reference_wavelength=wavelength_ref)      
    else: reader.initialize('single', [wavelength])

    reader.open_lid()

    ctx.move_labware(labware = assay_plate,
                     new_location = reader,
                     use_gripper=True
                    ) 
    reader.close_lid()
    
    #result = reader.read()
    result = reader.read(export_filename="output.csv")

    reader.open_lid()
    ctx.move_labware(labware = assay_plate, 
                     new_location = 'D2', 
                     use_gripper=True
                    )
    reader.close_lid()


    ## show data
    if data_on_screen:

        full_plate = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1',
                'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2',
                'A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3',
                'A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4',
                'A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5',
                'A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6',
                'A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7',
                'A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8',
                'A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9',
                'A10', 'B10', 'C10', 'D10', 'E10', 'F10', 'G10', 'H10',
                'A11', 'B11', 'C11', 'D11', 'E11', 'F11', 'G11', 'H11',
                'A12', 'B12', 'C12', 'D12', 'E12', 'F12', 'G12', 'H12'
                ]
        
        od_full_plate = [-1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1,
                        -1, -1, -1, -1, -1, -1, -1, -1
                        ]

        if result is not None:
            for a, well in enumerate(full_plate):
                od_full_plate[a] = round(result[wavelength][well], 3)

        for col in range(12):
            display = [0, 0, 0, 0, 0, 0, 0, 0]
            for raw in range(8):
                display[raw] = od_full_plate[col*8+raw]
            ctx.pause('Column # '+str(col+1)+': '+str(display))





