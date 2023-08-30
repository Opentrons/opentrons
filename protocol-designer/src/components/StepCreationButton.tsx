import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Tooltip,
  DeprecatedPrimaryButton,
  useHoverTooltip,
  TOOLTIP_RIGHT,
  TOOLTIP_TOP,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { i18n } from '../localization'
import { actions as stepsActions, getIsMultiSelectMode } from '../ui/steps'
import {
  selectors as stepFormSelectors,
  getIsModuleOnDeck,
} from '../step-forms'
import {
  ConfirmDeleteModal,
  CLOSE_UNSAVED_STEP_FORM,
} from './modals/ConfirmDeleteModal'
import { Portal } from './portals/MainPageModalPortal'
import { stepIconsByType, StepType } from '../form-types'
import styles from './listButtons.css'

interface StepButtonComponentProps {
  children: React.ReactNode
  expanded: boolean
  disabled: boolean
  setExpanded: (expanded: boolean) => unknown
}

// TODO: Ian 2019-01-17 move out to centralized step info file - see #2926

export const StepCreationButtonComponent = (
  props: StepButtonComponentProps
): JSX.Element => {
  const { children, expanded, setExpanded, disabled } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })
  return (
    <div
      className={styles.list_item_button}
      onMouseLeave={() => setExpanded(false)}
      {...targetProps}
    >
      {disabled && (
        <Tooltip {...tooltipProps}>
          {i18n.t(`tooltip.disabled_step_creation`)}
        </Tooltip>
      )}
      <DeprecatedPrimaryButton
        id="StepCreationButton"
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
      >
        {i18n.t('button.add_step')}
      </DeprecatedPrimaryButton>

      <div className={styles.buttons_popover}>{expanded && children}</div>
    </div>
  )
}

export interface StepButtonItemProps {
  onClick: () => unknown
  stepType: StepType
}

export function StepButtonItem(props: StepButtonItemProps): JSX.Element {
  const { onClick, stepType } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_RIGHT,
    strategy: TOOLTIP_FIXED,
  })
  const tooltipMessage = i18n.t(`tooltip.step_description.${stepType}`)
  return (
    <>
      <div {...targetProps}>
        <DeprecatedPrimaryButton
          onClick={onClick}
          iconName={stepIconsByType[stepType]}
        >
          {i18n.t(`application.stepType.${stepType}`, stepType)}
        </DeprecatedPrimaryButton>
      </div>
      <Tooltip {...tooltipProps}>{tooltipMessage}</Tooltip>
    </>
  )
}

export const StepCreationButton = (): JSX.Element => {
  const getSupportedSteps = (): Array<
    Exclude<StepType, 'manualIntervention'>
  > => [
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
    moveLabware: true,
    moveLiquid: true,
    mix: true,
    pause: true,
    magnet: getIsModuleOnDeck(modules, MAGNETIC_MODULE_TYPE),
    temperature: getIsModuleOnDeck(modules, TEMPERATURE_MODULE_TYPE),
    thermocycler: getIsModuleOnDeck(modules, THERMOCYCLER_MODULE_TYPE),
    heaterShaker: getIsModuleOnDeck(modules, HEATERSHAKER_MODULE_TYPE),
  }

  const [expanded, setExpanded] = React.useState<boolean>(false)
  const [
    enqueuedStepType,
    setEnqueuedStepType,
  ] = React.useState<StepType | null>(null)
  const dispatch = useDispatch()

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
          setExpanded(false)

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
      {enqueuedStepType !== null && (
        <Portal>
          <ConfirmDeleteModal
            modalType={CLOSE_UNSAVED_STEP_FORM}
            onCancelClick={() => setEnqueuedStepType(null)}
            onContinueClick={() => {
              if (enqueuedStepType !== null) {
                addStep(enqueuedStepType)
                setEnqueuedStepType(null)
              }
            }}
          ></ConfirmDeleteModal>
        </Portal>
      )}
      <StepCreationButtonComponent
        expanded={expanded}
        setExpanded={setExpanded}
        disabled={isStepCreationDisabled}
      >
        {items}
      </StepCreationButtonComponent>
    </>
  )
}
