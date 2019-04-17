// @flow
import assert from 'assert'
import range from 'lodash/range'
import isEmpty from 'lodash/isEmpty'
import uniq from 'lodash/uniq'
import {
  AIR,
  mergeLiquid,
  splitLiquid,
  getWellsForTips,
  totalVolume,
} from '../utils'
import * as warningCreators from '../warningCreators'
import type { AspirateDispenseArgsV1 as AspirateDispenseArgs } from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotState,
  SingleLabwareLiquidState,
  CommandCreatorWarning,
  RobotStateAndWarnings,
} from '../types'

// Blend tip's liquid contents (if any) with liquid of the source
// to update liquid state in all pipette tips
type PipetteLiquidStateAcc = {
  pipetteLiquidState: SingleLabwareLiquidState,
  warnings: Array<CommandCreatorWarning>,
}

export default function getNextRobotStateAndWarningsForAspDisp(
  args: AspirateDispenseArgs,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
): RobotStateAndWarnings {
  const { pipette: pipetteId, volume, labware: labwareId } = args

  const { liquidState: prevLiquidState } = prevRobotState
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const labwareDef = invariantContext.labwareEntities[labwareId].def

  const { allWellsShared, wellsForTips } = getWellsForTips(
    pipetteSpec.channels,
    labwareDef,
    args.well
  )

  // helper to avoid writing this twice
  const formatReturn = ({
    labwareLiquidState,
    pipetteLiquidState,
    warnings,
  }) => {
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
      robotState: {
        ...prevRobotState,
        liquidState: nextLiquidState,
      },
      warnings,
    }
  }

  assert(
    uniq(wellsForTips).length === allWellsShared ? 1 : wellsForTips.length,
    `expected all wells to be shared, or no wells to be shared. Got: ${JSON.stringify(
      wellsForTips
    )}`
  )
  if (pipetteSpec.channels > 1 && allWellsShared) {
    // special case: trough-like "shared" well with multi-channel pipette
    const commonWell = wellsForTips[0]
    const prevSourceLiquidState = prevLiquidState.labware[labwareId][commonWell]
    let warnings = []

    const isOveraspirate =
      volume * pipetteSpec.channels > totalVolume(prevSourceLiquidState)

    if (isEmpty(prevSourceLiquidState)) {
      warnings = [...warnings, warningCreators.aspirateFromPristineWell()]
    } else if (isOveraspirate) {
      warnings = [...warnings, warningCreators.aspirateMoreThanWellContents()]
    }

    const volumePerTip = isOveraspirate
      ? totalVolume(prevSourceLiquidState) / pipetteSpec.channels
      : volume

    // all tips get the same amount of the same liquid added to them, from the source well
    const newLiquidFromWell = splitLiquid(volumePerTip, prevSourceLiquidState)
      .dest

    const pipetteLiquidState = range(pipetteSpec.channels).reduce(
      (acc: SingleLabwareLiquidState, tipIndex): SingleLabwareLiquidState => {
        const prevTipLiquidState =
          prevLiquidState.pipettes[pipetteId][tipIndex.toString()]

        // since volumePerTip is being calculated to avoid splitting unevenly across tips,
        // AIR needs to be added in here if it's an over-aspiration
        const nextTipLiquidState = isOveraspirate
          ? mergeLiquid(prevTipLiquidState, {
              ...newLiquidFromWell,
              [AIR]: { volume: volume - volumePerTip },
            })
          : mergeLiquid(prevTipLiquidState, newLiquidFromWell)

        return {
          ...acc,
          [tipIndex]: nextTipLiquidState,
        }
      },
      {}
    )

    // Remove liquid from source well
    const labwareLiquidState: SingleLabwareLiquidState = {
      ...prevLiquidState.labware[labwareId],
      [commonWell]: splitLiquid(
        volume * pipetteSpec.channels,
        prevLiquidState.labware[labwareId][commonWell]
      ).source,
    }

    return formatReturn({ labwareLiquidState, pipetteLiquidState, warnings })
  }

  // general case (no common well shared across all tips)
  const { pipetteLiquidState, warnings } = range(pipetteSpec.channels).reduce(
    (acc: PipetteLiquidStateAcc, tipIndex) => {
      const prevTipLiquidState =
        prevLiquidState.pipettes[pipetteId][tipIndex.toString()]
      const prevSourceLiquidState =
        prevLiquidState.labware[labwareId][wellsForTips[tipIndex]]

      const newLiquidFromWell = splitLiquid(volume, prevSourceLiquidState).dest

      let nextWarnings = []
      if (isEmpty(prevSourceLiquidState)) {
        nextWarnings = [
          ...nextWarnings,
          warningCreators.aspirateFromPristineWell(),
        ]
      } else if (volume > totalVolume(prevSourceLiquidState)) {
        nextWarnings = [
          ...nextWarnings,
          warningCreators.aspirateMoreThanWellContents(),
        ]
      }

      return {
        pipetteLiquidState: {
          ...acc.pipetteLiquidState,
          [tipIndex]: mergeLiquid(prevTipLiquidState, newLiquidFromWell),
        },
        warnings: [...acc.warnings, ...nextWarnings],
      }
    },
    { pipetteLiquidState: {}, warnings: [] }
  )

  // Remove liquid from source well(s)
  const labwareLiquidState: SingleLabwareLiquidState = {
    ...wellsForTips.reduce(
      (acc: SingleLabwareLiquidState, well) => ({
        ...acc,
        [well]: splitLiquid(volume, acc[well]).source,
      }),
      { ...prevLiquidState.labware[labwareId] }
    ),
  }

  return formatReturn({ labwareLiquidState, pipetteLiquidState, warnings })
}
