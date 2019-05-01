// @flow
import * as React from 'react'
import map from 'lodash/map'
import Well from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

type WellFillProps = {|
  definition: LabwareDefinition2,
  fillByWell: { [wellName: string]: string },
|}

export default function WellFill(props: WellFillProps) {
  const { definition, fillByWell } = props
  return map<*, *, React.Node>(
    fillByWell,
    (color: $Values<typeof fillByWell>, wellName) => {
      return (
        <Well
          key={wellName}
          wellName={wellName}
          fill={color}
          definition={definition}
        />
      )
    }
  )
}
