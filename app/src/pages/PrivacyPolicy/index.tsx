import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  TYPOGRAPHY,
  COLORS,
} from '@opentrons/components'

import {
  getAnalyticsOptedIn,
  toggleAnalyticsOptedIn,
  setAnalyticsOptInSeen,
  getAnalyticsOptInSeen,
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
  const seenOptedIn = useSelector(getAnalyticsOptInSeen)
  const optedIn = useSelector(getAnalyticsOptedIn)

  const handleAgree = (): void => {
    dispatch(setAnalyticsOptInSeen())
    dispatch(toggleAnalyticsOptedIn())
  }

  if (seenOptedIn && optedIn) {
    if (isUnboxingFlowOngoing) {
      history.push('/robot-settings/rename-robot')
    } else {
      history.push('/dashboard')
    }
  }

  return (
    <>
      {isUnboxingFlowOngoing ? (
        <StepMeter totalSteps={5} currentStep={3} />
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex justifyContent={JUSTIFY_CENTER} alignItems={ALIGN_CENTER}>
          <StyledText
            as="h2"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            paddingX={SPACING.spacing40}
            paddingY={SPACING.spacing32}
          >
            {t('acknowledge_privacy_policy')}
          </StyledText>
        </Flex>
        <Flex
          gridGap={SPACING.spacing40}
          paddingX={SPACING.spacing40}
          paddingBottom={SPACING.spacing40}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
            <Trans
              t={t}
              i18nKey={'privacy_policy_description'}
              components={{ block: <StyledText as="h4" /> }}
            />
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingX={SPACING.spacing24}
              paddingY={SPACING.spacing16}
              borderRadius={SPACING.spacing12}
              backgroundColor={COLORS.grey35}
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
            buttonText={t('agree')}
            onClick={handleAgree}
          />
        </Flex>
      </Flex>
    </>
  )
}
