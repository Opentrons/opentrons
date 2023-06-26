import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  TYPOGRAPHY,
  PrimaryButton,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { css } from 'styled-components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import unmountGripper from '../../assets/videos/gripper-wizards/UNMOUNT_GRIPPER.webm'

import type { GripperWizardStepProps } from './types'
import type { GripperData } from '@opentrons/api-client'

export const UnmountGripper = (
  props: GripperWizardStepProps
): JSX.Element | null => {
  const { proceed, isRobotMoving, goBack, chainRunCommands } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])

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
    refetch()
      .then(() => {
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
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} flex="1">
        <Link
          role="button"
          css={TYPOGRAPHY.darkLinkH4SemiBold}
          onClick={() => setShowGripperStillDetected(false)}
        >
          {t('shared:go_back')}
        </Link>
        <PrimaryButton onClick={handleContinue}>{t('try_again')}</PrimaryButton>
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
      proceedButtonText={t('shared:continue')}
      proceed={handleContinue}
      back={goBack}
    />
  )
}
