import * as React from 'react'
import assert from 'assert'
import { PDAlert } from './PDAlert'
import { AlertData, AlertType } from './types'

/* TODO:  BC 2018-09-13 this component is an abstraction that is meant to be shared for timeline
 * and form level alerts. Currently it is being used in TimelineAlerts, but it should be used in
 * FormAlerts as well. This change will also include adding form level alert copy to i18n
 * see #1814 for reference
 */

export interface Props {
  errors: AlertData[]
  warnings: AlertData[]
  dismissWarning: (val: string) => unknown
}

type MakeAlert = (
  alertType: AlertType,
  data: AlertData,
  key: number | string
) => JSX.Element

const AlertsComponent = (props: Props): JSX.Element => {
  const makeHandleCloseWarning = (dismissId?: string | null) => () => {
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

export const Alerts = React.memo(AlertsComponent)
