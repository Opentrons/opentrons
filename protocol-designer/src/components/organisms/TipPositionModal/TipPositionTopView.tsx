import { useTranslation } from 'react-i18next'
import round from 'lodash/round'

import {
  Box,
  COLORS,
  OVERFLOW_HIDDEN,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  StyledText,
} from '@opentrons/components'

import BOTTOM_LAYER from '/protocol-designer/assets/images/tip_top_bottom_layer.svg'
import MID_LAYER from '/protocol-designer/assets/images/tip_top_mid_layer.svg'
import TOP_LAYER from '/protocol-designer/assets/images/tip_top_top_layer.svg'

import type { ReactNode } from 'react'

const WELL_WIDTH_PIXELS = 110
const PIXEL_DECIMALS = 2

interface TipPositionAllVizProps {
  xPosition: number
  xWidthMm: number
  yPosition: number
  yWidthMm: number
}

export function TipPositionTopView(props: TipPositionAllVizProps): ReactNode {
  const { yPosition, xPosition, yWidthMm, xWidthMm } = props
  const { t } = useTranslation('application')

  const xPx = (WELL_WIDTH_PIXELS / xWidthMm) * xPosition
  const yPx = (WELL_WIDTH_PIXELS / yWidthMm) * yPosition

  const roundedXPx = round(xPx, PIXEL_DECIMALS)
  const roundedYPx = round(yPx, PIXEL_DECIMALS)
  const translateY = roundedYPx < 0 ? Math.abs(roundedYPx) : -roundedYPx
  return (
    <Box
      position={POSITION_RELATIVE}
      width="20.75rem"
      height="22.75rem"
      overflow={OVERFLOW_HIDDEN}
    >
      <img
        src={BOTTOM_LAYER}
        style={{ position: POSITION_ABSOLUTE }}
        alt="bottom layer"
      />
      <img
        src={MID_LAYER}
        style={{
          position: POSITION_ABSOLUTE,
          transform: `translate(${roundedXPx}px, ${translateY}px)`,
        }}
        alt="mid layer"
      />
      <img
        src={TOP_LAYER}
        style={{ position: POSITION_ABSOLUTE }}
        alt="top layer"
      />
      {xWidthMm !== null && (
        <Box position={POSITION_ABSOLUTE} bottom="3.5rem" right="9.2rem">
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {xWidthMm}
            {t('units.millimeter')}
          </StyledText>
        </Box>
      )}
    </Box>
  )
}
