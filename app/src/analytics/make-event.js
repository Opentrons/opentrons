// @flow
// redux action types to analytics events map
import createLogger from '../logger'
import {selectors as robotSelectors} from '../robot'
import {getConnectedRobot} from '../discovery'
import {getProtocolAnalyticsData, getRobotAnalyticsData} from './selectors'

import type {State, Action} from '../types'
import type {AnalyticsEvent} from './types'

const log = createLogger(__filename)

export default function makeEvent (
  action: Action,
  nextState: State,
  prevState: State
): null | AnalyticsEvent | Promise<AnalyticsEvent | null> {
  switch (action.type) {
    case 'robot:CONNECT_RESPONSE':
      const robot = getConnectedRobot(nextState)

      if (!robot) {
        log.warn('No robot found for connect response')
        return null
      }

      return {
        name: 'robotConnect',
        properties: {
          success: !action.payload.error,
          method: robot.local ? 'usb' : 'wifi',
          error: (action.payload.error && action.payload.error.message) || '',
        },
      }

    // TODO (ka, 2018-6-6): add file open type 'button' | 'drag-n-drop' (work required in action meta)
    case 'protocol:UPLOAD': {
      return getProtocolAnalyticsData(nextState).then(data => ({
        name: 'protocolUploadRequest',
        properties: {
          ...data,
          ...getRobotAnalyticsData(nextState),
        },
      }))
    }

    case 'robot:SESSION_RESPONSE':
    case 'robot:SESSION_ERROR': {
      // only fire event if we had a protocol upload in flight; we don't want
      // to fire if user connects to robot with protocol already loaded
      if (!prevState.robot.session.sessionRequest.inProgress) return null
      const {type: actionType, payload: actionPayload} = action

      return getProtocolAnalyticsData(nextState).then(data => ({
        name: 'protocolUploadResponse',
        properties: {
          ...data,
          ...getRobotAnalyticsData(nextState),
          success: actionType === 'robot:SESSION_RESPONSE',
          error: (actionPayload.error && actionPayload.error.message) || '',
        },
      }))
    }

    // $FlowFixMe(mc, 2018-05-28): flow type robot:RUN
    case 'robot:RUN': {
      return getProtocolAnalyticsData(nextState).then(data => ({
        name: 'runStart',
        properties: {
          ...data,
          ...getRobotAnalyticsData(nextState),
        },
      }))
    }

    // TODO(mc, 2019-01-22): we only get this event if the user keeps their app
    // open for the entire run. Fixing this is blocked until we can fix
    // session.stop from triggering a run error
    // $FlowFixMe(mc, 2018-05-28): flow type robot:RUN_RESPONSE
    case 'robot:RUN_RESPONSE': {
      const runTime = robotSelectors.getRunSeconds(nextState)
      const success = !action.error
      const error = action.error ? action.payload.message || '' : ''

      return getProtocolAnalyticsData(nextState).then(data => ({
        name: 'runFinish',
        properties: {
          ...data,
          ...getRobotAnalyticsData(nextState),
          runTime,
          success,
          error,
        },
      }))
    }

    // $FlowFixMe(ka, 2018-06-5): flow type robot:PAUSE
    case 'robot:PAUSE': {
      const runTime = robotSelectors.getRunSeconds(nextState)

      return getProtocolAnalyticsData(nextState).then(data => ({
        name: 'runPause',
        properties: {...data, runTime},
      }))
    }

    // $FlowFixMe(ka, 2018-06-5): flow type robot:RESUME
    case 'robot:RESUME': {
      const runTime = robotSelectors.getRunSeconds(nextState)

      return getProtocolAnalyticsData(nextState).then(data => ({
        name: 'runResume',
        properties: {...data, runTime},
      }))
    }

    // $FlowFixMe(ka, 2018-06-5): flow type robot:CANCEL
    case 'robot:CANCEL':
      const runTime = robotSelectors.getRunSeconds(nextState)

      return getProtocolAnalyticsData(nextState).then(data => ({
        name: 'runCancel',
        properties: {...data, runTime},
      }))
  }

  return null
}
