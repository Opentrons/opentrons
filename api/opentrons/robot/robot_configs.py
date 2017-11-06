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
            [ 1.00188679e+00,  -1.38121547e-03, 0.0,  -4.02423779e+01],   # NOQA
            [-1.32075472e-02,   9.95856354e-01, 0.0,  -5.06868659e+00],   # NOQA
            [            0.0,              0.0, 1.0,              4.5],   # NOQA
            [-5.03305613e-19,   2.60208521e-18, 0.0,   1.00000000e+00]],  # NOQA
    probe_center=(287.49022485728057, 295.14501721735377, 96.5),
    instrument_offset=(-40.13513347,  28.33733321,  -0.25),  # left to right
    probe_dimensions=(30.0, 30, 25.5),   # X, Y and Z measurements
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
    probe_center=(287.49022485728057, 295.14501721735377, 0),
    probe_dimensions=(40.0, 40.0, 53.0),
    gantry_calibration=[
        [  1.00094340e+00,  -3.45303867e-03,   0.00000000e+00,  -1.94897355e+01],    # NOQA
        [  1.88679245e-03,   9.97237569e-01,   0.00000000e+00,  -1.66290112e+00],    # NOQA
        [  0.00000000e+00,   0.00000000e+00,   1.00000000e+00,   4.50000000e+00],    # NOQA
        [ -5.03305613e-19,   2.60208521e-18,   0.00000000e+00,   1.00000000e+00]],   # NOQA
    instrument_offset=(-40.13513347,  28.33733321,  -0.25)  # left to right
)

robots = {
    'B1': Ibn,
    'B2-4': Amedeo,
    'B2-6': Ada,
    'B2-5': Rosalind
}


config = robots[CURRENT_ROBOT]
