// @flow
// TODO: TimelineAlerts.js was replaced by Alerts.js, and Alerts.js is currently not used.
// See issue #1814. NOTE: for original TimelineAlerts, find an earlier commit
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {
  actions as dismissActions,
  selectors as dismissSelectors
} from '../../dismiss'
import {selectors as steplistSelectors} from '../../steplist'
import {selectors as fileDataSelectors} from '../../file-data'
import {AlertItem} from '@opentrons/components'
import type {BaseState} from '../../types'
import type {
  CommandCreatorError,
  CommandCreatorWarning,
  ErrorType,
  WarningType
} from '../../step-generation'

type AlertContent = {
  title: string,
  body?: React.Node
}

type SP = {
  errors: Array<CommandCreatorError>,
  warnings: Array<CommandCreatorWarning>,
  _stepId: ?number
}

type DP = {
  onDismiss: (CommandCreatorWarning) => () => mixed
}

type Props = SP & DP

/** Errors and Warnings from step-generation are written for developers
  * who are using step-generation as an API for writing Opentrons protocols.
  * These 'overrides' replace the content of some of those errors/warnings
  * in order to make things clearer to the PD user.
  *
  * When an override is not specified here, the default behaviors is that
  * the warning/error `message` gets put into the `title` of the Alert
  */
const errorOverrides: {[ErrorType]: AlertContent} = {
  'INSUFFICIENT_TIPS': {
    title: 'Not enough tips to complete action',
    body: 'Add another tip rack to an empty slot in Deck Setup'
  },
  'NO_TIP_ON_PIPETTE': {
    title: 'No tip on pipette',
    body: 'For the first step in a protocol the "change tip" setting must be set to always or once.'
  }
}

const warningOverrides: {[WarningType]: AlertContent} = {
  'ASPIRATE_MORE_THAN_WELL_CONTENTS': {
    title: 'Not enough liquid in well(s)',
    body: 'You are trying to aspirate more than the current volume of one of your well(s). If you intended to add air to your tip, please use the Air Gap advanced setting.'
  },
  'ASPIRATE_FROM_PRISTINE_WELL': {
    title: 'Source well is empty',
    body: "The well(s) you're trying to aspirate from are empty. You can add a starting liquid to this labware in Labware & Liquids"
  }
}

function getErrorContent (error: CommandCreatorError): AlertContent {
  return errorOverrides[error.type] || {title: error.message}
}

function getWarningContent (warning: CommandCreatorWarning): AlertContent {
  return warningOverrides[warning.type] || {title: warning.message}
}

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
