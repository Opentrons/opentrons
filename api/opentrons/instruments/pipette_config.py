from collections import namedtuple


pipette_config = namedtuple(
    'pipette_config',
    [
        'plunger_positions',
        'pick_up_current',
        'aspirate_flow_rate',
        'dispense_flow_rate',
        'ul_per_mm',
        'channels',
        'name'
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
    aspirate_flow_rate=5,   # default aspirate is 1/2 of total volume
    dispense_flow_rate=20,  # default dispense speed is 2x of total volume
    ul_per_mm=0.617,
    channels=1,
    name='p10_single'
)

p10_multi = pipette_config(
    plunger_positions={
        'top': 18,
        'bottom': 2,
        'blow_out': 0,
        'drop_tip': -6
    },
    pick_up_current=0.2,
    aspirate_flow_rate=5,
    dispense_flow_rate=20,
    ul_per_mm=0.617,
    channels=8,
    name='p10_multi'
)

p300_single = pipette_config(
    plunger_positions={
        'top': 18,
        'bottom': 2,
        'blow_out': 0,
        'drop_tip': -3.5
    },
    pick_up_current=0.1,
    aspirate_flow_rate=150,
    dispense_flow_rate=600,
    ul_per_mm=18.51,
    channels=1,
    name='p300_single'
)

p300_multi = pipette_config(
    plunger_positions={
        'top': 18,
        'bottom': 2,
        'blow_out': 0,
        'drop_tip': -5
    },
    pick_up_current=0.3,
    aspirate_flow_rate=150,
    dispense_flow_rate=600,
    ul_per_mm=18.51,
    channels=8,
    name='p300_multi'
)


configs = {
    'p10_single': p10_single,
    'p10_multi': p10_multi,
    'p300_single': p300_single,
    'p300_multi': p300_multi
}


def load(pipette_model: str):
    return configs[pipette_model]
