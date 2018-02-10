// @flow
import {tiprackWellNamesByCol, tiprackWellNamesFlat} from './'
import type {PipetteChannels, RobotState} from './'
import sortBy from 'lodash/sortBy'

// SELECTOR UTILITIES

export function sortLabwareBySlot (robotState: RobotState) {
  return sortBy(Object.keys(robotState.labware), id => parseInt(robotState.labware[id].slot))
}

// SELECTORS

export function _getNextTip (
  pipetteChannels: PipetteChannels,
  tiprackWellsState: {[wellName: string]: boolean
}) {
  /** Given a tiprack's wells state, return the well of the next available tip
    NOTE: expects 96-well tiprack
  */
  const hasTiprack = wellName => tiprackWellsState[wellName]

  if (pipetteChannels === 1) {
    const well = tiprackWellNamesFlat.find(hasTiprack)
    return well || null
  }

  if (pipetteChannels === 8) {
    // return first well in the column (for 96-well format, the 'A' row)
    const fullColumn = tiprackWellNamesByCol.find(wellNamesInCol => wellNamesInCol.every(hasTiprack))
    return fullColumn ? fullColumn[0] : null
  }
}

export function getNextTiprack (pipetteChannels: PipetteChannels, robotState: RobotState) {
  /** Returns the next tiprack that has tips.
    Tipracks are any labwareIds that exist in tipState.tipracks.
    For 8-channel pipette, tipracks need a full column of tips.
    If there are no available tipracks, returns null.
  */

  const sortedTipracksIds = sortLabwareBySlot(robotState).filter(labwareId =>
    robotState.tipState.tipracks[labwareId]
  )

  const firstAvailableTiprack = sortedTipracksIds.find(tiprackId =>
    _getNextTip(pipetteChannels, robotState.tipState.tipracks[tiprackId])
  )

  if (firstAvailableTiprack) {
    return {
      tiprackId: firstAvailableTiprack,
      well: _getNextTip(pipetteChannels, robotState.tipState.tipracks[firstAvailableTiprack]) // TODO later: avoid calling this twice
    }
  }
  // No available tipracks (for given pipette channels)
  return null
}
