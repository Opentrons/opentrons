import { map } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import * as Actions from '../actions'

import type { Action, Epic } from '../../../types'
import type { ConnectAction } from '../../../robot'

export const fetchPipetteOffsetCalibrationsOnConnectEpic: Epic = action$ => {
  return action$.pipe(
    ofType<Action, ConnectAction>('robot:CONNECT'),
    map(action => Actions.fetchPipetteOffsetCalibrations(action.payload.name))
  )
}
