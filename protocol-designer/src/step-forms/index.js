// @flow
import { registerSelectors } from '../utils'
import { rootReducer } from './reducers'
import type { RootState } from './reducers'
import * as selectors from './selectors'
import * as actions from './actions'
export * from './utils'
export * from './types'

export type { RootState }

registerSelectors(selectors)

export { rootReducer, actions, selectors }
