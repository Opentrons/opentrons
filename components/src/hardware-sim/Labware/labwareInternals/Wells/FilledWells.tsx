import { memo } from 'react'
import map from 'lodash/map'

import { COLORS } from '../../../../helix-design-system'
import { Well } from './Well'

import type { CSSProperties, MemoExoticComponent, ReactNode } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'
import type { WellFillByName, WellStroke } from './constants'

export interface FilledWellsProps {
  definition: LabwareDefinition
  fillByWell: WellFillByName
  strokeColor?: WellStroke
}

function FilledWellsComponent(props: FilledWellsProps): ReactNode {
  const { definition, fillByWell, strokeColor = COLORS.black90 } = props
  return (
    <>
      {map<Record<string, CSSProperties['fill']>, ReactNode>(
        fillByWell,
        (color: CSSProperties['fill'], wellName: string): JSX.Element => {
          return (
            <Well
              key={wellName}
              wellName={wellName}
              well={definition.wells[wellName]}
              fill={color}
              stroke={strokeColor}
              strokeWidth="0.6"
            />
          )
        }
      )}
    </>
  )
}

export const FilledWells: MemoExoticComponent<typeof FilledWellsComponent> =
  memo(FilledWellsComponent)
