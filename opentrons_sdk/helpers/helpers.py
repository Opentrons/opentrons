import json
import math

from opentrons_sdk.util.vector import Vector


def unpack_coordinates(coordinates):
    if not isinstance(coordinates, tuple):
        coordinates = tuple([coordinates[axis] for axis in 'xyz'])

    return coordinates


def flip_coordinates(coordinates, dimensions):
    coordinates = unpack_coordinates(coordinates)
    x, y, z = coordinates
    x_size, y_size, z_size = unpack_coordinates(dimensions)

    return (x, y_size - y, z_size - z)


def path_to_steps(p1, p2, increment=5, mode='absolute'):
    """
    given two points p1 and p2, this returns a list of
    incremental positions or relative steps
    """
    Point = Vector
    if not isinstance(p1, Vector):
        Point = float

    distance = Point(p2)
    if mode is 'absolute':
        distance = p2 - p1

    if isinstance(p1, Vector):
        travel = math.sqrt(
            pow(distance[0], 2) + pow(distance[1], 2) + pow(distance[2], 2))
    else:
        travel = distance

    divider = max(int(travel / increment), 1)
    step = Point(distance / divider)

    res = []
    if mode is 'absolute':
        for i in range(divider):
            p1 = p1 + step
            res.append(Point(p1))
    else:
        for i in range(divider):
            res.append(step)
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
                    if ('tip' not in name) and ('rack' not in name):
                        z_pos = 1
                location = (
                    container,
                    container[0].from_center(
                        x=0,
                        y=0,
                        z=z_pos,
                        reference=container))
                pipette.calibrate_position(
                    location,
                    robot.flip_coordinates(coordinates))


def import_calibration_file(file_name, robot):
    with open(file_name) as f:
        json_string = '\n'.join(f)
        import_calibration_json(json_string, robot)
