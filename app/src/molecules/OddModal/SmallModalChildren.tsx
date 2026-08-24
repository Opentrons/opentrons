import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'

import { OddModal } from './index'

import type { ReactNode } from 'react'

interface SmallModalChildrenProps {
  handleCloseMaxPinsAlert: () => void
  header: string
  subText: string
  buttonText: string
}
export function SmallModalChildren(props: SmallModalChildrenProps): ReactNode {
  const { handleCloseMaxPinsAlert, header, subText, buttonText } = props

  return (
    <OddModal onOutsideClick={handleCloseMaxPinsAlert} modalSize="small">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        width="100%"
        whiteSpace="break-spaces"
      >
        <LegacyStyledText
          color={COLORS.black90}
          fontSize={TYPOGRAPHY.fontSize28}
          fontWeight={TYPOGRAPHY.fontWeightBold}
          lineHeight={TYPOGRAPHY.lineHeight36}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {header}
        </LegacyStyledText>
        <LegacyStyledText
          color={COLORS.grey60}
          fontSize={TYPOGRAPHY.fontSize22}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          lineHeight={TYPOGRAPHY.lineHeight28}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {subText}
        </LegacyStyledText>

        <Flex marginTop={SPACING.spacing32}>
          <SmallButton
            flex="1"
            buttonText={buttonText}
            onClick={handleCloseMaxPinsAlert}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
