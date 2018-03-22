// @flow
import range from 'lodash/range'
import {mergeLiquid, splitLiquid, getWellsForTips} from './utils'
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
  prevLiquidState: LiquidState
) {
  const {pipetteId, pipetteData, volume, labwareId, labwareType, well} = args
  const {wellsForTips, allWellsShared} = getWellsForTips(pipetteData.channels, labwareType, well)

  // Blend tip's liquid contents (if any) with liquid of the source
  // to update liquid state in all pipette tips
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
