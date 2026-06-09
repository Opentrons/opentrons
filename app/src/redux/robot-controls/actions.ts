import * as Constants from './constants'

import type { Mount } from '../pipettes/types'
import type { RobotApiRequestMeta } from '../robot-api/types'
import type * as Types from './types'

type HomeActionCreator = ((
  robotName: string,
  target: 'robot'
) => Types.HomeAction) &
  ((robotName: string, target: 'pipette', mount: Mount) => Types.HomeAction)

/**
 * @deprecated: Prefer performing single robot commands via maintenance run. See useRobotControlCommands.
 */
export const home: HomeActionCreator = (
  robotName: string,
  target: 'robot' | 'pipette',
  mount?: Mount
): Types.HomeAction => ({
  type: Constants.HOME,
  payload:
    target === Constants.PIPETTE && typeof mount === 'string'
      ? { robotName, target: Constants.PIPETTE, mount }
      : { robotName, target: Constants.ROBOT },
  meta: {},
})

export const homeSuccess = (
  robotName: string,
  meta: RobotApiRequestMeta
): Types.HomeSuccessAction => ({
  type: Constants.HOME_SUCCESS,
  payload: { robotName },
  meta,
})

export const homeFailure = (
  robotName: string,
  error: { message: string },
  meta: RobotApiRequestMeta
): Types.HomeFailureAction => ({
  type: Constants.HOME_FAILURE,
  payload: { robotName, error },
  meta,
})

/**
 * @deprecated: Prefer performing single robot commands via maintenance run. See useRobotControlCommands.
 */
export const move = (
  robotName: string,
  position: Types.MovePosition,
  mount: Mount,
  disengageMotors: boolean = false
): Types.MoveAction => ({
  type: Constants.MOVE,
  payload: { robotName, mount, position, disengageMotors },
  meta: {},
})

export const moveSuccess = (
  robotName: string,
  meta: RobotApiRequestMeta
): Types.MoveSuccessAction => ({
  type: Constants.MOVE_SUCCESS,
  payload: { robotName },
  meta,
})

export const moveFailure = (
  robotName: string,
  error: { message: string },
  meta: RobotApiRequestMeta
): Types.MoveFailureAction => ({
  type: Constants.MOVE_FAILURE,
  payload: { robotName, error },
  meta,
})

export const clearMovementStatus = (
  robotName: string
): Types.ClearMovementStatusAction => ({
  type: Constants.CLEAR_MOVEMENT_STATUS,
  payload: { robotName },
})
