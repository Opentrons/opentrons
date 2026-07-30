import { createListenerMiddleware } from '@reduxjs/toolkit'

import { getAllRobots } from '../discovery'
import { removeRobot } from '../discovery/actions'
import { readSystemRobotUpdateFile, startRobotUpdate } from './actions'
import { DONE, DOWNLOAD_FILE, PREMIGRATION_RESTART } from './constants'
import {
  getRobotUpdateRobot,
  getRobotUpdateSession,
  getRobotUpdateSessionRobotName,
} from './selectors'

import type { Dispatch, State } from '../types'

/**
 * Non-HTTP robot-update side effects:
 * resume update after download completes, retry after premigration, and
 * remove a Balena robot name after migration rename.
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

// After premigration restart, once capabilities appear, restart the update.
startListening({
  predicate: (_action, currentState) => {
    const session = getRobotUpdateSession(currentState)
    const robot = getRobotUpdateRobot(currentState)
    return (
      robot != null &&
      session?.step === PREMIGRATION_RESTART &&
      session.error == null &&
      robot.serverHealth?.capabilities != null
    )
  },
  effect: (_action, listenerApi) => {
    const robot = getRobotUpdateRobot(listenerApi.getState())
    if (robot != null) {
      listenerApi.dispatch(startRobotUpdate(robot.name))
    }
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
