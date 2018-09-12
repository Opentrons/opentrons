// @flow
import * as React from 'react'
import {AlertItem} from '@opentrons/components'
import type {CommandCreatorError, CommandCreatorWarning} from '../step-generation'

type Props = {
  captions: {[warningOrErrorType: string]: string},
  alerts: Array<CommandCreatorError | {
    ...CommandCreatorWarning,
    dismissId?: string, // presence of dismissId allows alert to be dismissed
  }>,
  onDismiss: (id: string) => () => mixed,
}
// TODO: BC 2018-07-09 refactor this to class component using FormAlerts as a model

function Alerts (props: Props) {
  return (
    <div>
      {props.alerts.map((alert, key) =>
        <AlertItem
          type='warning'
          key={key}
          title={alert.message}
          onCloseClick={alert.dismissId
            ? props.onDismiss(alert.dismissId)
            : undefined
          }
        >
          {props.captions[alert.type]}
        </AlertItem>)
      }
    </div>
  )
}

export default Alerts
