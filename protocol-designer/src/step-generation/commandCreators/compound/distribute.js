// @flow
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
import * as errorCreators from '../../errorCreators'
import { getPipetteWithTipMaxVol } from '../../robotStateSelectors'
import type {
  DistributeArgs,
  RobotState,
  InvariantContext,
  CommandCreator,
  CompoundCommandCreator,
} from '../../types'
import { aspirate, dispense, blowout, replaceTip, touchTip } from '../atomic'
import { mixUtil } from './mix'

const distribute = (args: DistributeArgs): CompoundCommandCreator => (
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  /**
    Distribute will aspirate from a single source well into multiple destination wells.

    If the volume to aspirate from the source well exceeds the max volume of the pipette,
    then distribute will be broken up into multiple asp-disp-disp, asp-disp-disp cycles.

    A single uniform volume will be aspirated to every destination well.

    =====

    For distribute, changeTip means:
    * 'always': before the first aspirate in a single asp-disp-disp cycle, get a fresh tip
    * 'once': get a new tip at the beginning of the distribute step, and use it throughout
    * 'never': reuse the tip from the last step
  */

  // TODO Ian 2018-05-03 next ~20 lines match consolidate.js
  const actionName = 'distribute'

  // TODO IMMEDIATELY: revisit these pipetteDoesNotExist errors, how to do this in once place?
  if (
    !prevRobotState.pipettes[args.pipette] ||
    !invariantContext.pipetteEntities[args.pipette]
  ) {
    // bail out before doing anything else
    return [
      _robotState => ({
        errors: [
          errorCreators.pipetteDoesNotExist({
            actionName,
            pipette: args.pipette,
          }),
        ],
      }),
    ]
  }

  const {
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
  } = args

  // TODO error on negative args.disposalVolume?
  const disposalVolume =
    args.disposalVolume && args.disposalVolume > 0 ? args.disposalVolume : 0

  const maxVolume = getPipetteWithTipMaxVol(args.pipette, invariantContext)
  const maxWellsPerChunk = Math.floor(
    (maxVolume - disposalVolume) / args.volume
  )

  const { pipette } = args

  if (maxWellsPerChunk === 0) {
    // distribute vol exceeds pipette vol
    return [
      _robotState => ({
        errors: [
          errorCreators.pipetteVolumeExceeded({
            actionName,
            volume: args.volume,
            maxVolume,
            disposalVolume,
          }),
        ],
      }),
    ]
  }

  const commandCreators = flatMap(
    chunk(args.destWells, maxWellsPerChunk),
    (
      destWellChunk: Array<string>,
      chunkIndex: number
    ): Array<CommandCreator> => {
      const dispenseCommands = flatMap(
        destWellChunk,
        (destWell: string, wellIndex: number): Array<CommandCreator> => {
          const touchTipAfterDispenseCommand = args.touchTipAfterDispense
            ? [
                touchTip({
                  pipette,
                  labware: args.destLabware,
                  well: destWell,
                  offsetFromBottomMm:
                    args.touchTipAfterDispenseOffsetMmFromBottom,
                }),
              ]
            : []

          return [
            dispense({
              pipette,
              volume: args.volume,
              labware: args.destLabware,
              well: destWell,
              'flow-rate': dispenseFlowRateUlSec,
              offsetFromBottomMm: dispenseOffsetFromBottomMm,
            }),
            ...touchTipAfterDispenseCommand,
          ]
        }
      )

      // NOTE: identical to consolidate
      let tipCommands: Array<CommandCreator> = []

      if (
        args.changeTip === 'always' ||
        (args.changeTip === 'once' && chunkIndex === 0)
      ) {
        tipCommands = [replaceTip(args.pipette)]
      }

      // TODO: BC 2018-11-29 instead of disposalLabware and disposalWell use blowoutLocation
      let blowoutCommands = []
      if (args.disposalVolume && args.disposalLabware && args.disposalWell) {
        blowoutCommands = [
          blowout({
            pipette: args.pipette,
            labware: args.disposalLabware,
            well: args.disposalWell,
          }),
        ]
      }

      const touchTipAfterAspirateCommand = args.touchTipAfterAspirate
        ? [
            touchTip({
              pipette: args.pipette,
              labware: args.sourceLabware,
              well: args.sourceWell,
              offsetFromBottomMm: args.touchTipAfterAspirateOffsetMmFromBottom,
            }),
          ]
        : []

      const mixBeforeAspirateCommands = args.mixBeforeAspirate
        ? mixUtil({
            pipette: args.pipette,
            labware: args.sourceLabware,
            well: args.sourceWell,
            volume: args.mixBeforeAspirate.volume,
            times: args.mixBeforeAspirate.times,
            aspirateOffsetFromBottomMm,
            dispenseOffsetFromBottomMm,
            aspirateFlowRateUlSec,
            dispenseFlowRateUlSec,
          })
        : []

      return [
        ...tipCommands,
        ...mixBeforeAspirateCommands,
        aspirate({
          pipette,
          volume: args.volume * destWellChunk.length + disposalVolume,
          labware: args.sourceLabware,
          well: args.sourceWell,
          'flow-rate': aspirateFlowRateUlSec,
          offsetFromBottomMm: aspirateOffsetFromBottomMm,
        }),
        ...touchTipAfterAspirateCommand,

        ...dispenseCommands,
        ...blowoutCommands,
      ]
    }
  )

  return commandCreators
}

export default distribute
