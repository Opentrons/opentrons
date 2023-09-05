// import { createSelector } from 'reselect'
import * as Sessions from '../sessions'

// import {
//   getProtocolType,
//   getProtocolCreatorApp,
//   getProtocolApiVersion,
//   getProtocolName,
//   getProtocolSource,
//   getProtocolAuthor,
//   getProtocolContents,
// } from '../protocol'

import { getViewableRobots, getRobotApiVersion } from '../discovery'

import {
  getRobotUpdateVersion,
  getRobotUpdateRobot,
  getRobotUpdateSession,
  getRobotSystemType,
} from '../robot-update'

import { getRobotSessionById } from '../sessions/selectors'

// import { hash } from './hash'

// import type { Selector } from 'reselect'
import type { State } from '../types'
import type { Mount } from '../pipettes/types'

import type {
  AnalyticsConfig,
  BuildrootAnalyticsData,
  PipetteOffsetCalibrationAnalyticsData,
  TipLengthCalibrationAnalyticsData,
  DeckCalibrationAnalyticsData,
  CalibrationHealthCheckAnalyticsData,
  AnalyticsSessionExitDetails,
  SessionInstrumentAnalyticsData,
} from './types'

export const FF_PREFIX = 'robotFF_'

// const _getUnhashedProtocolAnalyticsData: Selector<
//   State,
//   ProtocolAnalyticsData
// > = createSelector(
//   getProtocolType,
//   getProtocolCreatorApp,
//   getProtocolApiVersion,
//   getProtocolName,
//   getProtocolSource,
//   getProtocolAuthor,
//   getProtocolContents,
//   getPipettes,
//   getModules,
//   (
//     type,
//     app,
//     apiVersion,
//     name,
//     source,
//     author,
//     contents,
//     pipettes,
//     modules
//   ) => ({
//     protocolType: type || '',
//     protocolAppName: app.name || '',
//     protocolAppVersion: app.version || '',
//     protocolApiVersion: apiVersion || '',
//     protocolName: name || '',
//     protocolSource: source || '',
//     protocolAuthor: author || '',
//     protocolText: contents || '',
//     pipettes: pipettes.map(p => p.requestedAs ?? p.name).join(','),
//     modules: modules.map(m => m.model).join(','),
//   })
// )

// export const getProtocolAnalyticsData: (
//   state: State
// ) => Promise<ProtocolAnalyticsData> = createSelector<
//   State,
//   ProtocolAnalyticsData,
//   Promise<ProtocolAnalyticsData>
// >(_getUnhashedProtocolAnalyticsData, (data: ProtocolAnalyticsData) => {
//   const hashTasks = [hash(data.protocolAuthor), hash(data.protocolText)]

//   return Promise.all(hashTasks).then(([protocolAuthor, protocolText]) => ({
//     ...data,
//     protocolAuthor: data.protocolAuthor !== '' ? protocolAuthor : '',
//     protocolText: data.protocolText !== '' ? protocolText : '',
//   }))
// })

// export function getRobotAnalyticsData(state: State): RobotAnalyticsData | null {
//   const robot = getConnectedRobot(state)

//   if (robot) {
//     const pipettes = getAttachedPipettes(state, robot.name)
//     const settings = getRobotSettings(state, robot.name)

//     // @ts-expect-error RobotAnalyticsData type needs boolean values should it be boolean | string
//     return settings.reduce<RobotAnalyticsData>(
//       (result, setting) => ({
//         ...result,
//         [`${FF_PREFIX}${setting.id}`]: !!setting.value,
//       }),
//       // @ts-expect-error RobotAnalyticsData type needs boolean values should it be boolean | string
//       {
//         robotApiServerVersion: getRobotApiVersion(robot) || '',
//         robotSmoothieVersion: getRobotFirmwareVersion(robot) || '',
//         robotLeftPipette: pipettes.left?.model || '',
//         robotRightPipette: pipettes.right?.model || '',
//       }
//     )
//   }

//   return null
// }

