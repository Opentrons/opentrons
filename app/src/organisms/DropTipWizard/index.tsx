import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import { WizardHeader } from '../../molecules/WizardHeader'
import { ChooseLocation } from './ChooseLocation'
import { AdjustLocation } from './AdjustLocation'
import { Success } from './Success'
import { SmallButton } from '../../atoms/buttons'

interface DropTipWizardProps {
  close: () => void
}

export function DropTipWizard(props: DropTipWizardProps): JSX.Element {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const { t } = useTranslation('robot_controls')

  const stepForward = () => setCurrentStepIndex(currentStepIndex + 1)
  const stepBack = () => setCurrentStepIndex(currentStepIndex - 1)

  const wizardSteps = [
    <ChooseLocation key="chooseLocation" proceed={stepForward} />,
    <AdjustLocation
      key="adjustLocation"
      proceed={stepForward}
      goBack={stepBack}
    />,
    <Flex key="confirm">
      CONFIRM THIS IS WHAT YOU WANT
      <SmallButton
        onClick={stepForward}
        buttonText="YES"
        buttonType="primary"
      />
    </Flex>,
    <Success key="success" proceed={close} />,
  ]

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="992px"
      height="568px"
      left="14.5px"
      top="16px"
      border={BORDERS.lineBorder}
      boxShadow={BORDERS.shadowSmall}
      borderRadius={BORDERS.borderRadiusSize4}
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
    >
      <WizardHeader
        title={t('drop_tip')}
        currentStep={currentStepIndex + 1}
        totalSteps={wizardSteps.length}
        onExit={close}
      />
      {wizardSteps[currentStepIndex]}
    </Flex>
  )
}
