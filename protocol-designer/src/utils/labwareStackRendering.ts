import first from 'lodash/first'

import { getCutoutIdFromAddressableArea } from '@opentrons/shared-data'

import { ZERO_COORDINATE_TUPLE } from './constants'

import type {
  AddressableAreaName,
  CoordinateTuple,
  DeckConfiguration,
  DeckDefinition,
  LabwareDefinition,
  LoadedLabwareLocation,
  Vector3D,
} from '@opentrons/shared-data'
import type { LabwareEntities } from '@opentrons/step-generation'

export interface StackRenderingInfo {
  labwareId: string
  definition: LabwareDefinition
  position: CoordinateTuple
}

/**
 * Deck SVG / layout: absolute [x,y,z] of the stack base when the base is a slot or addressable area.
 * Module- or labware-rooted stacks return the origin; children are positioned relative to parents in the view layer.
 */
export const getRenderingPositionFromBaseNode = (args: {
  baseNode: LoadedLabwareLocation
  deckDef: DeckDefinition
  deckConfiguration: DeckConfiguration
}): CoordinateTuple => {
  const { baseNode, deckDef, deckConfiguration } = args

  // If the base node is not a slot or addressable area, return zeros.
  if (!(
    typeof baseNode === 'object' &&
    ('addressableAreaName' in baseNode || 'slotName' in baseNode)
  )) {
    return ZERO_COORDINATE_TUPLE
  }
  const addressableAreaName =
    'addressableAreaName' in baseNode
      ? baseNode.addressableAreaName
      : (baseNode.slotName as AddressableAreaName)
  const addressableArea = deckDef.locations.addressableAreas.find(
    ({ id }) => id === addressableAreaName
  )
  if (addressableArea == null) {
    return ZERO_COORDINATE_TUPLE
  }
  const cutoutId = getCutoutIdFromAddressableArea(addressableAreaName, deckDef)
  const cutout = deckDef.locations.cutouts.find(({ id }) => id === cutoutId)
  if (cutout == null) {
    return ZERO_COORDINATE_TUPLE
  }
  const cutoutFixture = deckConfiguration.find(
    ({ cutoutId: deckConfigCutoutId }) => deckConfigCutoutId === cutoutId
  )
  if (cutoutFixture == null) {
    return ZERO_COORDINATE_TUPLE
  }
  const { position } = cutout
  const { offsetFromCutoutFixture } = addressableArea
  return getOffsetPosition({
    position,
    offset: {
      x: offsetFromCutoutFixture[0],
      y: offsetFromCutoutFixture[1],
      z: offsetFromCutoutFixture[2],
    },
  })
}

/**
 * Bottom-up rendering info for a labware stack (PE `LoadedLabwareLocation` chain, top-down in input).
 * Does not mutate the input `stack`.
 */
export const getLabwareStackRenderingInfo = (args: {
  stack: LoadedLabwareLocation[]
  labwareEntities: LabwareEntities
  deckDef: DeckDefinition
  deckConfiguration: DeckConfiguration
}): StackRenderingInfo[] | null => {
  const { stack, labwareEntities, deckDef, deckConfiguration } = args
  const stackBottomToTop = [...stack].reverse()

  const baseNode = first(stackBottomToTop)
  if (baseNode == null) {
    return null
  }

  let runningPosition: CoordinateTuple = getRenderingPositionFromBaseNode({
    baseNode,
    deckDef,
    deckConfiguration,
  })
  let prevDefLoadName: string | null = null
  const renderingInfos: StackRenderingInfo[] = []

  for (const node of stackBottomToTop) {
    if (!(typeof node === 'object' && 'labwareId' in node)) {
      continue
    }
    const { labwareId } = node
    const labwareEntity = labwareEntities[labwareId]
    if (labwareEntity == null) {
      return null
    }
    if (prevDefLoadName == null) {
      renderingInfos.push({
        labwareId,
        definition: labwareEntity.def,
        position: runningPosition,
      })
      prevDefLoadName = labwareEntity.def.parameters.loadName
      continue
    }
    const { stackingOffsetWithLabware } = labwareEntity.def
    const newOffset = stackingOffsetWithLabware?.[prevDefLoadName] ?? {
      x: 0,
      y: 0,
      z: 0,
    }
    runningPosition = getOffsetPosition({
      position: runningPosition,
      offset: newOffset,
    })
    prevDefLoadName = labwareEntity.def.parameters.loadName
    renderingInfos.push({
      labwareId,
      definition: labwareEntity.def,
      position: runningPosition,
    })
  }
  return renderingInfos
}

export const getOffsetPosition = (args: {
  position: CoordinateTuple
  offset: Vector3D
}): CoordinateTuple => {
  const { position, offset } = args
  return [
    position[0] + offset.x,
    position[1] + offset.y,
    position[2] + offset.z,
  ]
}
