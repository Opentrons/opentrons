// @flow
import { filter, map, mapTo, pairwise } from 'rxjs/operators'

import * as Alerts from '../alerts'
import type { Epic } from '../types'
import { OUTDATED } from './constants'
import { getU2EWindowsDriverStatus } from './selectors'

// dispatch an outdated alert action if the U2E Windows driver status changes
// and the value that it changes to is OUTDATED
export const systemInfoEpic: Epic = (_, state$) => {
  return state$.pipe(
    map(getU2EWindowsDriverStatus),
    pairwise(),
    filter(([prev, next]) => next !== prev && next === OUTDATED),
    mapTo(Alerts.alertTriggered(Alerts.ALERT_U2E_DRIVER_OUTDATED))
  )
}
