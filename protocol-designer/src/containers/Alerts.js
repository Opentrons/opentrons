// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {actions as dismissActions, selectors as dismissSelectors, type DismissInfo} from '../dismiss'
import {selectors as fileDataSelectors} from '../file-data'
import {AlertItem} from '@opentrons/components'
import type {BaseState} from '../types'
import type {CommandCreatorError} from '../step-generation'

type SP = {
  errors: Array<CommandCreatorError>,
  warnings: Array<DismissInfo>
}

type DP = {
  onDismiss: (DismissInfo) => () => mixed
}

type Props = SP & DP

// These captions populate the AlertItem body, the title/message
// comes from the CommandCreatorError / CommandCreatorWarning
const captions: {[warningOrErrorType: string]: string} = {
  'INSUFFICIENT_TIPS': 'Add another tip rack to an empty slot in Deck Setup',
  'ASPIRATE_MORE_THAN_WELL_CONTENTS': 'You are trying to aspirate more than the current volume of one of your well(s). If you intended to add air to your tip, please use the Air Gap advanced setting.'
}

function Alerts (props: Props) {
  const alertItemHelper = (alert: CommandCreatorError | DismissInfo, key) => (
    <AlertItem
      type='warning'
      key={key}
      title={alert.message}
      onCloseClick={alert.isDismissable
        ? props.onDismiss(alert)
        : undefined
      }
      >
        {captions[alert.type]}
      </AlertItem>
  )
  return (
    <div>
      {props.errors.map(alertItemHelper)}
      {props.warnings.map(alertItemHelper)}
    </div>
  )
}

function mapStateToProps (state: BaseState): SP {
  const timeline = fileDataSelectors.robotStateTimeline(state)
  const warnings = dismissSelectors.getWarningsForSelectedStep(state)
  const errors = timeline.errors || []

  return {
    errors,
    warnings
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    onDismiss: dismissInfo => () => dispatch(dismissActions.dismissWarning(dismissInfo))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Alerts)
