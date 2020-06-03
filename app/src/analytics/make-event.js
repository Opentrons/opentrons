// @flow
// redux action types to analytics events map
import { createLogger } from '../logger'
import { selectors as robotSelectors } from '../robot'
import { getConnectedRobot } from '../discovery'
import * as CustomLabware from '../custom-labware'
import * as SystemInfo from '../system-info'
import * as brActions from '../buildroot/constants'
import * as Sessions from '../sessions'
import {
  getProtocolAnalyticsData,
  getRobotAnalyticsData,
  getBuildrootAnalyticsData,
} from './selectors'

import type { State, Action } from '../types'
import type { AnalyticsEvent } from './types'

const log = createLogger(__filename)

export function makeEvent(
  action: Action,
  state: State
): Promise<AnalyticsEvent | null> {
  switch (action.type) {
    case 'robot:CONNECT_RESPONSE': {
      const robot = getConnectedRobot(state)

      if (!robot) {
        log.warn('No robot found for connect response')
        return Promise.resolve(null)
      }

      const data = getRobotAnalyticsData(state)

      return Promise.resolve({
        name: 'robotConnect',
        properties: {
          ...data,
          success: !action.payload.error,
          method: robot.local ? 'usb' : 'wifi',
          error: (action.payload.error && action.payload.error.message) || '',
        },
      })
    }

    // TODO (ka, 2018-6-6): add file open type 'button' | 'drag-n-drop' (work required in action meta)
    case 'protocol:UPLOAD': {
      return getProtocolAnalyticsData(state).then(data => ({
        name: 'protocolUploadRequest',
        properties: {
          ...getRobotAnalyticsData(state),
          ...data,
        },
      }))
    }

    case 'robot:SESSION_RESPONSE':
    case 'robot:SESSION_ERROR': {
      // only fire event if we had a protocol upload in flight; we don't want
      // to fire if user connects to robot with protocol already loaded
      const { type: actionType, payload: actionPayload, meta } = action
      if (!meta.freshUpload) return Promise.resolve(null)

      return getProtocolAnalyticsData(state).then(data => ({
        name: 'protocolUploadResponse',
        properties: {
          ...getRobotAnalyticsData(state),
          ...data,
          success: actionType === 'robot:SESSION_RESPONSE',
          error: (actionPayload.error && actionPayload.error.message) || '',
        },
      }))
    }

    case 'robot:RUN': {
      return getProtocolAnalyticsData(state).then(data => ({
        name: 'runStart',
        properties: {
          ...getRobotAnalyticsData(state),
          ...data,
        },
      }))
    }

    // TODO(mc, 2019-01-22): we only get this event if the user keeps their app
    // open for the entire run. Fixing this is blocked until we can fix
    // session.stop from triggering a run error
    case 'robot:RUN_RESPONSE': {
      const runTime = robotSelectors.getRunSeconds(state)
      const success = !action.error
      const error = action.error ? action.payload?.message || '' : ''

      return getProtocolAnalyticsData(state).then(data => ({
        name: 'runFinish',
        properties: {
          ...getRobotAnalyticsData(state),
          ...data,
          runTime,
          success,
          error,
        },
      }))
    }

    case 'robot:PAUSE': {
      const runTime = robotSelectors.getRunSeconds(state)

      return getProtocolAnalyticsData(state).then(data => ({
        name: 'runPause',
        properties: { ...data, runTime },
      }))
    }

    case 'robot:RESUME': {
      const runTime = robotSelectors.getRunSeconds(state)

      return getProtocolAnalyticsData(state).then(data => ({
        name: 'runResume',
        properties: { ...data, runTime },
      }))
    }

    case 'robot:CANCEL':
      const runTime = robotSelectors.getRunSeconds(state)

      return getProtocolAnalyticsData(state).then(data => ({
        name: 'runCancel',
        properties: { ...data, runTime },
      }))

    // buildroot update events
    case brActions.BR_SET_UPDATE_SEEN: {
      const data = getBuildrootAnalyticsData(state, action.meta.robotName)
      return Promise.resolve({
        name: 'robotUpdateView',
        properties: { ...data },
      })
    }

    case brActions.BR_CHANGELOG_SEEN: {
      const data = getBuildrootAnalyticsData(state, action.meta.robotName)
      return Promise.resolve({
        name: 'robotUpdateChangeLogView',
        properties: { ...data },
      })
    }

    case brActions.BR_UPDATE_IGNORED: {
      const data = getBuildrootAnalyticsData(state, action.meta.robotName)
      return Promise.resolve({
        name: 'robotUpdateIgnore',
        properties: { ...data },
      })
    }

    case brActions.BR_START_UPDATE: {
      const data = getBuildrootAnalyticsData(state)
      return Promise.resolve({
        name: 'robotUpdateInitiate',
        properties: { ...data },
      })
    }

    case brActions.BR_UNEXPECTED_ERROR: {
      const data = getBuildrootAnalyticsData(state)
      return Promise.resolve({
        name: 'robotUpdateError',
        properties: { ...data },
      })
    }

    case brActions.BR_SET_SESSION_STEP: {
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
          name: 'addCustomLabware',
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
        name: 'addCustomLabware',
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

    case Sessions.DELETE_SESSION: {
      const { robotName, sessionId } = action.payload
      const analyticsProps = Sessions.getAnalyticsPropsForRobotSessionById(
        state,
        robotName,
        sessionId
      )
      if (analyticsProps) {
        return Promise.resolve({
          name: 'sessionExit',
          properties: analyticsProps,
        })
      } else {
        return Promise.resolve(null)
      }
    }
  }

  return Promise.resolve(null)
}
