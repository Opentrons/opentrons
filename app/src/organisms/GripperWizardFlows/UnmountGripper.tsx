import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
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
import { getIsOnDevice } from '../../redux/config'
import { SmallButton } from '../../atoms/buttons'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '../../molecules/SimpleWizardBody'
import unmountGripper from '../../assets/videos/gripper-wizards/UNMOUNT_GRIPPER.webm'

import type { GripperWizardStepProps } from './types'
import type { GripperData } from '@opentrons/api-client'

const GO_BACK_BUTTON_TEXT_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.grey50};

  &:hover {
    opacity: 70%;
  }

  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    font-size: ${TYPOGRAPHY.fontSize22};
    line-height: ${TYPOGRAPHY.lineHeight28};

    &:hover {
      opacity: 100%;
    }
  }
`

const QUICK_GRIPPER_POLL_MS = 3000

export const UnmountGripper = (
  props: GripperWizardStepProps
): JSX.Element | null => {
  const { proceed, isRobotMoving, goBack, chainRunCommands } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared', 'branded'])
  const isOnDevice = useSelector(getIsOnDevice)
  const [isPending, setIsPending] = React.useState<boolean>(false)
  const { data: instrumentsQueryData, refetch } = useInstrumentsQuery({
    refetchInterval: QUICK_GRIPPER_POLL_MS,
  })
  const isGripperStillAttached = (instrumentsQueryData?.data ?? []).some(
    (i): i is GripperData => i.instrumentType === 'gripper' && i.ok
  )

  const [
    showGripperStillDetected,
    setShowGripperStillDetected,
  ] = React.useState(false)
  const handleContinue = (): void => {
    setIsPending(true)
    refetch()
      .then(() => {
        setIsPending(false)
        if (!isGripperStillAttached) {
          chainRunCommands?.(
            [{ commandType: 'home' as const, params: {} }],
            true
          )
            .then(() => {
              proceed()
            })
            .catch(() => {
              // TODO(BC, 2023-05-18): set fatal error here if home fails
            })
        } else {
          setShowGripperStillDetected(true)
        }
      })
      .catch(() => {
        setIsPending(false)
        setShowGripperStillDetected(true)
      })
  }

  if (isRobotMoving)
    return (
      <SimpleWizardInProgressBody
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )
  return showGripperStillDetected ? (
    <SimpleWizardBody
      iconColor={COLORS.red50}
      header={t('branded:gripper_still_attached')}
      isSuccess={false}
    >
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={isOnDevice ? ALIGN_CENTER : ALIGN_FLEX_END}
        gridGap={SPACING.spacing8}
      >
        <Btn
          paddingLeft={isOnDevice ? 0 : SPACING.spacing32}
          onClick={() => {
            setShowGripperStillDetected(false)
          }}
        >
          <LegacyStyledText css={GO_BACK_BUTTON_TEXT_STYLE}>
            {t('shared:go_back')}
          </LegacyStyledText>
        </Btn>
        {isOnDevice ? (
          <SmallButton
            disabled={isPending}
            buttonText={t('try_again')}
            onClick={handleContinue}
          />
        ) : (
          <PrimaryButton disabled={isPending} onClick={handleContinue}>
            {t('try_again')}
          </PrimaryButton>
        )}
      </Flex>
    </SimpleWizardBody>
  ) : (
    <GenericWizardTile
      header={t('branded:loosen_screws_and_detach')}
      rightHandBody={
        <video
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
          aria-label="unscrew and disconnect gripper"
        >
          <source src={unmountGripper} />
        </video>
      }
      bodyText={
        <LegacyStyledText as="p">
          {t('hold_gripper_and_loosen_screws')}
        </LegacyStyledText>
      }
      proceedButtonText={t('continue')}
      proceed={handleContinue}
      proceedIsDisabled={isPending}
      back={goBack}
    />
  )
}
