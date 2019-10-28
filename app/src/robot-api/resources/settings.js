// @flow
// settings endpoints and client state
import { of } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { combineEpics, ofType } from 'redux-observable'

import {
  getRobotApiState,
  getRobotApiRequestState,
  createBaseRobotApiEpic,
  passRobotApiResponseAction,
  GET,
  PATCH,
} from '../utils'

import { fetchPipettes } from './pipettes'

import type { State as AppState, Action, ActionLike, Epic } from '../../types'
import type { RobotHost, RobotApiAction, RobotApiRequestState } from '../types'
import type {
  SettingsState as State,
  PipetteSettings,
  PipetteSettingsUpdate,
} from './types'

const INITIAL_STATE: State = { pipettesById: {} }

export const PIPETTE_SETTINGS_PATH = '/settings/pipettes'
const makePipetteSettingsPath = (id: string) => `${PIPETTE_SETTINGS_PATH}/${id}`

export const FETCH_PIPETTE_SETTINGS: 'robotApi:FETCH_PIPETTE_SETTINGS' =
  'robotApi:FETCH_PIPETTE_SETTINGS'

export const SET_PIPETTE_SETTINGS: 'robotApi:SET_PIPETTE_SETTINGS' =
  'robotApi:SET_PIPETTE_SETTINGS'

export const fetchPipetteSettings = (host: RobotHost): RobotApiAction => ({
  type: FETCH_PIPETTE_SETTINGS,
  payload: { host, method: GET, path: PIPETTE_SETTINGS_PATH },
})

export const setPipetteSettings = (
  host: RobotHost,
  id: string,
  body: PipetteSettingsUpdate,
  onSuccess?: Action
): RobotApiAction => ({
  type: SET_PIPETTE_SETTINGS,
  payload: { host, body, method: PATCH, path: makePipetteSettingsPath(id) },
  meta: { id },
})

const fetchPipetteSettingsEpic = createBaseRobotApiEpic(FETCH_PIPETTE_SETTINGS)
const setPipetteSettingsEpic = createBaseRobotApiEpic(SET_PIPETTE_SETTINGS)

// if we're fetching pipette settings, we're going to need to know what
// pipettes are attached, too
const fetchPipettesForSettingsEpic: Epic = action$ =>
  action$.pipe(
    ofType(FETCH_PIPETTE_SETTINGS),
    switchMap<RobotApiAction, _, RobotApiAction>(a =>
      of(fetchPipettes(a.payload.host))
    )
  )

export const settingsEpic = combineEpics(
  fetchPipetteSettingsEpic,
  setPipetteSettingsEpic,
  fetchPipettesForSettingsEpic
)

export function settingsReducer(
  state: State = INITIAL_STATE,
  action: ActionLike
): State {
  const resAction = passRobotApiResponseAction(action)

  if (resAction) {
    const { payload, meta } = resAction
    const { method, path, body } = payload

    // grabs responses from GET /settings/pipettes
    if (path === PIPETTE_SETTINGS_PATH) {
      return { ...state, pipettesById: body }
    }

    // grabs responses from PATCH /settings/pipettes/:id
    if (
      method === PATCH &&
      path.startsWith(PIPETTE_SETTINGS_PATH) &&
      typeof meta.id === 'string'
    ) {
      return {
        ...state,
        pipettesById: {
          ...state.pipettesById,
          [meta.id]: { ...state.pipettesById[meta.id], fields: body.fields },
        },
      }
    }
  }

  return state
}

export function getPipetteSettingsState(
  state: AppState,
  robotName: string,
  id: string
): PipetteSettings | null {
  const robotState = getRobotApiState(state, robotName)

  return robotState?.resources.settings.pipettesById[id] || null
}

export function getSetPipetteSettingsRequestState(
  state: AppState,
  robotName: string,
  id: string
): RobotApiRequestState | null {
  const path = makePipetteSettingsPath(id)
  return getRobotApiRequestState(state, robotName, path)
}
