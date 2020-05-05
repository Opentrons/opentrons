// @flow
import { map, mapTo, filter } from 'rxjs/operators'

import * as Alerts from '../alerts'
import { OUTDATED } from './constants'
import { getU2EAdapterDevice } from './selectors'
import { getDriverStatus } from './utils'

import type { Epic } from '../types'
import type { UsbDevice } from './types'
export const systemInfoEpic: Epic = (_, state$) => {
  return state$.pipe(
    map(getU2EAdapterDevice),
    filter<UsbDevice | null, UsbDevice>(
      d => d !== null && getDriverStatus(d) === OUTDATED
    ),
    mapTo(Alerts.alertTriggered(Alerts.ALERT_U2E_DRIVER_OUTDATTED))
  )
}
