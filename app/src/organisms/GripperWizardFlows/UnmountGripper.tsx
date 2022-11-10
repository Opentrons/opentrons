import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import type { GripperWizardStepProps } from './types'

export const UnmountGripper = (props: GripperWizardStepProps): JSX.Element | null => {
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
    setIsBetweenCommands(true)
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
      header={t('unmount_gripper')}
      rightHandBody={<StyledText>TODO image of gripper being unmounted</StyledText>}
      bodyText={<StyledText as="p">{t('loosen_screws_and_unmount_gripper')}</StyledText>}
      proceedButtonText={t('confirm_detached')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
