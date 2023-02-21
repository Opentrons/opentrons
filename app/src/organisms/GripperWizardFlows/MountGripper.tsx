import { Flex, TYPOGRAPHY, COLOR_ERROR, JUSTIFY_SPACE_BETWEEN, Link } from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import type { GripperWizardStepProps } from './types'

export const MountGripper = (
  props: GripperWizardStepProps
): JSX.Element | null => {
  const {
    proceed,
    attachedGripper,
    isRobotMoving,
    goBack,
  } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  const [showUnableToDetect, setShowUnableToDetect] = React.useState(false)
  const handleOnClick = (): void => {
    attachedGripper == null
      ? setShowUnableToDetect(true)
      : proceed()
  }

  if (isRobotMoving)
    return (
      <InProgressModal
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )
  return showUnableToDetect ? (
    <SimpleWizardBody
      header={t('unable_to_detect_gripper')}
      iconColor={COLOR_ERROR}
      isSuccess={false}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Link
            role="button"
            css={TYPOGRAPHY.darkLinkH4SemiBold}
            onClick={goBack}>
            {t('shared:go_back')}
          </Link>
        <PrimaryButton onClick={() => setShowUnableToDetect(false)}>{t('shared:try_again')}</PrimaryButton>
      </Flex> 
    </SimpleWizardBody>
  ) : (
    <GenericWizardTile
      header={t('connect_and_screw_in_gripper')}
      rightHandBody={
        <StyledText>TODO image of gripper being mounted</StyledText>
      }
      bodyText={
        <StyledText as="p">{t('attached_gripper_and_screw_in')}</StyledText>
      }
      proceedButtonText={t('shared:continue')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
