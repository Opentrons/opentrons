import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import type { GripperWizardStepProps } from './types'

interface AttachProbeProps extends GripperWizardStepProps {
  isExiting: boolean
}

export const AttachProbe = (props: AttachProbeProps): JSX.Element | null => {
  const {
    proceed,
    attachedGripper,
    chainRunCommands,
    isRobotMoving,
    goBack,
    setIsBetweenCommands,
    isExiting,
  } = props
  const { t } = useTranslation('gripper_wizard_flows')
  if (attachedGripper == null) return null
  const handleOnClick = (): void => {
    setIsBetweenCommands(true)
    chainRunCommands([
      {
        // @ts-expect-error calibration type not yet supported
        commandType: 'calibration/calibrateGripper' as const,
        params: { },
      },
      {
        commandType: 'home' as const,
        params: {
          axes: [], // TODO: use gripper motor axis const here
        },
      },
      {
        // @ts-expect-error calibration type not yet supported
        commandType: 'calibration/moveToLocation' as const,
        params: {
          location: 'attachOrDetach',
        },
      },
    ]).then(() => {
      setIsBetweenCommands(false)
      proceed()
    })
  }

  if (isRobotMoving)
    return (
      <InProgressModal description={t('gripper_calibrating')} />
    )
  return (
    <GenericWizardTile
      header={t('attach_probe')}
      rightHandBody={<StyledText>TODO image</StyledText>}
      bodyText={<StyledText as="p">{t('install_probe')}</StyledText>}
      proceedButtonText={t('initiate_calibration')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
