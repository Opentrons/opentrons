// redux action types to analytics events map
import {actionTypes as robotActionTypes} from '../robot'

const CATEGORY_ROBOT = 'robot'

const eventsMap = {
  [robotActionTypes.CONNECT_RESPONSE]: (state, action) => ({
    name: 'connect',
    category: CATEGORY_ROBOT,
    payload: {}
  })
}

export default eventsMap
