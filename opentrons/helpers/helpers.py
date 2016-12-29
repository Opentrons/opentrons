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
    if hasattr(n, '__len__') and len(n) > 0:
        return n
    return [n]


def _create_well_pairs(s, t):

    # make source and targets lists of equal length
    s = _get_list(s)
    t = _get_list(t)
    length = max(len(s), len(t))
    if length > min(len(s), len(t)) > 1:
        raise RuntimeError('Sources and Targets list lengths do not match')
    elif len(s) == 1:
        s *= length
    elif len(t) == 1:
        t *= length
    return (s, t)


def _create_volume_gradient(min_v, max_v, total, interpolate=None):

    diff_vol = max_v - min_v

    def _map_volume(i):
        nonlocal diff_vol, total
        rel_x = i / (total - 1)
        rel_y = interpolate(rel_x) if interpolate else rel_x
        return (rel_y * diff_vol) + min_v

    return [_map_volume(i) for i in range(total)]


def _create_volume_pairs(v, total, interpolate=None):

    v = _get_list(v)
    t_vol = len(v)
    if t_vol > total:
        raise RuntimeError(
            '{0} volumes do not match with {1} transfers'.format(
                t_vol, total))
    elif len(v) == total:
        return v
    elif len(v) == 1:
        return v * total
    elif len(v) == 2:
        v = _create_volume_gradient(
            v[0], v[1], total, interpolate=interpolate)
        return v


def _find_aspirate_volume(volumes, remaining_volume):
    aspirate_volume = min(volumes[0], remaining_volume)
    for n in range(1, len(volumes)):
        if aspirate_volume + volumes[n] > remaining_volume:
            break
        aspirate_volume += volumes[n]
    return aspirate_volume


def _match_volumes_to_sources(volumes, sources):
    same_source_volumes = [volumes[0]]
    for i in range(1, len(volumes)):
        if sources[i] != sources[0]:
            break
        same_source_volumes.append(volumes[i])
    return same_source_volumes
