import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { MICRO_LITERS } from '@opentrons/shared-data'
import * as React from 'react'
import { css } from 'styled-components'
import { Divider } from '../../../../atoms/structure'
import { StyledText } from '../../../../atoms/text'
import { getWellRangeForLiquidLabwarePair } from './utils'

interface LiquidDetailCardProps {
  liquidId: string
  displayName: string
  description: string | null
  displayColor: string
  volumeByWell: { [well: string]: number }
  setSelectedValue: React.Dispatch<React.SetStateAction<string | undefined>>
  selectedValue: string | undefined
  labwareWellOrdering: string[][]
}

export function LiquidDetailCard(props: LiquidDetailCardProps): JSX.Element {
  const {
    liquidId,
    displayName,
    description,
    displayColor,
    volumeByWell,
    setSelectedValue,
    selectedValue,
    labwareWellOrdering,
  } = props
  const LIQUID_CARD_STYLE = css`
    ${BORDERS.cardOutlineBorder}

    &:hover {
      border: 1px solid ${COLORS.medGreyHover};
      cursor: pointer;
    }
  `
  const ACTIVE_STYLE = css`
    background-color: ${COLORS.lightBlue};
    border: 1px solid ${COLORS.blue};
  `
  const volumePerWellRange = getWellRangeForLiquidLabwarePair(
    volumeByWell,
    labwareWellOrdering
  )
  return (
    <Box
      css={selectedValue === liquidId ? ACTIVE_STYLE : LIQUID_CARD_STYLE}
      borderRadius={BORDERS.radiusSoftCorners}
      marginBottom={SPACING.spacing3}
      padding={SPACING.spacing4}
      backgroundColor={COLORS.white}
      onClick={() => setSelectedValue(liquidId)}
      width={'10.3rem'}
      minHeight={'max-content'}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          css={BORDERS.cardOutlineBorder}
          padding={'0.75rem'}
          height={'max-content'}
          width={'max-content'}
          backgroundColor={COLORS.white}
        >
          <Icon name="circle" color={displayColor} size={SIZE_1} />
        </Flex>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing3}
        >
          {displayName}
        </StyledText>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkGreyEnabled}
        >
          {description != null ? description : null}
        </StyledText>
        <Flex
          backgroundColor={COLORS.darkBlack + '1A'}
          borderRadius={BORDERS.radiusSoftCorners}
          height={'max-content'}
          width={'max-content'}
          paddingY={SPACING.spacing2}
          paddingX={SPACING.spacing3}
          marginTop={SPACING.spacing3}
        >
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {Object.values(volumeByWell).reduce((prev, curr) => prev + curr, 0)}{' '}
            {MICRO_LITERS}
          </StyledText>
        </Flex>
      </Flex>
      {selectedValue === liquidId ? (
        <>
          <Divider marginX={'-1rem'} marginY={SPACING.spacing4} />
          {volumePerWellRange.map((well, index) => {
            return (
              <Flex
                key={index}
                flexDirection={DIRECTION_ROW}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
              >
                <StyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  marginTop={SPACING.spacing3}
                  marginRight={SPACING.spacing2}
                >
                  {well.wellName}
                </StyledText>
                <StyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  marginTop={SPACING.spacing3}
                >
                  {well.volume} {MICRO_LITERS}
                </StyledText>
              </Flex>
            )
          })}
        </>
      ) : null}
    </Box>
  )
}
