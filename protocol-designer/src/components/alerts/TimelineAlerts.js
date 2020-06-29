// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import type { Dispatch } from 'redux'

import { actions as dismissActions } from '../../dismiss'
import { selectors as fileDataSelectors } from '../../file-data'
import type { StepIdType } from '../../form-types'
import { i18n } from '../../localization'
import type { CommandCreatorError } from '../../step-generation/types'
import * as timelineWarningSelectors from '../../top-selectors/timelineWarnings'
import type { BaseState } from '../../types'
import { getSelectedStepId } from '../../ui/steps'
import { type Props, Alerts } from './Alerts'
import { ErrorContents } from './ErrorContents'
import { WarningContents } from './WarningContents'

type SP = {|
  errors: $PropertyType<Props, 'errors'>,
  warnings: $PropertyType<Props, 'warnings'>,
  _stepId: ?StepIdType,
|}

/** Errors and Warnings from step-generation are written for developers
 * who are using step-generation as an API for writing Opentrons protocols.
 * These 'overrides' replace the content of some of those errors/warnings
 * in order to make things clearer to the PD user.
 *
 * When an override is not specified in /localization/en/alert/ , the default
 * behavior is that the warning/error `message` gets put into the `title` of the Alert
 */

function mapStateToProps(state: BaseState): SP {
  const timeline = fileDataSelectors.getRobotStateTimeline(state)
  const errors = (timeline.errors || []: Array<CommandCreatorError>).map(
    error => ({
      title: i18n.t(`alert.timeline.error.${error.type}.title`, error.message),
      description: <ErrorContents level="timeline" errorType={error.type} />,
    })
  )
  const warnings = timelineWarningSelectors
    .getTimelineWarningsForSelectedStep(state)
    .map(warning => ({
      title: i18n.t(`alert.timeline.warning.${warning.type}.title`),
      description: (
        <WarningContents level="timeline" warningType={warning.type} />
      ),
      dismissId: warning.type,
    }))
  const _stepId = getSelectedStepId(state)

  return {
    errors,
    warnings,
    _stepId,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: Dispatch<*> }
): Props {
  const { dispatch } = dispatchProps
  return {
    ...stateProps,
    dismissWarning: (dismissId: string) => {
      dispatch(
        dismissActions.dismissTimelineWarning({
          type: dismissId,
          stepId: stateProps._stepId,
        })
      )
    },
  }
}

export const TimelineAlerts: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  SP,
  {||},
  _,
  _
>(
  mapStateToProps,
  null,
  mergeProps
)(Alerts)
