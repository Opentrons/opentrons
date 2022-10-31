import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Icon,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

export function SearchNetwork(): JSX.Element {
  // Note kj 10/18/2022 The fixed value is temporarily
  return (
    <>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <StyledText fontSize="2rem" fontWeight="700" lineHeight="2.72375rem">
          {'Connect to a network'}
        </StyledText>
      </Flex>
      <Flex
        height="26.5625rem"
        backgroundColor="#D6D6D6"
        justifyContent={JUSTIFY_CENTER}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
        >
          <Icon
            name="ot-spinner"
            size="5.125rem"
            color={COLORS.darkGreyEnabled}
            aria-label="spinner"
            spin
          />
          <StyledText
            fontSize="2rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            lineHeight="2.72375rem"
            marginTop={SPACING.spacingXXL}
          >
            {'Searching for network...'}
          </StyledText>
        </Flex>
      </Flex>
    </>
  )
}
