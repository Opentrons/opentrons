import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Flex, StepMeter, SPACING } from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'
import { CreateNewTransfer } from './CreateNewTransfer'

import type {
  QuickTransferSetupState,
  QuickTransferWizardAction,
} from './types'

const QUICK_TRANSFER_WIZARD_STEPS = 8

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

export const QuickTransferFlow = (): JSX.Element => {
  const history = useHistory()
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  // const [state, dispatch] = React.useReducer(reducer, initialQuickTransferState)
  const [currentStep, setCurrentStep] = React.useState(1)
  const [wizardHeader, setWizardHeader] = React.useState<string | null>(null)
  const [continueIsDisabled] = React.useState<boolean>(false)
  const [wizardBody, setWizardBody] = React.useState<JSX.Element>(<></>)
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
  React.useEffect(() => {
    if (currentStep === 1) {
      setWizardHeader(null)
      setWizardBody(
        <CreateNewTransfer
          onNext={() => setCurrentStep(prevStep => prevStep + 1)}
          exitButtonProps={exitButtonProps}
        />
      )
    } else if (currentStep === 2) {
      setWizardHeader(t('select_attached_pipette'))
      setWizardBody(<></>)
    } else if (currentStep === 3) {
      setWizardHeader(t('select_tip_rack'))
      setWizardBody(<></>)
    } else if (currentStep === 4) {
      setWizardHeader(t('select_source_labware'))
      setWizardBody(<></>)
    } else if (currentStep === 5) {
      setWizardHeader(t('select_source_wells'))
      setWizardBody(<></>)
    } else if (currentStep === 6) {
      setWizardHeader(t('select_dest_labware'))
      setWizardBody(<></>)
    } else if (currentStep === 7) {
      setWizardHeader(t('select_dest_wells'))
      setWizardBody(<></>)
    } else if (currentStep === 8) {
      setWizardHeader(t('set_transfer_volume'))
      setWizardBody(<></>)
    }
  }, [currentStep])

  return (
    <>
      <StepMeter
        totalSteps={QUICK_TRANSFER_WIZARD_STEPS}
        currentStep={currentStep}
      />
      {wizardHeader != null ? (
        <Flex>
          <ChildNavigation
            header={wizardHeader}
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
          <Flex marginTop={SPACING.spacing80}>{wizardBody}</Flex>
        </Flex>
      ) : (
        wizardBody
      )}
    </>
  )
}
