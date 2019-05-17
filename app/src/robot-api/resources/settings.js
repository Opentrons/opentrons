// @flow
// settings endpoints and client state
import { combineEpics } from 'redux-observable'

import {
  getRobotApiState,
  getRobotApiRequestState,
  createBaseRobotApiEpic,
  passRobotApiResponseAction,
  GET,
  POST,
  PATCH,
} from '../utils'

import type { State as AppState, Action, ActionLike } from '../../types'
import type { RobotHost, RobotApiAction, RobotApiRequestState } from '../types'
import type {
  SettingsState as State,
  RobotSettings,
  PipetteSettings,
  RobotSettingsFieldUpdate,
  PipetteSettingsUpdate,
} from './types'

const INITIAL_STATE: State = { robot: [], pipettesById: {} }

export const SETTINGS_PATH = '/settings'
export const PIPETTE_SETTINGS_PATH = '/settings/pipettes'
const makePipetteSettingsPath = (id: string) => `${PIPETTE_SETTINGS_PATH}/${id}`

export const FETCH_SETTINGS: 'robotApi:FETCH_SETTINGS' =
  'robotApi:FETCH_SETTINGS'

export const SET_SETTINGS: 'robotApi:SET_SETTINGS' = 'robotApi:SET_SETTINGS'

export const FETCH_PIPETTE_SETTINGS: 'robotApi:FETCH_PIPETTE_SETTINGS' =
  'robotApi:FETCH_PIPETTE_SETTINGS'

export const SET_PIPETTE_SETTINGS: 'robotApi:SET_PIPETTE_SETTINGS' =
  'robotApi:SET_PIPETTE_SETTINGS'

export const fetchSettings = (host: RobotHost): RobotApiAction => ({
  type: FETCH_SETTINGS,
  payload: { host, method: GET, path: SETTINGS_PATH },
})

export const fetchPipetteSettings = (host: RobotHost): RobotApiAction => ({
  type: FETCH_PIPETTE_SETTINGS,
  payload: { host, method: GET, path: PIPETTE_SETTINGS_PATH },
})

export const setSettings = (
  host: RobotHost,
  body: RobotSettingsFieldUpdate
): RobotApiAction => ({
  type: SET_SETTINGS,
  payload: { host, body, method: POST, path: SETTINGS_PATH },
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

export const fetchSettingsEpic = createBaseRobotApiEpic(FETCH_SETTINGS)
export const setSettingsEpic = createBaseRobotApiEpic(SET_SETTINGS)
export const fetchPipetteSettingsEpic = createBaseRobotApiEpic(
  FETCH_PIPETTE_SETTINGS
)
export const setPipetteSettingsEpic = createBaseRobotApiEpic(
  SET_PIPETTE_SETTINGS
)

export const settingsEpic = combineEpics(
  fetchSettingsEpic,
  setSettingsEpic,
  fetchPipetteSettingsEpic,
  setPipetteSettingsEpic
)

export function settingsReducer(
  state: State = INITIAL_STATE,
  action: ActionLike
): State {
  const resAction = passRobotApiResponseAction(action)

  if (resAction) {
    const { payload, meta } = resAction
    const { method, path, body } = payload

    // grabs responses from GET /settings and POST /settings
    // settings in body check is a guard against an old version of GET /settings
    if (path === SETTINGS_PATH && 'settings' in body) {
      return { ...state, robot: body.settings }
    }

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

export function getRobotSettingsState(
  state: AppState,
  robotName: string
): RobotSettings {
  const robotState = getRobotApiState(state, robotName)

  return robotState?.resources.settings.robot || []
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
