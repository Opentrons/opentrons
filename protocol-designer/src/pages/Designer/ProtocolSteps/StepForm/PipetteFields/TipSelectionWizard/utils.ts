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

import type {
  DeckDefinition,
  LabwareDefinition,
  NozzleConfigurationStyle,
  PipetteChannels,
  PipetteV2Specs,
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

// arbitrary constant to show slots surrounding the selected tiprack
// TODO: confirm this padding with Design
const PADDING_MM_X = 50

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
  selectedTiprackId: string
  labwareState: AllTemporalPropertiesForTimelineFrame['labware']
  wellName: string | null
  pipetteSpec: PipetteV2Specs
  primaryNozzle: string
}): { x: number; y: number } => {
  const {
    selectedTiprackId,
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
  const labware = labwareState[selectedTiprackId ?? '']
  const well = labware.def.wells[wellName]
  return {
    x:
      well.x +
      xOffset -
      (well.shape === 'circular' ? well.diameter : well.xDimension) / 2,
    y:
      well.y +
      yOffset -
      (well.shape === 'circular' ? well.diameter : well.yDimension) / 2,
  }
}

export const getColumnFromWellName = (wellName: string): string =>
  wellName.slice(1, wellName.length)

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
  primaryNozzle: string
  invariantContext: InvariantContext
  robotState: TimelineFrame | null
  tipAccessibilityStatus: Record<string, Record<string, boolean>>
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
