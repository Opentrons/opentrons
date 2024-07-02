# systemctl stop opentrons-robot-server
# python3 -m opentrons.hardware_control.scripts.repl

from time import sleep
from opentrons.config.types import OT3AxisKind
from opentrons.hardware_control.motion_utilities import target_position_from_plunger

m = OT3Mount.LEFT; api.cache_instruments(); api.home_plunger(m); api.add_tip(m, 60)
api.set_pipette_speed(m, aspirate=15, dispense=15, blow_out=15)
pip = api._pipette_handler.get_pipette(m)


# BACKLASH motion
def prep(o):
    api._move_to_plunger_bottom(m, rate=1.0, overshoot=o)

def move(d):
    api._move(target_position_from_plunger(m, d, api._current_position), speed=15)

def jog(d):
    move(pip.plunger_positions.bottom + (d * -1))

def aspirate(v):
    move(api._pipette_handler.plunger_position(pip, v, "aspirate"))


def test(overshoot, prep_delay, aspirate_delay):
    prep(overshoot); sleep(prep_delay); jog(0.19 + overshoot); jog(0.19); sleep(aspirate_delay)


def jog_step(*args):
    for d in args:
        jog(d); input(f"Jog = {d} mm - press ENTER")


def jog_inc(start, inc):
    jog(start)
    while not input(f"at {round(start, 3)}, press any key to stop"):
        start += inc
        jog(start)
