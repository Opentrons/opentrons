import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_END,
  SPACING,
  Icon,
  COLORS,
  TYPOGRAPHY,
  JUSTIFY_START,
  ALIGN_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/buttons'

export function ConnectedNetworkInfo(): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacingXXL}>
      <Flex justifyContent={JUSTIFY_START} marginBottom="3.125rem">
        <StyledText fontSize="2rem" fontWeight="700" lineHeight="2.72375">
          {'Set up your robot'}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingX={SPACING.spacing6}
        paddingY={SPACING.spacing5}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        backgroundColor={COLORS.darkGreyDisabled}
        marginBottom="13.1875rem"
        borderRadius="0.75rem"
      >
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon name="wifi" size="2.4rem" />
          <StyledText
            marginLeft={SPACING.spacing2}
            fontSize="1.5rem"
            lineHeight="1.8rem"
            fontWeight="700"
          >
            {'Network name'}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          textAlign={TYPOGRAPHY.textAlignRight}
          gridColumn={SPACING.spacing2}
        >
          <StyledText fontSize="1.5rem" lineHeight="1.8rem">
            {'IP Address:  192.68.182'}
          </StyledText>
          <StyledText fontSize="1.5rem" lineHeight="1.8rem">
            {'Subnet mask: 255.255.255.0'}
          </StyledText>
          <StyledText fontSize="1.5rem" lineHeight="1.8rem">
            {'Mac address: 36:b4:d8:17:5c:c8'}
          </StyledText>
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <SecondaryButton>{'Change network'}</SecondaryButton>
      </Flex>
    </Flex>
  )
}
