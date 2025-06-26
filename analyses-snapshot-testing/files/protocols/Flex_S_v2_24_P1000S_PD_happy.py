requirements = {
    "robotType": "Flex",
    "apiLevel": "2.24"
}

metadata = {
    "protocolName": 'Test cases for single-channel',
    'author': 'Alex'
}
def add_parameters(parameters):
    parameters.add_str(
        variable_name="tip_strat",
        display_name="Select tip strategy",
        choices=[
            {"display_name": "Always", "value": "always"},
            {"display_name": "Never", "value": "never"},
            {"display_name": "Once", "value": "once"},
        ],
        default="once",
    )

    parameters.add_str(
        variable_name="liquid_strat",
        display_name="select liquid",
        choices=[
            {"display_name": "all", "value": "all"},
            {"display_name": "glycerol", "value": "glycerol_50"},
            {"display_name": "water", "value": "water"},
            {"display_name": "ethanol", "value": "ethanol_80"},
        ],
        default="all",
    )

def run(protocol_context):
    
    # Define labware, trash and pipette
    tiprack_1 = protocol_context.load_labware("opentrons_flex_96_tiprack_1000ul", "C2")
    tiprack_2 = protocol_context.load_labware("opentrons_flex_96_tiprack_1000ul", "C3")
    trash = protocol_context.load_waste_chute()
    pipette_1k = protocol_context.load_instrument("flex_1channel_1000", "left", tip_racks=[tiprack_1, tiprack_2])
    nest_plate_source_1 = protocol_context.load_labware("nest_96_wellplate_2ml_deep", "B2")
    nest_plate_source_2 = protocol_context.load_labware("nest_96_wellplate_2ml_deep", "D2")
    nest_plate_dest_1 = protocol_context.load_labware("nest_96_wellplate_2ml_deep", "A2")
    nest_plate_dest_2 = protocol_context.load_labware("nest_96_wellplate_2ml_deep", "B3")
    nest_plate_dest_1.load_empty(nest_plate_dest_1.wells())
    nest_plate_dest_2.load_empty(nest_plate_dest_2.wells())

    Liquid_1 = protocol_context.define_liquid(
    name="Liquid 1",
    description="Green colored water for demo",
    display_color="#00FF00",
        )
    Liquid_2 = protocol_context.define_liquid(
        name="Liquid 2",
        description="Blue colored water for demo",
        display_color="#0000FF",
        )
    for row in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
        for col in range(1, 13):
            well = f"{row}{col}"
            if row in ['A']:
                if col in range(1, 7):
                    nest_plate_source_1[well].load_liquid(Liquid_1, volume=1800)
                    nest_plate_source_2[well].load_liquid(Liquid_2, volume=1800)
                elif col in range(7, 11):
                    nest_plate_source_1[well].load_liquid(Liquid_2, volume=1800)
                    nest_plate_source_2[well].load_liquid(Liquid_2, volume=1800)
            elif row in ['B', 'C', 'D', 'E', 'F', 'G', 'H']:
                # Assuming you want to load different liquids or no liquids
                # in these rows. You'll need to define what should happen here.
                # For example, to load Liquid_1 in nest_plate_source_1 and nothing in nest_plate_source_2:
                nest_plate_source_1[well].load_liquid(Liquid_1, volume=1800)
                nest_plate_source_2[well].load_liquid(Liquid_2, volume=1800)



    # Define water liquid class
    water_liquid_class = protocol_context.get_liquid_class("water")
    glycerol_50_liquid_class = protocol_context.get_liquid_class("glycerol_50")
    ethanol_80_liquid_class = protocol_context.get_liquid_class("ethanol_80")
    
    liquid_classes = [water_liquid_class, glycerol_50_liquid_class, ethanol_80_liquid_class]

    # Transfer 100ul of water from two wells of source to two wells of destination
    # Use one tip and use the trash as the trash location
    volumes = [5, 200, 1000]
    tip_strategy = protocol_context.params.tip_strat
    liquid_strat = protocol_context.params.liquid_strat

    liquid_classy_options = {
        'all': ['Water', 'glycerol_50', 'ethanol_80'],
        'Water': ['water'],
        'glycerol_50': ['glycerol_50'],
        'ethanol_80':['ethanol_80']
    }

    actual_class_names = liquid_classy_options[liquid_strat]
    if len(actual_class_names)>1:
        pass
    elif actual_class_names == 'water':
        liquid_classes[0]
    elif actual_class_names == 'glycerol_50':
        liquid_classes[1]
    elif actual_class_names == 'ethanol_80':
        liquid_classes[2]
    
    
    

    counter = 0
    i = -1
    i_always = -1
    i_never = -1
    message = f'This is the tip strategy we will use: {tip_strategy}'
    protocol_context.pause(message)
    for volume in volumes:
        message = f'This is the tip strategy we will use: {tip_strategy} and the volume {volume}'
        protocol_context.pause(message)
        for liquid_class in liquid_classes:
            if len(actual_class_names)>1:
                counter =+ 1
            else:
                counter = 0
            message = f'This is the tip strategy we will use: {tip_strategy} and the liquid class: {actual_class_names[counter]} and the volume {volume}'
            protocol_context.pause(message)
            # Single-Transfer using P1000 pipette
            # Use every liquid class
            if tip_strategy == 'never':
                source_wells_1 = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9']   
                source_wells_2 = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9']   
                dest_wells_1 = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9']   
                dest_wells_2 = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9']   
                i_never+= 1


                transfer_set(protocol_context, trash, pipette_1k, volume, 'never', liquid_class, nest_plate_source_1, nest_plate_source_2,nest_plate_dest_1,nest_plate_dest_2, source_wells_1[i_never], source_wells_2[i_never], dest_wells_1[i_never], dest_wells_2[i_never])

            
            
            elif tip_strategy == 'Once':
                source_wells_1 = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9']
                source_wells_2 = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9']
                dest_wells_1 = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9']
                dest_wells_2 = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9']
                i +=1
                transfer_set(protocol_context, trash, pipette_1k, volume, 'once', liquid_class, nest_plate_source_1, nest_plate_source_2,nest_plate_dest_1,nest_plate_dest_2, source_wells_1[i], source_wells_2[i], dest_wells_1[i], dest_wells_2[i])
            else:
                source_wells_1 = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9']
                source_wells_2 = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9']
                dest_wells_1 = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9']
                dest_wells_2 = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9']
                i_always +=1
                transfer_set(protocol_context, trash, pipette_1k, volume, 'always', liquid_class, nest_plate_source_1, nest_plate_source_2,nest_plate_dest_1,nest_plate_dest_2, source_wells_1[i_always], source_wells_2[i_always], dest_wells_1[i_always], dest_wells_2[i_always])

                
