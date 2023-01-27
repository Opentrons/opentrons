import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, Flex, JUSTIFY_SPACE_BETWEEN, Link, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import type { GripperWizardStepProps } from './types'

export const UnmountGripper = (
  props: GripperWizardStepProps
): JSX.Element | null => {
  const {
    proceed,
    attachedGripper,
    isRobotMoving,
    goBack,
    chainRunCommands,
  } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  const [showGripperStillDetected, setShowGripperStillDetected] = React.useState(false)
  const handleContinue = (): void => {
    if (attachedGripper == null) {
      chainRunCommands([{ commandType: 'home' as const, params: {} }], true).then(() => {
        proceed()
      })
    } else {
      chainRunCommands([{ commandType: 'home' as const, params: {} }], true).then(() => {
        setShowGripperStillDetected(true)
      })

    }
  }

  if (isRobotMoving)
    return (
      <InProgressModal
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )
  return showGripperStillDetected
    ? (
      <SimpleWizardBody
        iconColor={COLORS.errorEnabled}
        header={t('gripper_still_attached')}
        subHeader={t('please_retry_gripper_detach')}
        isSuccess={false}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} flex="1">
          <Link
            role="button"
            css={TYPOGRAPHY.darkLinkH4SemiBold}
            onClick={() => setShowGripperStillDetected(false)}>
            {t('shared:go_back')}
          </Link>
          <PrimaryButton
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            onClick={() => {
              handleContinue()
            }}>
            {t('shared:try_again')}
          </PrimaryButton>
        </Flex>
      </SimpleWizardBody>
    ) : (
      <GenericWizardTile
        header={t('loosen_screws_and_detach')}
        rightHandBody={
          <StyledText>TODO image of gripper being unmounted</StyledText>
        }
        bodyText={
          <StyledText as="p">{t('hold_gripper_and_loosen_screws')}</StyledText >
        }
        proceedButtonText={t('shared:continue')}
        proceed={handleContinue}
        back={goBack}
      />
    )
}
