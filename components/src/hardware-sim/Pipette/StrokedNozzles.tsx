import { memo } from 'react'

import { WellStatus } from '../..'

import type { MemoExoticComponent } from 'react'
import type { LabwareWell, PipetteV2Specs } from '@opentrons/shared-data'
import type { WellType } from '../..'

export interface StrokedNozzleProps {
  pipetteSpecs: PipetteV2Specs
  nozzleStatus: Record<string, WellType>
  handleClickNozzle: (wellName: string) => void
}

export function StrokedNozzlesComponent(
  props: StrokedNozzleProps
): JSX.Element {
  const { pipetteSpecs, nozzleStatus, handleClickNozzle } = props
  const { nozzleMap, pipetteBoundingBoxOffsets } = pipetteSpecs
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
          diameter: 20,
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
      {Object.entries(nozzleStatus).map(([key, wellType]) => (
        <svg
          x={wells[key].x}
          y={wells[key].y}
          onClick={() => handleClickNozzle(key)}
        >
          <WellStatus
            type={wellType}
            size={'8'}
            wellMap={wells}
            showStroke={true}
          />
        </svg>
      ))}
    </>
  )
}

export const StrokedNozzles: MemoExoticComponent<
  typeof StrokedNozzlesComponent
> = memo(StrokedNozzlesComponent)
