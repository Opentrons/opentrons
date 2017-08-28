STORAGE_LOCATION = ''


# public
def calibrate_container(container, position_tracker, delta_x, delta_y, delta_z):
    #update position
    position_tracker.translate_object(container, delta_x, delta_y, delta_z)
    container_json = container_to_json(container, position_tracker)
    save_calibrated_container(container_json)

# helper
def container_to_json(container, position_tracker):
    locations_json = {}
    container_json = {'containers': {
        container.get_name(): {
            'locations': locations
        }
    }}
    for well in container:
        pass
    pass



def container_to_json(container, delta_x, delta_y, delta_z):
    locations = []
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
    return {name: {'locations': OrderedDict(locations), 'origin-offset': {'x': delta_x, 'y': delta_y, 'z': delta_z}}} 

def save_container(container_as_json):
    pass
    # write to file...
    save_container_calibration(container, relative_pose)
