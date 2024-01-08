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
import { ALL_OT2_DECK_LAYERS } from './constants'

export interface DeckFromLayersProps {
  robotType: RobotType
  layerBlocklist: string[]
}

const OT2_LAYER_MAP: {
  [layer in typeof ALL_OT2_DECK_LAYERS[number]]: React.FunctionComponent<{key: number}>
} = {
  fixedBase: ({key}: {key: number}) => <FixedBase key={key} />,
  fixedTrash: ({key}: {key: number}) => <FixedTrash key={key} />,
  doorStops: ({key}: {key: number}) => <DoorStops key={key} />,
  metalFrame: ({key}: {key: number}) => <MetalFrame key={key} />,
  removableDeckOutline: ({key}: {key: number}) => <RemovableDeckOutline key={key} />,
  slotRidges: ({key}: {key: number}) => <SlotRidges key={key} />,
  slotNumbers: ({key}: {key: number}) => <SlotNumbers key={key} />,
  calibrationMarkings: ({key}: {key: number}) => <CalibrationMarkings key={key} />,
  removalHandle: ({key}: {key: number}) => <RemovalHandle key={key} />,
  screwHoles: ({key}: {key: number}) => <ScrewHoles key={key} />,
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
      {ALL_OT2_DECK_LAYERS.reduce<Array<JSX.Element | null>>((acc, layer, index) => {
        if (layerBlocklist.includes(layer)) return acc
        return [...acc, OT2_LAYER_MAP[layer]({key: index})]
      }, [])}
    </g>
  )
}
