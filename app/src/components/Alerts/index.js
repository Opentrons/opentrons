// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import head from 'lodash/head'

import * as AppAlerts from '../../alerts'
import { LostConnectionAlert } from '../LostConnectionAlert'
import { AnalyticsSettingsModal } from '../analytics-settings'
import { U2EDriverOutdatedAlert } from './U2EDriverOutdatedAlert'

import type { State, Dispatch } from '../../types'
import type { AlertId } from '../../alerts/types'

export function Alerts(): React.Node {
  const dispatch = useDispatch<Dispatch>()

  // TODO(mc, 2020-05-07): move head logic to selector with alert priorities
  const activeAlert: AlertId | null = useSelector((state: State) => {
    return head(AppAlerts.getActiveAlerts(state)) ?? null
  })

  const dismissAlert = remember => {
    if (activeAlert) {
      dispatch(AppAlerts.alertDismissed(activeAlert, remember))
    }
  }

  return (
    <>
      {/* TODO(mc, 2020-05-07): LostConnectionAlert currently controls its own
          render; move its logic into `state.alerts` */}
      <LostConnectionAlert />
      {/* TODO(mc, 2020-05-07): AnalyticsSettingsModal currently controls its
          own render; move its logic into `state.alerts` */}
      <AnalyticsSettingsModal />

      {activeAlert === AppAlerts.ALERT_U2E_DRIVER_OUTDATED ? (
        <U2EDriverOutdatedAlert dismissAlert={dismissAlert} />
      ) : null}
    </>
  )
}
