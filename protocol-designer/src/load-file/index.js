// @flow
import rootReducer, {type RootState} from './reducers'
import * as actions from './actions'
import * as selectors from './selectors'
export * from './types'

const {loadFile, LOAD_FILE} = actions
type LoadFileAction = actions.LoadFileAction

export {
  actions,
  rootReducer,
  selectors,
  // redundant top-level exports for importer's convenience
  loadFile,
  LOAD_FILE
}

export type {
  RootState,
  LoadFileAction
}
