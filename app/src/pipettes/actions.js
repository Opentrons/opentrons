// @flow

import type { RobotApiRequestMeta } from '../robot-api/types'
import * as Constants from './constants'
import * as Types from './types'

export const fetchPipettes = (
  robotName: string,
  refresh: boolean = false
): Types.FetchPipettesAction => ({
  type: Constants.FETCH_PIPETTES,
  payload: { robotName, refresh },
  meta: {},
})

export const fetchPipettesSuccess = (
  robotName: string,
  pipettes: Types.FetchPipettesResponseBody,
  meta: RobotApiRequestMeta
): Types.FetchPipettesSuccessAction => ({
  type: Constants.FETCH_PIPETTES_SUCCESS,
  payload: { robotName, pipettes },
  meta,
})

export const fetchPipettesFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.FetchPipettesFailureAction => ({
  type: Constants.FETCH_PIPETTES_FAILURE,
  payload: { robotName, error },
  meta,
})

export const fetchPipetteSettings = (
  robotName: string
): Types.FetchPipetteSettingsAction => ({
  type: Constants.FETCH_PIPETTE_SETTINGS,
  payload: { robotName },
  meta: {},
})

export const fetchPipetteSettingsSuccess = (
  robotName: string,
  settings: Types.PipetteSettingsById,
  meta: RobotApiRequestMeta
): Types.FetchPipetteSettingsSuccessAction => ({
  type: Constants.FETCH_PIPETTE_SETTINGS_SUCCESS,
  payload: { robotName, settings },
  meta,
})

export const fetchPipetteSettingsFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.FetchPipetteSettingsFailureAction => ({
  type: Constants.FETCH_PIPETTE_SETTINGS_FAILURE,
  payload: { robotName, error },
  meta,
})

export const updatePipetteSettings = (
  robotName: string,
  pipetteId: string,
  fields: Types.PipetteSettingsFieldsUpdate
): Types.UpdatePipetteSettingsAction => ({
  type: Constants.UPDATE_PIPETTE_SETTINGS,
  payload: { robotName, pipetteId, fields },
  meta: {},
})

export const updatePipetteSettingsSuccess = (
  robotName: string,
  pipetteId: string,
  fields: Types.PipetteSettingsFieldsMap,
  meta: RobotApiRequestMeta
): Types.UpdatePipetteSettingsSuccessAction => ({
  type: Constants.UPDATE_PIPETTE_SETTINGS_SUCCESS,
  payload: { robotName, pipetteId, fields },
  meta,
})

export const updatePipetteSettingsFailure = (
  robotName: string,
  pipetteId: string,
  error: {},
  meta: RobotApiRequestMeta
): Types.UpdatePipetteSettingsFailureAction => ({
  type: Constants.UPDATE_PIPETTE_SETTINGS_FAILURE,
  payload: { robotName, pipetteId, error },
  meta,
})
