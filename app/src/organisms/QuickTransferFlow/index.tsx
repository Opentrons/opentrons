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
  const [currentStep, setCurrentStep] = React.useState(1)

  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => history.push('protocols'), true)

  React.useEffect(() => {
    if (state.volume != null) {
      // until summary screen is implemented, log the final state and close flow
      // once volume is set
      console.log('final quick transfer flow state:', state)
      history.push('protocols')
    }
  }, [state.volume])

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

  const modalContentInOrder: JSX.Element[] = [
    <CreateNewTransfer
      onNext={() => setCurrentStep(prevStep => prevStep + 1)}
      exitButtonProps={exitButtonProps}
    />,
    <SelectPipette {...sharedMiddleStepProps} />,
    <SelectTipRack {...sharedMiddleStepProps} />,
    <SelectSourceLabware {...sharedMiddleStepProps} />,
    <SelectSourceWells {...sharedMiddleStepProps} />,
    <SelectDestLabware {...sharedMiddleStepProps} />,
    <SelectDestWells {...sharedMiddleStepProps} />,
    <VolumeEntry {...sharedMiddleStepProps} onNext={() => {}} />,
  ]

  return (
    <>
      {showConfirmExit ? (
        <ConfirmExitModal confirmExit={confirmExit} cancelExit={cancelExit} />
      ) : (
        <>
          <StepMeter
            totalSteps={QUICK_TRANSFER_WIZARD_STEPS}
            currentStep={currentStep}
            position={POSITION_STICKY}
            top="0"
          />
          {modalContentInOrder[currentStep]}
        </>
      )}
    </>
  )
}
