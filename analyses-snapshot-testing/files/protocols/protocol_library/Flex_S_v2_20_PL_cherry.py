import csv
from io import StringIO
from opentrons import protocol_api
from dataclasses import dataclass
from typing import List, Set, Union

metadata = {
    'protocolName': 'Cherrypicking_Flex with Dual Pipettes',
    'author': 'Harshal Desai',
    'description': 'Cherrypicking protocol with CSV handling and dual pipettes',
}

requirements = {
    'robotType': "Flex",
    'apiLevel': "2.20"
}

# Define the expected headers for the CSV file
HEADERS = [
    "Source Labware",
    "Source Slot",
    "Source Well",
    "Source Aspiration Height Above Bottom (in mm)",
    "Dest Labware",
    "Dest Slot",
    "Dest Well",
    "Volume (in ul)"
]

@dataclass
class Transfer:
    source_labware: str
    source_slot: str
    source_well: str
    source_height: float
    dest_labware: str
    dest_slot: str
    dest_well: str
    volume: float

@dataclass(frozen=True)
class LabwareSlot:
    labware: str
    slot: str

    def __hash__(self):
        return hash((self.labware, self.slot))

    def __eq__(self, other):
        if not isinstance(other, LabwareSlot):
            return NotImplemented
        return (self.labware, self.slot) == (other.labware, other.slot)

def validate_data_rows(data_rows):
    for index, row in enumerate(data_rows, start=1):
        if len(row) != len(HEADERS):
            error = f"Missing fields in data row: {index}, line {index+1} of the CSV. Row data: {row}"
            raise ValueError(error)
        for value in row:
            if value is None or value.strip() == "":
                error = f"Empty fields in data row: {index}, line {index+1} of the CSV. Row data: {row}"
                raise ValueError(error)

def read_transfers_from_list(data: List[List[Union[str, int, float]]]) -> List[Transfer]:
    headers = data[0]
    assert headers == HEADERS, f"Expected headers: {HEADERS}, but got: {headers}"
    data_rows = data[1:]
    validate_data_rows(data_rows)
    
    transfers = []
    for row in data_rows:
        transfer = Transfer(
            source_labware=str(row[0]),
            source_slot=str(row[1]),
            source_well=str(row[2]),
            source_height=float(row[3]),
            dest_labware=str(row[4]),
            dest_slot=str(row[5]),
            dest_well=str(row[6]),
            volume=float(row[7])
        )
        transfers.append(transfer)
    return transfers

def get_unique_labware_slots(transfers: List[Transfer]) -> Set[LabwareSlot]:
    unique_labware_slots = set()
    for transfer in transfers:
        unique_labware_slots.add(LabwareSlot(transfer.source_labware, transfer.source_slot))
        unique_labware_slots.add(LabwareSlot(transfer.dest_labware, transfer.dest_slot))
    return unique_labware_slots

def add_parameters(protocol):
    protocol.add_csv_file(
        display_name="Transfer CSV",
        variable_name="transfer_csv",
        description="Table of labware, wells, and volumes to transfer.",
    )
    
    # Left Pipette
    protocol.add_str(
        display_name="Left Pipette Type",
        variable_name="left_pipette_type",
        choices=[
            {"display_name": "None", "value": "none"},
            {"display_name": "FLEX 1-Channel 50µL", "value": "flex_1channel_50"},
            {"display_name": "FLEX 1-Channel 1000µL", "value": "flex_1channel_1000"},
        ],
        default="flex_1channel_50",
        description="Select the left pipette type.",
    )
    protocol.add_str(
        display_name="Left Pipette Tip Type",
        variable_name="left_tip_type",
        choices=[
            {"display_name": "Standard 50µL", "value": "standard_50"},
            {"display_name": "Filter 50µL", "value": "filter_50"},
            {"display_name": "Standard 200µL", "value": "standard_200"},
            {"display_name": "Filter 200µL", "value": "filter_200"},
            {"display_name": "Standard 1000µL", "value": "standard_1000"},
            {"display_name": "Filter 1000µL", "value": "filter_1000"},
        ],
        default="standard_50",
        description="Select the left pipette tip type.",
    )
    
    # Right Pipette
    protocol.add_str(
        display_name="Right Pipette Type",
        variable_name="right_pipette_type",
        choices=[
            {"display_name": "None", "value": "none"},
            {"display_name": "FLEX 1-Channel 50µL", "value": "flex_1channel_50"},
            {"display_name": "FLEX 1-Channel 1000µL", "value": "flex_1channel_1000"},
        ],
        default="flex_1channel_1000",
        description="Select the right pipette type.",
    )
    protocol.add_str(
        display_name="Right Pipette Tip Type",
        variable_name="right_tip_type",
        choices=[
            {"display_name": "Standard 50µL", "value": "standard_50"},
            {"display_name": "Filter 50µL", "value": "filter_50"},
            {"display_name": "Standard 200µL", "value": "standard_200"},
            {"display_name": "Filter 200µL", "value": "filter_200"},
            {"display_name": "Standard 1000µL", "value": "standard_1000"},
            {"display_name": "Filter 1000µL", "value": "filter_1000"},
        ],
        default="standard_1000",
        description="Select the right pipette tip type.",
    )
    
    protocol.add_str(
        display_name="Tip Reuse",
        variable_name="tip_reuse",
        choices=[
            {"display_name": "Always", "value": "always"},
            {"display_name": "Never", "value": "never"},
        ],
        default="always",
        description="Select the tip reuse strategy.",
    )

    protocol.add_float(
        display_name="Aspiration Rate",
        variable_name="asp_rate",
        minimum=0.1,
        maximum=10,
        default=1,
        description="Set the aspiration rate (0.1 to 10).",
    )
    protocol.add_float(
        display_name="Dispense Rate",
        variable_name="disp_rate",
        minimum=0.1,
        maximum=10,
        default=1,
        description="Set the dispense rate (0.1 to 10).",
    )

    protocol.add_bool(
        display_name="Enable Liquid Detection",
        variable_name="enable_liquid_detection",
        default=True,
        description="Enable or disable liquid presence detection for the entire protocol.",
    )

