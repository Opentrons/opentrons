from collections import OrderedDict
import json


STORAGE_LOCATION = ''

'''
 IDEA: For OT1, we calibrate everything with respect to one of the pipettes, including the OTHER pipette.
       So, we have the user jog the first pipette to MY_PLATE[0]. Then calibrate the whole deck with respect to that pipette.
       Then the user brings the second pipette to any well that the first has already been to. This creates a relationship
       between second pipette and the first. Since the first already has a relationship with all the plates, we SHOULD
       then be able to avoid calibrating all the other plates with with the second pipette.
'''

def _container_to_json(container, position_tracker, delta_x, delta_y, delta_z):
    locations = []
    old_x, old_y, old_z = container._coordinates
    name = container.get_name()
    for well in container:
        x, y, z = position_tracker.relative_object_position(well, container)
        locations.append((
            well.get_name(),
            {
                'x': x, 'y': y, 'z': z,
                'depth': well.z_size(),
                'diameter': well.x_size(),
                'total-liquid-volume': well.max_volume()
            }
        ))
    container_json = {name: {'locations': OrderedDict(locations), 'origin-offset':
        {'x': old_x + delta_x, 'y': old_y + delta_y, 'z': old_z + delta_z}}}
    return json.dumps(container_json)

def calibrate_container_with_delta(container, position_tracker, delta_x, delta_y, delta_z):
    delta = (delta_x, delta_y, delta_z)
    position_tracker.translate_object(container, *delta)
    container_json = _container_to_json(container, position_tracker, *delta)
    save_container(container_json)


def save_container(container_as_json):
    print(container_as_json)

