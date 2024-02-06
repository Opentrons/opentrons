import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  toggleAnalyticsOptedIn,
  setAnalyticsOptInSeen,
} from '../../redux/analytics'
import { useIsUnboxingFlowOngoing } from '../../organisms/RobotSettingsDashboard/NetworkSettings/hooks'
import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons'
import { StepMeter } from '../../atoms/StepMeter'

import type { Dispatch } from '../../redux/types'
import imgSrc from '../../assets/images/on-device-display/privacy_policy_qrcode.png'

const PRIVACY_POLICY_URL = 'opentrons.com/privacy-policy/'
const IMG_ALT = 'QR Code for Opentrons Privacy Policy'

export function PrivacyPolicy(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()

  const handleAgree = (): void => {
    dispatch(setAnalyticsOptInSeen())
    dispatch(toggleAnalyticsOptedIn())
    if (isUnboxingFlowOngoing) {
      history.push('/robot-settings/rename-robot')
    } else {
      history.push('/dashboard')
    }
  }

  return (
    <>
      <StepMeter totalSteps={6} currentStep={4} />
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText
          as="h2"
          fontWeight="bold"
          paddingX={SPACING.spacing40}
          paddingY={SPACING.spacing32}
          justifyContent={JUSTIFY_CENTER}
        >
          {t('acknowledge_privacy_policy')}
        </StyledText>
        <Flex
          gridGap={SPACING.spacing40}
          paddingX={SPACING.spacing40}
          paddingBottom={SPACING.spacing40}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
            <StyledText as="h4">{t('privacy_policy_description')}</StyledText>
            <StyledText
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              fontSize={TYPOGRAPHY.fontSize22}
              lineHeight={TYPOGRAPHY.lineHeight28}
              paddingX={SPACING.spacing24}
              paddingY={SPACING.spacing16}
              borderRadius={SPACING.spacing12}
            >
              {PRIVACY_POLICY_URL}
            </StyledText>
          </Flex>
          <Flex>
            <img src={imgSrc} alt={IMG_ALT} width="178px" height="178px" />
          </Flex>
        </Flex>
        <Flex padding={SPACING.spacing40} paddingTop={SPACING.spacing48}>
          <MediumButton
            flex="1"
            buttonText={(t('agree'), 'capitalize')}
            onClick={handleAgree}
          />
        </Flex>
      </Flex>
    </>
  )
}
