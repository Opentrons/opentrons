import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { MICRO_LITERS, ODD_MEDIA_QUERY_SPECS } from '@opentrons/shared-data'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import { Divider } from '../../../../atoms/structure'
import { StyledText } from '../../../../atoms/text'
import { useTrackEvent } from '../../../../redux/analytics'
import { getIsOnDevice } from '../../../../redux/config'
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
  const trackEvent = useTrackEvent()
  const isOdd = useSelector(getIsOnDevice)

  const LIQUID_CARD_ODD_STYLE = css`
    border-color: ${COLORS.medGreyEnabled};
    border: 4px solid ${COLORS.medGreyEnabled};
    border-radius: 12px;
  `
  const LIQUID_CARD_STYLE = css`
    ${BORDERS.cardOutlineBorder}
    &:hover {
      border: 1px solid ${COLORS.medGreyHover};
      cursor: pointer;
    }
  `
  const ACTIVE_STYLE = css`
    background-color: ${isOdd ? COLORS.medBlue : COLORS.lightBlue};
    border: ${isOdd ? `4px` : `1px`} solid ${COLORS.blueEnabled};
    border-radius: ${isOdd ? `12px` : 0};
  `

  const P_STYLE = css`
    ${TYPOGRAPHY.pRegular};

    @media ${ODD_MEDIA_QUERY_SPECS} {
      font-size: 22px;
      line-height: 28px;
      font-weight: 400;
    }
  `

  const volumePerWellRange = getWellRangeForLiquidLabwarePair(
    volumeByWell,
    labwareWellOrdering
  )

  const handleSelectedValue = (): void => {
    setSelectedValue(liquidId)
    trackEvent({ name: 'highlightLiquidInDetailModal', properties: {} })
  }

  return (
    <Box
      css={
        selectedValue === liquidId
          ? ACTIVE_STYLE
          : isOdd
          ? LIQUID_CARD_ODD_STYLE
          : LIQUID_CARD_STYLE
      }
      borderRadius={BORDERS.radiusSoftCorners}
      padding={SPACING.spacing4}
      backgroundColor={COLORS.white}
      onClick={handleSelectedValue}
      width={isOdd ? `318px` : `10.3rem`}
      minHeight="max-content"
      data-testid="LiquidDetailCard_box"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          css={BORDERS.cardOutlineBorder}
          padding={SPACING.spacing3}
          height={isOdd ? `48px` : `max-content`}
          width={isOdd ? `48px` : `max-content`}
          backgroundColor={COLORS.white}
          justifyContent="center"
          alignItems="center"
        >
          <Icon
            name="circle"
            color={displayColor}
            size={isOdd ? `22.4px` : SIZE_1}
          />
        </Flex>
        <StyledText
          as={isOdd ? undefined : 'h3'}
          fontSize={isOdd ? '22px' : null}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing3}
        >
          {displayName}
        </StyledText>
        <StyledText css={P_STYLE} color={COLORS.darkGreyEnabled}>
          {description != null ? description : null}
        </StyledText>
        {isOdd ? (
          <Flex
            backgroundColor={COLORS.darkBlack_twenty}
            borderRadius={BORDERS.radiusSoftCorners}
            height="2.75rem"
            padding={`${SPACING.spacing3} 0.75rem`}
            alignItems={TYPOGRAPHY.textAlignCenter}
            marginRight={SPACING.spacing3}
          >
            {Object.values(volumeByWell).reduce((prev, curr) => prev + curr, 0)}{' '}
            {MICRO_LITERS}
          </Flex>
        ) : (
          <Flex
            backgroundColor={COLORS.darkBlackEnabled + '1A'}
            borderRadius={BORDERS.radiusSoftCorners}
            height="max-content"
            width="max-content"
            paddingY={SPACING.spacing2}
            paddingX={SPACING.spacing3}
            marginTop={SPACING.spacing3}
          >
            <StyledText css={P_STYLE}>
              {Object.values(volumeByWell).reduce(
                (prev, curr) => prev + curr,
                0
              )}{' '}
              {MICRO_LITERS}
            </StyledText>
          </Flex>
        )}
      </Flex>
      {selectedValue === liquidId ? (
        <>
          <Divider marginX="-1rem" marginY={SPACING.spacing4} />
          {volumePerWellRange.map((well, index) => {
            return (
              <Flex
                key={index}
                flexDirection={DIRECTION_ROW}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                paddingBottom={
                  index !== volumePerWellRange.length - 1
                    ? SPACING.spacing3
                    : '0'
                }
              >
                <StyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  marginRight={SPACING.spacing2}
                >
                  {well.wellName}
                </StyledText>
                <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightRegular}>
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
