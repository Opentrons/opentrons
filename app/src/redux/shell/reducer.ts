import { combineReducers } from 'redux'

import { robotSystemReducer } from './is-ready/reducer'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type {
  ShellState,
  ShellUpdateState,
  StepDetailViewerClosedState,
} from './types'

const INITIAL_STATE: ShellUpdateState = {
  checking: false,
  downloading: false,
  available: false,
  downloaded: false,
  downloadPercentage: 0,
  info: null,
  error: null,
}

// TODO(mc, 2020-01-07): move robot logs to own module and make this the root shell reducer
export function shellUpdateReducer(
  state: ShellUpdateState = INITIAL_STATE,
  action: Action
): ShellUpdateState {
  switch (action.type) {
    case 'shell:CHECK_UPDATE': {
      return { ...state, checking: true, error: null }
    }

    case 'shell:CHECK_UPDATE_RESULT': {
      return { ...state, ...action.payload, checking: false }
    }

    case 'shell:DOWNLOAD_UPDATE': {
      return { ...state, downloading: true, error: null }
    }

    case 'shell:DOWNLOAD_UPDATE_RESULT': {
      return {
        ...state,
        downloading: false,
        error: action.payload.error || null,
        downloaded: action.payload.error == null,
      }
    }
    case 'shell:DOWNLOAD_PERCENTAGE': {
      return {
        ...state,
        downloadPercentage: action.payload.percent,
      }
    }
  }

  return state
}

export function massStorageReducer(
  state = [] as string[],
  action: Action
): string[] {
  switch (action.type) {
    case 'shell:SEND_FILE_PATHS':
      return action.payload.filePaths
  }
  return state
}

export function usbMountPathsReducer(
  state = [] as string[],
  action: Action
): string[] {
  switch (action.type) {
    case 'shell:ROBOT_MASS_STORAGE_DEVICE_ADDED':
      return state.includes(action.payload.rootPath)
        ? state
        : [...state, action.payload.rootPath]
    case 'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED':
      return state.filter(p => p !== action.payload.rootPath)
  }
  return state
}

export function systemLanguageReducer(
  state: string[] | null = null,
  action: Action
): string[] | null {
  switch (action.type) {
    case 'shell:SYSTEM_LANGUAGE':
      return action.payload.systemLanguage
  }
  return state
}

export function stepDetailViewerClosedReducer(
  state: StepDetailViewerClosedState = null,
  action: Action
): StepDetailViewerClosedState {
  switch (action.type) {
    case 'shell:STEP_DETAIL_VIEWER_CLOSED':
      return {
        protocolKey: action.payload.protocolKey,
        closedAt: Date.now(),
      }
  }

  return state
}

interface ShellReducerMap {
  update: Reducer<ShellUpdateState, Action>
  isReady: Reducer<boolean, Action>
  filePaths: Reducer<string[], Action>
  usbMountPaths: Reducer<string[], Action>
  systemLanguage: Reducer<string[] | null, Action>
  stepDetailViewerClosed: Reducer<StepDetailViewerClosedState, Action>
}

const reducers: ShellReducerMap = {
  update: shellUpdateReducer,
  isReady: robotSystemReducer as Reducer<boolean, Action>,
  filePaths: massStorageReducer,
  usbMountPaths: usbMountPathsReducer,
  systemLanguage: systemLanguageReducer,
  stepDetailViewerClosed: stepDetailViewerClosedReducer,
}

export const shellReducer: Reducer<ShellState, Action> = (
  state: ShellState | undefined,
  action: Action
): ShellState => {
  const combinedReducer = combineReducers(reducers)
  return combinedReducer(state, action)
}
