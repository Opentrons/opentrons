// robot state module
// split up into reducer.js, action.js, etc if / when necessary
import api from './api-client'
import ROBOT_NAME from './name'

export const NAME = ROBOT_NAME

export {reducer, selectors, constants} from './reducer'

export {actions, actionTypes} from './actions'

export const apiClientMiddleware = api
