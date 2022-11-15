import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import type { GripperWizardStepProps } from './types'

export const MountGripper = (props: GripperWizardStepProps): JSX.Element | null => {
  const {
    proceed,
    attachedGripper,
    chainRunCommands,
    isRobotMoving,
    goBack,
    setIsBetweenCommands,
  } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  if (attachedGripper == null) return null
  const handleOnClick = (): void => {
    // setIsBetweenCommands(true)
    // chainRunCommands([
    //  // TODO: move gantry to mount/unmount location here 
    // ]).then(() => {
    //   setIsBetweenCommands(false)
    //   proceed()
    // })
    proceed()
  }

  if (isRobotMoving)
    return (
      <InProgressModal description={t('shared:stand_back_robot_is_in_motion')} />
    )
  return (
    <GenericWizardTile
      header={t('mount_gripper')}
      rightHandBody={<StyledText>TODO image of gripper being mounted</StyledText>}
      bodyText={<StyledText as="p">{t('hold_onto_gripper_and_attach')}</StyledText>}
      proceedButtonText={t('shared:continue')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
