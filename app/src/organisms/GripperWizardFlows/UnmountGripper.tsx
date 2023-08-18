import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  Btn,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_END,
  ALIGN_CENTER,
  SPACING,
  TYPOGRAPHY,
  RESPONSIVENESS,
  PrimaryButton,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { css } from 'styled-components'
import { getIsOnDevice } from '../../redux/config'
import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import unmountGripper from '../../assets/videos/gripper-wizards/UNMOUNT_GRIPPER.webm'

import type { GripperWizardStepProps } from './types'
import type { GripperData } from '@opentrons/api-client'

const GO_BACK_BUTTON_TEXT_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    opacity: 70%;
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    font-size: ${TYPOGRAPHY.fontSize22};
    line-height: ${TYPOGRAPHY.lineHeight28};

    &:hover {
      opacity: 100%;
    }
  }
`

export const UnmountGripper = (
  props: GripperWizardStepProps
): JSX.Element | null => {
  const { proceed, isRobotMoving, goBack, chainRunCommands } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  const isOnDevice = useSelector(getIsOnDevice)
  const [isPending, setIsPending] = React.useState<boolean>(false)

  // TODO(bc, 2023-03-23): remove this temporary local poll in favor of the single top level poll in InstrumentsAndModules
  const { data: instrumentsQueryData, refetch } = useInstrumentsQuery({
    refetchInterval: 3000,
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
          chainRunCommands([{ commandType: 'home' as const, params: {} }], true)
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
      <InProgressModal
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )
  return showGripperStillDetected ? (
    <SimpleWizardBody
      iconColor={COLORS.errorEnabled}
      header={t('gripper_still_attached')}
      subHeader={t('please_retry_gripper_detach')}
      isSuccess={false}
    >
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={isOnDevice ? ALIGN_CENTER : ALIGN_FLEX_END}
        gridGap={SPACING.spacing8}
      >
        <Btn onClick={() => setShowGripperStillDetected(false)}>
          <StyledText css={GO_BACK_BUTTON_TEXT_STYLE}>
            {t('shared:go_back')}
          </StyledText>
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
      header={t('loosen_screws_and_detach')}
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
        <StyledText as="p">{t('hold_gripper_and_loosen_screws')}</StyledText>
      }
      proceedButtonText={t('continue')}
      proceed={handleContinue}
      proceedIsDisabled={isPending}
      back={goBack}
    />
  )
}
