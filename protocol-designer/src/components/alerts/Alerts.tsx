import * as React from 'react'
import assert from 'assert'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import * as timelineWarningSelectors from '../../top-selectors/timelineWarnings'
import { getSelectedStepId } from '../../ui/steps'
import {
  actions as dismissActions,
  selectors as dismissSelectors,
} from '../../dismiss'
import { selectors as stepFormSelectors } from '../../step-forms'
import { StepFieldName } from '../../steplist/fieldLevel'
import { selectors as fileDataSelectors } from '../../file-data'
import {
  getVisibleFormWarnings,
  getVisibleFormErrors,
  getVisibleProfileFormLevelErrors,
} from '../StepEditForm/utils'
import { PDAlert } from './PDAlert'
import { ErrorContents } from './ErrorContents'
import { WarningContents } from './WarningContents'

import type { CommandCreatorError } from '@opentrons/step-generation'
import type { ProfileItem } from '../../form-types'
import type { ProfileFormError } from '../../steplist/formLevel/profileErrors'
import type { AlertData, AlertType } from './types'

/** Errors and Warnings from step-generation are written for developers
 * who are using step-generation as an API for writing Opentrons protocols.
 * These 'overrides' replace the content of some of those errors/warnings
 * in order to make things clearer to the PD user.
 *
 * When an override is not specified in /localization/en/alert/ , the default
 * behavior is that the warning/error `message` gets put into the `title` of the Alert
 */

interface Props {
  componentType: 'Form' | 'Timeline'
  focusedField?: StepFieldName | null
  dirtyFields?: StepFieldName[]
}

type MakeAlert = (
  alertType: AlertType,
  data: AlertData,
  key: number | string
) => JSX.Element

const AlertsComponent = (props: Props): JSX.Element => {
  const { componentType, focusedField, dirtyFields } = props
  const { t } = useTranslation('alert')
  const dispatch = useDispatch()
  const formLevelErrorsForUnsavedForm = useSelector(
    stepFormSelectors.getFormLevelErrorsForUnsavedForm
  )
  const formWarningsForSelectedStep = useSelector(
    dismissSelectors.getFormWarningsForSelectedStep
  )
  const timeline = useSelector(fileDataSelectors.getRobotStateTimeline)
  const timelineWarningsForSelectedStep = useSelector(
    timelineWarningSelectors.getTimelineWarningsForSelectedStep
  )
  const unsavedForm = useSelector(stepFormSelectors.getHydratedUnsavedForm)
  const dynamicFieldFormErrors = useSelector(
    stepFormSelectors.getDynamicFieldFormErrorsForUnsavedForm
  )

  const timelineErrors = (timeline.errors || ([] as CommandCreatorError[])).map(
    (error: CommandCreatorError) => ({
      title: t(`timeline.error.${error.type}.title`, error.message),
      description: <ErrorContents level="timeline" errorType={error.type} />,
    })
  )
  const timelineWarnings = timelineWarningsForSelectedStep.map(warning => ({
    title: t(`timeline.warning.${warning.type}.title`),
    description: (
      <WarningContents level="timeline" warningType={warning.type} />
    ),
    dismissId: warning.type,
  }))

  const visibleFormWarnings = getVisibleFormWarnings({
    focusedField,
    dirtyFields: dirtyFields ?? [],
    errors: formWarningsForSelectedStep,
  })
  const visibleFormErrors = getVisibleFormErrors({
    focusedField,
    dirtyFields: dirtyFields ?? [],
    errors: formLevelErrorsForUnsavedForm,
  })
  const stepId = useSelector(getSelectedStepId)

  const profileItemsById: Record<string, ProfileItem> | null | undefined =
    unsavedForm?.profileItemsById

  let visibleDynamicFieldFormErrors: ProfileFormError[] = []

  if (profileItemsById != null) {
    visibleDynamicFieldFormErrors = getVisibleProfileFormLevelErrors({
      focusedField,
      dirtyFields: dirtyFields ?? [],
      errors: dynamicFieldFormErrors,
      profileItemsById,
    })
  }

  const dismissWarning = (dismissId: string): void => {
    if (stepId) {
      dispatch(
        dismissActions.dismissTimelineWarning({
          type: dismissId,
          stepId,
        })
      )
    }
  }
  const makeHandleCloseWarning = (dismissId?: string | null) => () => {
    assert(dismissId, 'expected dismissId, Alert cannot dismiss warning')
    if (dismissId) {
      dismissWarning(dismissId)
    }
  }

  const makeAlert: MakeAlert = (alertType, data, key) => (
    <PDAlert
      alertType={alertType}
      title={data.title}
      description={data.description}
      key={`${alertType}:${key}`}
      onDismiss={
        alertType === 'warning' ? makeHandleCloseWarning(data.dismissId) : null
      }
    />
  )
  const formErrors = [
    ...visibleFormErrors.map(error => ({
      title: error.title,
      description: error.body || null,
    })),
    ...visibleDynamicFieldFormErrors.map(error => ({
      title: error.title,
      description: error.body || null,
    })),
  ]

  const formWarnings = visibleFormWarnings.map(warning => ({
    title: warning.title,
    description: warning.body || null,
    dismissId: warning.type,
  }))

  return (
    <>
      {componentType === 'Form'
        ? formErrors.map((error, key) => makeAlert('error', error, key))
        : timelineErrors.map((error, key) => makeAlert('error', error, key))}
      {componentType === 'Form'
        ? formWarnings.map((warning, key) => makeAlert('warning', warning, key))
        : timelineWarnings.map((warning, key) =>
            makeAlert('warning', warning, key)
          )}
    </>
  )
}

export const Alerts = React.memo(AlertsComponent)
