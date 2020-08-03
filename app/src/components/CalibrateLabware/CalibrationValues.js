// @flow
import * as React from 'react'
import { Text, FONT_WEIGHT_SEMIBOLD, SPACING_3 } from '@opentrons/components'

type Props = {|
  x: number | null,
  y: number | null,
  z: number | null,
|}
export const CalibrationValues = (props: Props): React.Node => (
  <span>
    {['x', 'y', 'z'].map(key => (
      <>
        <Text as="span" fontWeight={FONT_WEIGHT_SEMIBOLD}>
          {key.toUpperCase()}
        </Text>{' '}
        <Text as="span" marginRight={SPACING_3}>
          {props[key] != null ? props[key].toFixed(1) : null}
        </Text>
      </>
    ))}
  </span>
)
