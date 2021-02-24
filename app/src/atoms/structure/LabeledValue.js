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
  label: string | React.Node,
  value: string | React.Node,
  labelProps?: React.ElementProps<typeof Text>,
  valueProps?: React.ElementProps<typeof Text>,
  ...React.ElementProps<typeof Box>,
|}

export function LabeledValue(props: Props): React.Node {
  const {
    label,
    value,
    labelProps = {},
    valueProps = {},
    ...wrapperProps
  } = props
  return (
    <Box css={FONT_BODY_1_DARK} lineHeight={1.5} {...wrapperProps}>
      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        margin="0 0 0.25rem"
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        {...labelProps}
      >
        {label}
      </Text>
      <Text margin="0" {...valueProps}>
        {value}
      </Text>
    </Box>
  )
}
