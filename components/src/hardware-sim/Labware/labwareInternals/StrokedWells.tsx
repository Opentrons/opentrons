import * as React from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import map from 'lodash/map'
import type { CSSProperties } from 'styled-components'

import { Well } from './Well'

export interface StrokedWellProps {
  definition: LabwareDefinition2
  strokeByWell: Record<string, CSSProperties['stroke']>
}

export function StrokedWellsComponent(props: StrokedWellProps): JSX.Element {
  const { definition, strokeByWell } = props
  return (
    <>
      {map<Record<string, CSSProperties['stroke']>, React.ReactNode>(
        strokeByWell,
        (color: CSSProperties['stroke'], wellName: string): JSX.Element => {
          return (
            <Well
              key={wellName}
              wellName={wellName}
              well={definition.wells[wellName]}
              stroke={color}
            />
          )
        }
      )}
    </>
  )
}

export const StrokedWells: React.MemoExoticComponent<
  typeof StrokedWellsComponent
> = React.memo(StrokedWellsComponent)
