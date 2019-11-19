// @flow

import * as Constants from './constants'
import * as Types from './types'

import type { RobotApiRequestMeta } from '../robot-api/types'

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
  pipettes: Types.AttachedPipettesByMount,
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
