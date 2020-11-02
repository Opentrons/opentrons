// @flow
import type { State } from '../types'
// import { some } from 'lodash'
// import * as Constants from './constants'
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

/* TODO AA 11-01-2020: fix the following selectors for health check analytics to match the current flow */

// // TODO (lc 10-20-2020) move these selectors into a
// // a cal check specific file.
// const getMountEventPropsFromCalibrationCheck: (
//   session: Types.CalibrationCheckSession
// ) => Types.AnalyticsModelsByMount = session => {
//   const { instruments } = session.details
//   const initialModelsByMount: $Shape<Types.AnalyticsModelsByMount> = {}
//   const modelsByMount: Types.AnalyticsModelsByMount = instruments.reduce(
//     (
//       acc: Types.AnalyticsModelsByMount,
//       instrument: Types.CalibrationHealthCheckInstrument
//     ) => ({
//       ...acc,
//       [`${instrument.mount.toLowerCase()}PipetteModel`]: instrument.model,
//     }),
//     initialModelsByMount
//   )
//   return modelsByMount
// }

// // TODO (lc 10-20-2020) move these selectors into a
// // a cal check specific file.
// const getSharedAnalyticsPropsFromCalibrationCheck: (
//   session: Types.CalibrationCheckSession
// ) => Types.SharedAnalyticsProps = session => ({
//   sessionType: session.sessionType,
// })

// // TODO (lc 10-20-2020) move these selectors into a
// // a cal check specific file.
// const getAnalyticsPropsFromCalibrationCheck: (
//   session: Types.CalibrationCheckSession
// ) => Types.CalibrationCheckSessionAnalyticsProps = session => {
//   const { comparisonsByPipette, activePipette } = session.details
//   const rank = activePipette.rank
//   const initialStepData: $Shape<Types.CalibrationCheckAnalyticsData> = {}
//   const normalizedStepDataFirstPip = Object.keys(
//     comparisonsByPipette.first
//   ).reduce(
//     (
//       acc: Types.CalibrationCheckAnalyticsData,
//       stepName: Types.RobotCalibrationCheckStep
//     ) => {
//       const {
//         differenceVector,
//         thresholdVector,
//         exceedsThreshold,
//         transformType,
//       } = comparisonsByPipette[rank][stepName]
//       return {
//         ...acc,
//         [`${stepName}DifferenceVector`]: differenceVector,
//         [`${stepName}ThresholdVector`]: thresholdVector,
//         [`${stepName}ExceedsThreshold`]: exceedsThreshold,
//         [`${stepName}ErrorSource`]: transformType,
//       }
//     },
//     initialStepData
//   )
//   const normalizedStepDataSecondPip = Object.keys(
//     comparisonsByPipette.second
//   ).reduce(
//     (
//       acc: Types.CalibrationCheckAnalyticsData,
//       stepName: Types.RobotCalibrationCheckStep
//     ) => {
//       const {
//         differenceVector,
//         thresholdVector,
//         exceedsThreshold,
//         transformType,
//       } = comparisonsByPipette[rank][stepName]
//       return {
//         ...acc,
//         [`${stepName}DifferenceVector`]: differenceVector,
//         [`${stepName}ThresholdVector`]: thresholdVector,
//         [`${stepName}ExceedsThreshold`]: exceedsThreshold,
//         [`${stepName}ErrorSource`]: transformType,
//       }
//     },
//     initialStepData
//   )
//   return {
//     ...getSharedAnalyticsPropsFromCalibrationCheck(session),
//     ...getMountEventPropsFromCalibrationCheck(session),
//     ...normalizedStepDataFirstPip,
//     ...normalizedStepDataSecondPip,
//   }
// }

// // TODO (lc 10-20-2020) move these selectors into a
// // a cal check specific file.
// const getIntercomPropsFromCalibrationCheck: (
//   session: Types.CalibrationCheckSession
// ) => Types.CalibrationCheckSessionIntercomProps = session => {
//   const { comparisonsByPipette, activePipette } = session.details
//   const rank = activePipette.rank
//   const comparisons = comparisonsByPipette[rank]
//   const initialStepData: $Shape<Types.CalibrationCheckIntercomData> = {}
//   const normalizedStepData = Object.keys(comparisons).reduce(
//     (
//       acc: Types.CalibrationCheckIntercomData,
//       stepName: Types.RobotCalibrationCheckStep
//     ) => {
//       const { exceedsThreshold, transformType } = comparisonsByPipette[rank][
//         stepName
//       ]
//       return {
//         ...acc,
//         [`${stepName}ExceedsThreshold`]: exceedsThreshold,
//         [`${stepName}ErrorSource`]: transformType,
//       }
//     },
//     initialStepData
//   )

//   const succeeded = !some(
//     Object.keys(comparisons).map(k => Boolean(comparisons[k].exceedsThreshold))
//   )
//   return {
//     ...getSharedAnalyticsPropsFromCalibrationCheck(session),
//     ...getMountEventPropsFromCalibrationCheck(session),
//     ...normalizedStepData,
//     succeeded: succeeded,
//   }
// }

// export const getAnalyticsPropsForRobotSessionById: (
//   state: State,
//   robotName: string,
//   sessionId: string
// ) => Types.SessionAnalyticsProps | null = (state, robotName, sessionId) => {
//   const session = getRobotSessionById(state, robotName, sessionId)
//   if (!session) return null

//   if (session.sessionType === Constants.SESSION_TYPE_CALIBRATION_HEALTH_CHECK) {
//     return getAnalyticsPropsFromCalibrationCheck(session)
//   } else {
//     // the exited session type doesn't report to analytics
//     return null
//   }
// }

// export const getIntercomEventPropsForRobotSessionById: (
//   state: State,
//   robotName: string,
//   sessionId: string
// ) => Types.SessionIntercomProps | null = (state, robotName, sessionId) => {
//   const session = getRobotSessionById(state, robotName, sessionId)
//   if (!session) return null
//   if (session.sessionType === Constants.SESSION_TYPE_CALIBRATION_HEALTH_CHECK) {
//     return getIntercomPropsFromCalibrationCheck(session)
//   } else {
//     // the exited session type doesn't report to analytics
//     return null
//   }
// }
