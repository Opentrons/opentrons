// @flow
import assert from 'assert'
import min from 'lodash/min'
import sortBy from 'lodash/sortBy'
import type { Channels } from '@opentrons/components'
import { getTiprackVolume, type PipetteNameSpecs } from '@opentrons/shared-data'
import { tiprackWellNamesByCol, tiprackWellNamesFlat } from './'
import type { InvariantContext, RobotState } from './'

// SELECTOR UTILITIES

export function sortLabwareBySlot(
  labwareState: $PropertyType<RobotState, 'labware'>
) {
  return sortBy(Object.keys(labwareState), id =>
    parseInt(labwareState[id].slot)
  )
}

// SELECTORS
// TODO IMMEDIATELY audit and remove these, denormalized entities make some of these unneeded

// TODO IMMEDIATELY
export function getPipetteSpecFromId(
  pipetteId: string,
  invariantContext: InvariantContext
): PipetteNameSpecs {
  const pipette = invariantContext.pipetteEntities[pipetteId]

  if (!pipette) {
    throw Error(`no pipette with ID ${pipetteId} found in robot state`)
  }

  const pipetteSpec = pipette.spec
  if (!pipetteSpec) {
    throw Error(`no pipette spec for pipette with ID ${pipetteId}`)
  }

  return pipetteSpec
}

// TODO IMMEDIATELY
export function getLabwareType(
  labwareId: string,
  invariantContext: InvariantContext
): ?string {
  const labware = invariantContext.labwareEntities[labwareId]

  if (!labware) {
    assert(false, `no labware id: "${labwareId}"`)
    return null
  }

  return labware.type
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
  invariantContext: InvariantContext,
  robotState: RobotState
): NextTiprack {
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

  // filter out unmounted or non-compatible tiprack models
  const sortedTipracksIds = sortLabwareBySlot(robotState.labware).filter(
    labwareId => {
      assert(
        invariantContext.labwareEntities[labwareId]?.type,
        `cannot getNextTiprack, no labware entity for "${labwareId}"`
      )
      const isOnDeck = robotState.labware[labwareId].slot != null
      return (
        isOnDeck &&
        pipetteEntity.tiprackModel ===
          invariantContext.labwareEntities[labwareId]?.type
      )
    }
  )

  const firstAvailableTiprack = sortedTipracksIds.find(tiprackId =>
    _getNextTip(
      pipetteEntity.spec.channels,
      robotState.tipState.tipracks[tiprackId]
    )
  )

  // TODO Ian 2018-02-12: avoid calling _getNextTip twice
  const nextTip =
    firstAvailableTiprack &&
    _getNextTip(
      pipetteEntity.spec.channels,
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
  invariantContext: InvariantContext
): number {
  // NOTE: this fn assumes each pipette is assigned to exactly one tiprack type,
  // across the entire timeline
  const pipetteEntity = invariantContext.pipetteEntities[pipetteId]
  const pipetteMaxVol = pipetteEntity.spec.maxVolume

  const tiprackDef = pipetteEntity.tiprackLabwareDef
  const tiprackTipVol = getTiprackVolume(tiprackDef)

  if (!pipetteMaxVol || !tiprackTipVol) {
    assert(
      false,
      `getPipetteEffectiveMaxVol expected tiprackMaxVol and pipette maxVolume to be > 0, got',
      ${pipetteMaxVol}, ${tiprackTipVol}`
    )
    return NaN
  }
  return min([tiprackTipVol, pipetteMaxVol])
}
