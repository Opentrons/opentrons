// @flow
import { filter, withLatestFrom } from 'rxjs/operators'
import union from 'lodash/union'

import { getConfig, updateConfig } from '../config'
import { ALERT_DISMISSED } from './constants'

import type { Epic } from '../types'

export const alertsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    filter(a => a.type === ALERT_DISMISSED && a.payload.remember),
    withLatestFrom(state$, (dismissAction, state) => {
      const { alertId } = dismissAction.payload
      const ignored = getConfig(state).alerts.ignored

      return updateConfig('alerts.ignored', union(ignored, [alertId]))
    })
  )
}
