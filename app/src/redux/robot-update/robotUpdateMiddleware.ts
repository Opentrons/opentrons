import { createListenerMiddleware } from '@reduxjs/toolkit'

import { getAllRobots } from '../discovery'
import { removeRobot } from '../discovery/actions'
import {
  readSystemRobotUpdateFile,
  unexpectedRobotUpdateError,
} from './actions'
import { DONE, DOWNLOAD_FILE, ROBOTUPDATE_DOWNLOAD_ERROR } from './constants'
import {
  getRobotUpdateRobot,
  getRobotUpdateSession,
  getRobotUpdateSessionRobotName,
} from './selectors'

import type { Dispatch, State } from '../types'
import type { RobotUpdateAction } from './types'

/**
 * Non-HTTP robot-update side effects that are not part of the apply pipeline.
 */
export const robotUpdateMiddleware = createListenerMiddleware()

const startListening = robotUpdateMiddleware.startListening.withTypes<
  State,
  Dispatch
>()

// After a system file download finishes during an active update session,
// read the cached system file and continue the update.
startListening({
  predicate: (_action, currentState, previousState) => {
    const prev = getRobotUpdateSession(previousState)
    const curr = getRobotUpdateSession(currentState)
    return (
      curr != null &&
      curr.error == null &&
      curr.step === DOWNLOAD_FILE &&
      curr.stage === DONE &&
      !(
        prev?.step === DOWNLOAD_FILE &&
        prev?.stage === DONE &&
        prev?.robotName === curr.robotName
      )
    )
  },
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState()
    const host = getRobotUpdateRobot(state)
    const robotModel =
      host?.serverHealth?.robotModel === 'OT-3 Standard' ? 'flex' : 'ot2'
    listenerApi.dispatch(readSystemRobotUpdateFile(robotModel))
  },
})

// Surface shell download failures on the active update session so the UI
// does not hang when downloading an update.
startListening({
  predicate: action => action.type === ROBOTUPDATE_DOWNLOAD_ERROR,
  effect: (action, listenerApi) => {
    const session = getRobotUpdateSession(listenerApi.getState())
    if (session?.step !== DOWNLOAD_FILE || session.error != null) {
      return
    }
    const { error } = (
      action as unknown as Extract<
        RobotUpdateAction,
        { type: typeof ROBOTUPDATE_DOWNLOAD_ERROR }
      >
    ).payload
    listenerApi.dispatch(unexpectedRobotUpdateError(error))
  },
})

// If robot was renamed as part of migration, remove old robot name.
// Balena robots have name opentrons-robot-name; BR robots have robot-name.
startListening({
  predicate: (_action, currentState) => {
    const robotName = getRobotUpdateSessionRobotName(currentState)
    const robot = getRobotUpdateRobot(currentState)
    const allRobots = getAllRobots(currentState)

    return (
      robot != null &&
      robotName != null &&
      robot.name !== robotName &&
      allRobots.some(r => r.name === robotName)
    )
  },
  effect: (_action, listenerApi) => {
    const robotName = getRobotUpdateSessionRobotName(listenerApi.getState())
    if (robotName != null) {
      listenerApi.dispatch(removeRobot(robotName))
    }
  },
})
