import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  StepMeter,
  SPACING,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { ChildNavigation } from '../../organisms/ChildNavigation'

import type {
  QuickTransferSetupState,
  QuickTransferWizardAction,
} from './types'

// const initialQuickTransferState: QuickTransferSetupState = {}
export function reducer(
  state: QuickTransferSetupState,
  action: QuickTransferWizardAction
): QuickTransferSetupState {
  switch (action.type) {
    case 'SELECT_PIPETTE': {
      return {
        pipette: action.pipette,
      }
    }
    case 'SELECT_TIP_RACK': {
      return {
        pipette: state.pipette,
        tipRack: action.tipRack,
      }
    }
    case 'SOURCE_LABWARE': {
      return {
        pipette: state.pipette,
        tipRack: state.tipRack,
        source: action.labware,
      }
    }
    case 'SOURCE_WELLS': {
      return {
        pipette: state.pipette,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: action.wells,
      }
    }
    case 'DEST_LABWARE': {
      return {
        pipette: state.pipette,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: action.labware,
      }
    }
    case 'DEST_WELLS': {
      return {
        pipette: state.pipette,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: state.destination,
        destinationWells: action.wells,
      }
    }
    case 'VOLUME': {
      return {
        pipette: state.pipette,
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

export const NewTransferWizard = (): JSX.Element => {
  const history = useHistory()
  const { t } = useTranslation('quick_transfer')
  // const [state, dispatch] = React.useReducer(reducer, initialQuickTransferState)
  const [currentStep, setCurrentStep] = React.useState(1)
  const [wizardHeader, setWizardHeader] = React.useState<string>(
    t('create_new_transfer')
  )
  const [continueIsDisabled] = React.useState<boolean>(false)
  const wizardBody = <Flex>Wizard Body</Flex>
  // every child component will take state as a prop, an anonymous
  // dispatch function related to that step (except create new),
  // and a function to disable the continue button

  React.useEffect(() => {
    if (currentStep === 1) {
      setWizardHeader(t('create_new_transfer'))
    } else if (currentStep === 2) {
      setWizardHeader(t('select_attached_pipette'))
    } else if (currentStep === 3) {
      setWizardHeader(t('select_tip_rack'))
    } else if (currentStep === 4) {
      setWizardHeader(t('select_source_labware'))
    } else if (currentStep === 5) {
      setWizardHeader(t('select_source_wells'))
    } else if (currentStep === 6) {
      setWizardHeader(t('select_dest_labware'))
    } else if (currentStep === 7) {
      setWizardHeader(t('select_dest_wells'))
    } else if (currentStep === 8) {
      setWizardHeader(t('set_transfer_volume'))
    }
  }, [currentStep])

  return (
    <>
      <StepMeter totalSteps={8} currentStep={currentStep} />
      <Flex
        marginTop={SPACING.spacing8}
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
        flexDirection={DIRECTION_COLUMN}
      >
        <ChildNavigation
          header={wizardHeader}
          onClickBack={
            currentStep === 1
              ? undefined
              : () => {
                  setCurrentStep(prevStep => prevStep - 1)
                }
          }
          buttonText="Continue"
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
            buttonText: 'Exit',
            onClick: () => {
              history.push('protocols')
            },
          }}
          stepMeterPadding
        />
        <Flex marginTop={SPACING.spacing80}>{wizardBody}</Flex>
      </Flex>
    </>
  )
}
