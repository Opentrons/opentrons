// @flow
// start a buildroot migration by POSTing the necessary wheel files to a robot
// and restarting

import path from 'path'

import type { RobotHost } from '@opentrons/app/src/robot-api/types'
import { fetch, postFile } from '../http'

const PREMIGRATION_WHL_DIR = path.join(
  // NOTE: __dirname refers to output directory
  __dirname,
  '../build/br-premigration-wheels'
)

const PREMIGRATION_API_WHL = path.join(
  PREMIGRATION_WHL_DIR,
  'opentrons-3.10.3-py2.py3-none-any.whl'
)
const PREMIGRATION_SERVER_WHL = path.join(
  PREMIGRATION_WHL_DIR,
  'otupdate-3.10.3-py2.py3-none-any.whl'
)
const SYSTEM_FILENAME = 'ot2-system.zip'

export function startPremigration(robot: RobotHost): Promise<mixed> {
  const apiUrl = `http://${robot.ip}:${robot.port}/server/update`
  const serverUrl = `http://${robot.ip}:${robot.port}/server/update/bootstrap`
  const restartUrl = `http://${robot.ip}:${robot.port}/server/restart`

  return postFile(apiUrl, 'whl', PREMIGRATION_API_WHL)
    .then(() => postFile(serverUrl, 'whl', PREMIGRATION_SERVER_WHL))
    .then(() => fetch(restartUrl, { method: 'POST' }))
}

export function uploadSystemFile(
  robot: RobotHost,
  urlPath: string,
  file: string
): Promise<mixed> {
  const url = `http://${robot.ip}:${robot.port}${urlPath}`

  return postFile(url, SYSTEM_FILENAME, file)
}
