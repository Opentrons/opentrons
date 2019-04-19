// @flow
import assert from 'assert'
import min from 'lodash/min'
import sortBy from 'lodash/sortBy'
import type { Channels } from '@opentrons/components'
import {
  getLabware,
  getPipetteNameSpecs,
  type PipetteNameSpecs,
} from '@opentrons/shared-data'
import { tiprackWellNamesByCol, tiprackWellNamesFlat } from './'
import type { RobotState } from './'

// SELECTOR UTILITIES

export function sortLabwareBySlot(robotState: RobotState): Array<string> {
  return sortBy<string>(Object.keys(robotState.labware), (id: string) =>
    parseInt(robotState.labware[id].slot)
  )
}

// SELECTORS

export function getPipetteSpecFromId(
  pipetteId: string,
  robotState: RobotState
): PipetteNameSpecs {
  const pipette = robotState.pipettes[pipetteId]

  if (!pipette) {
    throw Error(`no pipette with ID ${pipetteId} found in robot state`)
  }

  const pipetteSpec = getPipetteNameSpecs(pipette.name)
  if (!pipetteSpec) {
    throw Error(`no pipette spec for pipette with ID ${pipetteId}`)
  }

  return pipetteSpec
}

export function getLabwareType(
  labwareId: string,
  robotState: RobotState
): ?string {
  const labware = robotState.labware[labwareId]

  if (!labware) {
    assert(false, `no labware id: "${labwareId}"`)
    return null
  }

  const labwareType = labware.type
  return labwareType
}

export function _getNextTip(
  pipetteChannels: Channels,
  tiprackWellsState: { [wellName: string]: boolean }
): string | null {
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
  const fullColumn = tiprackWellNamesByCol.find(wellNamesInCol =>
    wellNamesInCol.every(hasTiprack)
  )
  return fullColumn ? fullColumn[0] : null
}

type NextTiprack = {| tiprackId: string, well: string |} | null
export function getNextTiprack(
  pipetteId: string,
  robotState: RobotState
): NextTiprack {
  /** Returns the next tiprack that has tips.
    Tipracks are any labwareIds that exist in tipState.tipracks.
    For 8-channel pipette, tipracks need a full column of tips.
    If there are no available tipracks, returns null.
  */
  const pipetteData = robotState.pipettes[pipetteId]
  if (!pipetteData) {
    assert(
      false,
      `pipette ID ${pipetteId} not in robotState, could not getNextTiprack`
    )
    return null
  }
  const pipetteSpec = getPipetteSpecFromId(pipetteId, robotState)

  const sortedTipracksIds = sortLabwareBySlot(robotState).filter(
    labwareId =>
      // assume if labwareId is not in tipState.tipracks, it's not a tiprack
      robotState.tipState.tipracks[labwareId] &&
      pipetteData.tiprackModel === robotState.labware[labwareId].type
  )

  const firstAvailableTiprack = sortedTipracksIds.find(tiprackId =>
    _getNextTip(pipetteSpec.channels, robotState.tipState.tipracks[tiprackId])
  )

  // TODO Ian 2018-02-12: avoid calling _getNextTip twice
  const nextTip =
    firstAvailableTiprack &&
    _getNextTip(
      pipetteSpec.channels,
      robotState.tipState.tipracks[firstAvailableTiprack]
    )

  if (firstAvailableTiprack && nextTip) {
    return {
      tiprackId: firstAvailableTiprack,
      well: nextTip,
    }
  }
  // No available tipracks (for given pipette channels)
  return null
}

export function getPipetteWithTipMaxVol(
  pipetteId: string,
  robotState: RobotState
): number {
  // NOTE: this fn assumes each pipette is assigned to exactly one tiprack type,
  // across the entire timeline
  const pipetteData = robotState.pipettes[pipetteId]
  const pipetteSpec = getPipetteSpecFromId(pipetteId, robotState)
  const pipetteMaxVol = pipetteSpec && pipetteSpec.maxVolume

  const tiprackData =
    pipetteData &&
    pipetteData.tiprackModel &&
    getLabware(pipetteData.tiprackModel)
  const tiprackTipVol = tiprackData && tiprackData.metadata.tipVolume

  if (!pipetteMaxVol || !tiprackTipVol) {
    console.warn(
      'getPipetteEffectiveMaxVol expected tiprackMaxVol and pipette maxVolume to be > 0, got',
      { pipetteMaxVol, tiprackTipVol }
    )
    return NaN
  }
  return min([tiprackTipVol, pipetteMaxVol])
}
