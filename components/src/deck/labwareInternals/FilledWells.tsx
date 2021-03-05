import * as React from 'react'
import map from 'lodash/map'
import { Well } from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export interface FilledWellsProps {
  definition: LabwareDefinition2
  fillByWell: { [wellName: string]: string }
}

function FilledWellsComponent(props: FilledWellsProps): JSX.Element {
  const { definition, fillByWell } = props
  return (
    <>
      {map<Record<string, string>, JSX.Element>(
        fillByWell,
        (color: keyof typeof fillByWell, wellName: string): JSX.Element => {
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

export const FilledWells: React.MemoExoticComponent<
  typeof FilledWellsComponent
> = React.memo(FilledWellsComponent)
