// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {AlertItem} from '@opentrons/components'
import styles from './Alert.css'
import type {BaseState} from '../types'

type ErrorType = string // TODO IMMEDIATELY import enum type

type SP = {
  alerts: Array<{
    type: ErrorType,
    message: string,
    dismissId?: string // presence of dismissId allows alert to be dismissed
  }>
}

type DP = {
  onDismiss: (id: string) => () => mixed
}

type Props = SP & DP

const captions: {[ErrorType]: string} = {
  'TIP': 'Add another tip rack to an empty slot in Deck Setup'
}

function Alerts (props: Props) {
  return (
    <div>
      {props.alerts.map((alert, key) =>
        <AlertItem
          className={styles.alert}
          type='warning'
          key={key}
          title={alert.message}
          onCloseClick={alert.dismissId
            ? props.onDismiss(alert.dismissId)
            : undefined
          }
        >
          {captions[alert.type]}
        </AlertItem>)
      }
    </div>
  )
}

function mapStateToProps (state: BaseState): SP {
  // TODO IMMEDIATELY: use selector
  return {
    alerts: [
      {type: 'TEST', message: 'TEST Message is here', dismissId: '123'},
      {type: 'TIP', message: 'TIP Message is here'},
      {type: 'TEST', message: 'TEST Message is here', dismissId: '123'},
      {type: 'TEST', message: 'TEST Message is here', dismissId: '123'}
    ]
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    onDismiss: (id: string) => () => console.log('dismiss warning here', id)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Alerts)
