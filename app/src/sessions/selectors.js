// @flow
import type { State } from '../types'
import * as Constants from './constants'
import * as Types from './types'

export const getRobotSessions: (
  state: State,
  robotName: string
) => Types.SessionsById | null = (state, robotName) =>
  state.sessions[robotName]?.robotSessions ?? null

export const getRobotSessionById: (
  state: State,
  robotName: string,
  sessionId: string
) => Types.Session | null = (state, robotName, sessionId) => {
  return (getRobotSessions(state, robotName) || {})[sessionId] ?? null
}

export const getRobotSessionOfType: (
  state: State,
  robotName: string,
  sessionType: Types.SessionType
) => Types.Session | null = (state, robotName, sessionType) => {
  const sessionsById = getRobotSessions(state, robotName) || {}
  const foundSessionId =
    Object.keys(sessionsById).find(
      id => sessionsById[id].sessionType === sessionType
    ) ?? null
  return foundSessionId ? sessionsById[foundSessionId] : null
}

export const getAnalyticsPropsForRobotSessionById: (
  state: State,
  robotName: string,
  sessionId: string
) => Types.SessionAnalyticsProps | null = (state, robotName, sessionId) => {
  const session = getRobotSessionById(state, robotName, sessionId)
  if (!session) return null

  if (session.sessionType === Constants.SESSION_TYPE_CALIBRATION_CHECK) {
    const { instruments, comparisonsByStep } = session.details
    const initialModelsByMount: Types.AnalyticsModelsByMount = {}
    const modelsByMount: Types.AnalyticsModelsByMount = Object.keys(
      instruments
    ).reduce(
      (acc, mount) => ({
        ...acc,
        [`${mount.toLowerCase()}PipetteModel`]: instruments[mount].model,
      }),
      initialModelsByMount
    )
    const initialStepData: Types.CalibrationCheckAnalyticsData = {}
    const normalizedStepData = Object.keys(comparisonsByStep).reduce(
      (acc, stepName) => {
        const {
          differenceVector,
          thresholdVector,
          exceedsThreshold,
          transformType,
        } = comparisonsByStep[stepName]
        return {
          ...acc,
          [`${stepName}DifferenceVector`]: differenceVector,
          [`${stepName}ThresholdVector`]: thresholdVector,
          [`${stepName}ExceedsThreshold`]: exceedsThreshold,
          [`${stepName}ErrorSource`]: transformType,
        }
      },
      initialStepData
    )
    return {
      sessionType: session.sessionType,
      ...modelsByMount,
      ...normalizedStepData,
    }
  } else {
    // the exited session type doesn't report to analytics
    return null
  }
}
