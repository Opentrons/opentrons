// @flow
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {
  actions as dismissActions,
  selectors as dismissSelectors,
} from '../../dismiss'
import {selectors as steplistSelectors} from '../../steplist'
import {selectors as fileDataSelectors} from '../../file-data'
import type {BaseState} from '../../types'
import type {
  CommandCreatorError,
  CommandCreatorWarning,
} from '../../step-generation'
import Alerts from './Alerts'
import type {AlertLevel} from './types'

type SP = {
  errors: Array<CommandCreatorError>,
  warnings: Array<CommandCreatorWarning>,
  _stepId: ?number,
}

type MP = {
  errors: Array<CommandCreatorError>,
  warnings: Array<CommandCreatorWarning>,
  dismissWarning: (CommandCreatorWarning) => mixed,
  level: AlertLevel,
}

/** Errors and Warnings from step-generation are written for developers
  * who are using step-generation as an API for writing Opentrons protocols.
  * These 'overrides' replace the content of some of those errors/warnings
  * in order to make things clearer to the PD user.
  *
  * When an override is not specified in /localization/en/alert/ , the default
  * behavior is that the warning/error `message` gets put into the `title` of the Alert
  */

function mapStateToProps (state: BaseState): SP {
  const timeline = fileDataSelectors.robotStateTimeline(state)
  const errors = timeline.errors || []
  const warnings = dismissSelectors.getTimelineWarningsForSelectedStep(state)
  const _stepId = steplistSelectors.getSelectedStepId(state)

  return {
    errors,
    warnings,
    _stepId,
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): MP {
  const {dispatch} = dispatchProps
  return {
    ...stateProps,
    level: 'timeline',
    dismissWarning: (warning: CommandCreatorWarning) => {
      dispatch(dismissActions.dismissTimelineWarning({warning, stepId: stateProps._stepId}))
    },
  }
}

export default connect(mapStateToProps, null, mergeProps)(Alerts)
