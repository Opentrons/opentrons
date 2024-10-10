import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  useHoverTooltip,
  TOOLTIP_TOP,
  TOOLTIP_FIXED,
  Tooltip,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  BORDERS,
  NO_WRAP,
  useOnClickOutside,
  SecondaryButton,
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
} from '../../../../ui/steps'
import {
  selectors as stepFormSelectors,
  getIsModuleOnDeck,
} from '../../../../step-forms'
import { getEnableComment } from '../../../../feature-flags/selectors'
import { getMainPagePortalEl } from '../../../../components/portals/MainPageModalPortal'
import {
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
} from '../../../../components/modals/ConfirmDeleteModal'
import { AddStepOverflowButton } from './AddStepOverflowButton'

import type { ThunkDispatch } from 'redux-thunk'
import type { BaseState } from '../../../../types'
import type { StepType } from '../../../../form-types'

export function AddStepButton(): JSX.Element {
  const { t } = useTranslation(['tooltip', 'button'])
  const enableComment = useSelector(getEnableComment)
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })
  const currentFormIsPresaved = useSelector(
    stepFormSelectors.getCurrentFormIsPresaved
  )
  const formHasChanges = useSelector(
    stepFormSelectors.getCurrentFormHasUnsavedChanges
  )
  const isStepCreationDisabled = useSelector(getIsMultiSelectMode)
  const modules = useSelector(stepFormSelectors.getInitialDeckSetup).modules
  const [
    showStepOverflowMenu,
    setShowStepOverflowMenu,
  ] = React.useState<boolean>(false)
  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowStepOverflowMenu(false)
    },
  })
  const [
    enqueuedStepType,
    setEnqueuedStepType,
  ] = React.useState<StepType | null>(null)

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

  const addStep = (
    stepType: StepType
  ): ReturnType<typeof stepsActions.addAndSelectStepWithHints> =>
    dispatch(stepsActions.addAndSelectStepWithHints({ stepType }))

  const items = getSupportedSteps()
    .filter(stepType => isStepTypeEnabled[stepType])
    .map(stepType => (
      <AddStepOverflowButton
        key={stepType}
        stepType={stepType}
        onClick={() => {
          if (currentFormIsPresaved || formHasChanges) {
            setEnqueuedStepType(stepType)
          } else {
            addStep(stepType)
          }
          setShowStepOverflowMenu(false)
        }}
      />
    ))

  return (
    <>
      {/* TODO(ja): update this modal to match latest modal designs */}
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

      {showStepOverflowMenu ? (
        <Flex
          position={POSITION_ABSOLUTE}
          zIndex={5}
          ref={overflowWrapperRef}
          left="19.5rem"
          whiteSpace={NO_WRAP}
          bottom="4.2rem"
          borderRadius={BORDERS.borderRadius8}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          backgroundColor={COLORS.white}
          flexDirection={DIRECTION_COLUMN}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {items}
        </Flex>
      ) : null}

      {isStepCreationDisabled && (
        <Tooltip tooltipProps={tooltipProps}>
          {t(`disabled_step_creation`)}
        </Tooltip>
      )}
      <SecondaryButton
        width="100%"
        {...targetProps}
        id="AddStepButton"
        onClick={() => {
          setShowStepOverflowMenu(true)
        }}
        disabled={isStepCreationDisabled}
      >
        {t('button:add_step')}
      </SecondaryButton>
    </>
  )
}
