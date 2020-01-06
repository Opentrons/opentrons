// @flow
import { ofType } from 'redux-observable'

import { POST } from '../../robot-api'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { StrictEpic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { UpdateSettingAction, UpdateSettingDoneAction } from '../types'

const mapActionToRequest: ActionToRequestMapper<UpdateSettingAction> = action => ({
  method: POST,
  path: Constants.SETTINGS_PATH,
  body: { id: action.payload.settingId, value: action.payload.value },
})

const mapResponseToAction: ResponseToActionMapper<
  UpdateSettingAction,
  UpdateSettingDoneAction
> = (response, originalAction) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.updateSettingSuccess(
        host.name,
        body.settings,
        body.links?.restart || null,
        meta
      )
    : Actions.updateSettingFailure(host.name, body, meta)
}

export const updateSettingEpic: StrictEpic<UpdateSettingDoneAction> = (
  action$,
  state$
) => {
  return action$.pipe(
    ofType(Constants.UPDATE_SETTING),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
