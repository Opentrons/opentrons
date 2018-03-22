// @flow
import range from 'lodash/range'
import {mergeLiquid, splitLiquid} from './utils'
import {computeWellAccess} from '@opentrons/labware-definitions'
import type {RobotState, PipetteData} from './'

type LiquidState = $PropertyType<RobotState, 'liquidState'>
// type LocationLiquidState = {[ingredId: string]: {volume: number}}

export default function updateLiquidState (
  args: {
    pipetteId: string,
    pipetteData: PipetteData,
    volume: number,
    labwareId: string,
    labwareType: string,
    well: string
  },
  // TODO merge prevLiquidState into args
  prevLiquidState: LiquidState
) {
  const {pipetteId, pipetteData, volume, labwareId, labwareType, well} = args
  // TODO IMMEDIATELY this wellsForTips logic replicated all over the place
  const wellsForTips = (pipetteData.channels === 1)
    ? [well]
    : computeWellAccess(labwareType, well)

  if (!wellsForTips) {
    throw new Error(pipetteData.channels === 1
      ? `Invalid well: ${well}`
      : `Labware id "${labwareId}", type ${labwareType}, well ${well} is not accessible by 8-channel's 1st tip`
    )
  }

  const allWellsShared = wellsForTips.every(w => w && w === wellsForTips[0])
  // allWellsShared: eg in a trough, all wells are shared by an 8-channel
  // (for single-channel, "all wells" are always shared because there is only 1 well)
  // NOTE Ian 2018-03-15: there is no support for a case where some but not all wells are shared.
  // Eg, some unusual labware that allows 2 tips to a well will not work with the implementation below.
  // Low-priority TODO.

  // Blend tip's liquid contents (if any) with liquid of the source
  // to update liquid state in all pipette tips
  // TODO Ian 2018-03-19 factor this out, like dispenseUpdateLiquidState is
  const pipetteLiquidState = range(pipetteData.channels).reduce((acc, tipIndex) => {
    const prevTipLiquidState = prevLiquidState.pipettes[pipetteId][tipIndex.toString()]
    const prevSourceLiquidState = prevLiquidState.labware[labwareId][wellsForTips[tipIndex]]

    const newLiquidFromWell = splitLiquid(
      allWellsShared ? volume / pipetteData.channels : volume, // divide source volume across shared tips
      prevSourceLiquidState
    ).dest

    return {
      ...acc,
      [tipIndex]: mergeLiquid(
        prevTipLiquidState,
        newLiquidFromWell
      )
    }
  }, {})

  // Remove liquid from source well(s)
  const labwareLiquidState = {
    ...prevLiquidState.labware[labwareId],
    ...wellsForTips.reduce((acc, well) => ({
      ...acc,
      [well]: splitLiquid(
        volume,
        prevLiquidState.labware[labwareId][well]
      ).source
    }), {})
  }

  const nextLiquidState = {
    pipettes: {
      ...prevLiquidState.pipettes,
      [pipetteId]: pipetteLiquidState
    },
    labware: {
      ...prevLiquidState.labware,
      [labwareId]: labwareLiquidState
    }
  }

  return nextLiquidState
}
