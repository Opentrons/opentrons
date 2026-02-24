import { memo } from 'react'

import { WellStatus } from '../..'

import type { MemoExoticComponent } from 'react'
import type { LabwareWell, PipetteV2Specs } from '@opentrons/shared-data'
import type { WellType } from '../..'

export interface StrokedNozzleProps {
  pipetteSpecs: PipetteV2Specs
  nozzleStatus: Record<string, WellType>
  handleClickNozzle: (nozzleName: string) => void
}
export function StrokedNozzlesComponent(
  props: StrokedNozzleProps
): JSX.Element {
  const { pipetteSpecs, nozzleStatus, handleClickNozzle } = props
  const { nozzleMap, pipetteBoundingBoxOffsets } = pipetteSpecs
  const { backLeftCorner } = pipetteBoundingBoxOffsets
  const nozzleDiameter = 20
  const wells = Object.fromEntries(
    Object.entries(nozzleMap).map(([wellName, coordinates]) => {
      const [xOffset, yOffset] = coordinates
      const wellParams = {
        shape: 'circular',
        diameter: nozzleDiameter,
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
      {Object.entries(nozzleStatus).map(([key, wellType]) => {
        return (
          <svg
            key={key}
            x={wells[key].x - 5}
            y={wells[key].y - 5}
            onClick={() => {
              handleClickNozzle(key)
            }}
          >
            <WellStatus
              type={wellType}
              size="8"
              wellMap={wells}
              showStroke
              isLabware={false}
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
