import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  AnimationVideo,
  Btn,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

import mountGripper from '/app/assets/videos/gripper-wizards/MOUNT_GRIPPER.webm'
import { GenericWizardTile } from '/app/components/adhoc/shared/wizards/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/components/adhoc/shared/wizards/SimpleWizardBody'
import { SmallButton } from '/app/components/ODD/buttons'
import { getIsOnDevice } from '/app/redux/config'

import type { BadGripper, GripperData } from '@opentrons/api-client'
import type { GripperWizardStepProps } from './types'

const QUICK_GRIPPER_POLL_MS = 3000

const ALIGN_BUTTONS = css`
  align-items: ${ALIGN_FLEX_END};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    align-items: ${ALIGN_CENTER};
  }
`

export const MountGripper = (
  props: GripperWizardStepProps
): JSX.Element | null => {
  const { proceed, isRobotMoving } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared', 'branded'])
  const isOnDevice = useSelector(getIsOnDevice)
  const [showUnableToDetect, setShowUnableToDetect] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const { data: instrumentsQueryData, refetch } = useInstrumentsQuery({
    refetchInterval: QUICK_GRIPPER_POLL_MS,
  })
  const isGripperAttached = (instrumentsQueryData?.data ?? []).some(
    (i): i is GripperData | BadGripper => i.instrumentType === 'gripper'
  )
  const handleOnClick = (): void => {
    setIsPending(true)
    refetch()
      .then(() => {
        isGripperAttached ? proceed() : setShowUnableToDetect(true)
        setIsPending(false)
      })
      .catch(() => {
        setShowUnableToDetect(true)
        setIsPending(false)
      })
  }

  if (isRobotMoving) {
    return (
      <SimpleWizardInProgressBody
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )
  }
  return showUnableToDetect ? (
    <SimpleWizardBody
      header={t('unable_to_detect_gripper')}
      iconColor={COLORS.red50}
      isSuccess={false}
    >
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        css={ALIGN_BUTTONS}
        gridGap={SPACING.spacing8}
      >
        <Btn
          onClick={() => {
            setShowUnableToDetect(false)
          }}
        >
          <StyledText
            desktopStyle="bodyDefaultSemiBold"
            oddStyle="bodyTextSemiBold"
            color={COLORS.grey50}
            paddingLeft={SPACING.spacing32}
          >
            {t('shared:go_back')}
          </StyledText>
        </Btn>
        {isOnDevice ? (
          <SmallButton
            buttonText={t('try_again')}
            disabled={isPending}
            onClick={handleOnClick}
          />
        ) : (
          <PrimaryButton disabled={isPending} onClick={handleOnClick}>
            {t('try_again')}
          </PrimaryButton>
        )}
      </Flex>
    </SimpleWizardBody>
  ) : (
    <GenericWizardTile
      header={
        <StyledText
          desktopStyle="headingSmallBold"
          oddStyle="level4HeaderSemiBold"
        >
          {t('branded:connect_and_screw_in_gripper')}
        </StyledText>
      }
      rightHandBody={
        <AnimationVideo
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          aria-label="connect and screw in gripper"
        >
          <source src={mountGripper} />
        </AnimationVideo>
      }
      bodyText={
        <StyledText
          desktopStyle="bodyDefaultRegular"
          oddStyle="bodyTextRegular"
        >
          {t('attached_gripper_and_screw_in')}
        </StyledText>
      }
      proceedButtonText={t('continue')}
      proceedIsDisabled={isPending}
      proceed={handleOnClick}
    />
  )
}