from opentrons import protocol_api
def transfer_set(
    protocol_context: protocol_api.ProtocolContext,
    trash: protocol_api.WasteChute,
    pipette_1k: protocol_api.InstrumentContext,
    volume: float,
    tip_strategy: str,
    liquid_class: protocol_api.LiquidClass,
    nest_plate_source_1: protocol_api.Labware,
    nest_plate_source_2: protocol_api.Labware,
    nest_plate_dest_1: protocol_api.Labware,
    nest_plate_dest_2: protocol_api.Labware,
    source_well_1: str,
    source_well_2: str,
    dest_well_1: str,
    dest_well_2: str,
):
    """Performs a transfer, distribute, and consolidate liquid handling set.

    Args:
        protocol_context: The Opentrons protocol context.
        trash: The waste chute labware object.
        pipette_1k: The 1000ul single-channel pipette instrument context.
        volume: The volume of liquid to handle in each step.
        tip_strategy: The tip strategy ('always', 'once', 'never').
        liquid_class: The liquid class to use for the operations.
        nest_plate_source_1: The first source plate labware object.
        nest_plate_source_2: The second source plate labware object.
        nest_plate_dest_1: The first destination plate labware object.
        nest_plate_dest_2: The second destination plate labware object.
        source_well_1: The well name in nest_plate_source_1 for the consolidate source.
        source_well_2: The well name in nest_plate_source_2 for transfer, distribute, and consolidate source.
        dest_well_1: The well name in nest_plate_dest_1 for distribute and consolidate destination.
        dest_well_2: The well name in nest_plate_dest_2 for transfer and distribute destination.
    """    

    if tip_strategy != 'never':
        message = 'Transfer Liquid' + str(volume)
        protocol_context.comment(msg = message)

        pipette_1k.transfer_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=nest_plate_source_2[source_well_2],
            dest=nest_plate_dest_2[dest_well_2],
            new_tip=tip_strategy,
            trash_location=trash,
        )
        message = 'Distribute Liquid' + str(volume)
        protocol_context.comment(msg = message)
        if tip_strategy == 'always':
            pass
        else:
            pipette_1k.distribute_with_liquid_class(
                liquid_class=liquid_class,
                volume=volume,
                source=nest_plate_source_2[source_well_2],
                dest=[nest_plate_dest_1[dest_well_1], nest_plate_dest_2[dest_well_2]],
                new_tip=tip_strategy,
                trash_location=trash,
            )
        if tip_strategy == 'always':
            pass
        else:
            message = 'Consolidate Liquid' + str(volume)
            protocol_context.comment(msg = message)
            pipette_1k.consolidate_with_liquid_class(
                liquid_class=liquid_class,
                volume=volume,
                source=[nest_plate_source_1[source_well_1], nest_plate_source_2[source_well_2]],
                dest=nest_plate_dest_1[dest_well_1],
                new_tip=tip_strategy,
                trash_location=trash,
            )
    else:
        message = 'Transfer Liquid' + str(volume)
        protocol_context.comment(msg = message)
        pipette_1k.pick_up_tip()
        pipette_1k.transfer_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=nest_plate_source_2[source_well_2],
            dest=nest_plate_dest_2[dest_well_2],
            new_tip=tip_strategy,
            trash_location=trash,
        )
        message = 'Distribute Liquid' + str(volume)
        protocol_context.comment(msg = message)
        
        pipette_1k.distribute_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=nest_plate_source_2[source_well_2],
            dest=[nest_plate_dest_1[dest_well_1], nest_plate_dest_2[dest_well_2]],
            new_tip=tip_strategy,
            trash_location=trash,
        )
        
        
        message = 'Consolidate Liquid' + str(volume)
        protocol_context.comment(msg = message)
        pipette_1k.consolidate_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=[nest_plate_source_1[source_well_1], nest_plate_source_2[source_well_2]],
            dest=nest_plate_dest_1[dest_well_1],
            new_tip=tip_strategy,
            trash_location=trash,
        )
        pipette_1k.drop_tip()




    





