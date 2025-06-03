import flatMap from 'lodash/flatMap'

import {
  ALL,
  getCorrectionVolume,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  LOW_VOLUME_PIPETTES,
} from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import {
  blowoutLocationHelper,
  curryCommandCreator,
  curryWithoutPython,
  formatPyStr,
  formatPyWellLocation,
  getIsSafePipetteMovement,
  getSlotInLocationStack,
  indentPyLines,
  reduceCommandCreators,
} from '../../utils'
import {
  aspirate,
  aspirateInPlace,
  configureForVolume,
  delay,
  dispense,
  dispenseInPlace,
  touchTip,
} from '../atomic'
import { replaceTip } from './replaceTip'

import type {
  NozzleConfigurationStyle,
  WellLocation,
} from '@opentrons/shared-data'
import type {
  CommandCreator,
  CurriedCommandCreator,
  InvariantContext,
  MixArgs,
} from '../../types'

const getDelayCommand = (seconds?: number | null): CurriedCommandCreator[] =>
  seconds
    ? [
        curryWithoutPython(delay, {
          seconds,
        }),
      ]
    : []

const makePythonCommandCreator: (args: {
  invariantContext: InvariantContext
  pipette: string
  times: number
  volume: number
  aspirateDelaySeconds: number
  dispenseDelaySeconds: number
  finalPushOut: number | null
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  positionArgs?: {
    labware: string
    well: string
    xOffset: number
    yOffset: number
    offsetFromBottomMm: number
  }
}) => CurriedCommandCreator = args => () => {
  const {
    invariantContext,
    pipette,
    times,
    volume,
    aspirateDelaySeconds,
    dispenseDelaySeconds,
    finalPushOut,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    positionArgs,
  } = args

  const { pipetteEntities, labwareEntities } = invariantContext
  const pipettePythonName = pipetteEntities[pipette].pythonName
  let locationPythonArg: string | null = null
  if (positionArgs != null) {
    const { labware, well, xOffset, yOffset, offsetFromBottomMm } = positionArgs
    const labwarePythonName = labwareEntities[labware].pythonName
    const pythonWellLocation: WellLocation = {
      origin: 'bottom',
      offset: { x: xOffset, y: yOffset, z: offsetFromBottomMm },
    }
    locationPythonArg = `location=${labwarePythonName}[${formatPyStr(
      well
    )}]${formatPyWellLocation(pythonWellLocation)}`
  }
  const pythonArgs = [
    `repetitions=${times}`,
    `volume=${volume}`,
    ...(locationPythonArg != null ? [locationPythonArg] : []),
    `aspirate_flow_rate=${aspirateFlowRateUlSec}`,
    `dispense_flow_rate=${dispenseFlowRateUlSec}`,
    ...(aspirateDelaySeconds != null && aspirateDelaySeconds !== 0
      ? [`aspirate_delay=${aspirateDelaySeconds}`]
      : []),
    ...(dispenseDelaySeconds != null && dispenseDelaySeconds !== 0
      ? [`dispense_delay=${dispenseDelaySeconds}`]
      : []),
    ...(finalPushOut != null ? [`final_push_out=${finalPushOut}`] : []),
  ]
  return {
    commands: [],
    //  Note: we do not support mix in trashBin or wasteChute so location
    //  will always be a well
    python: `${pipettePythonName}.mix(\n${indentPyLines(
      pythonArgs.join(',\n')
    )},\n)`,
  }
}

export const mixInPlaceUtil = (args: {
  pipette: string
  volume: number
  times: number
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  aspirateDelaySeconds?: number
  dispenseDelaySeconds?: number
  finalPushOut: number | null
  invariantContext: InvariantContext
  liquidClass: string | null
  tiprack: string
}): CurriedCommandCreator[] => {
  const {
    pipette,
    volume,
    times,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    aspirateDelaySeconds = 0,
    dispenseDelaySeconds = 0,
    finalPushOut,
    invariantContext,
    liquidClass,
    tiprack,
  } = args

  const pythonCommandCreator = makePythonCommandCreator({
    invariantContext,
    pipette,
    volume,
    times,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    aspirateDelaySeconds,
    dispenseDelaySeconds,
    finalPushOut,
  })

  const pipetteSpecs = invariantContext.pipetteEntities[pipette].spec

  const correctionVolumeAspirate = getCorrectionVolume({
    liquidClass,
    pipetteSpecs,
    tiprackDefUri: tiprack,
    targetVolume: volume,
    liquidHandlingAction: 'aspirate',
  })
  const correctionVolumeDispense = getCorrectionVolume({
    liquidClass,
    pipetteSpecs,
    tiprackDefUri: tiprack,
    targetVolume: volume,
    liquidHandlingAction: 'singleDispense',
  })

  const commandCreators = []
  for (let i = 0; i < times; i++) {
    commandCreators.push(
      ...[
        curryWithoutPython(aspirateInPlace, {
          pipetteId: pipette,
          volume,
          flowRate: aspirateFlowRateUlSec,
          ...(correctionVolumeAspirate > 0
            ? { correctionVolume: correctionVolumeAspirate }
            : {}),
        }),
        ...getDelayCommand(aspirateDelaySeconds),
        curryWithoutPython(dispenseInPlace, {
          pipetteId: pipette,
          volume,
          flowRate: dispenseFlowRateUlSec,
          ...(i < times - 1
            ? { pushOut: 0 }
            : finalPushOut == null
            ? {}
            : { pushOut: finalPushOut }), // only push out if final repetition
          ...(correctionVolumeDispense > 0
            ? { correctionVolume: correctionVolumeDispense }
            : {}),
        }),

        ...getDelayCommand(dispenseDelaySeconds),
      ]
    )
  }
  return [...commandCreators, pythonCommandCreator]
}

