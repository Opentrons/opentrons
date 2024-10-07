import { postFile } from '../http'
import type { ViewableRobot } from '@opentrons/app/src/redux/discovery/types'
import { SYSTEM_FILENAME } from './constants'

export function uploadSystemFile(
  robot: ViewableRobot,
  urlPath: string,
  file: string
): Promise<unknown> {
  const url = `http://${robot.ip}:${robot.port}${urlPath}`

  return postFile(url, SYSTEM_FILENAME, file)
}
