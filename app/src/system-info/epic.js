// @flow
import { map, mapTo, pairwise, filter } from 'rxjs/operators'

import * as Alerts from '../alerts'
import { OUTDATED } from './constants'
import { getU2EWindowsDriverStatus } from './selectors'

import type { Epic } from '../types'

export const systemInfoEpic: Epic = (_, state$) => {
  return state$.pipe(
    map(getU2EWindowsDriverStatus),
    pairwise(),
    filter(([prev, next]) => next !== prev && next === OUTDATED),
    mapTo(Alerts.alertTriggered(Alerts.ALERT_U2E_DRIVER_OUTDATED))
  )
}
