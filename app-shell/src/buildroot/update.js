// @flow
// start a buildroot migration by POSTing the necessary wheel files to a robot
// and restarting

import assert from 'assert'
import path from 'path'
import globby from 'globby'

import { fetch, postFile } from '../http'
import type { RobotHost } from '@opentrons/app/src/robot-api'

const PREMIGRATION_WHL_DIR = path.join(
  __dirname,
  '../../build/br-premigration-wheels'
)

const API_WHL_PATTERN = path.join(PREMIGRATION_WHL_DIR, 'opentrons-*.whl')
const SERVER_WHL_PATTERN = path.join(PREMIGRATION_WHL_DIR, 'otupdate-*.whl')

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
  const getApiWheel = getWheel(API_WHL_PATTERN)
  const getServerWheel = getWheel(SERVER_WHL_PATTERN)

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

export function uploadFile(
  robot: RobotHost,
  urlPath: string,
  file: string
): Promise<mixed> {
  const url = `http://${robot.ip}:${robot.port}${urlPath}`

  return postFile(url, path.basename(file), file)
}
