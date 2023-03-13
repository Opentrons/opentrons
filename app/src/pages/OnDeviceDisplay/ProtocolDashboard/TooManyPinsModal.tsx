import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { ModalShell } from '../../../molecules/Modal'

import type { UseLongPressResult } from '@opentrons/components'

export function TooManyPinsModal(props: {
  longpress: UseLongPressResult
}): JSX.Element {
  const { longpress } = props
  const { t } = useTranslation('protocol_info')

  const handleCloseMaxPinsAlert = (): void => {
    longpress.setIsLongPressed(false)
  }

  return (
    <ModalShell
      borderRadius={BORDERS.size_three}
      height="26rem"
      onOutsideClick={handleCloseMaxPinsAlert}
      width="32.375rem"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing3}
        padding={SPACING.spacingXXL}
      >
        <StyledText
          fontSize="2rem"
          lineHeight="2.625rem"
          fontWeight={TYPOGRAPHY.fontWeightBold}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {t('too_many_pins_header')}
        </StyledText>
        <StyledText
          fontSize="1.75rem"
          lineHeight="2.625rem"
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {t('too_many_pins_body')}
        </StyledText>
        <Flex
          backgroundColor={COLORS.blueEnabled}
          borderRadius={BORDERS.size_three}
          flexDirection={DIRECTION_COLUMN}
          marginTop={SPACING.spacing6}
          onClick={handleCloseMaxPinsAlert}
          padding={SPACING.spacing4}
        >
          <StyledText
            color={COLORS.white}
            fontSize="1.375rem"
            lineHeight="1.75rem"
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('got_it')}
          </StyledText>
        </Flex>
      </Flex>
    </ModalShell>
  )
}
