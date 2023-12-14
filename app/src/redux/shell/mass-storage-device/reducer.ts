import type { Action } from '../../types'
import {
  ROBOT_MASS_STORAGE_DEVICE_ADDED,
  ROBOT_MASS_STORAGE_DEVICE_REMOVED,
} from '../actions'
import { ConnectedMassStorageState } from '../types'

const INITIAL_STATE: ConnectedMassStorageState = {
  rootPaths: new Set(),
}

export function massStorageDeviceReducer(
  state = INITIAL_STATE,
  action: Action
): ConnectedMassStorageState {
  switch (action.type) {
    case ROBOT_MASS_STORAGE_DEVICE_ADDED: {
      const updatedRootPaths = new Set(state.rootPaths)
      updatedRootPaths.add(action.payload.rootPath)
      return {
        ...state,
        rootPaths: updatedRootPaths,
      }
    }
    case ROBOT_MASS_STORAGE_DEVICE_REMOVED: {
      const updatedRootPaths = new Set(state.rootPaths)
      updatedRootPaths.delete(action.payload.rootPath)
      return {
        ...state,
        rootPaths: updatedRootPaths,
      }
    }
  }

  return state
}
