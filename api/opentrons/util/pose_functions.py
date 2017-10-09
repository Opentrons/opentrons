import numpy as np


def target_inst_position(
        pose_tracker, mover, instrument, x, y, z):
    '''
    Resolves where a moving component needs to move to in order
    to position an attached instrument at some target location
    '''

    rel_pos = pose_tracker[mover].position - pose_tracker[instrument].position
    mover_target = np.array([x, y, z] + rel_pos)
    return mover_target
