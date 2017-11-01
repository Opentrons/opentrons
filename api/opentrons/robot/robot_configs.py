from collections import namedtuple

CURRENT_ROBOT = 'B2-5'

robot_config = namedtuple(
    'robot_config',
    'name '
    'steps_per_mm '
    'max_speeds '
    'acceleration '
    'current '
    'deck_offset '
    'probe_center '
    'probe_dimensions'
)

Ibn = robot_config(
    name='Ibn al-Nafis',
    steps_per_mm='M92 X160 Y160 Z800 A800 B767.38 C767.38',
    max_speeds='M203.1 X300 Y200 Z50 A50 B8 C8',
    acceleration='M204 S1000 X4000 Y3000 Z2000 A2000 B3000 C3000',
    current='M907 X1.2 Y1.5 Z0.8 A0.8 B0.25 C0.25',
    deck_offset={'x': -27, 'y': -14.5, 'z': 0},
    probe_center={'z': 68.0, 'x': 268.4, 'y': 291.8181},
    probe_dimensions={'length': 47.74, 'width': 38, 'height': 63}
)

Amadeo = robot_config(
    name='Ibn al-Nafis',
    steps_per_mm='M92 X80 Y80 Z400 A400 B767.38 C767.38',
    max_speeds='M203.1 X300 Y200 Z50 A50 B8 C8',
    acceleration='M204 S1000 X4000 Y3000 Z2000 A2000 B3000 C3000',
    current='M907 X1.2 Y1.5 Z0.8 A0.8 B0.25 C0.25',
    deck_offset={'x': -31.45, 'y': -20.1, 'z': 0},
    probe_center={'z': 57.81, 'x': 259.8, 'y': 298.875},
    probe_dimensions={'length': 41, 'width': 38.7, 'height': 67.81}
)

Ada = robot_config(
    name='Ibn al-Nafis',
    steps_per_mm='M92 X80 Y80 Z400 A400 B767.38 C767.38',
    max_speeds='M203.1 X300 Y200 Z50 A50 B8 C8',
    acceleration='M204 S1000 X4000 Y3000 Z2000 A2000 B3000 C3000',
    current='M907 X1.2 Y1.5 Z0.8 A0.8 B0.25 C0.25',
    deck_offset={'x': -31.45, 'y': -20.1, 'z': 0},
    probe_center={'z': 57.81, 'x': 259.8, 'y': 298.875},
    probe_dimensions={'length': 41, 'width': 38.7, 'height': 67.81}
)

Rosalind = robot_config(
    name='Ibn al-Nafis',
    steps_per_mm='M92 X81.474 Y80.16 Z400 A400 B767.38 C767.38',
    max_speeds='M203.1 X300 Y200 Z50 A50 B8 C8',
    acceleration='M204 S1000 X4000 Y3000 Z2000 A2000 B3000 C3000',
    current='M907 X1.2 Y1.5 Z0.8 A0.8 B0.25 C0.25',
    deck_offset={'x': -31.45, 'y': -20.1, 'z': 0},
    probe_center={'z': 57.81, 'x': 259.8, 'y': 298.875},
    probe_dimensions={'length': 41, 'width': 38.7, 'height': 67.81}
)

robots = {
    'B1': Ibn,
    'B2-4': Amadeo,
    'B2-6': Ada,
    'B2-5': Rosalind
}


def current_config():
    return robots[CURRENT_ROBOT]
