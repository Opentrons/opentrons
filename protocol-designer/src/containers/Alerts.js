// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {selectors as fileDataSelectors} from '../file-data'
import {selectors as steplistSelectors} from '../steplist'
import {AlertItem} from '@opentrons/components'
import type {BaseState} from '../types'
import type {CommandCreatorError, CommandCreatorWarning} from '../step-generation'

type SP = {
  alerts: Array<CommandCreatorError | {
    ...CommandCreatorWarning,
    dismissId?: string // presence of dismissId allows alert to be dismissed
  }>
}

type DP = {
  onDismiss: (id: string) => () => mixed
}

type Props = SP & DP

// These captions populate the AlertItem body, the title/message
// comes from the CommandCreatorError / CommandCreatorWarning
const captions: {[warningOrErrorType: string]: string} = {
  'INSUFFICIENT_TIPS': 'Add another tip rack to an empty slot in Deck Setup',
  'ASPIRATE_MORE_THAN_WELL_CONTENTS': 'You are trying to aspirate more than the current volume of one of your well(s). If you intended to add air to your tip, please use the Air Gap advanced setting.'
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
  const timeline = fileDataSelectors.robotStateTimeline(state)
  const warningsPerStep = fileDataSelectors.warningsPerStep(state)
  const selectedStepId = steplistSelectors.selectedStepId(state)

  const {errors} = timeline
  const rawWarnings = (
    // hide warnings without explicit FEATURE FLAG
    process.env.OT_PD_SHOW_WARNINGS === 'true' &&
    // show warnings only for the selected step
    selectedStepId &&
    warningsPerStep[selectedStepId]
  ) || []

  const warnings = rawWarnings.map(warning => ({
    ...warning,
    // TODO Ian 2018-06-14 once warning dismissal is actually implemented,
    // the dismiss ID will probably have more info than just the type.
    // This is a placeholder.
    dismissId: warning.type
  }))

  let alerts = errors ? [...errors, ...warnings] : warnings

  return {
    alerts
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    onDismiss: (id: string) => () => console.log('dismiss warning here', id)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Alerts)
