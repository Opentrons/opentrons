import * as Sessions from '../sessions'

import { getViewableRobots, getRobotApiVersion } from '../discovery'

import {
  getRobotUpdateVersion,
  getRobotUpdateRobot,
  getRobotUpdateSession,
  getRobotSystemType,
} from '../robot-update'

import { getRobotSessionById } from '../sessions/selectors'

import type { State } from '../types'

import type {
  AnalyticsConfig,
  BuildrootAnalyticsData,
  AnalyticsSessionExitDetails,
  SessionInstrumentAnalyticsData,
} from './types'

export function getBuildrootAnalyticsData(
  state: State,
  robotName: string | null = null
): BuildrootAnalyticsData | null {
  const updateVersion =
    robotName != null ? getRobotUpdateVersion(state, robotName) : null
  const session = getRobotUpdateSession(state)
  const robot =
    robotName === null
      ? getRobotUpdateRobot(state)
      : getViewableRobots(state).find(r => r.name === robotName) ?? null

  if (updateVersion === null || robot === null) return null

  const currentVersion = getRobotApiVersion(robot) ?? 'unknown'
  const currentSystem = getRobotSystemType(robot) ?? 'unknown'

  return {
    currentVersion,
    currentSystem,
    updateVersion,
    error: session != null && 'error' in session ? session.error : null,
  }
}

export function getAnalyticsConfig(state: State): AnalyticsConfig | null {
  return state.config?.analytics ?? null
}

export function getAnalyticsOptedIn(state: State): boolean {
  return state.config?.analytics.optedIn ?? true
}

export function getAnalyticsOptInSeen(state: State): boolean {
  return state.config?.analytics.seenOptIn ?? true
}

export function getAnalyticsSessionExitDetails(
  state: State,
  robotName: string,
  sessionId: string
): AnalyticsSessionExitDetails | null {
  const session = getRobotSessionById(state, robotName, sessionId)
  if (session != null) {
    return {
      step: session.details.currentStep,
      sessionType: session.sessionType,
    }
  }
  return null
}

export function getSessionInstrumentAnalyticsData(
  state: State,
  robotName: string,
  sessionId: string
): SessionInstrumentAnalyticsData | null {
  const session = getRobotSessionById(state, robotName, sessionId)
  if (session != null) {
    const pipModel =
      session.sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
        ? session.details.activePipette.model
        : session.details.instrument.model

    return {
      sessionType: session.sessionType,
      pipetteModel: pipModel,
    }
  }
  return null
}
