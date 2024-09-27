import { useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Btn,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { css } from 'styled-components'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getIsOnDevice } from '/app/redux/config'
import { SmallButton } from '/app/atoms/buttons'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'
import mountGripper from '/app/assets/videos/gripper-wizards/MOUNT_GRIPPER.webm'

import type { GripperWizardStepProps } from './types'
import type { BadGripper, GripperData } from '@opentrons/api-client'

const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.grey50};
  padding-left: ${SPACING.spacing32};

  &:hover {
    opacity: 70%;
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    font-size: ${TYPOGRAPHY.fontSize22};
    padding-left: 0rem;
    &:hover {
      opacity: 100%;
    }
  }
`
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

  if (isRobotMoving)
    return (
      <SimpleWizardInProgressBody
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )
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
          <LegacyStyledText css={GO_BACK_BUTTON_STYLE}>
            {t('shared:go_back')}
          </LegacyStyledText>
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
      header={t('branded:connect_and_screw_in_gripper')}
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
        <LegacyStyledText as="p">
          {t('attached_gripper_and_screw_in')}
        </LegacyStyledText>
      }
      proceedButtonText={t('continue')}
      proceedIsDisabled={isPending}
      proceed={handleOnClick}
    />
  )
}
