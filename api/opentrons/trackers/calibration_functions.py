from opentrons.trackers import position_tracker
'''
 IDEA: For OT1, we calibrate everything with respect to one of the pipettes, including the OTHER pipette.
       So, we have the user jog the first pipette to MY_PLATE[0]. Then calibrate the whole deck with respect to that pipette.
       Then the user brings the second pipette to any well that the first has already been to. This creates a relationship
       between second pipette and the first. Since the first already has a relationship with all the plates, we SHOULD
       then be able to avoid calibrating all the other plates with with the second pipette.
'''

def calibrate_container(container, delta=None):
    if not delta:
        delta = get_delta_with_pipette_position() # not sure how we get this number yet. Pipette position is more complicated
    objects = [container] + [well for well in container.wells()] # Get all the children objects that would need to be calibrated
    [calibrate(obj, delta) for obj in objects]

def calibrate_well(well, delta=None):
    if not delta:
        delta = get_delta_with_pipette_position()
    calibrate(well, delta)

def calibrate_pipette(container, delta):
    # TODO: How does pipette calibration work?
    pass

def calibrate(obj, delta):
    position_tracker.adjust_object(obj, *delta)

def get_delta_with_pipette_position():
    pass

