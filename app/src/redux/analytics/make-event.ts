// redux action types to analytics events map
// TODO(mc, 2022-03-04): large chunks of this module are commented
// out because RPC-based analytics events were not replaced with
// the switch to the HTTP APIs. Commented out code left to aid with
// analytics replacement.
import * as CustomLabware from '../custom-labware'
import * as SystemInfo from '../system-info'
import * as RobotUpdate from '../robot-update/constants'
import * as Sessions from '../sessions'
import * as Alerts from '../alerts'
import * as Constants from './constants'
import { sharedCalCommands } from '../sessions/common-calibration/constants'
import * as RobotAdmin from '../robot-admin'

import {
  getBuildrootAnalyticsData,
  getAnalyticsPipetteCalibrationData,
  getAnalyticsTipLengthCalibrationData,
  getAnalyticsHealthCheckData,
  getAnalyticsDeckCalibrationData,
  getAnalyticsSessionExitDetails,
  getSessionInstrumentAnalyticsData,
} from './selectors'

import type { State, Action } from '../types'
import type { AnalyticsEvent } from './types'
import type { Mount } from '../pipettes/types'

const EVENT_APP_UPDATE_DISMISSED = 'appUpdateDismissed'

export function makeEvent(
  action: Action,
  state: State
): Promise<AnalyticsEvent | null> {
  switch (action.type) {
    // case 'robot:CONNECT': {
    //   const robot = getConnectedRobot(state)

    //   if (!robot) {
    //     log.warn('No robot found for connect response')
    //     return Promise.resolve(null)
    //   }

    //   const data = getRobotAnalyticsData(state)

    //   return Promise.resolve({
    //     name: 'robotConnect',
    //     properties: {
    //       ...data,
    //       method: robot.local ? 'usb' : 'wifi',
    //       success: true,
    //     },
    //   })
    // }

    // case 'protocol:LOAD': {
    //   return getProtocolAnalyticsData(state).then(data => ({
    //     name: 'protocolUploadRequest',
    //     properties: {
    //       ...getRobotAnalyticsData(state),
    //       ...data,
    //     },
    //   }))
    // }

    // case 'robot:SESSION_RESPONSE':
    // case 'robot:SESSION_ERROR': {
    //   // only fire event if we had a protocol upload in flight; we don't want
    //   // to fire if user connects to robot with protocol already loaded
    //   const { type: actionType, payload: actionPayload, meta } = action
    //   if (!meta.freshUpload) return Promise.resolve(null)

    //   return getProtocolAnalyticsData(state).then(data => ({
    //     name: 'protocolUploadResponse',
    //     properties: {
    //       ...getRobotAnalyticsData(state),
    //       ...data,
    //       success: actionType === 'robot:SESSION_RESPONSE',
    //       // @ts-expect-error even if we used the in operator, TS cant narrow error to anything more specific than 'unknown' https://github.com/microsoft/TypeScript/issues/25720
    //       error: (actionPayload.error && actionPayload.error.message) || '',
    //     },
    //   }))
    // }

    // case 'robot:RUN': {
    //   return getProtocolAnalyticsData(state).then(data => ({
    //     name: 'runStart',
    //     properties: {
    //       ...getRobotAnalyticsData(state),
    //       ...data,
    //     },
    //   }))
    // }

    // TODO(mc, 2019-01-22): we only get this event if the user keeps their app
    // open for the entire run. Fixing this is blocked until we can fix
    // session.stop from triggering a run error
    // case 'robot:RUN_RESPONSE': {
    //   const runTime = robotSelectors.getRunSeconds(state)
    //   const success = !action.error
    //   const error = action.error ? action.payload?.message || '' : ''

    //   return getProtocolAnalyticsData(state).then(data => ({
    //     name: 'runFinish',
    //     properties: {
    //       ...getRobotAnalyticsData(state),
    //       ...data,
    //       runTime,
    //       success,
    //       error,
    //     },
    //   }))
    // }

    // case 'robot:PAUSE': {
    //   const runTime = robotSelectors.getRunSeconds(state)

    //   return getProtocolAnalyticsData(state).then(data => ({
    //     name: 'runPause',
    //     properties: { ...data, runTime },
    //   }))
    // }

    // case 'robot:RESUME': {
    //   const runTime = robotSelectors.getRunSeconds(state)

    //   return getProtocolAnalyticsData(state).then(data => ({
    //     name: 'runResume',
    //     properties: { ...data, runTime },
    //   }))
    // }

    // case 'robot:CANCEL':
    //   const runTime = robotSelectors.getRunSeconds(state)

    //   return getProtocolAnalyticsData(state).then(data => ({
    //     name: 'runCancel',
    //     properties: { ...data, runTime },
    //   }))

    // robot update events
    case RobotUpdate.ROBOTUPDATE_SET_UPDATE_SEEN: {
      const data = getBuildrootAnalyticsData(state, action.meta.robotName)
      return Promise.resolve({
        name: 'robotUpdateView',
        properties: { ...data },
      })
    }

    case RobotUpdate.ROBOTUPDATE_CHANGELOG_SEEN: {
      const data = getBuildrootAnalyticsData(state, action.meta.robotName)
      return Promise.resolve({
        name: 'robotUpdateChangeLogView',
        properties: { ...data },
      })
    }

    case RobotUpdate.ROBOTUPDATE_UPDATE_IGNORED: {
      const data = getBuildrootAnalyticsData(state, action.meta.robotName)
      return Promise.resolve({
        name: 'robotUpdateIgnore',
        properties: { ...data },
      })
    }

    case RobotUpdate.ROBOTUPDATE_START_UPDATE: {
      const data = getBuildrootAnalyticsData(state)
      return Promise.resolve({
        name: 'robotUpdateInitiate',
        properties: { ...data },
      })
    }

    case RobotUpdate.ROBOTUPDATE_UNEXPECTED_ERROR: {
      const data = getBuildrootAnalyticsData(state)
      return Promise.resolve({
        name: 'robotUpdateError',
        properties: { ...data },
      })
    }

    case RobotUpdate.ROBOTUPDATE_SET_SESSION_STEP: {
      if (action.payload !== 'finished') return Promise.resolve(null)
      const data = getBuildrootAnalyticsData(state)
      return Promise.resolve({
        name: 'robotUpdateComplete',
        properties: { ...data },
      })
    }

    case CustomLabware.CUSTOM_LABWARE_LIST: {
      const { payload: labware, meta } = action
      const { source } = meta
      const customLabwareCount = labware.filter(
        lw => lw.type === CustomLabware.VALID_LABWARE_FILE
      ).length
      const superProperties = { customLabwareCount }

      if (
        source === CustomLabware.ADD_LABWARE ||
        source === CustomLabware.OVERWRITE_LABWARE
      ) {
        return Promise.resolve({
          name: Constants.ANALYTICS_ADD_CUSTOM_LABWARE,
          properties: {
            success: true,
            overwrite: source === CustomLabware.OVERWRITE_LABWARE,
            error: '',
          },
          superProperties,
        })
      }

      if (source === CustomLabware.CHANGE_DIRECTORY) {
        return Promise.resolve({
          name: 'changeLabwareSourceDirectory',
          properties: { success: true, error: '' },
          superProperties,
        })
      }

      return Promise.resolve({ superProperties })
    }

    case CustomLabware.CUSTOM_LABWARE_LIST_FAILURE: {
      const { message: error } = action.payload
      const { source } = action.meta

      if (source === CustomLabware.CHANGE_DIRECTORY) {
        return Promise.resolve({
          name: 'changeLabwareSourceDirectory',
          properties: { success: false, error },
        })
      }

      if (source === CustomLabware.INITIAL) {
        return Promise.resolve({
          name: 'customLabwareListError',
          properties: { error },
        })
      }

      break
    }

    case CustomLabware.ADD_CUSTOM_LABWARE_FAILURE: {
      const { labware, message } = action.payload
      let error = ''

      if (labware !== null) {
        error = labware.type
      } else if (message !== null) {
        error = message
      }

      return Promise.resolve({
        name: Constants.ANALYTICS_ADD_CUSTOM_LABWARE,
        properties: { success: false, overwrite: false, error },
      })
    }

    case SystemInfo.INITIALIZED:
    case SystemInfo.USB_DEVICE_ADDED:
    case SystemInfo.NETWORK_INTERFACES_CHANGED: {
      const systemInfoProps = SystemInfo.getU2EDeviceAnalyticsProps(state)

      return Promise.resolve(
        systemInfoProps
          ? {
              superProperties: {
                ...systemInfoProps,
                // anonymize IP address so analytics profile can't be mapped to more
                // specific Intercom support profile
                'U2E IPv4 Address': Boolean(
                  systemInfoProps['U2E IPv4 Address']
                ),
              },
            }
          : null
      )
    }

    case Sessions.ENSURE_SESSION: {
      switch (action.payload.sessionType) {
        case Sessions.SESSION_TYPE_DECK_CALIBRATION:
          const dcAnalyticsProps = getAnalyticsDeckCalibrationData(state)
          return Promise.resolve(
            dcAnalyticsProps
              ? {
                  name: 'deckCalibrationStarted',
                  properties: dcAnalyticsProps,
                }
              : null
          )
        case Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK:
          const hcAnalyticsProps = getAnalyticsHealthCheckData(state)
          return Promise.resolve(
            hcAnalyticsProps
              ? {
                  name: 'calibrationHealthCheckStarted',
                  properties: hcAnalyticsProps,
                }
              : null
          )
        default:
          return Promise.resolve(null)
      }
    }

    case Sessions.CREATE_SESSION_COMMAND: {
      switch (action.payload.command.command) {
        case sharedCalCommands.EXIT:
          const sessionDetails = getAnalyticsSessionExitDetails(
            state,
            action.payload.robotName,
            action.payload.sessionId
          )
          return Promise.resolve(
            sessionDetails
              ? {
                  name: `${sessionDetails.sessionType}Exit`,
                  properties: {
                    step: sessionDetails.step,
                  },
                }
              : null
          )
        case sharedCalCommands.LOAD_LABWARE:
          const commandData = action.payload.command.data
          if (commandData) {
            const instrData = getSessionInstrumentAnalyticsData(
              state,
              action.payload.robotName,
              action.payload.sessionId
            )
            return Promise.resolve(
              instrData
                ? {
                    name: `${instrData.sessionType}TipRackSelect`,
                    properties: {
                      pipetteModel: instrData.pipetteModel,
                      // @ts-expect-error TODO: use in operator and add test case for no tiprackDefiniton on CommandData
                      tipRackDisplayName: commandData.tiprackDefinition
                        ? // @ts-expect-error TODO: use in operator and add test case for no tiprackDefiniton on CommandData
                          commandData.tiprackDefinition.metadata.displayName
                        : null,
                    },
                  }
                : null
            )
          } else {
            return Promise.resolve(null)
          }
        default:
          return Promise.resolve(null)
      }
    }

    case Alerts.ALERT_DISMISSED: {
      const { alertId, remember } = action.payload

      if (alertId === Alerts.ALERT_APP_UPDATE_AVAILABLE) {
        return Promise.resolve({
          name: EVENT_APP_UPDATE_DISMISSED,
          properties: { updatesIgnored: remember },
        })
      }

      return Promise.resolve(null)
    }

    case Constants.ANALYTICS_PIPETTE_OFFSET_STARTED: {
      return Promise.resolve({
        name: 'pipetteOffsetCalibrationStarted',
        properties: {
          ...action.payload,
          ...getAnalyticsPipetteCalibrationData(
            state,
            action.payload.mount as Mount
          ),
        },
      })
    }

    case Constants.ANALYTICS_TIP_LENGTH_STARTED: {
      return Promise.resolve({
        name: 'tipLengthCalibrationStarted',
        properties: {
          ...action.payload,
          ...getAnalyticsTipLengthCalibrationData(
            state,
            action.payload.mount as Mount
          ),
        },
      })
    }

    case RobotAdmin.RESET_CONFIG: {
      const { resets } = action.payload
      return Promise.resolve({
        name: 'resetRobotConfig',
        properties: { ...resets },
      })
    }
  }

  return Promise.resolve(null)
}
