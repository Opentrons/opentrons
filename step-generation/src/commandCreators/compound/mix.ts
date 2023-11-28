import flatMap from 'lodash/flatMap'
import { LOW_VOLUME_PIPETTES } from '@opentrons/shared-data'
import {
  repeatArray,
  blowoutUtil,
  curryCommandCreator,
  reduceCommandCreators,
} from '../../utils'
import * as errorCreators from '../../errorCreators'
import { configureForVolume } from '../atomic/configureForVolume'
import { aspirate, dispense, delay, replaceTip, touchTip } from '../atomic'
import type {
  MixArgs,
  CommandCreator,
  CurriedCommandCreator,
} from '../../types'
/** Helper fn to make mix command creators w/ minimal arguments */
export function mixUtil(args: {
  pipette: string
  labware: string
  well: string
  volume: number
  times: number
  aspirateOffsetFromBottomMm: number
  dispenseOffsetFromBottomMm: number
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  aspirateDelaySeconds?: number | null | undefined
  dispenseDelaySeconds?: number | null | undefined
}): CurriedCommandCreator[] {
  const {
    pipette,
    labware,
    well,
    volume,
    times,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    aspirateDelaySeconds,
    dispenseDelaySeconds,
  } = args

  const getDelayCommand = (seconds?: number | null): CurriedCommandCreator[] =>
    seconds
      ? [
          curryCommandCreator(delay, {
            commandCreatorFnName: 'delay',
            description: null,
            name: null,
            meta: null,
            wait: seconds,
          }),
        ]
      : []

  return repeatArray(
    [
      curryCommandCreator(aspirate, {
        pipette,
        volume,
        labware,
        well,
        offsetFromBottomMm: aspirateOffsetFromBottomMm,
        flowRate: aspirateFlowRateUlSec,
      }),
      ...getDelayCommand(aspirateDelaySeconds),
      curryCommandCreator(dispense, {
        pipette,
        volume,
        labware,
        well,
        offsetFromBottomMm: dispenseOffsetFromBottomMm,
        flowRate: dispenseFlowRateUlSec,
      }),
      ...getDelayCommand(dispenseDelaySeconds),
    ],
    times
  )
}
export const mix: CommandCreator<MixArgs> = (
  data,
  invariantContext,
  prevRobotState
) => {
  /**
    Mix will aspirate and dispense a uniform volume some amount of times from a set of wells
    in a single labware.
     =====
     For mix, changeTip means:
    * 'always': before the first aspirate in each well, get a fresh tip
    * 'once': get a new tip at the beginning of the overall mix step, and use it throughout for all wells
    * 'never': reuse the tip from the last step
  */
  const actionName = 'mix'
  const {
    pipette,
    labware,
    wells,
    volume,
    times,
    changeTip,
    aspirateDelaySeconds,
    dispenseDelaySeconds,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    blowoutFlowRateUlSec,
    blowoutOffsetFromTopMm,
    dropTipLocation,
  } = data

  // Errors
  if (
    !prevRobotState.pipettes[pipette] ||
    !invariantContext.pipetteEntities[pipette]
  ) {
    // bail out before doing anything else
    return {
      errors: [
        errorCreators.pipetteDoesNotExist({
          actionName,
          pipette,
        }),
      ],
    }
  }

  if (!prevRobotState.labware[labware]) {
    return {
      errors: [
        errorCreators.labwareDoesNotExist({
          actionName,
          labware,
        }),
      ],
    }
  }

  if (
    !invariantContext.labwareEntities[dropTipLocation] &&
    !invariantContext.additionalEquipmentEntities[dropTipLocation]
  ) {
    return { errors: [errorCreators.dropTipLocationDoesNotExist()] }
  }

  const configureForVolumeCommand: CurriedCommandCreator[] = LOW_VOLUME_PIPETTES.includes(
    invariantContext.pipetteEntities[pipette].name
  )
    ? [
        curryCommandCreator(configureForVolume, {
          pipetteId: pipette,
          volume: volume,
        }),
      ]
    : []

  // Command generation
  const commandCreators = flatMap(
    wells,
    (well: string, wellIndex: number): CurriedCommandCreator[] => {
      let tipCommands: CurriedCommandCreator[] = []

      if (changeTip === 'always' || (changeTip === 'once' && wellIndex === 0)) {
        tipCommands = [
          curryCommandCreator(replaceTip, {
            pipette,
            dropTipLocation,
          }),
        ]
      }

      const touchTipCommands = data.touchTip
        ? [
            curryCommandCreator(touchTip, {
              pipette,
              labware,
              well,
              offsetFromBottomMm: data.touchTipMmFromBottom,
            }),
          ]
        : []
      const blowoutCommand = blowoutUtil({
        pipette: data.pipette,
        sourceLabwareId: data.labware,
        sourceWell: well,
        destLabwareId: data.labware,
        destWell: well,
        blowoutLocation: data.blowoutLocation,
        flowRate: blowoutFlowRateUlSec,
        offsetFromTopMm: blowoutOffsetFromTopMm,
        invariantContext,
      })
      const mixCommands = mixUtil({
        pipette,
        labware,
        well,
        volume,
        times,
        aspirateOffsetFromBottomMm,
        dispenseOffsetFromBottomMm,
        aspirateFlowRateUlSec,
        dispenseFlowRateUlSec,
        aspirateDelaySeconds,
        dispenseDelaySeconds,
      })
      return [
        ...tipCommands,
        ...configureForVolumeCommand,
        ...mixCommands,
        ...blowoutCommand,
        ...touchTipCommands,
      ]
    }
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
