# In this file we often align code for readability triggering PEP8 warnings
# So...
# pylama:skip=1

# TODO: jmg 11/2 This file is meant to be a temporary
# fix to make development easier and should be removed
# once this configuration information is part of persistent robot data

from collections import namedtuple

PLUNGER_CURRENT_LOW = 0.1
PLUNGER_CURRENT_HIGH = 0.5

CURRENT_ROBOT = 'B2-5'

robot_config = namedtuple(
    'robot_config',
    [
        'name',
        'steps_per_mm',
        'max_speeds',
        'acceleration',
        'current',
        'deck_offset',
        'gantry_calibration',
        'instrument_offset',
        'probe_center',
        'probe_dimensions'
    ]
)

Ibn = robot_config(
    name='Ibn al-Nafis',
    steps_per_mm='M92 X160 Y160 Z800 A800 B767.38 C767.38',
    max_speeds='M203.1 X300 Y200 Z50 A50 B8 C8',
    acceleration='M204 S10000 X4000 Y3000 Z2000 A2000 B3000 C3000',
    current='M907 X1.2 Y1.5 Z0.8 A0.8 B{0} C{0}'.format(PLUNGER_CURRENT_LOW),
    deck_offset=(-27, -14.5, 0),
    probe_center={'z': 68.0, 'x': 268.4, 'y': 291.8181},
    probe_dimensions={'length': 47.74, 'width': 38, 'height': 63},
    gantry_calibration=None,
    instrument_offset=None
)

Amedeo = robot_config(
    name='Amedeo Avogadro',
    steps_per_mm='M92 X80 Y80 Z400 A400 B767.38 C767.38',
    max_speeds='M203.1 X300 Y200 Z50 A50 B8 C8',
    acceleration='M204 S1000 X4000 Y3000 Z2000 A2000 B3000 C3000',
    current='M907 X1.2 Y1.5 Z0.8 A0.8 B0.25 C0.25',
    gantry_calibration=[
        [  1.00283019e+00,  -4.83425414e-03,   0.00000000e+00, -3.52323132e+01],
        [ -1.13207547e-02,   9.97237569e-01,   0.00000000e+00, -1.81761811e+00],
        [  0.00000000e+00,   0.00000000e+00,   1.00000000e+00,  4.50000000e+00],
        [ -5.03305613e-19,   2.60208521e-18,   0.00000000e+00,  1.00000000e+00]],
    probe_center=(289, 295, 55.0),
    instrument_offset=(-37.99669417,  30.15314473,  -0.25),  # left to right
    # X, Y and Z measurement of imaginary bounding box surrounding the probe
    # giving safe distance to position for probing
    probe_dimensions=(60.0, 60.0, 60.0),
    deck_offset=None
)

Ada = robot_config(
    name='Ada Lovelace',
    steps_per_mm='M92 X80 Y80 Z400 A400 B767.38 C767.38',
    max_speeds='M203.1 X300 Y200 Z50 A50 B8 C8',
    acceleration='M204 S10000 X4000 Y3000 Z2000 A2000 B3000 C3000',
    current='M907 X1.2 Y1.5 Z0.8 A0.8 B{0} C{0}'.format(PLUNGER_CURRENT_LOW),
    deck_offset=(-31.45, -20.1, 0),
    probe_center={'z': 57.81, 'x': 259.8, 'y': 298.875},
    probe_dimensions={'length': 41, 'width': 38.7, 'height': 67.81},
    gantry_calibration=None,
    instrument_offset=None
)

Rosalind = robot_config(
    name='Rosalind Franklin',
    steps_per_mm='M92 X80.0254 Y80.16 Z400 A400 B767.38 C767.38',
    max_speeds='M203.1 X300 Y200 Z50 A50 B8 C8',
    acceleration='M204 S10000 X4000 Y3000 Z2000 A2000 B3000 C3000',
    current='M907 X1.2 Y1.5 Z0.8 A0.8 B{0} C{0}'.format(PLUNGER_CURRENT_LOW),
    deck_offset=None,
    probe_center=(287, 295, 55.0),
    # X, Y and Z measurement of imaginary bounding box surrounding the probe
    # giving safe distance to position for probing
    probe_dimensions=(60.0, 60.0, 60.0),
    gantry_calibration=[
        [  1.00000000e+00,   2.48619898e-17,   0.00000000e+00,  -3.02300000e+01],
        [  3.77358491e-04,   9.97928177e-01,   0.00000000e+00,  -5.28188575e+00],
        [  0.00000000e+00,   0.00000000e+00,   1.00000000e+00,   4.50000000e+00],
        [ -5.03305613e-19,   2.60208521e-18,   0.00000000e+00,   1.00000000e+00]],
    instrument_offset=(-37.43826124,  31.44202338,  -0.5)  # left to right
)

robots = {
    'B1': Ibn,
    'B2-4': Amedeo,
    'B2-6': Ada,
    'B2-5': Rosalind
}


config = robots[CURRENT_ROBOT]
