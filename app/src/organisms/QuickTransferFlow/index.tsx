import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  StepMeter,
  SPACING,
  POSITION_STICKY,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'
import { CreateNewTransfer } from './CreateNewTransfer'
import { SelectPipette } from './SelectPipette'
import { SelectTipRack } from './SelectTipRack'
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
  const [continueIsDisabled] = React.useState<boolean>(false)

  // every child component will take state as a prop, an anonymous
  // dispatch function related to that step (except create new),
  // and a function to disable the continue button

  const exitButtonProps: React.ComponentProps<typeof SmallButton> = {
    buttonType: 'tertiaryLowLight',
    buttonText: i18n.format(t('shared:exit'), 'capitalize'),
    onClick: () => {
      history.push('protocols')
    },
  }

  // these will be moved to the child components once they all exist
  const ORDERED_STEP_HEADERS: string[] = [
    t('create_new_transfer'),
    t('select_attached_pipette'),
    t('select_tip_rack'),
    t('select_source_labware'),
    t('select_source_wells'),
    t('select_dest_labware'),
    t('select_dest_wells'),
    t('set_transfer_volume'),
  ]

  const header = ORDERED_STEP_HEADERS[currentStep - 1]
  let modalContent: JSX.Element | null = null
  if (currentStep === 1) {
    modalContent = (
      <CreateNewTransfer
        onNext={() => setCurrentStep(prevStep => prevStep + 1)}
        exitButtonProps={exitButtonProps}
      />
    )
  } else if (currentStep === 2) {
    modalContent = (
      <SelectPipette
        state={state}
        dispatch={dispatch}
        onBack={() => setCurrentStep(prevStep => prevStep - 1)}
        onNext={() => setCurrentStep(prevStep => prevStep + 1)}
        exitButtonProps={exitButtonProps}
      />
    )
  } else if (currentStep === 3) {
    modalContent = (
      <SelectTipRack
        state={state}
        dispatch={dispatch}
        onBack={() => setCurrentStep(prevStep => prevStep - 1)}
        onNext={() => setCurrentStep(prevStep => prevStep + 1)}
        exitButtonProps={exitButtonProps}
      />
    )
  } else {
    modalContent = null
  }

  // until each page is wired up, show header title with empty screen
  return (
    <>
      <StepMeter
        totalSteps={QUICK_TRANSFER_WIZARD_STEPS}
        currentStep={currentStep}
        position={POSITION_STICKY}
        top="0"
      />
      {modalContent == null ? (
        <Flex>
          <ChildNavigation
            header={header}
            onClickBack={
              currentStep === 1
                ? undefined
                : () => {
                    setCurrentStep(prevStep => prevStep - 1)
                  }
            }
            buttonText={i18n.format(t('shared:continue'), 'capitalize')}
            onClickButton={() => {
              if (currentStep === 8) {
                history.push('protocols')
              } else {
                setCurrentStep(prevStep => prevStep + 1)
              }
            }}
            buttonIsDisabled={continueIsDisabled}
            secondaryButtonProps={{
              buttonType: 'tertiaryLowLight',
              buttonText: i18n.format(t('shared:exit'), 'capitalize'),
              onClick: () => {
                history.push('protocols')
              },
            }}
            top={SPACING.spacing8}
          />
          <Flex marginTop={SPACING.spacing80}>{modalContent}</Flex>
        </Flex>
      ) : (
        modalContent
      )}
    </>
  )
}
