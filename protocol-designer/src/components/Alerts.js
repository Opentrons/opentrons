// @flow
import * as React from 'react'
import {AlertItem} from '@opentrons/components'
import type {CommandCreatorError, CommandCreatorWarning} from '../step-generation'

type Props = {
  captions: {[warningOrErrorType: string]: string},
  alerts: Array<CommandCreatorError | {
    ...CommandCreatorWarning,
    dismissId?: string // presence of dismissId allows alert to be dismissed
  }>,
  dismissWarning: (mixed) => void
}

class Alerts extends React.Component<Props> {
  makeHandleCloseWarning = (warning) => () => {this.props.dismissWarning(warning)}
  render(){
    return (
      <div>
        {props.alerts.map((alert, key) =>
          <AlertItem
            type='warning'
            key={key}
            title={alert.message}
            onCloseClick={alert.dismissId ? this.makeHandleCloseWarning(alert.dismissId) : undefined } >
            {props.captions[alert.type]}
          </AlertItem>)
        }
      </div>
    )
  }
}

export default Alerts
