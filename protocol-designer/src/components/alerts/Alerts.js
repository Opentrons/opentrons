// @flow
import assert from 'assert'
import * as React from 'react'

import { PDAlert } from './PDAlert'
import type { AlertData, AlertType } from './types'

/* TODO:  BC 2018-09-13 this component is an abstraction that is meant to be shared for timeline
 * and form level alerts. Currently it is being used in TimelineAlerts, but it should be used in
 * FormAlerts as well. This change will also include adding form level alert copy to i18n
 * see #1814 for reference
 */

export type Props = {
  errors: Array<AlertData>,
  warnings: Array<AlertData>,
  dismissWarning: string => mixed,
}

type MakeAlert = (
  alertType: AlertType,
  data: AlertData,
  key: number | string
) => React.Node

const AlertsComponent = (props: Props) => {
  const makeHandleCloseWarning = (dismissId: ?string) => () => {
    assert(dismissId, 'expected dismissId, Alert cannot dismiss warning')
    if (dismissId) {
      props.dismissWarning(dismissId)
    }
  }

  const makeAlert: MakeAlert = (alertType, data, key) => (
    <PDAlert
      alertType={alertType}
      title={data.title}
      description={data.description}
      key={`${alertType}:${key}`}
      onDismiss={
        alertType === 'warning' ? makeHandleCloseWarning(data.dismissId) : null
      }
    />
  )

  return (
    <>
      {props.errors.map((error, key) => makeAlert('error', error, key))}
      {props.warnings.map((warning, key) => makeAlert('warning', warning, key))}
    </>
  )
}

export const Alerts: React.AbstractComponent<Props> = React.memo(
  AlertsComponent
)
