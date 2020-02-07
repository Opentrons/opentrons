// @flow
import assert from 'assert'
// TODO: Ian 2019-04-18 move orderWells somewhere more general -- shared-data util?
import { orderWells } from '../steplist/utils/orderWells.js'
import min from 'lodash/min'
import sortBy from 'lodash/sortBy'
import { getTiprackVolume } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from './'
import type { ModuleTemporalProperties } from '../step-forms'

export function sortLabwareBySlot(
  labwareState: $PropertyType<RobotState, 'labware'>
) {
  return sortBy<string>(Object.keys(labwareState), (id: string) =>
    parseInt(labwareState[id].slot)
  )
}

export function _getNextTip(args: {|
  pipetteId: string,
  tiprackId: string,
  invariantContext: InvariantContext,
  robotState: RobotState,
|}): string | null {
  // return the well name of the next available tip for a pipette (or null)
  const { pipetteId, tiprackId, invariantContext, robotState } = args
  const pipetteChannels =
    invariantContext.pipetteEntities[pipetteId]?.spec?.channels
  const tiprackWellsState = robotState.tipState.tipracks[tiprackId]
  const tiprackDef = invariantContext.labwareEntities[tiprackId]?.def
  const hasTip = wellName => tiprackWellsState[wellName]

  const orderedWells = orderWells(tiprackDef.ordering, 't2b', 'l2r')

  if (pipetteChannels === 1) {
    const well = orderedWells.find(hasTip)
    return well || null
  }

  if (pipetteChannels === 8) {
    // Otherwise, pipetteChannels === 8.
    // return first well in the column (for 96-well format, the 'A' row)
    const tiprackColumns = tiprackDef.ordering
    const fullColumn = tiprackColumns.find(col => col.every(hasTip))
    return fullColumn ? fullColumn[0] : null
  }

  assert(false, `Pipette ${pipetteId} has no channels/spec, cannot _getNextTip`)
  return null
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
        invariantContext.labwareEntities[labwareId]?.labwareDefURI,
        `cannot getNextTiprack, no labware entity for "${labwareId}"`
      )
      const isOnDeck = robotState.labware[labwareId].slot != null
      return (
        isOnDeck &&
        pipetteEntity.tiprackDefURI ===
          invariantContext.labwareEntities[labwareId]?.labwareDefURI
      )
    }
  )

  const firstAvailableTiprack = sortedTipracksIds.find(tiprackId =>
    _getNextTip({
      pipetteId,
      tiprackId,
      invariantContext,
      robotState,
    })
  )

  // TODO Ian 2018-02-12: avoid calling _getNextTip twice
  const nextTip =
    firstAvailableTiprack &&
    _getNextTip({
      pipetteId,
      tiprackId: firstAvailableTiprack,
      invariantContext,
      robotState,
    })

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

export function getModuleState(
  robotState: RobotState,
  module: string
): $PropertyType<ModuleTemporalProperties, 'moduleState'> {
  assert(
    module in robotState.modules,
    `getModuleState expected module id "${module}"`
  )

  return robotState.modules[module]?.moduleState
}
