from collections import namedtuple


# Default number of seconds to aspirate/dispense a pipette's full volume,
# and these times were chosen to mimic normal human-pipetting motions.
# However, accurate speeds are dependent on environment (ex: liquid viscosity),
# therefore a pipette's flow-rates (ul/sec) should be set by protocol writer
DEFAULT_ASPIRATE_SECONDS = 2
DEFAULT_DISPENSE_SECONDS = 1

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
    pick_up_current=0.1,
    aspirate_flow_rate=10 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=10 / DEFAULT_DISPENSE_SECONDS,
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
    aspirate_flow_rate=10 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=10 / DEFAULT_DISPENSE_SECONDS,
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
    aspirate_flow_rate=300 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=300 / DEFAULT_DISPENSE_SECONDS,
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
    aspirate_flow_rate=300 / DEFAULT_ASPIRATE_SECONDS,
    dispense_flow_rate=300 / DEFAULT_DISPENSE_SECONDS,
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
