import { of } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import * as Actions from '../actions'

import type { Action, Epic } from '../../types'
import type { ConnectAction } from '../../robot/actions'

export const fetchPipettesOnConnectEpic: Epic = action$ => {
  return action$.pipe(
    ofType<Action, ConnectAction>('robot:CONNECT'),
    switchMap(action =>
      of(
        Actions.fetchPipettes(action.payload.name),
        Actions.fetchPipetteSettings(action.payload.name)
      )
    )
  )
}
