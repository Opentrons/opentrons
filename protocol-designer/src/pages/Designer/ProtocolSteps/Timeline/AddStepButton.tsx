import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  NO_WRAP,
  POSITION_ABSOLUTE,
  SecondaryButton,
  SPACING,
  StyledText,
  Tooltip,
  TOOLTIP_FIXED,
  TOOLTIP_TOP,
  useHoverTooltip,
  useOnClickOutside,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getIsLid,
  getIsTiprack,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  SYSTEM_LOCATION,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import {
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
  getMainPagePortalEl,
} from '/protocol-designer/components/organisms'
import { OFFDECK } from '/protocol-designer/constants'
import { getEnableComment } from '/protocol-designer/feature-flags/selectors'
import {
  getInitialRobotState,
  getRobotStateTimeline,
} from '/protocol-designer/file-data/selectors'
import {
  getIsModuleOnDeck,
  selectors as stepFormSelectors,
} from '/protocol-designer/step-forms'
import { getLabwareEntities } from '/protocol-designer/step-forms/selectors'
import {
  getIsMultiSelectMode,
  actions as stepsActions,
} from '/protocol-designer/ui/steps'
import { getIsAdapterFromDef } from '/protocol-designer/utils'

import { AddStepOverflowButton } from './AddStepOverflowButton'
import { getConsolidatedStacks } from './utils'

import type { ThunkDispatch } from 'redux-thunk'
import type { MouseEvent, ReactNode } from 'react'
import type { StepType } from '/protocol-designer/form-types'
import type { BaseState } from '/protocol-designer/types'

interface AddStepButtonProps {
  hasText: boolean
  sidebarWidth: number
}

export function AddStepButton({
  hasText,
  sidebarWidth,
}: AddStepButtonProps): ReactNode {
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
  const { modules } = useSelector(stepFormSelectors.getInitialDeckSetup)
  const [showStepOverflowMenu, setShowStepOverflowMenu] =
    useState<boolean>(false)
  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowStepOverflowMenu(false)
    },
  })
  const [enqueuedStepType, setEnqueuedStepType] = useState<StepType | null>(
    null
  )
  const labwareEntities = useSelector(getLabwareEntities)
  const { timeline } = useSelector(getRobotStateTimeline)
  const initialTimeline = useSelector(getInitialRobotState)
  const lastTimelineFrame =
    timeline.length > 0 ? last(timeline)?.robotState : initialTimeline
  const labwareAtLastState = lastTimelineFrame?.labware ?? {}
  const moduleAtLastState = lastTimelineFrame?.modules ?? {}
  const consolidatedStacks = getConsolidatedStacks(labwareAtLastState)
  const isLabwarePresentForLiquidHandling = consolidatedStacks.some(stack => {
    const labwareId = stack[0]
    const labwareDef = labwareEntities[labwareId]?.def
    const slot = getSlotInLocationStack(stack)
    const isInaccessible = slot === SYSTEM_LOCATION
    const isLidOnSlot = labwareDef != null ? getIsLid(labwareDef) : false
    const isStackerInSlot = Object.values(modules).some(
      module =>
        module.type === FLEX_STACKER_MODULE_TYPE &&
        moduleAtLastState[module.id]?.slot === slot
    )
    return (
      !isInaccessible &&
      labwareDef != null &&
      slot !== OFFDECK &&
      !getIsTiprack(labwareDef) &&
      !getIsAdapterFromDef(labwareDef) &&
      !isLidOnSlot &&
      !isStackerInSlot
    )
  })
  const getSupportedSteps = (): Array<
    Exclude<StepType, 'manualIntervention'>
  > => [
    'absorbanceReader',
    'camera',
    'comment',
    'moveLabware',
    'moveLiquid',
    'mix',
    'pause',
    'heaterShaker',
    'magnet',
    'temperature',
    'thermocycler',
    'flexStacker',
    'vacuum',
  ]
  const isStepTypeEnabled: Record<
    Exclude<StepType, 'manualIntervention'>,
    boolean
  > = {
    camera: true,
    comment: enableComment,
    moveLabware: true,
    moveLiquid: isLabwarePresentForLiquidHandling,
    mix: isLabwarePresentForLiquidHandling,
    pause: true,
    magnet: getIsModuleOnDeck(modules, MAGNETIC_MODULE_TYPE),
    temperature: getIsModuleOnDeck(modules, TEMPERATURE_MODULE_TYPE),
    thermocycler: getIsModuleOnDeck(modules, THERMOCYCLER_MODULE_TYPE),
    heaterShaker: getIsModuleOnDeck(modules, HEATERSHAKER_MODULE_TYPE),
    absorbanceReader: getIsModuleOnDeck(modules, ABSORBANCE_READER_TYPE),
    flexStacker: getIsModuleOnDeck(modules, FLEX_STACKER_MODULE_TYPE),
    vacuum: getIsModuleOnDeck(modules, VACUUM_MODULE_TYPE),
  }

  const addStep = (stepType: StepType): ReturnType<any> =>
    dispatch(stepsActions.addAndSelectStep({ stepType }))

  const items = getSupportedSteps()
    .filter(stepType => isStepTypeEnabled[stepType])
    .map((stepType, index, array) => (
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
        isFirstStep={index === 0}
        isLastStep={index === array.length - 1}
      />
    ))

  const handleAddClick = (): void => {
    setShowStepOverflowMenu(true)
  }

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

      {showStepOverflowMenu ? (
        <Flex
          css={STEP_OVERFLOW_MENU_STYLE}
          ref={overflowWrapperRef}
          onClick={(e: MouseEvent) => {
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
        display={DISPLAY_FLEX}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing10}
        width="100%"
        {...targetProps}
        id="AddStepButton"
        onClick={handleAddClick}
        disabled={isStepCreationDisabled}
      >
        <Icon name="plus" size="1rem" />
        {hasText ? <StyledText>{t('button:add_step')}</StyledText> : null}
      </SecondaryButton>
    </>
  )
}

const STEP_OVERFLOW_MENU_STYLE = css`
  position: ${POSITION_ABSOLUTE};
  z-index: 5;
  right: -8.05rem;
  white-space: ${NO_WRAP};
  bottom: 1rem;
  border-radius: ${BORDERS.borderRadius8};
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);
  background-color: ${COLORS.white};
  flex-direction: ${DIRECTION_COLUMN};
`
