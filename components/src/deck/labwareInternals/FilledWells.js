// @flow
import * as React from 'react'
import map from 'lodash/map'
import { Well } from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type FilledWellsProps = {|
  definition: LabwareDefinition2,
  fillByWell: { [wellName: string]: string },
|}

function FilledWellsComponent(props: FilledWellsProps) {
  const { definition, fillByWell } = props
  return (
    <>
      {map<string, { [wellName: string]: string, ... }, React.Node>(
        fillByWell,
        (color: $Values<typeof fillByWell>, wellName) => {
          return (
            <Well
              key={wellName}
              wellName={wellName}
              well={definition.wells[wellName]}
              fill={color}
            />
          )
        }
      )}
    </>
  )
}

export const FilledWells: React.AbstractComponent<FilledWellsProps> = React.memo(
  FilledWellsComponent
)
