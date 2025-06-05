import flatMap from 'lodash/flatMap'

import {
  getCorrectionVolume,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  LOW_VOLUME_PIPETTES,
  WELL_ORIGIN_BOTTOM,
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
  aspirateInPlace,
  configureForVolume,
  delay,
  dispenseInPlace,
  moveToWell,
  touchTip,
} from '../atomic'
import { replaceTip } from './replaceTip'

import type { MoveToWellParams, WellLocation } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CurriedCommandCreator,
  InvariantContext,
  MixArgs,
} from '../../types'

const getDelayCommand = (seconds: number = 0): CurriedCommandCreator[] =>
  seconds > 0
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

/** Helper fn to make mix command creators w/ minimal arguments */
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
  moveToWellParams?: MoveToWellParams
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
    moveToWellParams,
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
    positionArgs:
      moveToWellParams != null
        ? {
            labware: moveToWellParams.labwareId,
            well: moveToWellParams.wellName,
            xOffset: moveToWellParams.wellLocation?.offset?.x ?? 0,
            yOffset: moveToWellParams.wellLocation?.offset?.y ?? 0,
            offsetFromBottomMm: moveToWellParams.wellLocation?.offset?.z ?? 0,
          }
        : undefined,
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

  const moveToWellCommands: CurriedCommandCreator[] =
    moveToWellParams != null
      ? [
          curryWithoutPython(moveToWell, {
            ...moveToWellParams,
            wellLocation: {
              ...moveToWellParams.wellLocation,
            },
          }),
        ]
      : []

  const commandCreators = moveToWellCommands
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
    offsetFromBottomMm,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    blowoutFlowRateUlSec,
    blowoutOffsetFromTopMm,
    dropTipLocation,
    tipRack,
    xOffset,
    yOffset,
    finalPushOut,
  } = data

  const aspirateDelaySeconds = data.aspirateDelaySeconds ?? 0
  const dispenseDelaySeconds = data.dispenseDelaySeconds ?? 0

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

  if (isMultiChannelPipette) {
    const isAspirateSafePipetteMovement = getIsSafePipetteMovement({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: labware,
      wellLocationOffset: { x: xOffset, y: yOffset },
      wellTargetName: wells[0],
    })
    const isDispenseSafePipetteMovement = getIsSafePipetteMovement({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: labware,
      wellLocationOffset: { x: xOffset, y: yOffset },
      wellTargetName: wells[0],
    })
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
      const mixCommands = mixInPlaceUtil({
        pipette,
        volume,
        times,
        aspirateFlowRateUlSec,
        dispenseFlowRateUlSec,
        invariantContext,
        liquidClass: null,
        tiprack: tipRack,
        finalPushOut,
        aspirateDelaySeconds,
        dispenseDelaySeconds,
        moveToWellParams: {
          pipetteId: pipette,
          labwareId: labware,
          wellName: well,
          wellLocation: {
            origin: WELL_ORIGIN_BOTTOM,
            offset: {
              z: offsetFromBottomMm,
              x: xOffset,
              y: yOffset,
            },
          },
        },
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
