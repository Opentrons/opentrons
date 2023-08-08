import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Btn,
  DIRECTION_ROW,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'
import {
  NOT_PRESENT,
  PHYSICALLY_ENGAGED,
  LOGICALLY_ENGAGED,
  useEstopContext,
} from '../EmergencyStop'

import type { EstopState } from '@opentrons/api-client'

interface EstopBannerProps {
  status?: EstopState
}

export function EstopBanner({ status }: EstopBannerProps): JSX.Element {
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
        <StyledText as="p">{bannerText}</StyledText>
        <Btn onClick={handleClick}>
          <StyledText textDecoration={TYPOGRAPHY.textDecorationUnderline}>
            {buttonText}
          </StyledText>
        </Btn>
      </Flex>
    </Banner>
  )
}
