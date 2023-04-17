import {
  Flex,
  TYPOGRAPHY,
  COLOR_ERROR,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  ALIGN_CENTER,
  SPACING,
  PrimaryButton,
} from '@opentrons/components'
import { css } from 'styled-components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import mountGripper from '../../assets/videos/gripper-wizards/MOUNT_GRIPPER.webm'

import type { GripperWizardStepProps } from './types'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

const CAPITALIZE_FIRST_LETTER_STYLE = css`
  &:first-letter {
    text-transform: uppercase;
  }
`
export const MountGripper = (
  props: GripperWizardStepProps
): JSX.Element | null => {
  const { proceed, attachedGripper, isRobotMoving, goBack } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  const [showUnableToDetect, setShowUnableToDetect] = React.useState(false)
  const handleOnClick = (): void => {
    attachedGripper == null ? setShowUnableToDetect(true) : proceed()
  }
  // TODO(bc, 2023-03-23): remove this temporary local poll in favor of the single top level poll in InstrumentsAndModules
  useInstrumentsQuery({ refetchInterval: 3000 })

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
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing3}
      >
        <Link
          role="button"
          css={TYPOGRAPHY.darkLinkH4SemiBold}
          onClick={goBack}
        >
          {t('shared:go_back')}
        </Link>
        <PrimaryButton
          css={CAPITALIZE_FIRST_LETTER_STYLE}
          onClick={() => setShowUnableToDetect(false)}
        >
          {t('shared:try_again')}
        </PrimaryButton>
      </Flex>
    </SimpleWizardBody>
  ) : (
    <GenericWizardTile
      header={t('connect_and_screw_in_gripper')}
      rightHandBody={
        <video
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
          aria-label="connect and screw in gripper"
        >
          <source src={mountGripper} />
        </video>
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
