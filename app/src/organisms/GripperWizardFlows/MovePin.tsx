import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW, MOVE_PIN_TO_FRONT_JAW, REMOVE_PIN_FROM_REAR_JAW } from './constants'
import type { GripperWizardStepProps, MovePinStep } from './types'

interface MovePinProps extends GripperWizardStepProps, MovePinStep {
  isExiting: boolean
}

export const MovePin = (props: MovePinProps): JSX.Element | null => {
  const {
    proceed,
    attachedGripper,
    chainRunCommands,
    isRobotMoving,
    goBack,
    setIsBetweenCommands,
    isExiting,
    movement
  } = props
  const { t } = useTranslation('gripper_wizard_flows')
  if (attachedGripper == null) return null
  const handleOnClick = (): void => {
    setIsBetweenCommands(true)
    // chainRunCommands([
    //   {
    //     // @ts-expect-error calibration type not yet supported
    //     commandType: 'calibration/calibrateGripper' as const,
    //     params: { },
    //   },
    //   {
    //     commandType: 'home' as const,
    //     params: {
    //       axes: [], // TODO: use gripper motor axis const here
    //     },
    //   },
    //   {
    //     // @ts-expect-error calibration type not yet supported
    //     commandType: 'calibration/moveToLocation' as const,
    //     params: {
    //       location: 'attachOrDetach',
    //     },
    //   },
    // ]).then(() => {
    //   setIsBetweenCommands(false)
    //   proceed()
    // })
    proceed()
  }
  const infoByMovement: { [m in typeof movement]: {
    inProgressText: string,
    header: string,
    body: string,
    buttonText: string,
    image: React.ReactNode
  } } = {
    [MOVE_PIN_TO_FRONT_JAW]: {
      inProgressText: t('gripper_calibrating'),
      header: t('attach_probe'),
      body: t('install_probe'),
      buttonText: t('initiate_calibration'),
      image: <StyledText>TODO image</StyledText>
    },
    [MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW]: {
      inProgressText: t('gripper_calibrating'),
      header: t('attach_probe'),
      body: t('install_probe'),
      buttonText: t('initiate_calibration'),
      image: <StyledText>TODO image</StyledText>
    },
    [REMOVE_PIN_FROM_REAR_JAW]: {
      inProgressText: t('gripper_calibrating'),
      header: t('attach_probe'),
      body: t('install_probe'),
      buttonText: t('initiate_calibration'),
      image: <StyledText>TODO image</StyledText>
    }
  }

  const { inProgressText, header, body, buttonText, image } = infoByMovement[movement]
  if (isRobotMoving)
    return (
      <InProgressModal description={inProgressText} />
    )
  return (
    <GenericWizardTile
      header={header}
      rightHandBody={image}
      bodyText={<StyledText as="p">{body}</StyledText>}
      proceedButtonText={buttonText}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
