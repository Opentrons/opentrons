// @flow
import {
  AlertModal,
  PrimaryButton,
  Tooltip,
  TOOLTIP_FIXED,
  TOOLTIP_RIGHT,
  useHoverTooltip,
} from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import cx from 'classnames'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { type StepType, stepIconsByType } from '../form-types'
import { i18n } from '../localization'
import {
  getIsModuleOnDeck,
  selectors as stepFormSelectors,
} from '../step-forms'
import { actions as stepsActions } from '../ui/steps'
import styles from './listButtons.css'
import { Portal } from './portals/MainPageModalPortal'

type StepButtonComponentProps = {|
  children: React.Node,
  expanded: boolean,
  setExpanded: boolean => mixed,
|}

// TODO: Ian 2019-01-17 move out to centralized step info file - see #2926
const getSupportedSteps = () => [
  'moveLiquid',
  'mix',
  'pause',
  'magnet',
  'temperature',
  'thermocycler',
]

const StepCreationButtonComponent = (props: StepButtonComponentProps) => {
  const { children, expanded, setExpanded } = props

  return (
    <div
      className={styles.list_item_button}
      onMouseLeave={() => setExpanded(false)}
    >
      <PrimaryButton onClick={() => setExpanded(!expanded)}>
        {i18n.t('button.add_step')}
      </PrimaryButton>

      <div className={styles.buttons_popover}>{expanded && children}</div>
    </div>
  )
}

type StepButtonItemProps = {|
  onClick: () => mixed,
  disabled: boolean,
  stepType: string,
|}

function StepButtonItem(props: StepButtonItemProps) {
  const { onClick, disabled, stepType } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_RIGHT,
    strategy: TOOLTIP_FIXED,
  })
  const tooltipMessage = disabled
    ? i18n.t(`tooltip.disabled_module_step`)
    : i18n.t(`tooltip.step_description.${stepType}`)
  return (
    <>
      <PrimaryButton
        hoverTooltipHandlers={targetProps}
        onClick={onClick}
        iconName={stepIconsByType[stepType]}
        className={cx({
          [styles.step_button_disabled]: disabled,
        })}
      >
        {i18n.t(`application.stepType.${stepType}`, stepType)}
      </PrimaryButton>
      <Tooltip {...tooltipProps}>{tooltipMessage}</Tooltip>
    </>
  )
}

export const StepCreationButton = (): React.Node => {
  const currentFormIsPresaved = useSelector(
    stepFormSelectors.getCurrentFormIsPresaved
  )
  const modules = useSelector(stepFormSelectors.getInitialDeckSetup).modules
  const isStepTypeEnabled = {
    moveLiquid: true,
    mix: true,
    pause: true,
    magnet: getIsModuleOnDeck(modules, MAGNETIC_MODULE_TYPE),
    temperature: getIsModuleOnDeck(modules, TEMPERATURE_MODULE_TYPE),
    thermocycler: getIsModuleOnDeck(modules, THERMOCYCLER_MODULE_TYPE),
  }

  const [expanded, setExpanded] = React.useState<boolean>(false)
  const [
    enqueuedStepType,
    setEnqueuedStepType,
  ] = React.useState<StepType | null>(null)
  const dispatch = useDispatch()

  const addStep = (stepType: StepType) =>
    dispatch(stepsActions.addAndSelectStepWithHints({ stepType }))

  const items = getSupportedSteps().map(stepType => (
    <StepButtonItem
      key={stepType}
      stepType={stepType}
      disabled={!isStepTypeEnabled[stepType]}
      onClick={() => {
        setExpanded(false)

        if (currentFormIsPresaved) {
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
          <AlertModal
            heading="Unsaved step form"
            alertOverlay
            buttons={[
              {
                children: 'Continue',
                onClick: () => setEnqueuedStepType(null),
              },
              {
                children: 'Delete Step',
                onClick: () => {
                  if (enqueuedStepType !== null) {
                    addStep(enqueuedStepType)
                    setEnqueuedStepType(null)
                  }
                },
              },
            ]}
          >
            <p style={{ lineHeight: 1.5 }}>
              {i18n.t('modal.delete_step.body')}
            </p>
          </AlertModal>
        </Portal>
      )}
      <StepCreationButtonComponent
        expanded={expanded}
        setExpanded={setExpanded}
      >
        {items}
      </StepCreationButtonComponent>
    </>
  )
}
