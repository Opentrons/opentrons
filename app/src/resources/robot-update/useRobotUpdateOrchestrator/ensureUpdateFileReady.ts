import { i18n } from '/app/i18n'
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
import { waitForStoreCondition } from '/app/redux/waitForStoreCondition'

import type { Store } from 'redux'
import type { RobotUpdateSession } from '/app/redux/robot-update/types'
import type { Dispatch, State } from '/app/redux/types'

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
    const message = i18n.t('unable_to_find_robot_with_name', {
      ns: 'device_settings',
      robotName,
    })
    dispatch(unexpectedRobotUpdateError(message))
    return Promise.reject(new Error(message))
  }

  const capabilities = serverHealth.capabilities ?? null

  if (systemFile != null) {
    if (capabilities == null) {
      const message = i18n.t('robot_requires_premigration', {
        ns: 'device_settings',
      })
      dispatch(unexpectedRobotUpdateError(message))
      return Promise.reject(new Error(message))
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
