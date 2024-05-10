import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useConditionalConfirm,
  StepMeter,
  POSITION_STICKY,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { ConfirmExitModal } from './ConfirmExitModal'
import { CreateNewTransfer } from './CreateNewTransfer'
import { SelectPipette } from './SelectPipette'
import { SelectTipRack } from './SelectTipRack'
import { SelectSourceLabware } from './SelectSourceLabware'
import { SelectSourceWells } from './SelectSourceWells'
import { SelectDestLabware } from './SelectDestLabware'
import { SelectDestWells } from './SelectDestWells'
import { VolumeEntry } from './VolumeEntry'
import { SummaryAndSettings } from './SummaryAndSettings'
import { quickTransferReducer } from './utils'

import type { QuickTransferSetupState } from './types'

const QUICK_TRANSFER_WIZARD_STEPS = 8
const initialQuickTransferState: QuickTransferSetupState = {}

export const QuickTransferFlow = (): JSX.Element => {
  const history = useHistory()
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const [state, dispatch] = React.useReducer(
    quickTransferReducer,
    initialQuickTransferState
  )
  const [currentStep, setCurrentStep] = React.useState(0)

  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => history.push('protocols'), true)

  const exitButtonProps: React.ComponentProps<typeof SmallButton> = {
    buttonType: 'tertiaryLowLight',
    buttonText: i18n.format(t('shared:exit'), 'capitalize'),
    onClick: confirmExit,
  }
  const sharedMiddleStepProps = {
    state,
    dispatch,
    onBack: () => setCurrentStep(prevStep => prevStep - 1),
    onNext: () => setCurrentStep(prevStep => prevStep + 1),
    exitButtonProps,
  }

  const contentInOrder: JSX.Element[] = [
    <CreateNewTransfer
      key={0}
      onNext={() => setCurrentStep(prevStep => prevStep + 1)}
      exitButtonProps={exitButtonProps}
    />,
    <SelectPipette key={1} {...sharedMiddleStepProps} />,
    <SelectTipRack key={2} {...sharedMiddleStepProps} />,
    <SelectSourceLabware key={3} {...sharedMiddleStepProps} />,
    <SelectSourceWells key={4} {...sharedMiddleStepProps} />,
    <SelectDestLabware key={5} {...sharedMiddleStepProps} />,
    <SelectDestWells key={6} {...sharedMiddleStepProps} />,
    <VolumeEntry key={7} {...sharedMiddleStepProps} />,
    <SummaryAndSettings
      key={8}
      {...sharedMiddleStepProps}
      onNext={() => {
        console.log('final quick transfer flow state:', state)
        history.push('protocols')
      }}
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
              position={POSITION_STICKY}
              top="0"
            />
          ) : null}
          {contentInOrder[currentStep]}
        </>
      )}
    </>
  )
}
