import numpy as np


def target_inst_position(
        pose_tracker, mover, instrument, x, y, z):
    '''
    Resolves where a moving component needs to move to in order
    to position an attached instrument at some target location
    '''

    print(
        '---[POSE FUNC] mover: {}, instrument{}, target_position: {}'.format(
            mover, instrument, (x, y, z)))

    print("---[POSE FUNC] mover_position: {}".format(
        pose_tracker[mover].position))
    print(
        "---[POSE FUNC] instrument_position: {}".format(
            pose_tracker[instrument].position))

    rel_pos = pose_tracker[mover].position - pose_tracker[instrument].position
    mover_target = np.array([x, y, z] + rel_pos)

    print('---[POSE FUNC] mover target: {}'.format(mover_target))

    return mover_target
