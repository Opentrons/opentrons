import * as React from 'react'

import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  FixedBase,
  FixedTrash,
  DoorStops,
  MetalFrame,
  RemovableDeckOutline,
  SlotRidges,
  SlotNumbers,
  CalibrationMarkings,
  RemovalHandle,
  ScrewHoles,
} from './OT2Layers'

import type { RobotType } from '@opentrons/shared-data'

export interface DeckFromLayersProps {
  robotType: RobotType
  layerBlocklist: string[]
}

const OT2_LAYER_MAP: { [layer: string]: JSX.Element } = {
  flexBase: <FixedBase />,
  fixedTrash: <FixedTrash />,
  doorStops: <DoorStops />,
  metalFrame: <MetalFrame />,
  removableDeckOutline: <RemovableDeckOutline />,
  slotRidges: <SlotRidges />,
  slotNumbers: <SlotNumbers />,
  calibrationMarkings: <CalibrationMarkings />,
  removalHandle: <RemovalHandle />,
  screwHoles: <ScrewHoles />,
}

/**
 * a component that renders an OT-2 deck from the V3 deck definition layers property
 * takes a robot type prop to protect against an attempted Flex render
 */
export function DeckFromLayers(props: DeckFromLayersProps): JSX.Element | null {
  const { robotType, layerBlocklist = [] } = props

  // early return null if not OT-2
  if (robotType !== OT2_ROBOT_TYPE) return null

  return (
    <g id="deckLayers">
      {Object.keys(OT2_LAYER_MAP).reduce<JSX.Element[]>(
        (acc, layer) => {
          if (layerBlocklist.includes(layer)) return acc
          return [...acc, OT2_LAYER_MAP[layer]]
        }, []
      )}
    </g>
  )
}
