import json

from opentrons.util.vector import Vector


def unpack_coordinates(coordinates):
    if not isinstance(coordinates, tuple):
        coordinates = tuple([coordinates[axis] for axis in 'xyz'])

    return coordinates


def flip_coordinates(coordinates, dimensions):
    coordinates = unpack_coordinates(coordinates)
    x, y, z = coordinates
    x_size, y_size, z_size = unpack_coordinates(dimensions)

    return (x, y_size - y, z_size - z)


def break_down_travel(p1, target, increment=5, mode='absolute'):
    """
    given two points p1 and target, this returns a list of
    incremental positions or relative steps
    """

    heading = target - p1
    if mode == 'relative':
        heading = target
    length = heading.length()

    length_steps = length / increment
    length_remainder = length % increment

    vector_step = Vector(0, 0, 0)
    if length_steps > 0:
        vector_step = heading / length_steps
    vector_remainder = vector_step * (length_remainder / increment)

    res = []
    if mode is 'absolute':
        for i in range(int(length_steps)):
            p1 = p1 + vector_step
            res.append(p1)
        p1 = p1 + vector_remainder
        res.append(p1)
    else:
        for i in range(int(length_steps)):
            res.append(vector_step)
        res.append(vector_remainder)
    return res


def import_calibration_json(json_string, robot, calibrated_top=False):
    pipette_calibration = json.loads(json_string)

    for axis, data in pipette_calibration.items():

        if axis.upper() in robot._instruments:
            pipette = robot._instruments[axis.upper()]

            pipette.positions['top'] = data['top']
            pipette.positions['bottom'] = data['bottom']
            pipette.positions['blow_out'] = data['blowout']
            pipette.positions['drop_tip'] = data['droptip']

            container_data = data['theContainers']
            for name, coordinates in container_data.items():
                children = robot._deck.get_all_children()
                container = list(
                    filter(
                        lambda child: child.get_name() == name,
                        children))[0]
                z_pos = -1
                if calibrated_top:
                    if (
                        ('tip' not in name.lower()) and
                        ('rack' not in name.lower())
                    ):
                        z_pos = 1
                location = (
                    container,
                    container[0].from_center(
                        x=0,
                        y=0,
                        z=z_pos,
                        reference=container))
                # If calibration data is null for x, y, z then skip this
                # container
                if not all([coordinates[c] for c in 'xyz']):
                    continue
                pipette.calibrate_position(
                    location,
                    robot.flip_coordinates(coordinates))


def import_calibration_file(file_name, robot):
    with open(file_name) as f:
        json_string = '\n'.join(f)
        import_calibration_json(json_string, robot)


def _get_list(n):
    if not hasattr(n, '__len__') or len(n) == 0 or isinstance(n, tuple):
        n = [n]
    return n


def _create_source_target_lists(s, t, **kwargs):
    s = _get_list(s)
    t = _get_list(t)
    mode = kwargs.get('mode', 'transfer')
    if mode == 'transfer':
        if len(s) != len(t):
            raise RuntimeError(
                'Transfer sources/targets must be same length')
    elif mode == 'distribute':
        if not (len(t) >= len(s) == 1):
            raise RuntimeError(
                'Distribute must have 1 source and multiple targets')
        s *= len(t)
    elif mode == 'consolidate':
        if not (len(s) >= len(t) == 1):
            raise RuntimeError(
                'Consolidate must have multiple sources and 1 target')
        t *= len(s)
    return (s, t)


def _create_volume_list(v, total, **kwargs):

    gradient = kwargs.get('gradient', None)

    if isinstance(v, tuple):
        return _create_volume_gradient(
            v[0], v[-1], total, gradient=gradient)

    v = _get_list(v)
    t_vol = len(v)
    if (t_vol < total and t_vol != 1) or t_vol > total:
        raise RuntimeError(
            '{0} volumes do not match with {1} transfers'.format(
                t_vol, total))
    if t_vol < total:
        v = [v[0]] * total
    return v


def _create_volume_gradient(min_v, max_v, total, gradient=None):

    diff_vol = max_v - min_v

    def _map_volume(i):
        nonlocal diff_vol, total
        rel_x = i / (total - 1)
        rel_y = gradient(rel_x) if gradient else rel_x
        return (rel_y * diff_vol) + min_v

    return [_map_volume(i) for i in range(total)]


def _compress_for_repeater(max_vol, plan, **kwargs):
    max_vol = float(max_vol)
    mode = kwargs.get('mode', 'transfer')
    if mode == 'distribute':  # combine target volumes into single aspirate
        return _compress_for_distribute(max_vol, plan, **kwargs)
    if mode == 'consolidate':  # combine target volumes into multiple aspirates
        return _compress_for_consolidate(max_vol, plan, **kwargs)
    else:
        return plan


def _compress_for_distribute(max_vol, plan, **kwargs):
    source = plan[0]['aspirate']['location']
    a_vol = 0
    temp_dispenses = []
    new_transfer_plan = []

    def _add():
        nonlocal a_vol, temp_dispenses, new_transfer_plan, source
        new_transfer_plan.append({
            'aspirate': {
                'location': source, 'volume': a_vol
            }
        })
        for d in temp_dispenses:
            new_transfer_plan.append({
                'dispense': {
                    'location': d['location'], 'volume': d['volume']
                }
            })

    for p in plan:
        this_vol = p['aspirate']['volume']
        if this_vol + a_vol > max_vol:
            _add()
            a_vol = 0
            temp_dispenses = []
        a_vol += this_vol
        temp_dispenses.append(p['dispense'])
    _add()
    return new_transfer_plan


def _compress_for_consolidate(max_vol, plan, **kwargs):
    target = plan[0]['dispense']['location']
    d_vol = 0
    temp_aspirates = []
    new_transfer_plan = []

    def _add():
        nonlocal d_vol, temp_aspirates, new_transfer_plan, target
        for a in temp_aspirates:
            new_transfer_plan.append({
                'aspirate': {
                    'location': a['location'], 'volume': a['volume']
                }
            })
        new_transfer_plan.append({
            'dispense': {
                'location': target, 'volume': d_vol
            }
        })
        d_vol = 0
        temp_aspirates = []

    for i, p in enumerate(plan):
        this_vol = p['aspirate']['volume']
        if this_vol + d_vol > max_vol:
            _add()
        d_vol += this_vol
        temp_aspirates.append(p['aspirate'])
    _add()
    return new_transfer_plan


def _expand_for_carryover(max_vol, plan, **kwargs):
    max_vol = float(max_vol)
    carryover = kwargs.get('carryover', True)
    if not carryover:
        return plan
    new_transfer_plan = []
    for p in plan:
        source = p['aspirate']['location']
        target = p['dispense']['location']
        volume = float(p['aspirate']['volume'])
        while volume > max_vol:
            new_transfer_plan.append({
                'aspirate': {'location': source, 'volume': max_vol},
                'dispense': {'location': target, 'volume': max_vol}
            })
            volume -= max_vol
        new_transfer_plan.append({
            'aspirate': {'location': source, 'volume': float(volume)},
            'dispense': {'location': target, 'volume': float(volume)}
        })
    return new_transfer_plan
