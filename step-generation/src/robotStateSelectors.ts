// TODO: Ian 2019-04-18 move orderWells somewhere more general -- shared-data util?
import min from 'lodash/min'

import {
  A1_NOZZLE,
  A12_NOZZLE,
  ABSORBANCE_READER_TYPE,
  ALL,
  COLUMN,
  FLEX_STACKER_MODULE_TYPE,
  getIsTiprack,
  getLabwareDefIsStandard,
  getLabwareDefURI,
  getTiprackVolume,
  H1_NOZZLE,
  H12_NOZZLE,
  orderWells,
  PARTIAL_COLUMN,
  ROW,
  SINGLE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { CLEAN, COLUMN_4_SLOTS } from './constants'
import {
  getIsInPipettableLocation,
  getIsSafePickupWithinTiprack,
  getLabwareHasLid,
  getPipetteMovementSafetyStatus,
  getSlotInLocationStack,
} from './utils'

import type {
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  AbsorbanceReaderState,
  FlexStackerModuleState,
  InvariantContext,
  ModuleTemporalProperties,
  RobotState,
  ThermocyclerModuleState,
  VacuumModuleState,
} from './types'

export function sortLabwareBySlot(
  labwareState: RobotState['labware']
): string[] {
  const sortedLabware = Object.keys(labwareState).sort(
    (idA: string, idB: string) => {
      const slotAStr = getSlotInLocationStack(labwareState[idA].stack)
      const slotBStr = getSlotInLocationStack(labwareState[idB].stack)
      const slotANum = parseInt(slotAStr)
      const slotBNum = parseInt(slotBStr)
      if (
        COLUMN_4_SLOTS.includes(slotAStr) &&
        COLUMN_4_SLOTS.includes(slotBStr)
      ) {
        return idA.localeCompare(idB)
      }
      if (COLUMN_4_SLOTS.includes(slotAStr)) {
        return 1
      }
      if (COLUMN_4_SLOTS.includes(slotBStr)) {
        return -1
      }
      return slotANum - slotBNum
    }
  )

  return sortedLabware
}

export function _getNextTip(args: {
  pipetteId: string
  tiprackId: string
  invariantContext: InvariantContext
  robotState: RobotState
  primaryNozzle: PrimaryNozzleConfigurationStyle | null
  nozzles: NozzleConfigurationStyle
}): string | null {
  const {
    pipetteId,
    tiprackId,
    invariantContext,
    robotState,
    nozzles,
    primaryNozzle,
  } = args
  const pipetteChannels =
    invariantContext.pipetteEntities[pipetteId]?.spec?.channels
  const tiprackDef = invariantContext.labwareEntities[tiprackId]?.def
  const tiprackWellsState = robotState.tipState.tipracks[tiprackId]
  if (!pipetteChannels || !tiprackDef || !tiprackWellsState) {
    console.assert(
      false,
      `Pipette ${pipetteId} missing channels/spec or tiprack definition`
    )
    return null
  }

  const hasCleanTip = (well: string): boolean =>
    tiprackWellsState[well] === CLEAN

  const orderedWellsT2B = orderWells(tiprackDef.ordering, 't2b', 'l2r')
  const orderedWellsB2T = orderWells(tiprackDef.ordering, 'b2t', 'l2r')

  const firstClean = (wells: string[]): string | null =>
    wells.find(hasCleanTip) ?? null

  const firstCleanReversed = (wells: string[]): string | null =>
    [...wells].reverse().find(hasCleanTip) ?? null

  const firstFullGroup = (groups: string[][]): string[] | null =>
    groups.find(group => group.every(hasCleanTip)) ?? null

  const firstFullGroupReversed = (groups: string[][]): string[] | null =>
    [...groups].reverse().find(group => group.every(hasCleanTip)) ?? null
  const is8ch1Nozzle = pipetteChannels === 8 && nozzles === SINGLE
  const is8ch1NozzleFront = is8ch1Nozzle && primaryNozzle === H1_NOZZLE
  const is8ch1NozzleBack = is8ch1Nozzle && primaryNozzle === A1_NOZZLE

  const is96ch1Nozzle = pipetteChannels === 96 && nozzles === SINGLE
  const is96ch1NozzleFrontRight = is96ch1Nozzle && primaryNozzle === H12_NOZZLE
  const is96ch1NozzleBackRight = is96ch1Nozzle && primaryNozzle === A12_NOZZLE
  const is96ch1NozzleFrontLeft = is96ch1Nozzle && primaryNozzle === H1_NOZZLE
  const is96ch1NozzleBackLeft = is96ch1Nozzle && primaryNozzle === A1_NOZZLE

  if (pipetteChannels === 1 || is8ch1NozzleFront || is96ch1NozzleFrontRight) {
    return firstClean(orderedWellsT2B)
  }
  if (is8ch1NozzleBack) {
    return firstClean(orderedWellsB2T)
  }
  if (nozzles === PARTIAL_COLUMN) {
    const first = firstClean(orderedWellsT2B)
    if (!first) {
      return null
    }
    const idx = orderedWellsT2B.indexOf(first)
    return orderedWellsT2B[idx] ?? null
  }

  if (nozzles === ALL && pipetteChannels === 8) {
    const column = firstFullGroup(tiprackDef.ordering)
    return column?.[0] ?? null
  }

  if (is96ch1NozzleBackLeft) {
    return firstCleanReversed(orderedWellsT2B)
  }
  if (is96ch1NozzleBackRight) {
    return firstClean(orderedWellsB2T)
  }
  if (is96ch1NozzleFrontLeft) {
    return firstCleanReversed(orderedWellsB2T)
  }

  if (nozzles === COLUMN) {
    const columns = tiprackDef.ordering
    const column =
      primaryNozzle === A1_NOZZLE
        ? firstFullGroupReversed(columns)
        : firstFullGroup(columns)
    return column?.[0] ?? null
  }

  if (nozzles === ROW) {
    const columns = tiprackDef.ordering
    const rows = columns[0].map((_, i) => columns.map(col => col[i]))

    const row =
      primaryNozzle === A1_NOZZLE
        ? firstFullGroupReversed(rows)
        : firstFullGroup(rows)

    return row?.[0] ?? null
  }

  if (nozzles === ALL && pipetteChannels === 96) {
    return orderedWellsT2B.every(hasCleanTip) ? orderedWellsT2B[0] : null
  }

  console.assert(false, `Unhandled _getNextTip case for pipette ${pipetteId}`)
  return null
}
interface NextTiprackInfo {
  nextTiprack: {
    tiprackId: string
    well: string
  } | null
  tipracks: {
    totalTipracks: number
    excludedBy96Channel: number
    excludedByLid: number
    filteredSortedTiprackIds: string[]
  }
}
export function getNextTiprack(
  pipetteId: string,
  tipRackUri: string,
  invariantContext: InvariantContext,
  robotState: RobotState,
  primaryNozzle: PrimaryNozzleConfigurationStyle,
  nozzles: NozzleConfigurationStyle
): NextTiprackInfo {
  /** Returns the next tiprack that has tips.
    Tipracks are any labwareIds that exist in tipState.tipracks.
    For 8-channel pipette, tipracks need a full column of tips.
    If there are no available tipracks, returns null.
  */
  const pipetteEntity = invariantContext.pipetteEntities[pipetteId]
  if (!pipetteEntity) {
    throw new Error(
      `cannot getNextTiprack, no pipette entity for pipette "${pipetteId}"`
    )
  }
  // filter out unmounted or non-compatible or lidded tiprack models
  const excludedByLid: string[] = []
  const sortedTipracksIds = sortLabwareBySlot(robotState.labware).filter(
    labwareId => {
      console.assert(
        invariantContext.labwareEntities[labwareId]?.labwareDefURI != null,
        `cannot getNextTiprack, no labware entity for "${labwareId}"`
      )
      const slotInLocationStack = getSlotInLocationStack(
        robotState.labware[labwareId].stack
      )
      const isInPipettableLocation =
        getIsInPipettableLocation(slotInLocationStack)

      const hasLid = getLabwareHasLid({
        labwareId: labwareId,
        labwareRobotState: robotState.labware,
        labwareEntities: invariantContext.labwareEntities,
      })
      if (
        isInPipettableLocation &&
        hasLid &&
        getIsTiprack(invariantContext.labwareEntities[labwareId].def)
      ) {
        excludedByLid.push(labwareId)
        return false
      }

      const labwareIdDefUri =
        invariantContext.labwareEntities[labwareId].labwareDefURI
      return isInPipettableLocation && labwareIdDefUri === tipRackUri
    }
  )
  let filteredSortedTiprackIds = sortedTipracksIds
  const is96Channel = pipetteEntity.spec.channels === 96

  const excludedBy96Channel: string[] = []

  if (is96Channel) {
    filteredSortedTiprackIds = filteredSortedTiprackIds.filter(tiprackId => {
      const tipRackLocation = robotState.labware[tiprackId].stack[1]
      const adapterEntity = invariantContext.labwareEntities[tipRackLocation]
      const has96TiprackAdapterId =
        adapterEntity?.def.parameters.loadName ===
          'opentrons_flex_96_tiprack_adapter' &&
        getLabwareDefIsStandard(adapterEntity?.def)

      const keepTiprackAdapter =
        nozzles === ALL ? has96TiprackAdapterId : !has96TiprackAdapterId
      if (!keepTiprackAdapter) {
        excludedBy96Channel.push(tiprackId)
      }
      return keepTiprackAdapter
    })
  }

  let firstAvailableTiprack: string | null = null
  let nextTip: string | null = null

  for (const tiprackId of filteredSortedTiprackIds) {
    const candidateTip = _getNextTip({
      pipetteId,
      tiprackId,
      nozzles,
      invariantContext,
      robotState,
      primaryNozzle,
    })
    const { isSafe: isCandidateSafeMovement } =
      candidateTip != null
        ? getPipetteMovementSafetyStatus({
            robotState,
            invariantContext,
            pipetteId,
            labwareId: tiprackId,
            wellTargetName: candidateTip,
            primaryNozzle,
            nozzleConfiguration: nozzles,
          })
        : { isSafe: false }
    const {
      isSafe: isSafeWithinTiprack,
      isComplete: isCompletePickup = false,
    } =
      candidateTip != null
        ? getIsSafePickupWithinTiprack({
            tipState: robotState.tipState.tipracks[tiprackId],
            primaryNozzle,
            channels: pipetteEntity.spec.channels,
            nozzleConfiguration: nozzles,
            wellName: candidateTip,
            tiprackDef: invariantContext.labwareEntities[tiprackId].def,
          })
        : { isSafe: false }

    if (
      candidateTip &&
      isCandidateSafeMovement &&
      isSafeWithinTiprack &&
      isCompletePickup
    ) {
      firstAvailableTiprack = tiprackId
      nextTip = candidateTip
      break
    }
  }

  if (firstAvailableTiprack && nextTip) {
    return {
      nextTiprack: {
        tiprackId: firstAvailableTiprack,
        well: nextTip,
      },
      tipracks: {
        totalTipracks: sortedTipracksIds.length,
        excludedBy96Channel: excludedBy96Channel.length,
        excludedByLid: excludedByLid.length,
        filteredSortedTiprackIds,
      },
    }
  }

  // No available tipracks (for given pipette channels) but keep track of tiprack numbers
  // for 96-channel and tiprack adapters
  return {
    nextTiprack: null,
    tipracks: {
      totalTipracks: sortedTipracksIds.length,
      excludedBy96Channel: excludedBy96Channel.length,
      excludedByLid: excludedByLid.length,
      filteredSortedTiprackIds,
    },
  }
}
export function getPipetteWithTipMaxVol(
  pipetteId: string,
  invariantContext: InvariantContext,
  tipRackDefUri: string
): number {
  // NOTE: this fn assumes each pipette is assigned to exactly one tiprack type,
  // across the entire timeline
  const pipetteEntity = invariantContext.pipetteEntities[pipetteId]
  const pipetteMaxVol = pipetteEntity.spec.liquids.default.maxVolume
  const tiprackDef = pipetteEntity.tiprackLabwareDef
  let chosenTipRack = null
  for (const def of tiprackDef) {
    if (getLabwareDefURI(def) === tipRackDefUri) {
      chosenTipRack = def
      break
    }
  }
  const tiprackTipVol = getTiprackVolume(chosenTipRack ?? tiprackDef[0])

  if (!pipetteMaxVol || !tiprackTipVol) {
    console.assert(
      false,
      `getPipetteEffectiveMaxVol expected tiprackMaxVol and pipette maxVolume to be > 0, got',
      ${pipetteMaxVol}, ${tiprackTipVol}`
    )
    return NaN
  }
  return min([tiprackTipVol, pipetteMaxVol]) ?? NaN
}
export function getModuleState(
  robotState: RobotState,
  moduleId: string
): ModuleTemporalProperties['moduleState'] {
  if (!(moduleId in robotState.modules)) {
    console.warn(
      `getModuleState expected module id "${moduleId}" to be in robot state`
    )
  }

  return robotState.modules[moduleId]?.moduleState
}
export const thermocyclerStateGetter = (
  robotState: RobotState,
  moduleId: string
): ThermocyclerModuleState | null => {
  const hardwareModule = robotState.modules[moduleId]?.moduleState
  return hardwareModule && hardwareModule.type === THERMOCYCLER_MODULE_TYPE
    ? hardwareModule
    : null
}

// TODO: refactor this and above utility into one
export const absorbanceReaderStateGetter = (
  robotState: RobotState,
  moduleId: string
): AbsorbanceReaderState | null => {
  const hardwareModule = robotState.modules[moduleId]?.moduleState
  return hardwareModule && hardwareModule.type === ABSORBANCE_READER_TYPE
    ? hardwareModule
    : null
}

export const flexStackerStateGetter = (
  robotState: RobotState,
  moduleId: string
): FlexStackerModuleState | null => {
  const hardwareModule = robotState.modules[moduleId]?.moduleState
  return hardwareModule && hardwareModule.type === FLEX_STACKER_MODULE_TYPE
    ? hardwareModule
    : null
}

export const vacuumModuleStateGetter = (
  robotState: RobotState,
  moduleId: string
): VacuumModuleState | null => {
  const hardwareModule = robotState.modules[moduleId]?.moduleState
  return hardwareModule && hardwareModule.type === VACUUM_MODULE_TYPE
    ? hardwareModule
    : null
}
