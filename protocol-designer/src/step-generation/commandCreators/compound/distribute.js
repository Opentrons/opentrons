// @flow
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
import { getWellsDepth } from '@opentrons/shared-data'
import * as errorCreators from '../../errorCreators'
import { getPipetteWithTipMaxVol } from '../../robotStateSelectors'
import {
  aspirate,
  blowout,
  delay,
  dispense,
  moveToWell,
  replaceTip,
  touchTip,
} from '../atomic'
import { mixUtil } from './mix'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import type {
  DistributeArgs,
  CommandCreator,
  CurriedCommandCreator,
} from '../../types'

export const distribute: CommandCreator<DistributeArgs> = (
  args,
  invariantContext,
  prevRobotState
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

  // TODO: Ian 2019-04-19 revisit these pipetteDoesNotExist errors, how to do it DRY?
  if (
    !prevRobotState.pipettes[args.pipette] ||
    !invariantContext.pipetteEntities[args.pipette]
  ) {
    // bail out before doing anything else
    return {
      errors: [
        errorCreators.pipetteDoesNotExist({
          actionName,
          pipette: args.pipette,
        }),
      ],
    }
  }

  // TODO: BC 2019-07-08 these argument names are a bit misleading, instead of being values bound
  // to the action of aspiration of dispensing in a given command, they are actually values bound
  // to a given labware associated with a command (e.g. Source, Destination). For this reason we
  // currently remapping the inner mix values. Those calls to mixUtil should become easier to read
  // when we decide to rename these fields/args... probably all the way up to the UI level.
  const {
    aspirateDelay,
    aspirateFlowRateUlSec,
    aspirateOffsetFromBottomMm,
    dispenseDelay,
    dispenseFlowRateUlSec,
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
    return {
      errors: [
        errorCreators.pipetteVolumeExceeded({
          actionName,
          volume: args.volume,
          maxVolume,
          disposalVolume,
        }),
      ],
    }
  }

  const commandCreators = flatMap(
    chunk(args.destWells, maxWellsPerChunk),
    (
      destWellChunk: Array<string>,
      chunkIndex: number
    ): Array<CurriedCommandCreator> => {
      const dispenseCommands = flatMap(
        destWellChunk,
        (destWell: string, wellIndex: number): Array<CurriedCommandCreator> => {
          const delayAfterDispenseCommands =
            dispenseDelay != null
              ? [
                  curryCommandCreator(moveToWell, {
                    pipette: args.pipette,
                    labware: args.destLabware,
                    well: destWell,
                    offset: {
                      x: 0,
                      y: 0,
                      z: dispenseDelay.mmFromBottom,
                    },
                  }),
                  curryCommandCreator(delay, {
                    commandCreatorFnName: 'delay',
                    description: null,
                    name: null,
                    meta: null,
                    wait: dispenseDelay.seconds,
                  }),
                ]
              : []

          const touchTipAfterDispenseCommand = args.touchTipAfterDispense
            ? [
                curryCommandCreator(touchTip, {
                  pipette,
                  labware: args.destLabware,
                  well: destWell,
                  offsetFromBottomMm:
                    args.touchTipAfterDispenseOffsetMmFromBottom,
                }),
              ]
            : []

          return [
            curryCommandCreator(dispense, {
              pipette,
              volume: args.volume,
              labware: args.destLabware,
              well: destWell,
              flowRate: dispenseFlowRateUlSec,
              offsetFromBottomMm: dispenseOffsetFromBottomMm,
            }),
            ...delayAfterDispenseCommands,
            ...touchTipAfterDispenseCommand,
          ]
        }
      )

      // NOTE: identical to consolidate
      let tipCommands: Array<CurriedCommandCreator> = []

      if (
        args.changeTip === 'always' ||
        (args.changeTip === 'once' && chunkIndex === 0)
      ) {
        tipCommands = [
          curryCommandCreator(replaceTip, { pipette: args.pipette }),
        ]
      }

      // TODO: BC 2018-11-29 instead of disposalLabware and disposalWell use blowoutLocation
      let blowoutCommands = []
      if (args.disposalVolume && args.disposalLabware && args.disposalWell) {
        blowoutCommands = [
          curryCommandCreator(blowout, {
            pipette: args.pipette,
            labware: args.disposalLabware,
            well: args.disposalWell,
            flowRate: args.blowoutFlowRateUlSec,
            offsetFromBottomMm:
              // NOTE: when we use blowoutLocation as mentioned above,
              // we can delegate this top -> bottom transform to blowoutUtil
              getWellsDepth(
                invariantContext.labwareEntities[args.disposalLabware].def,
                [args.disposalWell]
              ) + args.blowoutOffsetFromTopMm,
          }),
        ]
      }

      const delayAfterAspirateCommands =
        aspirateDelay != null
          ? [
              curryCommandCreator(moveToWell, {
                pipette: args.pipette,
                labware: args.sourceLabware,
                well: args.sourceWell,
                offset: {
                  x: 0,
                  y: 0,
                  z: aspirateDelay.mmFromBottom,
                },
              }),
              curryCommandCreator(delay, {
                commandCreatorFnName: 'delay',
                description: null,
                name: null,
                meta: null,
                wait: aspirateDelay.seconds,
              }),
            ]
          : []

      const touchTipAfterAspirateCommand = args.touchTipAfterAspirate
        ? [
            curryCommandCreator(touchTip, {
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
            dispenseOffsetFromBottomMm: aspirateOffsetFromBottomMm,
            aspirateFlowRateUlSec,
            dispenseFlowRateUlSec,
            aspirateDelay,
            dispenseDelay,
          })
        : []

      return [
        ...tipCommands,
        ...mixBeforeAspirateCommands,
        curryCommandCreator(aspirate, {
          pipette,
          volume: args.volume * destWellChunk.length + disposalVolume,
          labware: args.sourceLabware,
          well: args.sourceWell,
          flowRate: aspirateFlowRateUlSec,
          offsetFromBottomMm: aspirateOffsetFromBottomMm,
        }),
        ...delayAfterAspirateCommands,
        ...touchTipAfterAspirateCommand,

        ...dispenseCommands,
        ...blowoutCommands,
      ]
    }
  )

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
