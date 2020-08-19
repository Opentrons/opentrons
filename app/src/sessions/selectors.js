// @flow
import type { State } from '../types'
import { every } from 'lodash'
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

export function getRobotSessionOfType(
  state: State,
  robotName: string,
  sessionType: Types.SessionType
): Types.Session | null {
  const sessionsById = getRobotSessions(state, robotName) || {}
  const foundSessionId =
    Object.keys(sessionsById).find(
      id => sessionsById[id].sessionType === sessionType
    ) ?? null
  return foundSessionId ? sessionsById[foundSessionId] : null
}

const getMountEventPropsFromCalibrationCheck: (
  session: Types.CalibrationCheckSession
) => Types.AnalyticsModelsByMount = session => {
  const { instruments } = session.details
  const initialModelsByMount: $Shape<Types.AnalyticsModelsByMount> = {}
  const modelsByMount: Types.AnalyticsModelsByMount = Object.keys(
    instruments
  ).reduce(
    (acc: Types.AnalyticsModelsByMount, mount: string) => ({
      ...acc,
      [`${mount.toLowerCase()}PipetteModel`]: instruments[mount].model,
    }),
    initialModelsByMount
  )
  return modelsByMount
}

const getSharedAnalyticsPropsFromCalibrationCheck: (
  session: Types.CalibrationCheckSession
) => Types.SharedAnalyticsProps = session => ({
  sessionType: session.sessionType,
})

const getAnalyticsPropsFromCalibrationCheck: (
  session: Types.CalibrationCheckSession
) => Types.CalibrationCheckSessionAnalyticsProps = session => {
  const { comparisonsByStep } = session.details
  const initialStepData: $Shape<Types.CalibrationCheckAnalyticsData> = {}
  const normalizedStepData = Object.keys(comparisonsByStep).reduce(
    (
      acc: Types.CalibrationCheckAnalyticsData,
      stepName: Types.RobotCalibrationCheckStep
    ) => {
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
    ...getSharedAnalyticsPropsFromCalibrationCheck(session),
    ...getMountEventPropsFromCalibrationCheck(session),
    ...normalizedStepData,
  }
}

const getIntercomPropsFromCalibrationCheck: (
  session: Types.CalibrationCheckSession
) => Types.CalibrationCheckSessionIntercomProps = session => {
  const { comparisonsByStep } = session.details
  const initialStepData: $Shape<Types.CalibrationCheckIntercomData> = {}
  const normalizedStepData = Object.keys(comparisonsByStep).reduce(
    (
      acc: Types.CalibrationCheckIntercomData,
      stepName: Types.RobotCalibrationCheckStep
    ) => {
      const { exceedsThreshold, transformType } = comparisonsByStep[stepName]
      return {
        ...acc,
        [`${stepName}ExceedsThreshold`]: exceedsThreshold,
        [`${stepName}ErrorSource`]: transformType,
      }
    },
    initialStepData
  )
  const boolValueOrNull: (val?: boolean) => boolean = val => {
    if (val === undefined || val === null) {
      return false
    }
    return val
  }

  const succeeded = every(
    Object.keys(comparisonsByStep).map(k =>
      boolValueOrNull(comparisonsByStep[k].exceedsThreshold)
    )
  )
  return {
    ...getSharedAnalyticsPropsFromCalibrationCheck(session),
    ...getMountEventPropsFromCalibrationCheck(session),
    ...normalizedStepData,
    succeeded: succeeded,
  }
}

export const getAnalyticsPropsForRobotSessionById: (
  state: State,
  robotName: string,
  sessionId: string
) => Types.SessionAnalyticsProps | null = (state, robotName, sessionId) => {
  const session = getRobotSessionById(state, robotName, sessionId)
  if (!session) return null

  if (session.sessionType === Constants.SESSION_TYPE_CALIBRATION_CHECK) {
    return getAnalyticsPropsFromCalibrationCheck(session)
  } else {
    // the exited session type doesn't report to analytics
    return null
  }
}

export const getIntercomEventPropsForRobotSessionById: (
  state: State,
  robotName: string,
  sessionId: string
) => Types.SessionIntercomProps | null = (state, robotName, sessionId) => {
  const session = getRobotSessionById(state, robotName, sessionId)
  if (!session) return null
  if (session.sessionType === Constants.SESSION_TYPE_CALIBRATION_CHECK) {
    return getIntercomPropsFromCalibrationCheck(session)
  } else {
    // the exited session type doesn't report to analytics
    return null
  }
}
