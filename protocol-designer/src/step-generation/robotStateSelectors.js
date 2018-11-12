// @flow
import assert from 'assert'
import min from 'lodash/min'
import sortBy from 'lodash/sortBy'
import type {Channels} from '@opentrons/components'
import {getLabware} from '@opentrons/shared-data'
import {tiprackWellNamesByCol, tiprackWellNamesFlat} from './'
import type {RobotState, PipetteData, LabwareData} from './'

// SELECTOR UTILITIES

export function sortLabwareBySlot (robotState: RobotState) {
  return sortBy(Object.keys(robotState.labware), id => parseInt(robotState.labware[id].slot))
}

// SELECTORS

export function getPipetteChannels (pipetteId: string, robotState: RobotState): ?Channels {
  const pipette = robotState.instruments[pipetteId]

  if (!pipette) {
    assert(pipette, `no pipette with ID {pipetteId} found in robot state`)
    return null
  }

  const pipetteChannels = pipette.channels
  return pipetteChannels
}

export function getTiprackVolumeByLabwareId (labwareId: string, robotState: RobotState): ?number {
  const tiprackType = robotState.labware[labwareId].type
  const tiprackData = getLabware(tiprackType)
  assert(
    tiprackData,
    `could not get labware data for tiprack: id=${labwareId}, type=${tiprackType}.`)

  const tipMaxVolume = (tiprackData && tiprackData.metadata.tipVolume) || null

  assert(
    tipMaxVolume && tipMaxVolume > 0,
    `expected tipMaxVolume > 0, got ${String(tipMaxVolume)}. tiprack id: ${labwareId}`)
  return tipMaxVolume
}

export function getLabwareType (labwareId: string, robotState: RobotState): ?string {
  const labware = robotState.labware[labwareId]

  if (!labware) {
    assert(false, `no labware id: "${labwareId}"`)
    return null
  }

  const labwareType = labware.type
  return labwareType
}

export function _getNextTip (
  pipetteChannels: Channels,
  tiprackWellsState: {[wellName: string]: boolean,
}): string | null {
  /** Given a tiprack's wells state, return the well of the next available tip
    NOTE: expects 96-well tiprack
  */
  const hasTiprack = wellName => tiprackWellsState[wellName]

  if (pipetteChannels === 1) {
    const well = tiprackWellNamesFlat.find(hasTiprack)
    return well || null
  }

  // Otherwise, pipetteChannels === 8.
  // return first well in the column (for 96-well format, the 'A' row)
  const fullColumn = tiprackWellNamesByCol.find(wellNamesInCol => wellNamesInCol.every(hasTiprack))
  return fullColumn ? fullColumn[0] : null
}

/** Tipracks are "available" if they match the assignment type,
  * and are not assigned to another pipette. */
export function tiprackIsAvailableToPipette (
  pipette: PipetteData,
  tiprackData: LabwareData,
  assignedPipetteId: ?string
): boolean {
  const matchingTiprackModel = pipette.tiprackModel === tiprackData.type

  // robotState.tiprackAssignment key may not exist,
  // or tiprack id may not be in tiprackAssignment
  // both these indicate that the tiprack is unassigned
  const tiprackAssignmentOk = (
    assignedPipetteId == null ||
    assignedPipetteId === pipette.id
  )

  return matchingTiprackModel && tiprackAssignmentOk
}

type NextTiprack = {|tiprackId: string, well: string|} | null
export function getNextTiprack (pipette: PipetteData, robotState: RobotState): NextTiprack {
  /** Returns the next tiprack that has tips.
    Tipracks are any labwareIds that exist in tipState.tipracks.
    For 8-channel pipette, tipracks need a full column of tips.
    If there are no available tipracks, returns null.
  */
  const sortedTipracksIds = sortLabwareBySlot(robotState).filter(labwareId =>
    // assume if labwareId is not in tipState.tipracks, it's not a tiprack
    robotState.tipState.tipracks[labwareId] &&
    tiprackIsAvailableToPipette(
      pipette,
      robotState.labware[labwareId],
      robotState.tiprackAssignment && robotState.tiprackAssignment[labwareId]
    )
  )

  const firstAvailableTiprack = sortedTipracksIds.find(tiprackId =>
    _getNextTip(pipette.channels, robotState.tipState.tipracks[tiprackId])
  )

  // TODO Ian 2018-02-12: avoid calling _getNextTip twice
  const nextTip = firstAvailableTiprack &&
    _getNextTip(pipette.channels, robotState.tipState.tipracks[firstAvailableTiprack])

  if (firstAvailableTiprack && nextTip) {
    return {
      tiprackId: firstAvailableTiprack,
      well: nextTip,
    }
  }
  // No available tipracks (for given pipette channels)
  return null
}

export function getPipetteWithTipMaxVol (pipetteId: string, robotState: RobotState): number {
  // NOTE: this fn assumes each pipette is assigned to exactly one tiprack type,
  // across the entire timeline
  const pipetteData = robotState.instruments[pipetteId]
  const pipetteMaxVol = pipetteData && pipetteData.maxVolume

  const tiprackData = pipetteData && pipetteData.tiprackModel && getLabware(pipetteData.tiprackModel)
  const tiprackTipVol = tiprackData && tiprackData.metadata.tipVolume

  if (!pipetteMaxVol || !tiprackTipVol) {
    console.error('getPipetteEffectiveMaxVol expected tiprackMaxVol and pipette maxVolume to be > 0, got', {pipetteMaxVol, tiprackTipVol})
    return NaN
  }
  return min([tiprackTipVol, pipetteMaxVol])
}
