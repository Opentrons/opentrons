import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Flex, StepMeter, SPACING } from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'
import { CreateNewTransfer } from './CreateNewTransfer'
import { SelectPipette } from './SelectPipette'

import type {
  QuickTransferSetupState,
  QuickTransferWizardAction,
} from './types'

const QUICK_TRANSFER_WIZARD_STEPS = 8

const initialQuickTransferState: QuickTransferSetupState = {}
export function reducer(
  state: QuickTransferSetupState,
  action: QuickTransferWizardAction
): QuickTransferSetupState {
  switch (action.type) {
    case 'SELECT_PIPETTE': {
      return {
        pipette: action.pipette,
        mount: action.mount,
      }
    }
    case 'SELECT_TIP_RACK': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: action.tipRack,
      }
    }
    case 'SET_SOURCE_LABWARE': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: action.labware,
      }
    }
    case 'SET_SOURCE_WELLS': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: action.wells,
      }
    }
    case 'SET_DEST_LABWARE': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: action.labware,
      }
    }
    case 'SET_DEST_WELLS': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: state.destination,
        destinationWells: action.wells,
      }
    }
    case 'SET_VOLUME': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: state.destination,
        destinationWells: state.destinationWells,
        volume: action.volume,
      }
    }
  }
}

export const QuickTransferFlow = (): JSX.Element => {
  const history = useHistory()
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const [state, dispatch] = React.useReducer(reducer, initialQuickTransferState)
  const [currentStep, setCurrentStep] = React.useState(1)
  const [continueIsDisabled] = React.useState<boolean>(false)

  React.useEffect(() => {
    console.log(state)
  }, [state])

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
  } else {
    modalContent = null
  }

  // until each page is wired up, show header title with empty screen

  return (
    <>
      <StepMeter
        totalSteps={QUICK_TRANSFER_WIZARD_STEPS}
        currentStep={currentStep}
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
