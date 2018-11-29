// @flow
import range from 'lodash/range'
import isEmpty from 'lodash/isEmpty'
import {mergeLiquid, splitLiquid, getWellsForTips, totalVolume} from './utils'
import * as warningCreators from './warningCreators'
import type {
  RobotState,
  PipetteData,
  SingleLabwareLiquidState,
  CommandCreatorWarning,
} from './'

type LiquidState = $PropertyType<RobotState, 'liquidState'>

type LiquidStateAndWarnings = {liquidState: LiquidState, warnings: Array<CommandCreatorWarning>}

export default function updateLiquidState (
  args: {
    pipetteId: string,
    pipetteData: PipetteData,
    volume: number,
    labwareId: string,
    labwareType: string,
    well: string,
  },
  prevLiquidState: LiquidState
): LiquidStateAndWarnings {
  const {pipetteId, pipetteData, volume, labwareId, labwareType, well} = args
  const {wellsForTips} = getWellsForTips(pipetteData.channels, labwareType, well)

  // Blend tip's liquid contents (if any) with liquid of the source
  // to update liquid state in all pipette tips
  type PipetteLiquidStateAcc = {
    pipetteLiquidState: SingleLabwareLiquidState,
    pipetteWarnings: Array<CommandCreatorWarning>,
  }
  const {pipetteLiquidState, pipetteWarnings} = range(pipetteData.channels).reduce(
    (acc: PipetteLiquidStateAcc, tipIndex) => {
      const prevTipLiquidState = prevLiquidState.pipettes[pipetteId][tipIndex.toString()]
      const prevSourceLiquidState = prevLiquidState.labware[labwareId][wellsForTips[tipIndex]]

      const newLiquidFromWell = splitLiquid(
        volume,
        prevSourceLiquidState
      ).dest

      let nextWarnings = []
      if (isEmpty(prevSourceLiquidState)) {
        nextWarnings = [...nextWarnings, warningCreators.aspirateFromPristineWell()]
      } else if (volume > totalVolume(prevSourceLiquidState)) {
        nextWarnings = [...nextWarnings, warningCreators.aspirateMoreThanWellContents()]
      }

      return {
        pipetteLiquidState: {
          ...acc.pipetteLiquidState,
          [tipIndex]: mergeLiquid(
            prevTipLiquidState,
            newLiquidFromWell
          ),
        },
        pipetteWarnings: [...acc.pipetteWarnings, ...nextWarnings],
      }
    }, {pipetteLiquidState: {}, pipetteWarnings: []})

  // Remove liquid from source well(s)
  const labwareLiquidState: SingleLabwareLiquidState = {
    ...prevLiquidState.labware[labwareId],
    ...wellsForTips.reduce((acc: SingleLabwareLiquidState, well) => ({
      ...acc,
      [well]: splitLiquid(
        volume,
        // When multiple tips aspirate from 1 well,
        // that volume is sequentially removed, tip by tip
        acc[well] || prevLiquidState.labware[labwareId][well]
      ).source,
    }), {}),
  }

  const nextLiquidState = {
    pipettes: {
      ...prevLiquidState.pipettes,
      [pipetteId]: pipetteLiquidState,
    },
    labware: {
      ...prevLiquidState.labware,
      [labwareId]: labwareLiquidState,
    },
  }

  return {
    liquidState: nextLiquidState,
    warnings: pipetteWarnings,
  }
}
