import { useSelector } from 'react-redux'
import {
  Flex,
  Btn,
  TYPOGRAPHY,
  COLOR_ERROR,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  COLORS,
  RESPONSIVENESS,
  PrimaryButton,
  ALIGN_FLEX_END,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { css } from 'styled-components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { getIsOnDevice } from '../../redux/config'
import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import mountGripper from '../../assets/videos/gripper-wizards/MOUNT_GRIPPER.webm'

import type { GripperWizardStepProps } from './types'
import type { BadGripper, GripperData } from '@opentrons/api-client'

const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    opacity: 70%;
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    font-size: ${TYPOGRAPHY.fontSize22};

    &:hover {
      opacity: 100%;
    }
  }
`

export const MountGripper = (
  props: GripperWizardStepProps
): JSX.Element | null => {
  const { proceed, isRobotMoving, goBack } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  const isOnDevice = useSelector(getIsOnDevice)
  const [showUnableToDetect, setShowUnableToDetect] = React.useState(false)

  // TODO(bc, 2023-03-23): remove this temporary local poll in favor of the single top level poll in InstrumentsAndModules
  const { data: instrumentsQueryData, refetch } = useInstrumentsQuery({
    refetchInterval: 3000,
  })
  const isGripperAttached = (instrumentsQueryData?.data ?? []).some(
    (i): i is GripperData | BadGripper => i.instrumentType === 'gripper'
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
        alignItems={ALIGN_FLEX_END}
        gridGap={SPACING.spacing8}
      >
        <Btn onClick={goBack}>
          <StyledText css={GO_BACK_BUTTON_STYLE}>
            {t('shared:go_back')}
          </StyledText>
        </Btn>
        {isOnDevice ? (
          <SmallButton
            buttonText={t('try_again')}
            buttonType="primary"
            onClick={proceed}
          />
        ) : (
          <PrimaryButton onClick={() => setShowUnableToDetect(false)}>
            {t('try_again')}
          </PrimaryButton>
        )}
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
      proceedButtonText={t('continue')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
