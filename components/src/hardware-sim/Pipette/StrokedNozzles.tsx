import { memo } from 'react'
import map from 'lodash/map'

import { COLORS, Well } from '../..'
import type { CSSProperties } from 'styled-components'
import type { MemoExoticComponent, ReactNode } from 'react'
import type { LabwareWell, PipetteV2Specs } from '@opentrons/shared-data'
 import { WellStrokeByName } from '../..'
export interface StrokedNozzleProps {
  pipetteSpecs: PipetteV2Specs
 strokeByWell: WellStrokeByName
}

export function StrokedNozzlesComponent(
  props: StrokedNozzleProps
): JSX.Element {
  const { pipetteSpecs, strokeByWell } = props
  const { nozzleMap, pipetteBoundingBoxOffsets, channels} = pipetteSpecs
  const { backLeftCorner, frontRightCorner } = pipetteBoundingBoxOffsets
  const leftBound = Math.abs(backLeftCorner[0])
  const frontBound = Math.abs(frontRightCorner[1])
  const wells = Object.fromEntries(
    Object.entries(nozzleMap).map(([wellName, coordinates]) => {
      const [xOffset, yOffset, zOffset] = coordinates
      return [
        wellName,
        {
          shape: 'circular',
          diameter: 6,
          x: leftBound - Math.abs(xOffset),
          y: frontBound - Math.abs(yOffset),
          z: 0,
          geometryDefinitionId: 'conicalWell',
        } as LabwareWell,
      ]
    })
  )
  return (
    <>
      {map<Record<string, CSSProperties['stroke']>, ReactNode>(
        strokeByWell,
        (color: CSSProperties['stroke'], wellName: string): JSX.Element => {
          return (
            <Well
              key={wellName}
              wellName={wellName}
              well={wells[wellName]}
              stroke={color}
              fill={COLORS.white}
              strokeWidth="0.6"
            />
          )
        }
      )}
    </>
  )
}

export const StrokedNozzles: MemoExoticComponent<
  typeof StrokedNozzlesComponent
> = memo(StrokedNozzlesComponent)
