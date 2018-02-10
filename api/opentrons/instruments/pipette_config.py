from collections import namedtuple


# multi-channel pipettes share the same dimensional offsets
DISTANCE_BETWEEN_NOZZLES = 9
NUM_MULTI_CHANNEL_NOZZLES = 8
Y_OFFSET_MULTI = DISTANCE_BETWEEN_NOZZLES * (NUM_MULTI_CHANNEL_NOZZLES / 2)
Z_OFFSET_MULTI = -25.8

# single-channel pipettes have different lengths
Z_OFFSET_P10 = -13  # longest single-channel pipette
Z_OFFSET_P50 = 0
Z_OFFSET_P300 = 0
Z_OFFSET_P1000 = 20  # shortest single-channel pipette

pipette_config = namedtuple(
    'pipette_config',
    [
        'plunger_positions',
        'pick_up_current',
        'aspirate_flow_rate',
        'dispense_flow_rate',
        'ul_per_mm',
        'channels',
        'name',
        'model_offset'
    ]
)

p10_single = pipette_config(
    plunger_positions={
        'top': 18,
        'bottom': 2,
        'blow_out': 0,
        'drop_tip': -6
    },
    pick_up_current=0.05,
    aspirate_flow_rate=1,
    dispense_flow_rate=10,
    ul_per_mm=0.617,
    channels=1,
    name='p10_single',
    model_offset=(0.0, 0.0, Z_OFFSET_P10)
)

p10_multi = pipette_config(
    plunger_positions={
        'top': 18,
        'bottom': 2,
        'blow_out': 0,
        'drop_tip': -6
    },
    pick_up_current=0.2,
    aspirate_flow_rate=1,
    dispense_flow_rate=10,
    ul_per_mm=0.617,
    channels=8,
    name='p10_multi',
    model_offset=(0.0, Y_OFFSET_MULTI, Z_OFFSET_MULTI)
)

p300_single = pipette_config(
    plunger_positions={
        'top': 18,
        'bottom': 2,
        'blow_out': 0,
        'drop_tip': -3.5
    },
    pick_up_current=0.1,
    aspirate_flow_rate=30,
    dispense_flow_rate=300,
    ul_per_mm=18.51,
    channels=1,
    name='p300_single',
    model_offset=(0.0, 0.0, Z_OFFSET_P300)
)

p300_multi = pipette_config(
    plunger_positions={
        'top': 18,
        'bottom': 2,
        'blow_out': 0,
        'drop_tip': -5
    },
    pick_up_current=0.3,
    aspirate_flow_rate=30,
    dispense_flow_rate=300,
    ul_per_mm=18.51,
    channels=8,
    name='p300_multi',
    model_offset=(0.0, Y_OFFSET_MULTI, Z_OFFSET_MULTI)
)


configs = {
    'p10_single': p10_single,
    'p10_multi': p10_multi,
    'p300_single': p300_single,
    'p300_multi': p300_multi
}


def load(pipette_model: str):
    return configs[pipette_model]
