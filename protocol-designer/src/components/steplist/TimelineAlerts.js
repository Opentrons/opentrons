// @flow
// TODO: TimelineAlerts.js was replaced by Alerts.js, and Alerts.js is currently not used.
// See issue #1814. NOTE: for original TimelineAlerts, find an earlier commit
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import i18n from '../../localization'
import {
  actions as dismissActions,
  selectors as dismissSelectors,
} from '../../dismiss'
import {selectors as steplistSelectors} from '../../steplist'
import {selectors as fileDataSelectors} from '../../file-data'
import {AlertItem} from '@opentrons/components'
import type {BaseState} from '../../types'
import type {
  CommandCreatorError,
  CommandCreatorWarning,
} from '../../step-generation'

type AlertContent = {
  title: string,
  body?: React.Node,
}

type SP = {
  errors: Array<CommandCreatorError>,
  warnings: Array<CommandCreatorWarning>,
  _stepId: ?number,
}

type DP = {
  onDismiss: (CommandCreatorWarning) => () => mixed,
}

type Props = SP & DP

/** Errors and Warnings from step-generation are written for developers
  * who are using step-generation as an API for writing Opentrons protocols.
  * These 'overrides' replace the content of some of those errors/warnings
  * in order to make things clearer to the PD user.
  *
  * When an override is not specified in /localization/en/alert/ , the default
  * behavior is that the warning/error `message` gets put into the `title` of the Alert
  */

const getErrorContent = (error: CommandCreatorError): AlertContent => ({
  title: i18n.t(`alert.timeline.error.${error.type}.title`, error.message),
  body: i18n.t(`alert.timeline.error.${error.type}.body`, {defaultValue: ''}),
})

const getWarningContent = (warning: CommandCreatorWarning): AlertContent => ({
  title: i18n.t(`alert.timeline.warning.${warning.type}.title`, warning.message),
  body: i18n.t(`alert.timeline.warning.${warning.type}.body`, {defaultValue: ''}),
})

function Alerts (props: Props) {
  const errors = props.errors.map((error, key) => {
    const {title, body} = getErrorContent(error)
    return (
      <AlertItem
        type='warning'
        key={`error:${key}`}
        title={title}
        onCloseClick={undefined}
        >
          {body}
        </AlertItem>
    )
  })

  const warnings = props.warnings.map((warning, key) => {
    const {title, body} = getWarningContent(warning)
    return (
      <AlertItem
        type='warning'
        key={`warning:${key}`}
        title={title}
        onCloseClick={props.onDismiss(warning)}
        >
          {body}
        </AlertItem>
    )
  })

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
    _stepId,
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {dispatch} = dispatchProps
  const stepId = stateProps._stepId
  const onDismiss = (warning: CommandCreatorWarning) =>
    () => dispatch(dismissActions.dismissTimelineWarning({
      warning,
      stepId,
    }))

  return {
    ...stateProps,
    onDismiss,
  }
}

export default connect(mapStateToProps, null, mergeProps)(Alerts)
