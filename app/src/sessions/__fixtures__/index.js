// @flow

import * as Types from '../types'
import * as Constants from '../constants'



export const mockRobotSessionData : Types.RobotSessionData = {
  sessionType: 'check',
  sessionId: '1234',
  meta: {someData: 5}
}

export const mockRobotSessionUpdate : Types.RobotSessionUpdate = {
  commandType: 'dosomething',
  payload: {someData: 32}
}

export const mockRobotSessionUpdateData : RobotSessionUpdateData = {
  commandId: '4321',
  status: 'accepted',
  meta: {
    sessionType: 'check',
    sessionId: '1234',
    meta: {
      someData: 15,
      someOtherData: 'hi',
    },
  }
}
