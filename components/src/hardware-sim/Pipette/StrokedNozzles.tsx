import { memo } from 'react'

import { PIPETTE, WellStatus } from '../..'
import {
  NOZZLE_DIAMETER,
  NOZZLE_POSITION_IN_RENDER,
  NOZZLE_SIZE_MM,
} from './constants'

import type { MemoExoticComponent, ReactNode } from 'react'
import type { LabwareWell, PipetteV2Specs } from '@opentrons/shared-data'
import type { WellType } from '../..'

export interface StrokedNozzleProps {
  pipetteSpecs: PipetteV2Specs
  nozzleStatus: Record<string, WellType>
  handleClickNozzle: (nozzleName: string) => void
}
export function StrokedNozzlesComponent(props: StrokedNozzleProps): ReactNode {
  const { pipetteSpecs, nozzleStatus, handleClickNozzle } = props
  const { nozzleMap, pipetteBoundingBoxOffsets } = pipetteSpecs
  const { backLeftCorner } = pipetteBoundingBoxOffsets

  const wells = Object.fromEntries(
    Object.entries(nozzleMap).map(([wellName, coordinates]) => {
      const [xOffset, yOffset] = coordinates
      const wellParams = {
        shape: 'circular',
        diameter: NOZZLE_DIAMETER,
        x: xOffset - backLeftCorner[0],
        y: backLeftCorner[1] - yOffset,
        z: 0,
        geometryDefinitionId: 'conicalWell',
      }
      return [wellName, wellParams as LabwareWell]
    })
  )

  return (
    <>
      {Object.entries(nozzleStatus).map(([wellName, wellType]) => {
        return (
          <svg
            key={wellName}
            x={wells[wellName].x - NOZZLE_POSITION_IN_RENDER}
            y={wells[wellName].y - NOZZLE_POSITION_IN_RENDER}
            onClick={() => {
              handleClickNozzle(wellName)
            }}
          >
            <WellStatus
              type={wellType}
              size={NOZZLE_SIZE_MM}
              wellMap={wells}
              showStroke
              parentType={PIPETTE}
              wellName={wellName}
            />
          </svg>
        )
      })}
    </>
  )
}
export const StrokedNozzles: MemoExoticComponent<
  typeof StrokedNozzlesComponent
> = memo(StrokedNozzlesComponent)
