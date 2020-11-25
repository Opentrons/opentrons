// @flow
import * as React from 'react'
import {
  Box,
  Text,
  TEXT_TRANSFORM_CAPITALIZE,
  FONT_BODY_1_DARK,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'

type Props = {|
  label: string,
  value: string,
  wrapperProps?: React.ElementProps<typeof Box>,
  labelProps?: React.ElementProps<typeof Text>,
  valueProps?: React.ElementProps<typeof Text>,
  colon?: boolean,
|}

export function LabeledValue(props: Props): React.Node {
  const {
    label,
    value,
    wrapperProps = {},
    labelProps = {},
    valueProps = {},
    colon = false,
  } = props
  return (
    <Box css={FONT_BODY_1_DARK} lineHeight={1.5} {...wrapperProps}>
      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        margin="0 0 0.25rem"
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        {...labelProps}
      >
        {`${label}${colon ? ':' : ''}`}
      </Text>
      <Text margin="0" {...valueProps}>
        {value}
      </Text>
    </Box>
  )
}
