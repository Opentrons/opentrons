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
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { css } from 'styled-components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import mountGripper from '../../assets/videos/gripper-wizards/MOUNT_GRIPPER.webm'

import type { GripperWizardStepProps } from './types'

const CAPITALIZE_FIRST_LETTER_STYLE = css`
  &:first-letter {
    text-transform: uppercase;
  }
`
export const MountGripper = (
  props: GripperWizardStepProps
): JSX.Element | null => {
  const { proceed, isRobotMoving, goBack } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  const [showUnableToDetect, setShowUnableToDetect] = React.useState(false)

  // TODO(bc, 2023-03-23): remove this temporary local poll in favor of the single top level poll in InstrumentsAndModules
  const { data: instrumentsQueryData, refetch } = useInstrumentsQuery({
    refetchInterval: 3000,
  })
  const isGripperAttached = (instrumentsQueryData?.data ?? []).some(
    i => i.mount === 'extension'
  )

  const handleOnClick = (): void => {
    refetch()
      .then(() => {
        isGripperAttached ? proceed() : setShowUnableToDetect(true)
      })
      .catch(() => {
        setShowUnableToDetect(true)
      })
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
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
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