/** Helper fn to make mix command creators w/ minimal arguments */
export function mixUtil(args: {
  pipette: string
  labware: string
  well: string
  volume: number
  times: number
  offsetFromBottomMm: number
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  tipRack: string
  xOffset: number
  yOffset: number
  aspirateDelaySeconds?: number | null | undefined
  dispenseDelaySeconds?: number | null | undefined
  nozzles: NozzleConfigurationStyle | null
  invariantContext: InvariantContext
  finalPushOut: number | null
}): CurriedCommandCreator[] {
  const {
    pipette,
    labware,
    well,
    volume,
    times,
    offsetFromBottomMm,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    aspirateDelaySeconds,
    dispenseDelaySeconds,
    tipRack,
    xOffset,
    yOffset,
    nozzles,
    invariantContext,
    finalPushOut,
  } = args

  const getDelayCommand = (seconds?: number | null): CurriedCommandCreator[] =>
    seconds
      ? [
          curryWithoutPython(delay, {
            seconds,
          }),
        ]
      : []

  const pythonCommandCreator = makePythonCommandCreator({
    invariantContext,
    pipette,
    volume,
    times,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    aspirateDelaySeconds: aspirateDelaySeconds ?? 0,
    dispenseDelaySeconds: dispenseDelaySeconds ?? 0,
    finalPushOut,
    positionArgs: {
      labware,
      well,
      xOffset,
      yOffset,
      offsetFromBottomMm,
    },
  })

  const commandCreators = []
  for (let i = 0; i < times; i++) {
    commandCreators.push(
      ...[
        curryWithoutPython(aspirate, {
          pipetteId: pipette,
          volume,
          labwareId: labware,
          wellName: well,
          flowRate: aspirateFlowRateUlSec,
          tipRack,
          wellLocation: {
            origin: 'bottom',
            offset: {
              z: offsetFromBottomMm,
              x: xOffset,
              y: yOffset,
            },
          },
          nozzles: null,
        }),
        ...getDelayCommand(aspirateDelaySeconds),
        curryWithoutPython(dispense, {
          pipetteId: pipette,
          volume,
          labwareId: labware,
          wellName: well,
          wellLocation: {
            origin: 'bottom',
            offset: {
              z: offsetFromBottomMm,
              x: xOffset,
              y: yOffset,
            },
          },
          flowRate: dispenseFlowRateUlSec,
          tipRack,
          nozzles: nozzles,
          ...(i < times - 1
            ? { pushOut: 0 }
            : finalPushOut == null
            ? {}
            : { pushOut: finalPushOut }), // only push out if final repetition
        }),
        ...getDelayCommand(dispenseDelaySeconds),
      ]
    )
  }
  return [...commandCreators, pythonCommandCreator]
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
    offsetFromBottomMm,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    blowoutFlowRateUlSec,
    blowoutOffsetFromTopMm,
    dropTipLocation,
    tipRack,
    xOffset,
    yOffset,
    nozzles,
    finalPushOut,
  } = data

  const isMultiChannelPipette =
    invariantContext.pipetteEntities[pipette]?.spec.channels !== 1

  // Errors
  if (
    !prevRobotState.pipettes[pipette] ||
    !invariantContext.pipetteEntities[pipette]
  ) {
    // bail out before doing anything else
    return {
      errors: [
        errorCreators.pipetteDoesNotExist({
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

  const initialLabwareSlot = getSlotInLocationStack(
    prevRobotState.labware[labware]?.stack
  )
  const hasWasteChute =
    Object.keys(invariantContext.wasteChuteEntities).length > 0

  if (
    hasWasteChute &&
    initialLabwareSlot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA
  ) {
    return { errors: [errorCreators.labwareDiscarded()] }
  }

  if (
    !dropTipLocation ||
    (invariantContext.wasteChuteEntities[dropTipLocation] == null &&
      invariantContext.trashBinEntities[dropTipLocation] == null)
  ) {
    return { errors: [errorCreators.dropTipLocationDoesNotExist()] }
  }

  if (isMultiChannelPipette && nozzles !== ALL) {
    const isAspirateSafePipetteMovement = getIsSafePipetteMovement(
      data.nozzles,
      prevRobotState,
      invariantContext,
      pipette,
      labware,
      tipRack,
      { x: xOffset, y: yOffset }
    )
    const isDispenseSafePipetteMovement = getIsSafePipetteMovement(
      data.nozzles,
      prevRobotState,
      invariantContext,
      pipette,
      labware,
      tipRack,
      { x: xOffset, y: yOffset }
    )
    if (!isAspirateSafePipetteMovement && !isDispenseSafePipetteMovement) {
      return {
        errors: [errorCreators.possiblePipetteCollision()],
      }
    }
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
            nozzles: data.nozzles ?? undefined,
            tipRack,
          }),
        ]
      }

      const touchTipCommands = data.touchTip
        ? [
            curryCommandCreator(touchTip, {
              pipetteId: pipette,
              labwareId: labware,
              wellName: well,
              zOffsetFromTop: data.touchTipMmFromTop,
            }),
          ]
        : []
      const blowoutCommand = blowoutLocationHelper({
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
        offsetFromBottomMm,
        aspirateFlowRateUlSec,
        dispenseFlowRateUlSec,
        aspirateDelaySeconds,
        dispenseDelaySeconds,
        tipRack,
        xOffset,
        yOffset,
        nozzles,
        invariantContext,
        finalPushOut,
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
