// @flow
import * as React from 'react'
import map from 'lodash/map'
import Well from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type FilledWellsProps = {|
  definition: LabwareDefinition2,
  fillByWell: { [wellName: string]: string },
|}

function FilledWells(props: FilledWellsProps) {
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

export default React.memo<FilledWellsProps>(FilledWells)
