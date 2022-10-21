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
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'

export function ConnectionResult(): JSX.Element {
  // Note kj 10/18/2022 The fixed value is temporarily
  return (
    <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <StyledText fontSize="2rem" fontWeight="700" lineHeight="2.72375rem">
          {'Connect to a network'}
        </StyledText>
      </Flex>
      <Flex
        height="26.5625rem"
        backgroundColor={COLORS.successBackgroundMed}
        justifyContent={JUSTIFY_CENTER}
        marginBottom={SPACING.spacing6}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
        >
          <Icon
            name="ot-check"
            size="4.375rem"
            color={COLORS.successEnabled}
            aria-label="spinner"
          />
          <StyledText
            fontSize="2rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            lineHeight="2.72375rem"
            marginTop={SPACING.spacingXXL}
          >
            {'Connected to <Network Name>'}
          </StyledText>
        </Flex>
      </Flex>
      <Flex gridRow="0.75rem">
        <SecondaryButton flex="1">{'Change network'}</SecondaryButton>
        <PrimaryButton flex="1">{'Done'}</PrimaryButton>
      </Flex>
    </Flex>
  )
}
