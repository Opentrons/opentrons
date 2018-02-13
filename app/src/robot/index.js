// @flow
// robot state module
// split up into reducer.js, action.js, etc if / when necessary
import reducer from './reducer'
import * as selectors from './selectors'
import * as constants from './constants'
import apiClientMiddleware from './api-client'

export type {Action} from './actions'

export * from './types'
export {_NAME as NAME} from './constants'
export {actions, actionTypes} from './actions'
export {constants, reducer, selectors, apiClientMiddleware}
