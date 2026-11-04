import { useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { StepMeter, useConditionalConfirm } from '@opentrons/components'

import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_EXIT_EARLY } from '/app/redux/analytics'

import { ConfirmExitModal } from './ConfirmExitModal'
import { CreateNewTransfer } from './CreateNewTransfer'
import { quickTransferWizardReducer } from './reducers'
import { SelectDestLabware } from './SelectDestLabware'
import { SelectDestWells } from './SelectDestWells'
import { SelectLiquidClass } from './SelectLiquidClass'
import { SelectPipette } from './SelectPipette'
import { SelectPipettePath } from './SelectPipettePath'
import { SelectSourceLabware } from './SelectSourceLabware'
import { SelectSourceWells } from './SelectSourceWells'
import { SelectTipDropLocation } from './SelectTipDropLocation'
import { SelectTipFrequency } from './SelectTipFrequency'
import { SelectTipRack } from './SelectTipRack'
import { SummaryAndSettings } from './SummaryAndSettings'
import { VolumeEntry } from './VolumeEntry'

import type { ComponentProps, ReactNode } from 'react'
import type { SmallButton } from '/app/atoms/buttons'
import type { QuickTransferWizardState } from './types'

const initialQuickTransferState: QuickTransferWizardState = {}

export const QuickTransferFlow = (): ReactNode => {
  const navigate = useNavigate()
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const [state, dispatch] = useReducer(
    quickTransferWizardReducer,
    initialQuickTransferState
  )
  const [currentStep, setCurrentStep] = useState(0)

  const [analyticsStartTime] = useState<Date>(new Date())
  const QUICK_TRANSFER_WIZARD_STEPS = 12

  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    trackEventWithRobotSerial({
      name: ANALYTICS_QUICK_TRANSFER_EXIT_EARLY,
      properties: {
        step: currentStep,
      },
    })
    navigate('/protocols')
  }, true)

  const exitButtonProps: ComponentProps<typeof SmallButton> = {
    buttonType: 'tertiaryLowLight',
    buttonText: i18n.format(t('shared:exit'), 'capitalize'),
    onClick: confirmExit,
  }
  const sharedMiddleStepProps = {
    state,
    dispatch,
    onBack: () => {
      setCurrentStep(prevStep => prevStep - 1)
    },
    onNext: () => {
      setCurrentStep(prevStep => prevStep + 1)
    },
    exitButtonProps,
  }

  const contentInOrder: JSX.Element[] = [
    <CreateNewTransfer
      key={0}
      onNext={() => {
        setCurrentStep(prevStep => prevStep + 1)
      }}
      exitButtonProps={exitButtonProps}
    />,
    <SelectPipette key={1} {...sharedMiddleStepProps} />,
    <SelectTipRack key={2} {...sharedMiddleStepProps} />,
    <SelectSourceLabware key={3} {...sharedMiddleStepProps} />,
    <SelectSourceWells key={4} {...sharedMiddleStepProps} />,
    <SelectDestLabware key={5} {...sharedMiddleStepProps} />,
    <SelectDestWells key={6} {...sharedMiddleStepProps} />,
    <VolumeEntry key={7} {...sharedMiddleStepProps} />,
    <SelectPipettePath key={8} {...sharedMiddleStepProps} />,
    <SelectTipFrequency key={9} {...sharedMiddleStepProps} />,
    <SelectTipDropLocation key={10} {...sharedMiddleStepProps} />,
    <SelectLiquidClass key={11} {...sharedMiddleStepProps} />,
    <SummaryAndSettings
      key={QUICK_TRANSFER_WIZARD_STEPS}
      {...sharedMiddleStepProps}
      analyticsStartTime={analyticsStartTime}
    />,
  ]

  return (
    <>
      {showConfirmExit ? (
        <ConfirmExitModal confirmExit={confirmExit} cancelExit={cancelExit} />
      ) : (
        <>
          {currentStep < QUICK_TRANSFER_WIZARD_STEPS ? (
            <StepMeter
              totalSteps={QUICK_TRANSFER_WIZARD_STEPS}
              currentStep={currentStep + 1}
            />
          ) : null}
          {contentInOrder[currentStep]}
        </>
      )}
    </>
  )
}
