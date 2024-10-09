import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StepMeter } from '/app/atoms/StepMeter'
import { MediumButton } from '/app/atoms/buttons'
import screenImage from '/app/assets/images/on-device-display/odd_abstract@x2.png'

const IMAGE_ALT = 'finish setting up a robot'

interface ConfirmRobotNameProps {
  robotName: string
}

export function ConfirmRobotName({
  robotName,
}: ConfirmRobotNameProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const navigate = useNavigate()

  const handleClick = (): void => {
    navigate('/dashboard')
  }
  return (
    <>
      <StepMeter totalSteps={6} currentStep={6} />
      <Flex
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex justifyContent={JUSTIFY_CENTER} marginBottom="3.041875rem">
          <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('name_love_it', { name: robotName })}
          </LegacyStyledText>
        </Flex>
        <Flex height="26.5625rem" justifyContent={JUSTIFY_CENTER}>
          <Flex
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            flexDirection={DIRECTION_COLUMN}
          >
            <img
              alt={IMAGE_ALT}
              src={screenImage}
              width="944px"
              height="236px"
            />
            <LegacyStyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              marginTop={SPACING.spacing12}
              marginBottom={SPACING.spacing40}
              color={COLORS.grey60}
            >
              {t('your_robot_is_ready_to_go')}
            </LegacyStyledText>
            <MediumButton
              buttonType="primary"
              buttonCategory="rounded"
              buttonText={t('finish_setup')}
              onClick={handleClick}
            />
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
