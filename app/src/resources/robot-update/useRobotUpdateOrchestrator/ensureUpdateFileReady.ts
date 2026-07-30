import { OPENTRONS_USB } from '/app/redux/discovery/constants'
import {
  readSystemRobotUpdateFile,
  readUserRobotUpdateFile,
  startBuildrootPremigration,
  unexpectedRobotUpdateError,
} from '/app/redux/robot-update'
import {
  getRobotUpdateRobot,
  getRobotUpdateSession,
} from '/app/redux/robot-update/selectors'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

import {
  ROBOT_REQUIRES_PREMIGRATION,
  UNABLE_TO_FIND_ROBOT_WITH_NAME,
} from './constants'
import { waitForStoreCondition } from './waitForStoreCondition'

import type { Store } from 'redux'
import type { HostConfig } from '@opentrons/api-client'
import type { ViewableRobot } from '/app/redux/discovery/types'
import type { RobotUpdateSession } from '/app/redux/robot-update/types'
import type { Dispatch, State } from '/app/redux/types'

export function buildHostConfig(
  robot: ViewableRobot,
  token: string | null | undefined
): HostConfig {
  return {
    hostname: robot.ip,
    port: robot.port,
    robotName: robot.name,
    token,
    requestor: robot.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined,
  }
}

/**
 * Resolve the system file on disk (user file, cached download, or after
 * premigration), then wait until Redux session has fileInfo.
 */
export function ensureUpdateFileReady(
  store: Store<State>,
  dispatch: Dispatch,
  robotName: string,
  systemFile: string | null,
  signal?: AbortSignal
): Promise<RobotUpdateSession> {
  const state = store.getState()
  const host = getRobotUpdateRobot(state)
  const serverHealth = host?.serverHealth ?? null

  if (host == null || serverHealth == null) {
    const message = `${UNABLE_TO_FIND_ROBOT_WITH_NAME} ${robotName}`
    dispatch(unexpectedRobotUpdateError(message))
    return Promise.reject(new Error(message))
  }

  const capabilities = serverHealth.capabilities ?? null

  if (systemFile != null) {
    if (capabilities == null) {
      dispatch(unexpectedRobotUpdateError(ROBOT_REQUIRES_PREMIGRATION))
      return Promise.reject(new Error(ROBOT_REQUIRES_PREMIGRATION))
    }
    dispatch(readUserRobotUpdateFile(systemFile))
  } else if (capabilities == null) {
    dispatch(
      startBuildrootPremigration({
        name: host.name,
        ip: host.ip,
        port: host.port,
      })
    )
  } else {
    dispatch(
      readSystemRobotUpdateFile(
        serverHealth.robotModel === 'OT-3 Standard' ? 'flex' : 'ot2'
      )
    )
  }

  // Premigration: wait for capabilities, then read the system file.
  const afterPremigration =
    systemFile == null && capabilities == null
      ? waitForStoreCondition(
          store,
          getRobotUpdateRobot,
          robot => robot.serverHealth?.capabilities != null,
          {
            signal,
            getError: s => getRobotUpdateSession(s)?.error ?? null,
          }
        ).then(robot => {
          dispatch(
            readSystemRobotUpdateFile(
              robot.serverHealth?.robotModel === 'OT-3 Standard'
                ? 'flex'
                : 'ot2'
            )
          )
        })
      : Promise.resolve()

  return afterPremigration.then(() =>
    waitForStoreCondition(
      store,
      getRobotUpdateSession,
      session => session.fileInfo != null,
      {
        signal,
        getError: s => getRobotUpdateSession(s)?.error ?? null,
      }
    )
  )
}
