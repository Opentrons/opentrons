import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { MICRO_LITERS } from '@opentrons/shared-data'
import { Divider } from '../../../../atoms/structure'
import { StyledText } from '../../../../atoms/text'
import {
  useTrackEvent,
  ANALYTICS_HIGHLIGHT_LIQUID_IN_DETAIL_MODAL,
} from '../../../../redux/analytics'
import { getIsOnDevice } from '../../../../redux/config'
import { getWellRangeForLiquidLabwarePair } from './utils'

const LIQUID_CARD_STYLE = css`
  ${BORDERS.cardOutlineBorder}
  &:hover {
    border: 1px solid ${COLORS.medGreyHover};
    cursor: pointer;
  }
`
const LIQUID_CARD_ODD_STYLE = css`
  border-color: ${COLORS.medGreyEnabled};
  border: ${SPACING.spacing4} solid ${COLORS.medGreyEnabled};
  border-radius: ${BORDERS.borderRadiusSize3};
`
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
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('protocol_setup')

  const ACTIVE_STYLE = css`
    background-color: ${isOnDevice ? COLORS.medBlue : COLORS.lightBlue};
    border: ${isOnDevice ? SPACING.spacing4 : `1px`} solid ${COLORS.blueEnabled};
    border-radius: ${isOnDevice ? BORDERS.borderRadiusSize3 : 0};
  `
  const volumePerWellRange = getWellRangeForLiquidLabwarePair(
    volumeByWell,
    labwareWellOrdering
  )

  const handleSelectedValue = (): void => {
    setSelectedValue(liquidId)
    trackEvent({
      name: ANALYTICS_HIGHLIGHT_LIQUID_IN_DETAIL_MODAL,
      properties: {},
    })
  }

  return isOnDevice ? (
    <Box
      css={selectedValue === liquidId ? ACTIVE_STYLE : LIQUID_CARD_ODD_STYLE}
      borderRadius={BORDERS.radiusSoftCorners}
      backgroundColor={COLORS.white}
      onClick={() => setSelectedValue(liquidId)}
      width="19.875rem"
      minHeight="max-content"
      aria-label="liquidBox_odd"
    >
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing16}>
        <Flex
          css={BORDERS.cardOutlineBorder}
          padding={SPACING.spacing8}
          height="3rem"
          width="3rem"
          backgroundColor={COLORS.white}
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
        >
          <Icon name="circle" color={displayColor} size="1.4rem" />
        </Flex>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize22}
          lineHeight={TYPOGRAPHY.lineHeight28}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing12}
        >
          {displayName}
        </StyledText>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize22}
          lineHeight={TYPOGRAPHY.lineHeight28}
          color={COLORS.darkGreyEnabled}
        >
          {description != null ? description : null}
        </StyledText>
        <Flex
          backgroundColor={COLORS.darkBlack20}
          borderRadius={BORDERS.radiusSoftCorners}
          height="2.75rem"
          padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
          alignItems={TYPOGRAPHY.textAlignCenter}
          marginTop={SPACING.spacing16}
          width="max-content"
        >
          <>
            {Object.values(volumeByWell).reduce((prev, curr) => prev + curr, 0)}{' '}
            {MICRO_LITERS} {t('total_vol')}
          </>
        </Flex>
      </Flex>
      {selectedValue === liquidId ? (
        <>
          <Box borderBottom={`3px solid ${COLORS.darkBlack20}`} />
          <Flex
            padding={SPACING.spacing16}
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
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
                    lineHeight={TYPOGRAPHY.lineHeight28}
                    fontSize={TYPOGRAPHY.fontSize22}
                    color={COLORS.darkBlack70}
                  >
                    {well.wellName}
                  </StyledText>
                  <StyledText
                    lineHeight={TYPOGRAPHY.lineHeight28}
                    fontSize={TYPOGRAPHY.fontSize22}
                    color={COLORS.darkBlack70}
                  >
                    {well.volume} {MICRO_LITERS}
                  </StyledText>
                </Flex>
              )
            })}
          </Flex>
        </>
      ) : null}
    </Box>
  ) : (
    <Box
      css={selectedValue === liquidId ? ACTIVE_STYLE : LIQUID_CARD_STYLE}
      borderRadius={BORDERS.radiusSoftCorners}
      padding={SPACING.spacing16}
      backgroundColor={COLORS.white}
      onClick={handleSelectedValue}
      width="10.3rem"
      minHeight="max-content"
      data-testid="LiquidDetailCard_box"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          css={BORDERS.cardOutlineBorder}
          padding={SPACING.spacing8}
          height="max-content"
          width="max-content"
          backgroundColor={COLORS.white}
        >
          <Icon name="circle" color={displayColor} size={SIZE_1} />
        </Flex>
        <StyledText
          as="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing8}
        >
          {displayName}
        </StyledText>
        <StyledText as="p" color={COLORS.darkGreyEnabled}>
          {description != null ? description : null}
        </StyledText>

        <Flex
          backgroundColor={COLORS.darkBlackEnabled + '1A'}
          borderRadius={BORDERS.radiusSoftCorners}
          height="max-content"
          width="max-content"
          paddingY={SPACING.spacing4}
          paddingX={SPACING.spacing8}
          marginTop={SPACING.spacing8}
        >
          <StyledText as="p">
            {Object.values(volumeByWell).reduce((prev, curr) => prev + curr, 0)}{' '}
            {MICRO_LITERS}
          </StyledText>
        </Flex>
      </Flex>
      {selectedValue === liquidId ? (
        <>
          <Divider marginX="-1rem" marginY={SPACING.spacing16} />
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
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  marginRight={SPACING.spacing4}
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
