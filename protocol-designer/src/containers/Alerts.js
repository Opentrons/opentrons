// @flow
// TODO: This file is currently not used
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {
  actions as dismissActions,
  selectors as dismissSelectors
} from '../dismiss'
import {selectors as steplistSelectors} from '../steplist'
import {selectors as fileDataSelectors} from '../file-data'
import {AlertItem} from '@opentrons/components'
import type {BaseState} from '../types'
import type {CommandCreatorError, CommandCreatorWarning} from '../step-generation'

type SP = {
  errors: Array<CommandCreatorError>,
  warnings: Array<CommandCreatorWarning>,
  _stepId: *
}

type DP = {
  onDismiss: (CommandCreatorWarning) => () => mixed
}

type Props = SP & DP

// These captions populate the AlertItem body, the title/message
// comes from the CommandCreatorError / CommandCreatorWarning
const captions: {[warningOrErrorType: string]: string} = {
  'INSUFFICIENT_TIPS': 'Add another tip rack to an empty slot in Deck Setup',
  'ASPIRATE_MORE_THAN_WELL_CONTENTS': 'You are trying to aspirate more than the current volume of one of your well(s). If you intended to add air to your tip, please use the Air Gap advanced setting.'
}

function Alerts (props: Props) {
  const errors = props.errors.map((error, key) => (
    <AlertItem
      type='warning'
      key={`error:${key}`}
      title={error.message}
      onCloseClick={undefined}
      >
        {captions[error.type]}
      </AlertItem>
    ))

  const warnings = props.warnings.map((warning, key) => (
    <AlertItem
      type='warning'
      key={`warning:${key}`}
      title={warning.message}
      onCloseClick={props.onDismiss(warning)}
      >
        {captions[warning.type]}
      </AlertItem>
    ))

  return (
    <div>
      {errors}
      {warnings}
    </div>
  )
}

function mapStateToProps (state: BaseState): SP {
  const timeline = fileDataSelectors.robotStateTimeline(state)
  const errors = timeline.errors || []
  const warnings = dismissSelectors.getTimelineWarningsForSelectedStep(state)
  const _stepId = steplistSelectors.getSelectedStepId(state)

  return {
    errors,
    warnings,
    _stepId
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {dispatch} = dispatchProps
  const stepId = stateProps._stepId
  const onDismiss = (warning: CommandCreatorWarning) =>
    () => dispatch(dismissActions.dismissTimelineWarning({
      warning,
      stepId
    }))

  return {
    ...stateProps,
    onDismiss
  }
}

export default connect(mapStateToProps, null, mergeProps)(Alerts)
