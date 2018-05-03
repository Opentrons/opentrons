// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {selectors} from '../file-data'
import {AlertItem} from '@opentrons/components'
import type {BaseState} from '../types'
import type {ErrorType, CommandCreatorError} from '../step-generation'

type SP = {
  alerts: Array<{
    ...CommandCreatorError,
    dismissId?: string // presence of dismissId allows alert to be dismissed
  }>
}

type DP = {
  onDismiss: (id: string) => () => mixed
}

type Props = SP & DP

const captions: {[ErrorType]: string} = {
  'INSUFFICIENT_TIPS': 'Add another tip rack to an empty slot in Deck Setup'
}

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
          {captions[alert.type]}
        </AlertItem>)
      }
    </div>
  )
}

function mapStateToProps (state: BaseState): SP {
  const timelineFull = selectors.robotStateTimelineFull(state)
  const errors = timelineFull.timelineErrors

  if (!errors || errors.length === 0) {
    return {
      alerts: []
    }
  }

  return {
    alerts: errors.map(err => ({...err})) // NOTE Flow complains about exact obj types if you don't map & unpack here

    // TODO LATER Ian 2018-05-01 generate warnings somewhere, and merge in here with dismissId's
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    onDismiss: (id: string) => () => console.log('dismiss warning here', id)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Alerts)
