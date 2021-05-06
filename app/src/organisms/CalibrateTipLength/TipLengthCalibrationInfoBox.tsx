import * as React from 'react'
import {
  Box,
  Text,
  BORDER_SOLID_LIGHT,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'

export interface TipLengthCalibrationInfoBoxProps {
  title: string
  children: React.ReactNode
}

export function TipLengthCalibrationInfoBox(
  props: TipLengthCalibrationInfoBoxProps
): JSX.Element {
  const { title, children } = props

  return (
    <Box border={BORDER_SOLID_LIGHT} margin={SPACING_3} paddingY={SPACING_3}>
      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        paddingLeft={SPACING_3}
        paddingBottom={SPACING_2}
      >
        {title}
      </Text>
      {children}
    </Box>
  )
}