def run(ctx: protocol_api.ProtocolContext):
    # Get the values from the RTPs
    left_pipette_type = ctx.params.left_pipette_type
    right_pipette_type = ctx.params.right_pipette_type
    left_tip_type = ctx.params.left_tip_type
    right_tip_type = ctx.params.right_tip_type
    tip_reuse = ctx.params.tip_reuse
    asp_rate = ctx.params.asp_rate
    disp_rate = ctx.params.disp_rate
    transfer_csv = ctx.params.transfer_csv.parse_as_csv()
    enable_liquid_detection = ctx.params.enable_liquid_detection

    # Read transfers from CSV
    transfers = read_transfers_from_list(transfer_csv)

    # Load labware
    trash = ctx.load_trash_bin("A3")
    unique_labware_slots = get_unique_labware_slots(transfers)
    for labware_slot in unique_labware_slots:
        ctx.load_labware(labware_slot.labware, labware_slot.slot)

    # Define tiprack map
    tiprack_map = {
        'flex_1channel_50': {
            'standard_50': 'opentrons_flex_96_tiprack_50ul',
            'filter_50': 'opentrons_flex_96_filtertiprack_50ul',
        },
        'flex_1channel_1000': {
            'standard_1000': 'opentrons_flex_96_tiprack_1000ul',
            'filter_1000': 'opentrons_flex_96_filtertiprack_1000ul',
            'standard_200': 'opentrons_flex_96_tiprack_200ul',
            'filter_200': 'opentrons_flex_96_filtertiprack_200ul',
            'standard_50': 'opentrons_flex_96_tiprack_50ul',
            'filter_50': 'opentrons_flex_96_filtertiprack_50ul',
        }
    }

    # Load tipracks and pipettes
    pipettes = {}
    tipracks = {'left': [], 'right': []}

    if left_pipette_type != 'none':
        left_tiprack_type = tiprack_map[left_pipette_type][left_tip_type]
        for slot in range(1, 6):  # Assuming slots 1-5 for left pipette
            if str(slot) not in [ls.slot for ls in unique_labware_slots]:
                tipracks['left'].append(ctx.load_labware(left_tiprack_type, str(slot)))

        pipettes['left'] = ctx.load_instrument(
            left_pipette_type, 
            'left', 
            tip_racks=tipracks['left'],
            liquid_presence_detection=enable_liquid_detection
        )

    if right_pipette_type != 'none':
        right_tiprack_type = tiprack_map[right_pipette_type][right_tip_type]
        for slot in range(7, 12):  # Assuming slots 7-11 for right pipette
            if str(slot) not in [ls.slot for ls in unique_labware_slots]:
                tipracks['right'].append(ctx.load_labware(right_tiprack_type, str(slot)))
        pipettes['right'] = ctx.load_instrument(
            right_pipette_type, 
            'right', 
            tip_racks=tipracks['right'],
            liquid_presence_detection=enable_liquid_detection
        )

    if not pipettes:
        raise ValueError("At least one pipette must be selected.")

    tip_count = {'left': 0, 'right': 0}
    tip_max = {'left': len(tipracks['left']) * 96, 'right': len(tipracks['right']) * 96}

    def pick_up(mount):
        nonlocal tip_count
        if tip_count[mount] == tip_max[mount]:
            ctx.pause(f'Please refill {mount} tipracks before resuming.')
            pipettes[mount].reset_tipracks()
            tip_count[mount] = 0
        pipettes[mount].pick_up_tip()
        tip_count[mount] += 1

    if tip_reuse == 'never':
        for mount in pipettes:
            pick_up(mount)
    
    for transfer in transfers:
        source = ctx.loaded_labwares[
            int(transfer.source_slot)].wells_by_name()[transfer.source_well].bottom(transfer.source_height)
        dest = ctx.loaded_labwares[
            int(transfer.dest_slot)].wells_by_name()[transfer.dest_well]
        
        # Choose the appropriate pipette based on volume
        if transfer.volume <= 50 and 'left' in pipettes:
            pip = pipettes['left']
            mount = 'left'
        elif transfer.volume <= 1000 and 'right' in pipettes:
            pip = pipettes['right']
            mount = 'right'
        else:
            raise ValueError(f"No suitable pipette for volume {transfer.volume}µL")

        if tip_reuse == 'always':
            pick_up(mount)
        pip.aspirate(transfer.volume, source, rate=asp_rate)
        pip.dispense(transfer.volume, dest, rate=disp_rate)
        if tip_reuse == 'always':
            pip.drop_tip()
    
    for pip in pipettes.values():
        if pip.has_tip:
            pip.drop_tip()