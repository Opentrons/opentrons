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

export function TooManyPinsModal(props: {
  handleCloseMaxPinsAlert: () => void
}): JSX.Element {
  const { handleCloseMaxPinsAlert } = props
  const { t } = useTranslation(['protocol_info', 'shared'])

  return (
    <ModalShell
      borderRadius={BORDERS.size_three}
      onOutsideClick={handleCloseMaxPinsAlert}
      width="32.375rem"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing3}
        padding={SPACING.spacingXXL}
      >
        <StyledText
          color={COLORS.darkBlackEnabled}
          fontSize={TYPOGRAPHY.fontSize28}
          fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
          lineHeight={TYPOGRAPHY.lineHeight36}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {t('too_many_pins_header')}
        </StyledText>
        <StyledText
          color={COLORS.darkBlack_ninety}
          fontSize={TYPOGRAPHY.fontSize22}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          lineHeight={TYPOGRAPHY.lineHeight28}
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
            fontSize={TYPOGRAPHY.fontSize22}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            lineHeight={TYPOGRAPHY.lineHeight28}
            textAlign={TYPOGRAPHY.textAlignCenter}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('shared:close')}
          </StyledText>
        </Flex>
      </Flex>
    </ModalShell>
  )
}
