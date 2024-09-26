import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import * as timelineWarningSelectors from '../../../../top-selectors/timelineWarnings'
import { selectors as dismissSelectors } from '../../../../dismiss'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import {
  actions as stepsActions,
  getHoveredStepId,
  getHoveredSubstep,
  getMultiSelectItemIds,
  getSelectedStepId,
} from '../../../../ui/steps'
import { selectors as fileDataSelectors } from '../../../../file-data'

import { stepIconsByType } from '../../../../form-types'
import { getOrderedStepIds } from '../../../../step-forms/selectors'
import { StepContainer } from './StepContainer'

import type { ThunkDispatch } from 'redux-thunk'
import type { HoverOnStepAction } from '../../../../ui/steps'
import type { StepIdType } from '../../../../form-types'
import type { BaseState, ThunkAction } from '../../../../types'

export interface ConnectedStepInfoProps {
  stepId: StepIdType
  stepNumber: number
}

export function ConnectedStepInfo(props: ConnectedStepInfoProps): JSX.Element {
  const { stepId, stepNumber } = props
  const { t } = useTranslation('application')
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const stepIds = useSelector(getOrderedStepIds)
  const step = useSelector(stepFormSelectors.getSavedStepForms)[stepId]
  const argsAndErrors = useSelector(stepFormSelectors.getArgsAndErrorsByStepId)[
    stepId
  ]
  const errorStepId = useSelector(fileDataSelectors.getErrorStepId)
  const hasError = errorStepId === stepId || argsAndErrors.errors != null
  const hasTimelineWarningsPerStep = useSelector(
    timelineWarningSelectors.getHasTimelineWarningsPerStep
  )
  const hasFormLevelWarningsPerStep = useSelector(
    dismissSelectors.getHasFormLevelWarningsPerStep
  )
  const stepListAfterErrors =
    errorStepId != null ? stepIds.slice(stepIds.indexOf(errorStepId) + 1) : []
  const stepAfterError =
    stepId != null ? stepListAfterErrors.includes(stepId) : false

  const hasWarnings =
    hasTimelineWarningsPerStep[stepId] || hasFormLevelWarningsPerStep[stepId]
  const hoveredSubstep = useSelector(getHoveredSubstep)
  const hoveredStep = useSelector(getHoveredStepId)
  const selectedStepId = useSelector(getSelectedStepId)
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)
  const selected: boolean = multiSelectItemIds?.length
    ? multiSelectItemIds.includes(stepId)
    : selectedStepId === stepId

  const selectStep = (): ThunkAction<any> =>
    dispatch(stepsActions.selectStep(stepId))
  const highlightStep = (): HoverOnStepAction =>
    dispatch(stepsActions.hoverOnStep(stepId))
  const unhighlightStep = (): HoverOnStepAction =>
    dispatch(stepsActions.hoverOnStep(null))

  // const { confirm, showConfirmation, cancel } = useConditionalConfirm(
  //   handleStepItemSelection,
  //   currentFormIsPresaved || singleEditFormHasUnsavedChanges
  // )

  const iconName = stepIconsByType[step.stepType]

  return (
    <>
      {/* {showConfirmation && (
        <ConfirmDeleteModal
          modalType={getModalType()}
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )} */}
      <StepContainer
        hasError={hasError}
        isStepAfterError={stepAfterError}
        stepId={stepId}
        onMouseLeave={unhighlightStep}
        selected={selected}
        // setSelectedStep={setSelectedStep}
        onClick={() => {
          selectStep()
        }}
        hovered={hoveredStep === stepId && !hoveredSubstep}
        onMouseEnter={highlightStep}
        iconName={hasError || hasWarnings ? 'alert-circle' : iconName}
        title={`${stepNumber}. ${
          step.stepName || t(`stepType.${step.stepType}`)
        }`}
      />
    </>
  )
}
