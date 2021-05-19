import { filter, map } from 'rxjs/operators'

import { alertPermanentlyIgnored } from './actions'
import { ALERT_DISMISSED } from './constants'

import type { Action, Epic } from '../types'
import type { AlertDismissedAction } from './types'

// dispatch an updateConfig action to add the alertId to the permanent ignore
// list in config if an ALERT_DISMISSED action comes in with remember: true
export const alertsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    filter<Action, AlertDismissedAction>(
      (a: Action): a is AlertDismissedAction =>
        a.type === ALERT_DISMISSED && a.payload.remember
    ),
    map(dismiss => alertPermanentlyIgnored(dismiss.payload.alertId))
  )
}
