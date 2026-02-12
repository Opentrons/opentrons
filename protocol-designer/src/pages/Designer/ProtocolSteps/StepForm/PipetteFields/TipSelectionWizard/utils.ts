import {
  ALL,
  COLUMN,
  getIsTiprack,
  getPositionFromSlotId,
  SINGLE,
} from '@opentrons/shared-data'
import {
  COLUMN_4_SLOTS,
  getIsSafePickupWithinTiprack,
  getIsSafePipetteMovement,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import {
  LABEL_BORDER_WIDTH_PX,
  LABEL_PLACEMENT_BOTTOM,
  LABEL_PLACEMENT_LEFT,
  LABEL_PLACEMENT_RIGHT,
  LABEL_PLACEMENT_TOP,
} from './constants'

import type { Channels } from '@opentrons/components'
import type {
  DeckDefinition,
  LabwareDefinition,
  NozzleConfigurationStyle,
  PipetteChannels,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntities,
  TimelineFrame,
} from '@opentrons/step-generation'
import type {
  AllTemporalPropertiesForTimelineFrame,
  LabwareOnDeck,
} from '../../../../../../step-forms'
import type { AccessibilityStatus, LabelPlacement } from './types'

// arbitrary constant to show slots surrounding the selected tiprack
// TODO: confirm this padding with Design
const PADDING_MM_X = 50
const BASE_OFFSET_X = 15
const BASE_OFFSET_Y = 15

// additional offset to account for irregular OT-2 8-channel pipette geometry (right "hump")
const OFFSET_OT2_8_CHANNEL = 10

export const getViewboxFromSelectedLabware = (
  selectedLabwareId: string,
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame,
  deckDef: DeckDefinition
): string | null => {
  const { labware } = activeDeckSetup
  const selectedLabware = labware[selectedLabwareId]
  if (selectedLabware == null) {
    return null
  }
  const [deckXDimension, deckYDimension] = deckDef.dimensions
  const ratio = deckYDimension / deckXDimension

  // preserve aspect ratio
  const paddingMmY = PADDING_MM_X * ratio
  const { xDimension, yDimension } = selectedLabware.def.dimensions
  const slot = getSlotInLocationStack(selectedLabware.stack)
  const slotPosition = getPositionFromSlotId(slot, deckDef)
  if (slotPosition == null) {
    return null
  }
  return `${slotPosition[0] - PADDING_MM_X} ${slotPosition[1] - paddingMmY} ${
    xDimension + PADDING_MM_X * 2
  } ${yDimension + paddingMmY * 2}`
}

export const getHoveredOffsetFromWell = (args: {
  selectedLabwareId: string
  labwareState: AllTemporalPropertiesForTimelineFrame['labware']
  wellName: string | null
  pipetteSpec: PipetteV2Specs
  primaryNozzle: PrimaryNozzleConfigurationStyle
}): { x: number; y: number } => {
  const {
    selectedLabwareId,
    labwareState,
    wellName,
    pipetteSpec,
    primaryNozzle,
  } = args
  const { nozzleMap, pipetteBoundingBoxOffsets } = pipetteSpec
  const { backLeftCorner, frontRightCorner } = pipetteBoundingBoxOffsets
  const [xNozzleOffset, yNozzleOffset] = nozzleMap[primaryNozzle] ?? [0, 0]
  const leftBound = backLeftCorner[0]
  const frontBound = frontRightCorner[1]

  const xOffset = leftBound - xNozzleOffset
  const yOffset = frontBound - yNozzleOffset

  if (wellName == null) {
    return {
      x: 0,
      y: 0,
    }
  }
  const labware = labwareState[selectedLabwareId ?? '']

  const well = labware.def.wells[wellName]
  return {
    x: well.x + xOffset,
    y: well.y + yOffset,
  }
}

export const getColumnFromWellName = (wellName: string): string =>
  wellName.slice(-2, -1)

export const getIsPickupCompatibleWithPossibleAdapter = (
  stack: string[],
  labwareEntities: LabwareEntities,
  nozzles: NozzleConfigurationStyle,
  channels: PipetteChannels
): boolean => {
  const isAdapterNeeded = nozzles === ALL && channels === 96
  const isAdapterInStack = stack.some(stackElementId => {
    return (
      labwareEntities[stackElementId]?.labwareDefURI ===
      'opentrons/opentrons_flex_96_tiprack_adapter/1'
    )
  })
  return isAdapterNeeded === isAdapterInStack
}

export function getIsTiprackSelectable(args: {
  labware: LabwareOnDeck
  formTiprackUri: string
  pipetteSpecs: PipetteV2Specs
  nozzles: NozzleConfigurationStyle
  labwareEntities: LabwareEntities
  validTiprackIds: string[]
}): boolean {
  // TODO: check if tiprack is on stacker. Will bottom of stack still be slot?
  const {
    labware,
    formTiprackUri,
    pipetteSpecs,
    nozzles,
    labwareEntities,
    validTiprackIds,
  } = args
  const { channels } = pipetteSpecs
  const { def, labwareDefURI, stack } = labware
  const isPickupCompatibleWithPossibleAdapter =
    getIsPickupCompatibleWithPossibleAdapter(
      stack,
      labwareEntities,
      nozzles,
      channels
    )
  const slot = getSlotInLocationStack(stack)
  return (
    getIsTiprack(def) &&
    labwareDefURI === formTiprackUri &&
    !COLUMN_4_SLOTS.includes(slot) &&
    isPickupCompatibleWithPossibleAdapter &&
    validTiprackIds.includes(labware.id)
  )
}

export const getAllWellsInColumn = (
  wellName: string,
  labwareDef: LabwareDefinition
): string[] => {
  const column = getColumnFromWellName(wellName)
  return Object.keys(labwareDef.wells).filter(
    well => getColumnFromWellName(well) === column
  )
}

export const getAffectedWells = (args: {
  wellName: string | null
  labwareDef: LabwareDefinition
  channels: number
  nozzles: NozzleConfigurationStyle
}): string[] => {
  const { wellName, labwareDef, channels, nozzles } = args
  if (wellName == null) {
    return []
  }
  if (channels === 1 || nozzles === SINGLE) {
    return [wellName]
  } else if (channels === 8 || (channels === 96 && nozzles === COLUMN)) {
    return getAllWellsInColumn(wellName, labwareDef)
  } else if (channels === 96) {
    return Object.keys(labwareDef.wells)
  }
  return []
}

export const getValidTiprackIds = (args: {
  pipetteId: string
  nozzles: NozzleConfigurationStyle
  channels: PipetteChannels
  numPickups: number
  primaryNozzle: PrimaryNozzleConfigurationStyle
  invariantContext: InvariantContext
  robotState: TimelineFrame | null
  tipAccessibilityStatus: Record<string, Record<string, AccessibilityStatus>>
}): string[] => {
  const {
    pipetteId,
    nozzles,
    channels,
    numPickups,
    primaryNozzle,
    tipAccessibilityStatus,
    invariantContext,
    robotState,
  } = args
  const { labwareEntities } = invariantContext
  const validTiprackIds = Object.keys(tipAccessibilityStatus).reduce<string[]>(
    (acc, id) => {
      const tiprackDef = labwareEntities[id].def
      const tipState = robotState?.tipState.tipracks[id] ?? {}
      const stack = robotState?.labware[id]?.stack
      const isPickupCompatibleWithPossibleAdapter =
        stack != null
          ? getIsPickupCompatibleWithPossibleAdapter(
              stack,
              labwareEntities,
              nozzles,
              channels
            )
          : true
      if (!isPickupCompatibleWithPossibleAdapter) {
        return acc
      }

      let isValidTiprack: boolean = true
      const addedWells: string[] = []
      for (let pickupIndex = 0; pickupIndex < numPickups; pickupIndex++) {
        const wellsToTraverse = Object.keys(tiprackDef.wells)
        let foundSafePickup = false
        for (const wellName of wellsToTraverse) {
          const { isSafe: isSafeWithinTiprack, isComplete } =
            getIsSafePickupWithinTiprack({
              tipState,
              primaryNozzle,
              channels,
              nozzleConfiguration: nozzles,
              wellName,
              tiprackDef,
              tipsToIgnore: addedWells,
            })
          const isSafeMoveConsideringDeck =
            robotState != null
              ? getIsSafePipetteMovement({
                  robotState,
                  invariantContext,
                  pipetteId,
                  labwareId: id,
                  wellTargetName: wellName,
                  primaryNozzle,
                  nozzleConfiguration: nozzles,
                })
              : true
          if (isSafeWithinTiprack && isSafeMoveConsideringDeck && isComplete) {
            const allAffectedWells = getAffectedWells({
              wellName,
              labwareDef: tiprackDef,
              channels,
              nozzles,
            })
            addedWells.push(...allAffectedWells)
            foundSafePickup = true
            break // Found a safe pickup for this iteration, move to next pickup
          }
        }

        // If we didn't find a safe pickup for this iteration, the tiprack is invalid
        if (!foundSafePickup) {
          isValidTiprack = false
          break // Stop checking this tiprack entirely
        }
      }

      return isValidTiprack ? [...acc, id] : acc
    },
    []
  )
  return validTiprackIds
}

export const getPlacementByViewboxAndPipetteSpec = (args: {
  enclosingViewbox: string | null
  x: number
  y: number
  width: number
  height: number
  channels: Channels
}): LabelPlacement => {
  const { enclosingViewbox, x, y, width, height, channels } = args
  if (enclosingViewbox == null) {
    console.warn('No enclosing viewbox found')
    return LABEL_PLACEMENT_BOTTOM
  }
  const viewBoxSplit = enclosingViewbox.split(' ').map(val => Number(val))
  if (viewBoxSplit.length !== 4) {
    console.warn(`Invalid viewbox value: ${enclosingViewbox}`)
    return LABEL_PLACEMENT_BOTTOM
  }
  const leftBound = viewBoxSplit[0]
  const bottomBound = viewBoxSplit[1]
  const rightBound = viewBoxSplit[2] + leftBound
  const topBound = viewBoxSplit[3] + bottomBound

  // pipette is left of viewbox
  if (channels === 96) {
    if (x < leftBound - BASE_OFFSET_X) {
      return LABEL_PLACEMENT_RIGHT
    }
    // pipette is right of viewbox
    if (x + width > rightBound) {
      return LABEL_PLACEMENT_LEFT
    }
    // pipette is above viewbox
    if (y < bottomBound) {
      return LABEL_PLACEMENT_TOP
    }
    // pipette is below viewbox
    if (y + height > topBound) {
      return LABEL_PLACEMENT_BOTTOM
    }
    return LABEL_PLACEMENT_BOTTOM
  }
  // 1- or 8-channel pipette
  const distanceFromLeft = x - leftBound
  const distanceFromRight = rightBound - (x + width)
  const isCloserToLeft = distanceFromLeft < distanceFromRight
  return isCloserToLeft ? LABEL_PLACEMENT_RIGHT : LABEL_PLACEMENT_LEFT
}

// TODO (nd: 2025/11/06): extend to top-right, top-left, etc. once different nozzle configurations are supported
export const getLabelOffsetByPlacement = (args: {
  labelPlacement: LabelPlacement
  labelWidth: number
  labelHeight: number
  shadowWidth: number
  shadowHeight: number
  isOt2EightChannel: boolean
}): {
  x: number
  y: number
} => {
  const {
    labelPlacement,
    labelWidth,
    labelHeight,
    shadowWidth,
    shadowHeight,
    isOt2EightChannel,
  } = args
  let labelOffsetX: number = 0
  let labelOffsetY: number = 0
  if (labelPlacement === LABEL_PLACEMENT_BOTTOM) {
    labelOffsetX = BASE_OFFSET_X
    labelOffsetY = -labelHeight + 2 * LABEL_BORDER_WIDTH_PX
  } else if (labelPlacement === LABEL_PLACEMENT_TOP) {
    labelOffsetX = BASE_OFFSET_X
    labelOffsetY = shadowHeight - 2 * LABEL_BORDER_WIDTH_PX
  } else if (labelPlacement === LABEL_PLACEMENT_LEFT) {
    labelOffsetY = BASE_OFFSET_Y
    labelOffsetX = -labelWidth
  } else if (labelPlacement === LABEL_PLACEMENT_RIGHT) {
    labelOffsetY =
      BASE_OFFSET_Y + (isOt2EightChannel ? OFFSET_OT2_8_CHANNEL : 0)
    labelOffsetX = shadowWidth - LABEL_BORDER_WIDTH_PX
  }
  return {
    x: labelOffsetX,
    y: labelOffsetY,
  }
}
