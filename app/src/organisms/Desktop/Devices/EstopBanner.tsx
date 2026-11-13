import { useTranslation } from 'react-i18next'

import {
  Banner,
  Btn,
  DIRECTION_ROW,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  LOGICALLY_ENGAGED,
  NOT_PRESENT,
  PHYSICALLY_ENGAGED,
  useEstopContext,
} from '/app/organisms/EmergencyStop'

import type { ReactNode } from 'react'
import type { EstopState } from '@opentrons/api-client'

interface EstopBannerProps {
  status?: EstopState
}

export function EstopBanner({ status }: EstopBannerProps): ReactNode {
  const { t } = useTranslation('device_details')
  const { setIsEmergencyStopModalDismissed } = useEstopContext()

  let bannerText = ''
  let buttonText = ''
  switch (status) {
    case PHYSICALLY_ENGAGED:
      bannerText = t('estop_pressed')
      buttonText = t('reset_estop')
      break
    case LOGICALLY_ENGAGED:
      bannerText = t('estop_disengaged')
      buttonText = t('resume_operation')
      break
    case NOT_PRESENT:
      bannerText = t('estop_disconnected')
      buttonText = t('resume_operation')
      break
    default:
      break
  }

  const handleClick = (): void => {
    setIsEmergencyStopModalDismissed(false)
  }

  return (
    <Banner type="error" width="100%">
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing2}>
        <LegacyStyledText forwardedAs="p">{bannerText}</LegacyStyledText>
        <Btn onClick={handleClick}>
          <LegacyStyledText textDecoration={TYPOGRAPHY.textDecorationUnderline}>
            {buttonText}
          </LegacyStyledText>
        </Btn>
      </Flex>
    </Banner>
  )
}