export function getBuildrootAnalyticsData(
  state: State,
  robotName: string | null = null
): BuildrootAnalyticsData | null {
  const updateVersion = robotName
    ? getRobotUpdateVersion(state, robotName)
    : null
  const session = getRobotUpdateSession(state)
  const robot =
    robotName === null
      ? getRobotUpdateRobot(state)
      : getViewableRobots(state).find(r => r.name === robotName) || null

  if (updateVersion === null || robot === null) return null

  const currentVersion = getRobotApiVersion(robot) || 'unknown'
  const currentSystem = getRobotSystemType(robot) || 'unknown'

  return {
    currentVersion,
    currentSystem,
    updateVersion,
    error: session?.error || null,
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

export function getAnalyticsPipetteCalibrationData(
  state: State,
  mount: Mount
): PipetteOffsetCalibrationAnalyticsData | null {
  // const robot = getConnectedRobot(state)

  // if (robot) {
  //   const pipcal =
  //     getAttachedPipetteCalibrations(state, robot.name)[mount]?.offset ?? null
  //   const pip = getAttachedPipettes(state, robot.name)[mount]
  //   return {
  //     calibrationExists: Boolean(pipcal),
  //     markedBad: pipcal?.status?.markedBad ?? false,
  //     // @ts-expect-error protect for cases where model is not on pip
  //     pipetteModel: pip.model,
  //   }
  // }
  return null
}

export function getAnalyticsTipLengthCalibrationData(
  state: State,
  mount: Mount
): TipLengthCalibrationAnalyticsData | null {
  // const robot = getConnectedRobot(state)

  // if (robot) {
  //   const tipcal =
  //     getAttachedPipetteCalibrations(state, robot.name)[mount]?.tipLength ??
  //     null
  //   const pip = getAttachedPipettes(state, robot.name)[mount]
  //   return {
  //     calibrationExists: Boolean(tipcal),
  //     markedBad: tipcal?.status?.markedBad ?? false,
  //     // @ts-expect-error protect for cases where model is not on pip
  //     pipetteModel: pip.model,
  //   }
  // }
  return null
}

// function getPipetteModels(state: State, robotName: string): ModelsByMount {
//   // @ts-expect-error ensure that both mount keys exist on returned object
//   return Object.entries(
//     getAttachedPipettes(state, robotName)
//   ).reduce<ModelsByMount>((obj, [mount, pipData]): ModelsByMount => {
//     if (pipData) {
//       obj[mount as Mount] = pick(pipData, ['model'])
//     }
//     return obj
//     // @ts-expect-error ensure that both mount keys exist on returned object
//   }, {})
// }

// function getCalibrationCheckData(
//   state: State,
//   robotName: string
// ): CalibrationCheckByMount | null {
//   const session = getCalibrationCheckSession(state, robotName)
//   if (!session) {
//     return null
//   }
//   const { comparisonsByPipette, instruments } = session.details
//   return instruments.reduce<CalibrationCheckByMount>(
//     (obj, instrument: CalibrationCheckInstrument) => {
//       const { rank, mount, model } = instrument
//       const succeeded = !some(
//         Object.keys(comparisonsByPipette[rank]).map(k =>
//           Boolean(
//             comparisonsByPipette[rank][
//               k as keyof CalibrationCheckComparisonsPerCalibration
//             ]?.status === 'OUTSIDE_THRESHOLD'
//           )
//         )
//       )
//       obj[mount] = {
//         comparisons: comparisonsByPipette[rank],
//         succeeded: succeeded,
//         model: model,
//       }
//       return obj
//     },
//     { left: null, right: null }
//   )
// }

export function getAnalyticsDeckCalibrationData(
  state: State
): DeckCalibrationAnalyticsData | null {
  // TODO(va, 08-17-22): this selector was broken and was always returning null because getConnectedRobot
  // always returned null, this should be fixed at the epic level in a future ticket RAUT-150
  // const robot = getConnectedRobot(state)
  // if (robot) {
  //   const dcData = getDeckCalibrationData(state, robot.name)
  //   return {
  //     calibrationStatus: getDeckCalibrationStatus(state, robot.name),
  //     markedBad: !Array.isArray(dcData)
  //       ? dcData?.status?.markedBad || null
  //       : null,
  //     pipettes: getPipetteModels(state, robot.name),
  //   }
  // }
  return null
}

export function getAnalyticsHealthCheckData(
  state: State
): CalibrationHealthCheckAnalyticsData | null {
  // TODO(va, 08-17-22): this selector was broken and was always returning null because getConnectedRobot
  // always returned null, this should be fixed at the epic level in a future ticket RAUT-150
  // const robot = getConnectedRobot(state)
  // if (robot) {
  //   return {
  //     pipettes: getCalibrationCheckData(state, robot.name),
  //   }
  // }
  return null
}

export function getAnalyticsSessionExitDetails(
  state: State,
  robotName: string,
  sessionId: string
): AnalyticsSessionExitDetails | null {
  const session = getRobotSessionById(state, robotName, sessionId)
  if (session) {
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
  if (session) {
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
