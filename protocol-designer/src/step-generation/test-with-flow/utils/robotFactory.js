//  @flow
import cloneDeep from 'lodash/cloneDeep'
import {
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_DEACTIVATED,
  TEMPDECK,
} from '../../../constants'
import type { RobotState } from '../../types'

export const robotWithStatusAndTemp = (
  robotState: RobotState,
  temperatureModuleId: string,
  status:
    | typeof TEMPERATURE_AT_TARGET
    | typeof TEMPERATURE_APPROACHING_TARGET
    | typeof TEMPERATURE_DEACTIVATED,
  targetTemperature: number | null
): RobotState => {
  const robot = cloneDeep(robotState)
  robot.modules[temperatureModuleId].moduleState = {
    type: TEMPDECK,
    targetTemperature,
    status,
  }
  return robot
}
