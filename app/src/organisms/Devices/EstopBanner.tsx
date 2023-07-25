import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { DIRECTION_ROW, Flex, SPACING, TYPOGRAPHY } from '@opentrons/components'

import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'

import type { EstopState } from '@opentrons/api-client'

interface EstopBannerProps {
  status?: EstopState
}

export function EstopBanner({ status }: EstopBannerProps): JSX.Element {
  const { t } = useTranslation('device_details')
  let bannerText = ''
  let buttonText = ''
  switch (status) {
    case 'physicallyEngaged':
      bannerText = t('estop_pressed')
      buttonText = t('reset_estop')
      break
    case 'logicallyEngaged':
      bannerText = t('estop_disengaged')
      buttonText = t('resume_operation')
      break
    case 'notPresent':
      bannerText = t('estop_disconnected')
      buttonText = t('resume_operation')
      break
    default:
      break
  }

  const handleClick = (): void => {
    // reopen modal
    console.log('reopen a modal')
  }

  return (
    <Banner type="error" width="100%">
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing2}>
        <StyledText as="p">{bannerText}</StyledText>
        <StyledText
          textDecoration={TYPOGRAPHY.textDecorationUnderline}
          onClick={handleClick}
        >
          {buttonText}
        </StyledText>
      </Flex>
    </Banner>
  )
}
