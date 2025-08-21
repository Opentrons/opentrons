import sum from 'lodash/sum'
import { css } from 'styled-components'

import {
  BORDERS,
  Box,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Divider,
  Flex,
  FLEX_MAX_CONTENT,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getWellRangeForLiquidLabwarePair,
  MICRO_LITERS,
} from '@opentrons/shared-data'

import type { Dispatch, SetStateAction } from 'react'
import type { IngredInputs } from '/protocol-designer/labware-ingred/types'
import type { WellContentsByNumber } from './index'

interface LiquidDetailCardProps {
  liquidInfo: IngredInputs
  liquidId: string
  labwareWellOrdering: string[][]
  volumesPerLiquid: Record<string, WellContentsByNumber>
  setSelectedValue: Dispatch<SetStateAction<string | undefined>>
  selectedValue?: string
}

export function LiquidDetailCard(props: LiquidDetailCardProps): JSX.Element {
  const {
    liquidId,
    liquidInfo,
    setSelectedValue,
    selectedValue,
    labwareWellOrdering,
    volumesPerLiquid,
  } = props
  const { displayName, displayColor, description } = liquidInfo
  const ACTIVE_STYLE = css`
    background-color: ${COLORS.blue10};
    border: 1px solid ${COLORS.blue50};
    border-radius: ${BORDERS.borderRadius8};
  `
  const volumeByWell = volumesPerLiquid[parseInt(selectedValue ?? '0')]
  const volumePerWellRange = getWellRangeForLiquidLabwarePair(
    volumeByWell,
    labwareWellOrdering
  )

  const handleSelectedValue = (): void => {
    setSelectedValue(liquidId)
  }

  const totalVolume = sum(Object.values(volumesPerLiquid[parseInt(liquidId)]))

  return (
    <Box
      css={selectedValue === liquidId ? ACTIVE_STYLE : LIQUID_CARD_STYLE}
      borderRadius={BORDERS.borderRadius8}
      padding={SPACING.spacing16}
      backgroundColor={COLORS.white}
      onClick={handleSelectedValue}
      width="10.3rem"
      minHeight={FLEX_MAX_CONTENT}
      data-testid="LiquidDetailCard_box"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          css={CARD_OUTLINE_BORDER_STYLE}
          padding={SPACING.spacing8}
          height={FLEX_MAX_CONTENT}
          width={FLEX_MAX_CONTENT}
          backgroundColor={COLORS.white}
        >
          <Icon name="circle" color={displayColor} size={SIZE_1} />
        </Flex>
        <StyledText
          desktopStyle="headingMediumSemiBold"
          marginTop={SPACING.spacing8}
        >
          {displayName}
        </StyledText>
        <StyledText desktopStyle="captionRegular" color={COLORS.grey50}>
          {description != null ? description : null}
        </StyledText>

        <Flex
          backgroundColor={`${COLORS.black90}${COLORS.opacity20HexCode}`}
          borderRadius={BORDERS.borderRadius8}
          height={FLEX_MAX_CONTENT}
          width={FLEX_MAX_CONTENT}
          paddingY={SPACING.spacing4}
          paddingX={SPACING.spacing8}
          marginTop={SPACING.spacing8}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {totalVolume} {MICRO_LITERS}
          </StyledText>
        </Flex>
      </Flex>
      {selectedValue === liquidId ? (
        <>
          <Divider
            marginX="-1rem"
            marginY={SPACING.spacing16}
            color={`${COLORS.black90}${COLORS.opacity20HexCode}`}
          />
          {volumePerWellRange.map((well, index) => {
            return (
              <Flex
                key={`${well.wellName}_${index}`}
                flexDirection={DIRECTION_ROW}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                paddingBottom={
                  index !== volumePerWellRange.length - 1
                    ? SPACING.spacing8
                    : '0'
                }
              >
                <StyledText
                  desktopStyle="captionRegular"
                  marginRight={SPACING.spacing4}
                >
                  {well.wellName}
                </StyledText>
                <StyledText desktopStyle="captionRegular">
                  {well.volume.toFixed(1)} {MICRO_LITERS}
                </StyledText>
              </Flex>
            )
          })}
        </>
      ) : null}
    </Box>
  )
}

const CARD_OUTLINE_BORDER_STYLE = css`
  border-style: ${BORDERS.styleSolid};
  border-width: 1px;
  border-color: ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius8};
  &:hover {
    border-color: ${COLORS.grey55};
  }
`

const LIQUID_CARD_STYLE = css`
  ${CARD_OUTLINE_BORDER_STYLE}
  &:hover {
    border: 1px solid ${COLORS.grey60};
    border-radius: ${BORDERS.borderRadius8};
    cursor: ${CURSOR_POINTER};
  }
`
