import { postFile } from '../http'
import type {
  RobotModel,
  ViewableRobot,
} from '@opentrons/app/src/redux/discovery/types'

const OT2_FILENAME = 'ot2-system.zip'
const SYSTEM_FILENAME = 'system-update.zip'

const getSystemFileName = (robotModel: RobotModel): string => {
  if (robotModel === 'OT-2 Standard' || robotModel === null) {
    return OT2_FILENAME
  }
  return SYSTEM_FILENAME
}

export function uploadSystemFile(
  robot: ViewableRobot,
  urlPath: string,
  file: string
): Promise<unknown> {
  const url = `http://${robot.ip}:${robot.port}${urlPath}`

  return postFile(url, getSystemFileName(robot.robotModel), file)
}
