from opentrons.data_storage import database

'''
 IDEA: For OT1, we calibrate everything with respect to one of the pipettes,
 including the other pipette. So, we have the user jog the first pipette
 to MY_PLATE[0]. Then calibrate the whole deck with respect to that pipette.
 Then the user brings the second pipette to any well that the first has already
 been to. This creates a relationship between second pipette and the first.
 Since the first already has a relationship with all the plates, we should
then be able to avoid calibrating all the other plates with with the
second pipette.
'''


def calibrate_container_with_delta(
        container, position_tracker, delta_x,
        delta_y, delta_z, save, new_container_name=None
):
    delta = (delta_x, delta_y, delta_z)
    position_tracker.translate_object(container, *delta)
    container._coordinates += delta
    if save and new_container_name:
        database.save_new_container(container, new_container_name)
    elif save:
        database.overwrite_container(container)
