// @flow
import { filter, withLatestFrom } from 'rxjs/operators'
import union from 'lodash/union'

import { getConfig, updateConfig } from '../config'
import { ALERT_DISMISSED } from './constants'

import type { Action, Epic } from '../types'
import type { AlertDismissedAction } from './types'

// dispatch an updateConfig action to add the alertId to the permanent ignore
// list in config if an ALERT_DISMISSED action comes in with remember: true
export const alertsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    filter<Action, AlertDismissedAction>(
      a => a.type === ALERT_DISMISSED && a.payload.remember
    ),
    // TODO(mc, 2020-05-06): we need to pull in state here because we don't
    // have a config update action to append a value to an array config. We
    // have several array config values, so we should have an append action
    withLatestFrom(state$, (dismissAction, state) => {
      const { alertId } = dismissAction.payload
      const ignored = getConfig(state).alerts.ignored

      return updateConfig('alerts.ignored', union(ignored, [alertId]))
    })
  )
}
