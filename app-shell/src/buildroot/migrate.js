// @flow
// start a buildroot migration by POSTing the necessary wheel files to a robot
// and restarting

import assert from 'assert'
import path from 'path'
import globby from 'globby'

import { fetch, postFile } from '../http'
import type { RobotHost } from '@opentrons/app/src/robot-api'

const API_WHEEL_PATTERN = path.join(__dirname, '../../../api/dist/*.whl')
const SERVER_WHEEL_PATTERN = path.join(
  __dirname,
  '../../build/update-server/*.whl'
)

const getWheel = (pattern: string): Promise<string> =>
  globby(pattern).then(matches => {
    assert(
      matches.length === 1,
      `Expected 1 file to match ${pattern}, found [${matches.join(', ')}]`
    )
    return matches[0]
  })

export function getPremigrationWheels(): Promise<{
  api: string,
  updateServer: string,
}> {
  const getApiWheel = getWheel(API_WHEEL_PATTERN)
  const getServerWheel = getWheel(SERVER_WHEEL_PATTERN)

  return Promise.all([getApiWheel, getServerWheel]).then(
    ([api, updateServer]) => ({ api, updateServer })
  )
}

export function startPremigration(
  robot: RobotHost,
  apiWheelPath: string,
  serverWheelPath: string
): Promise<mixed> {
  const apiUrl = `http://${robot.ip}:${robot.port}/server/update`
  const serverUrl = `http://${robot.ip}:${robot.port}/server/update/bootstrap`
  const restartUrl = `http://${robot.ip}:${robot.port}/server/restart`

  return postFile(apiUrl, 'whl', apiWheelPath)
    .then(() => postFile(serverUrl, 'whl', serverWheelPath))
    .then(() => fetch(restartUrl, { method: 'POST' }))
}
