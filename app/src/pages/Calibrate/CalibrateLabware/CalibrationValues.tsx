import * as React from 'react'
import { Text, FONT_WEIGHT_SEMIBOLD, SPACING_3 } from '@opentrons/components'

interface Props {
  x: number | null
  y: number | null
  z: number | null
}
export const CalibrationValues = (props: Props): JSX.Element => (
  <span>
    {['x', 'y', 'z'].map((key: string) => (
      <React.Fragment key={key}>
        <Text as="span" fontWeight={FONT_WEIGHT_SEMIBOLD}>
          {key.toUpperCase()}
        </Text>{' '}
        <Text as="span" marginRight={SPACING_3}>
          {props[key as keyof Props] != null
            ? props[key as keyof Props]?.toFixed(1)
            : null}
        </Text>
      </React.Fragment>
    ))}
  </span>
)
