// @flow
import { filter, map } from 'rxjs/operators'

import { addUniqueConfigValue } from '../config'
import type { Action, Epic } from '../types'
import { ALERT_DISMISSED } from './constants'

import type { AlertDismissedAction } from './types'

// dispatch an updateConfig action to add the alertId to the permanent ignore
// list in config if an ALERT_DISMISSED action comes in with remember: true
export const alertsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    filter<Action, AlertDismissedAction>(
      a => a.type === ALERT_DISMISSED && a.payload.remember
    ),
    map(dismissAction => {
      return addUniqueConfigValue(
        'alerts.ignored',
        dismissAction.payload.alertId
      )
    })
  )
}
