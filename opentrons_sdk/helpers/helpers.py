import json


def unpack_coordinates(coordinates):
    if not isinstance(coordinates, tuple):
        coordinates = tuple([coordinates[axis] for axis in 'xyz'])

    return coordinates


def flip_coordinates(coordinates, dimensions):
    coordinates = unpack_coordinates(coordinates)
    x, y, z = coordinates
    x_size, y_size, z_size = unpack_coordinates(dimensions)

    return (x, y_size - y, z_size - z)


def import_calibration_json(json_string, robot, calibrated_top=False):
    pipette_calibration = json.loads(json_string)

    for axis, data in pipette_calibration.items():
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
            if ('tip' not in name) and ('rack' not in name) and calibrated_top:
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
