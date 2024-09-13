import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  LegacyTooltip,
  DeprecatedPrimaryButton,
  useHoverTooltip,
  TOOLTIP_RIGHT,
  TOOLTIP_TOP,
  TOOLTIP_FIXED,
  PrimaryButton,
  Tooltip,
  Flex,
  Modal,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  actions as stepsActions,
  getIsMultiSelectMode,
} from '../../../ui/steps'
import {
  selectors as stepFormSelectors,
  getIsModuleOnDeck,
} from '../../../step-forms'
import { getEnableComment } from '../../../feature-flags/selectors'

import { stepIconsByType } from '../../../form-types'
import type { ThunkDispatch } from 'redux-thunk'
import type { BaseState } from '../../../types'
import type { StepType } from '../../../form-types'
import {
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
} from '../../../components/modals/ConfirmDeleteModal'
import { getMainPagePortalEl } from '../../../components/portals/MainPageModalPortal'

interface StepButtonComponentProps {
  children: React.ReactNode
  expanded: boolean
  disabled: boolean
  setExpanded: (expanded: boolean) => void
}

export interface StepButtonItemProps {
  onClick: () => void
  stepType: StepType
}

export function StepButtonItem(props: StepButtonItemProps): JSX.Element {
  const { onClick, stepType } = props
  const { t } = useTranslation(['tooltip', 'application'])
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_RIGHT,
    strategy: TOOLTIP_FIXED,
  })
  const tooltipMessage = t(`step_description.${stepType}`)
  return (
    <>
      <div {...targetProps}>
        <PrimaryButton onClick={onClick} iconName={stepIconsByType[stepType]}>
          {t(`application:stepType.${stepType}`, stepType)}
        </PrimaryButton>
      </div>
      <LegacyTooltip {...tooltipProps}>{tooltipMessage}</LegacyTooltip>
    </>
  )
}

export const AddStepButton = (): JSX.Element => {
  const { t } = useTranslation(['tooltip', 'button'])
  const [showStepModal, setShowStepModal] = React.useState<boolean>(false)
  const enableComment = useSelector(getEnableComment)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })

  const getSupportedSteps = (): Array<
    Exclude<StepType, 'manualIntervention'>
  > =>
    enableComment
      ? [
          'comment',
          'moveLabware',
          'moveLiquid',
          'mix',
          'pause',
          'heaterShaker',
          'magnet',
          'temperature',
          'thermocycler',
        ]
      : [
          'moveLabware',
          'moveLiquid',
          'mix',
          'pause',
          'heaterShaker',
          'magnet',
          'temperature',
          'thermocycler',
        ]

  const currentFormIsPresaved = useSelector(
    stepFormSelectors.getCurrentFormIsPresaved
  )
  const formHasChanges = useSelector(
    stepFormSelectors.getCurrentFormHasUnsavedChanges
  )
  const isStepCreationDisabled = useSelector(getIsMultiSelectMode)
  const modules = useSelector(stepFormSelectors.getInitialDeckSetup).modules
  const isStepTypeEnabled: Record<
    Exclude<StepType, 'manualIntervention'>,
    boolean
  > = {
    comment: enableComment,
    moveLabware: true,
    moveLiquid: true,
    mix: true,
    pause: true,
    magnet: getIsModuleOnDeck(modules, MAGNETIC_MODULE_TYPE),
    temperature: getIsModuleOnDeck(modules, TEMPERATURE_MODULE_TYPE),
    thermocycler: getIsModuleOnDeck(modules, THERMOCYCLER_MODULE_TYPE),
    heaterShaker: getIsModuleOnDeck(modules, HEATERSHAKER_MODULE_TYPE),
  }
  const [
    enqueuedStepType,
    setEnqueuedStepType,
  ] = React.useState<StepType | null>(null)
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()

  const addStep = (
    stepType: StepType
  ): ReturnType<typeof stepsActions.addAndSelectStepWithHints> =>
    dispatch(stepsActions.addAndSelectStepWithHints({ stepType }))

  const items = getSupportedSteps()
    .filter(stepType => isStepTypeEnabled[stepType])
    .map(stepType => (
      <StepButtonItem
        key={stepType}
        stepType={stepType}
        onClick={() => {
          if (currentFormIsPresaved || formHasChanges) {
            setEnqueuedStepType(stepType)
          } else {
            addStep(stepType)
          }
        }}
      />
    ))

  return (
    <>
      {enqueuedStepType !== null &&
        createPortal(
          <ConfirmDeleteModal
            modalType={CLOSE_UNSAVED_STEP_FORM}
            onCancelClick={() => {
              setEnqueuedStepType(null)
            }}
            onContinueClick={() => {
              if (enqueuedStepType !== null) {
                addStep(enqueuedStepType)
                setEnqueuedStepType(null)
              }
            }}
          />,
          getMainPagePortalEl()
        )}

      {showStepModal
        ? //  TODO(ja, 9/13/24): update modal to match designs
          createPortal(
            <Modal
              onClose={() => {
                setShowStepModal(false)
              }}
            >
              {items}
            </Modal>,
            getMainPagePortalEl()
          )
        : null}

      {isStepCreationDisabled && (
        <Tooltip tooltipProps={tooltipProps}>
          {t(`disabled_step_creation`)}
        </Tooltip>
      )}
      <PrimaryButton
        width="100%"
        {...targetProps}
        id="AddStepButton"
        onClick={() => {
          setShowStepModal(true)
        }}
        disabled={isStepCreationDisabled}
      >
        {t('button:add_step')}
      </PrimaryButton>
    </>
  )
}
