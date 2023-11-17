import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
import { getWellDepth } from '@opentrons/shared-data'
import { AIR_GAP_OFFSET_FROM_TOP } from '../../constants'
import * as errorCreators from '../../errorCreators'
import { getPipetteWithTipMaxVol } from '../../robotStateSelectors'
import {
  blowoutUtil,
  curryCommandCreator,
  reduceCommandCreators,
  wasteChuteCommandsUtil,
} from '../../utils'
import { configureForVolume } from '../atomic/configureForVolume'
import {
  aspirate,
  delay,
  dispense,
  dropTip,
  moveToWell,
  replaceTip,
  touchTip,
} from '../atomic'
import { mixUtil } from './mix'
import type {
  ConsolidateArgs,
  CommandCreator,
  CurriedCommandCreator,
} from '../../types'
export const consolidate: CommandCreator<ConsolidateArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /**
    Consolidate will aspirate several times in sequence from multiple source wells,
    then dispense into a single destination.
     If the volume to aspirate from the source wells exceeds the max volume of the pipette,
    then consolidate will be broken up into multiple asp-asp-disp, asp-asp-disp cycles.
     A single uniform volume will be aspirated from every source well.
     =====
     For consolidate, changeTip means:
    * 'always': before the first aspirate in a single asp-asp-disp cycle, get a fresh tip
    * 'once': get a new tip at the beginning of the consolidate step, and use it throughout
    * 'never': reuse the tip from the last step
  */
  const actionName = 'consolidate'
  const pipetteData = prevRobotState.pipettes[args.pipette]

  if (!pipetteData) {
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

  if (
    !invariantContext.labwareEntities[args.dropTipLocation] &&
    !invariantContext.additionalEquipmentEntities[args.dropTipLocation]
  ) {
    return { errors: [errorCreators.dropTipLocationDoesNotExist()] }
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
    blowoutFlowRateUlSec,
    blowoutOffsetFromTopMm,
    dispenseAirGapVolume,
    dispenseDelay,
    dispenseFlowRateUlSec,
    dispenseOffsetFromBottomMm,
    mixFirstAspirate,
    mixInDestination,
    dropTipLocation,
  } = args
  const aspirateAirGapVolume = args.aspirateAirGapVolume || 0
  const maxWellsPerChunk = Math.floor(
    getPipetteWithTipMaxVol(args.pipette, invariantContext) /
      (args.volume + aspirateAirGapVolume)
  )
  const sourceLabwareDef =
    invariantContext.labwareEntities[args.sourceLabware].def
  const destLabwareDef = invariantContext.labwareEntities[args.destLabware].def
  const airGapOffsetDestWell =
    getWellDepth(destLabwareDef, args.destWell) + AIR_GAP_OFFSET_FROM_TOP

  const sourceWellChunks = chunk(args.sourceWells, maxWellsPerChunk)

  const isWasteChute =
    invariantContext.additionalEquipmentEntities[args.dropTipLocation] != null

  const addressableAreaName =
    invariantContext.pipetteEntities[args.pipette].spec.channels === 96
      ? '96ChannelWasteChute'
      : '1and8ChannelWasteChute'

  const dropTipCommand = isWasteChute
    ? curryCommandCreator(wasteChuteCommandsUtil, {
        type: 'dropTip',
        pipetteId: args.pipette,
        addressableAreaName,
      })
    : curryCommandCreator(dropTip, {
        pipette: args.pipette,
        dropTipLocation: args.dropTipLocation,
      })

  const commandCreators = flatMap(
    sourceWellChunks,
    (
      sourceWellChunk: string[],
      chunkIndex: number
    ): CurriedCommandCreator[] => {
      const isLastChunk = chunkIndex + 1 === sourceWellChunks.length
      // Aspirate commands for all source wells in the chunk
      const aspirateCommands = flatMap(
        sourceWellChunk,
        (sourceWell: string, wellIndex: number): CurriedCommandCreator[] => {
          const airGapOffsetSourceWell =
            getWellDepth(sourceLabwareDef, sourceWell) + AIR_GAP_OFFSET_FROM_TOP
          const airGapAfterAspirateCommands = aspirateAirGapVolume
            ? [
                curryCommandCreator(aspirate, {
                  pipette: args.pipette,
                  volume: aspirateAirGapVolume,
                  labware: args.sourceLabware,
                  well: sourceWell,
                  flowRate: aspirateFlowRateUlSec,
                  offsetFromBottomMm: airGapOffsetSourceWell,
                  isAirGap: true,
                }),
                ...(aspirateDelay != null
                  ? [
                      curryCommandCreator(delay, {
                        commandCreatorFnName: 'delay',
                        description: null,
                        name: null,
                        meta: null,
                        wait: aspirateDelay.seconds,
                      }),
                    ]
                  : []),
              ]
            : []
          const delayAfterAspirateCommands =
            aspirateDelay != null
              ? [
                  curryCommandCreator(moveToWell, {
                    pipette: args.pipette,
                    labware: args.sourceLabware,
                    well: sourceWell,
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
                  well: sourceWell,
                  offsetFromBottomMm:
                    args.touchTipAfterAspirateOffsetMmFromBottom,
                }),
              ]
            : []
          return [
            curryCommandCreator(aspirate, {
              pipette: args.pipette,
              volume: args.volume,
              labware: args.sourceLabware,
              well: sourceWell,
              flowRate: aspirateFlowRateUlSec,
              offsetFromBottomMm: aspirateOffsetFromBottomMm,
            }),
            ...delayAfterAspirateCommands,
            ...touchTipAfterAspirateCommand,
            ...airGapAfterAspirateCommands,
          ]
        }
      )
      let tipCommands: CurriedCommandCreator[] = []

      if (
        args.changeTip === 'always' ||
        (args.changeTip === 'once' && chunkIndex === 0)
      ) {
        tipCommands = [
          curryCommandCreator(replaceTip, {
            pipette: args.pipette,
            dropTipLocation,
          }),
        ]
      }

      const touchTipAfterDispenseCommands: CurriedCommandCreator[] = args.touchTipAfterDispense
        ? [
            curryCommandCreator(touchTip, {
              pipette: args.pipette,
              labware: args.destLabware,
              well: args.destWell,
              offsetFromBottomMm: args.touchTipAfterDispenseOffsetMmFromBottom,
            }),
          ]
        : []
      const mixBeforeCommands =
        mixFirstAspirate != null
          ? mixUtil({
              pipette: args.pipette,
              labware: args.sourceLabware,
              well: sourceWellChunk[0],
              volume: mixFirstAspirate.volume,
              times: mixFirstAspirate.times,
              aspirateOffsetFromBottomMm,
              dispenseOffsetFromBottomMm: aspirateOffsetFromBottomMm,
              aspirateFlowRateUlSec,
              dispenseFlowRateUlSec,
              aspirateDelaySeconds: aspirateDelay?.seconds,
              dispenseDelaySeconds: dispenseDelay?.seconds,
            })
          : []
      const preWetTipCommands = args.preWetTip // Pre-wet tip is equivalent to a single mix, with volume equal to the consolidate volume.
        ? mixUtil({
            pipette: args.pipette,
            labware: args.sourceLabware,
            well: sourceWellChunk[0],
            volume: args.volume,
            times: 1,
            aspirateOffsetFromBottomMm,
            dispenseOffsetFromBottomMm: aspirateOffsetFromBottomMm,
            aspirateFlowRateUlSec,
            dispenseFlowRateUlSec,
            aspirateDelaySeconds: aspirateDelay?.seconds,
            dispenseDelaySeconds: dispenseDelay?.seconds,
          })
        : []
      const mixAfterCommands =
        mixInDestination != null
          ? mixUtil({
              pipette: args.pipette,
              labware: args.destLabware,
              well: args.destWell,
              volume: mixInDestination.volume,
              times: mixInDestination.times,
              aspirateOffsetFromBottomMm: dispenseOffsetFromBottomMm,
              dispenseOffsetFromBottomMm,
              aspirateFlowRateUlSec,
              dispenseFlowRateUlSec,
              aspirateDelaySeconds: aspirateDelay?.seconds,
              dispenseDelaySeconds: dispenseDelay?.seconds,
            })
          : []
      const delayAfterDispenseCommands =
        dispenseDelay != null
          ? [
              curryCommandCreator(moveToWell, {
                pipette: args.pipette,
                labware: args.destLabware,
                well: args.destWell,
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
      const willReuseTip = args.changeTip !== 'always' && !isLastChunk
      const airGapAfterDispenseCommands =
        dispenseAirGapVolume && !willReuseTip
          ? [
              curryCommandCreator(aspirate, {
                pipette: args.pipette,
                volume: dispenseAirGapVolume,
                labware: args.destLabware,
                well: args.destWell,
                flowRate: aspirateFlowRateUlSec,
                offsetFromBottomMm: airGapOffsetDestWell,
                isAirGap: true,
              }),
              ...(aspirateDelay != null
                ? [
                    curryCommandCreator(delay, {
                      commandCreatorFnName: 'delay',
                      description: null,
                      name: null,
                      meta: null,
                      wait: aspirateDelay.seconds,
                    }),
                  ]
                : []),
            ]
          : []
      // if using dispense > air gap, drop or change the tip at the end
      const dropTipAfterDispenseAirGap =
        airGapAfterDispenseCommands.length > 0 ? [dropTipCommand] : []
      const blowoutCommand = blowoutUtil({
        pipette: args.pipette,
        sourceLabwareId: args.sourceLabware,
        sourceWell: sourceWellChunk[0],
        destLabwareId: args.destLabware,
        destWell: args.destWell,
        blowoutLocation: args.blowoutLocation,
        flowRate: blowoutFlowRateUlSec,
        offsetFromTopMm: blowoutOffsetFromTopMm,
        invariantContext,
      })

      const configureForVolumeCommand: CurriedCommandCreator[] =
        invariantContext.pipetteEntities[args.pipette].name ===
          'p50_single_flex' ||
        invariantContext.pipetteEntities[args.pipette].name === 'p50_multi_flex'
          ? [
              curryCommandCreator(configureForVolume, {
                pipetteId: args.pipette,
                volume:
                  args.volume * sourceWellChunk.length +
                  aspirateAirGapVolume * sourceWellChunk.length,
              }),
            ]
          : []

      return [
        ...tipCommands,
        ...mixBeforeCommands,
        ...preWetTipCommands, // NOTE when you both mix-before and pre-wet tip, it's kinda redundant. Prewet is like mixing once.
        ...configureForVolumeCommand,
        ...aspirateCommands,
        curryCommandCreator(dispense, {
          pipette: args.pipette,
          volume:
            args.volume * sourceWellChunk.length +
            aspirateAirGapVolume * sourceWellChunk.length,
          labware: args.destLabware,
          well: args.destWell,
          flowRate: dispenseFlowRateUlSec,
          offsetFromBottomMm: dispenseOffsetFromBottomMm,
        }),
        ...delayAfterDispenseCommands,
        ...mixAfterCommands,
        ...touchTipAfterDispenseCommands,
        ...blowoutCommand,
        ...airGapAfterDispenseCommands,
        ...dropTipAfterDispenseAirGap,
      ]
    }
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
