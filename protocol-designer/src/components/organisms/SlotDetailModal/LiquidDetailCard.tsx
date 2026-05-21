import sum from 'lodash/sum'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
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
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
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
  selectedValue: string
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
  const volumeByWell = volumesPerLiquid[liquidId]
  const volumePerWellRange = getWellRangeForLiquidLabwarePair(
    volumeByWell,
    labwareWellOrdering
  )

  const handleSelectedValue = (): void => {
    setSelectedValue(liquidId)
  }

  const totalVolume = sum(Object.values(volumesPerLiquid[liquidId]))

  return (
    <Box
      css={selectedValue === liquidId ? ACTIVE_STYLE : LIQUID_CARD_STYLE}
      borderRadius={BORDERS.borderRadius8}
      padding={SPACING.spacing12}
      backgroundColor={COLORS.white}
      onClick={handleSelectedValue}
      width="10.3rem"
      minHeight={FLEX_MAX_CONTENT}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing16}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing8}
        >
          <Flex
            css={CARD_OUTLINE_BORDER_STYLE}
            padding={SPACING.spacing8}
            height="1.5rem"
            width="1.5rem"
            backgroundColor={COLORS.white}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
          >
            <Icon name="circle" color={displayColor} size="0.5rem" />
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gap={description != null ? SPACING.spacing4 : 0}
          >
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {displayName}
            </StyledText>
            <StyledText desktopStyle="captionRegular" color={COLORS.grey50}>
              {description != null ? description : null}
            </StyledText>
          </Flex>
        </Flex>
        <Flex
          backgroundColor={`${COLORS.black90}${COLORS.opacity20HexCode}`}
          borderRadius={BORDERS.borderRadius8}
          height={FLEX_MAX_CONTENT}
          width={FLEX_MAX_CONTENT}
          padding={`${SPACING.spacing4} ${SPACING.spacing8}`}
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
                key={well.wellName}
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
