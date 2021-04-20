// @flow
import * as React from 'react'
import assert from 'assert'
import { PDAlert } from './PDAlert'
import type { AlertData, AlertType } from './types'

export type Props = {|
  errors: Array<AlertData>,
  warnings: Array<AlertData>,
  dismissWarning?: string => mixed,
|}

type MakeAlert = (
  alertType: AlertType,
  data: AlertData,
  key: number | string
) => React.Node

const AlertsComponent = (props: Props) => {
  const makeHandleCloseWarning = (dismissId: ?string) => () => {
    assert(
      dismissId && props.dismissWarning,
      'expected dismissId and dismissWarning, Alert cannot dismiss warning'
    )
    if (dismissId && props.dismissWarning) {
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
