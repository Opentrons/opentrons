import numpy as np


def target_pos_for_instrument_positioning(position_tracker, mover, instrument, target_x, target_y, target_z):
    '''
    Resolves where a moving component needs to move to in order
    to position an attached instrument at some target location
    '''
    rel_pos =  position_tracker[mover].position - position_tracker[instrument].position
    mover_target = np.array([target_x, target_y, target_z] + rel_pos)
    return mover_target
