import flatMap from 'lodash/flatMap'

import {
  getByVolumeValue,
  getIsTiprack,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  LOW_VOLUME_PIPETTES,
  POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN,
  WELL_ORIGIN_BOTTOM,
} from '@opentrons/shared-data'

import { MANUAL } from '../../constants'
import * as errorCreators from '../../errorCreators'
import {
  curryCommandCreator,
  curryWithoutPython,
  formatPyStr,
  formatPyWellLocation,
  getPipetteMovementSafetyStatus,
  getSlotInLocationStack,
  getTargetTipsFromWellSets,
  indentPyLines,
  mixBlowoutLocationHelper,
  reduceCommandCreators,
} from '../../utils'
import {
  aspirateInPlace,
  configureForVolume,
  delay,
  dispenseInPlace,
  dropTip,
  moveToWell,
  prepareToAspirate,
  touchTip,
} from '../atomic'
import { replaceTip } from './replaceTip'

import type {
  MoveToWellParams,
  WellLocation,
  WellOrigin,
} from '@opentrons/shared-data'
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
    wellOrigin: WellOrigin
    xOffset: number
    yOffset: number
    zOffset: number
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
    const { labware, well, wellOrigin, xOffset, yOffset, zOffset } =
      positionArgs
    const labwarePythonName = labwareEntities[labware].pythonName
    const pythonWellLocation: WellLocation = {
      origin: wellOrigin,
      offset: { x: xOffset, y: yOffset, z: zOffset },
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
  generatePython: boolean
  // TODO: This function shouldn't be called "mixInPlaceUtil()" if we support moveToWellParams:
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
    generatePython,
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
            wellOrigin:
              moveToWellParams.wellLocation?.origin ?? WELL_ORIGIN_BOTTOM,
            xOffset: moveToWellParams.wellLocation?.offset?.x ?? 0,
            yOffset: moveToWellParams.wellLocation?.offset?.y ?? 0,
            zOffset: moveToWellParams.wellLocation?.offset?.z ?? 0,
          }
        : undefined,
  })

  const pipetteSpecs = invariantContext.pipetteEntities[pipette].spec

  const correctionVolumeAspirate =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tiprack,
      targetVolume: volume,
      liquidHandlingAction: 'aspirate',
      byVolumeProperty: 'correctionByVolume',
      defaultValue: 0,
    }) ?? 0
  const correctionVolumeDispense =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tiprack,
      targetVolume: volume,
      liquidHandlingAction: 'singleDispense',
      byVolumeProperty: 'correctionByVolume',
      defaultValue: 0,
    }) ?? 0

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
  return [...commandCreators, ...(generatePython ? [pythonCommandCreator] : [])]
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
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    blowoutFlowRateUlSec,
    blowoutOffsetFromTopMm,
    dropTipLocation,
    tipRack,
    positionReference,
    xOffset,
    yOffset,
    zOffset,
    finalPushOut,
    nozzles,
    primaryNozzle,
    tipsSelected,
    tiprackSelected,
    tipTracking,
  } = data

  const aspirateDelaySeconds = data.aspirateDelaySeconds ?? 0
  const dispenseDelaySeconds = data.dispenseDelaySeconds ?? 0

  const isMultiChannelPipette =
    invariantContext.pipetteEntities[pipette]?.spec.channels !== 1

  // Errors
  if (
    prevRobotState.pipettes[pipette] == null ||
    invariantContext.pipetteEntities[pipette] == null
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

  if (prevRobotState.labware[labware] == null) {
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

  const trashLikeIds = [
    ...Object.keys(invariantContext.trashBinEntities),
    ...Object.keys(invariantContext.wasteChuteEntities),
  ]

  const fallBackTrashLikeId = trashLikeIds.length > 0 ? trashLikeIds[0] : null

  // tiprack for return tip
  const dropTipLabware = Object.values(invariantContext.labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === dropTipLocation
  )
  const isReturnTip = dropTipLabware != null && getIsTiprack(dropTipLabware.def)

  const isWasteChuteDropLocation =
    invariantContext.wasteChuteEntities[dropTipLocation] != null
  const isTrashBinDropLocation =
    invariantContext.trashBinEntities[dropTipLocation] != null

  const hasTip = prevRobotState.pipettes[pipette]?.tipWell != null

  if (
    dropTipLocation == null ||
    (isReturnTip &&
      fallBackTrashLikeId == null &&
      changeTip !== 'never' &&
      hasTip) ||
    (!isReturnTip && !isWasteChuteDropLocation && !isTrashBinDropLocation)
  ) {
    return { errors: [errorCreators.dropTipLocationDoesNotExist()] }
  }

  if (isMultiChannelPipette) {
    const aspiratePipetteMovementSafetyStatus = getPipetteMovementSafetyStatus({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: labware,
      wellLocationOffset: { x: xOffset, y: yOffset },
      wellTargetName: wells[0],
      primaryNozzle,
      nozzleConfiguration: nozzles,
    })
    if (!aspiratePipetteMovementSafetyStatus.isSafe) {
      return {
        errors: [
          errorCreators.possiblePipetteCollision({
            unsafePipetteMovementReason:
              aspiratePipetteMovementSafetyStatus.reason,
          }),
        ],
      }
    }
    const dispensePipetteMovementSafetyStatus = getPipetteMovementSafetyStatus({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: labware,
      wellLocationOffset: { x: xOffset, y: yOffset },
      wellTargetName: wells[0],
      primaryNozzle,
      nozzleConfiguration: nozzles,
    })
    if (!dispensePipetteMovementSafetyStatus.isSafe) {
      return {
        errors: [
          errorCreators.possiblePipetteCollision({
            unsafePipetteMovementReason:
              dispensePipetteMovementSafetyStatus.reason,
          }),
        ],
      }
    }
  }

  const shouldConfigureForVolume = LOW_VOLUME_PIPETTES.includes(
    invariantContext.pipetteEntities[pipette].name
  )
  const configureForVolumeCommand: CurriedCommandCreator[] =
    shouldConfigureForVolume
      ? [
          curryCommandCreator(configureForVolume, {
            pipetteId: pipette,
            volume,
          }),
        ]
      : []

  const pipetteSpecs = invariantContext.pipetteEntities[pipette].spec
  const shouldSelectManualTips =
    tipTracking === MANUAL &&
    tiprackSelected != null &&
    tipsSelected != null &&
    tipsSelected.length > 0

  const targetTips = shouldSelectManualTips
    ? getTargetTipsFromWellSets({
        wellSets: tipsSelected,
        nozzles,
        channels: pipetteSpecs.channels,
        primaryNozzle,
      })
    : null

  // Command generation
  const commandCreators = flatMap(
    wells,
    (well: string, wellIndex: number): CurriedCommandCreator[] => {
      let tipCommands: CurriedCommandCreator[] = []

      if (changeTip === 'always' || (changeTip === 'once' && wellIndex === 0)) {
        const nextTip = targetTips?.shift()
        tipCommands = [
          curryCommandCreator(replaceTip, {
            pipette,
            primaryNozzle,
            // the tip will only be dropped on the first time through this loop if we are returning tip to tiprack
            dropTipLocation:
              isReturnTip && fallBackTrashLikeId != null
                ? fallBackTrashLikeId
                : dropTipLocation,
            tipRack,
            nozzles,
            ...(tipTracking === MANUAL &&
            nextTip != null &&
            tiprackSelected != null
              ? {
                  tipSelectionArgs: {
                    tipRackId: tiprackSelected,
                    tipWell: nextTip,
                  },
                }
              : {}),
            isFromMixCommand: true,
          }),
        ]
      }

      // need to prepare to aspirate if configuring for volume or have previously blown out (after the first well)
      const prepareToAspirateCommand: CurriedCommandCreator[] =
        shouldConfigureForVolume ||
        (data.blowoutLocation != null && wellIndex > 0)
          ? [
              curryCommandCreator(prepareToAspirate, {
                pipetteId: pipette,
              }),
            ]
          : []

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
      const blowoutCommand = mixBlowoutLocationHelper({
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
      const trashLikeEntityIds = [
        ...Object.keys(invariantContext.wasteChuteEntities),
        ...Object.keys(invariantContext.trashBinEntities),
      ]
      const isBlowoutLocationTrashLikeEntity = trashLikeEntityIds.some(
        id => id === data.blowoutLocation
      )
      const advancedDispenseCommands = isBlowoutLocationTrashLikeEntity
        ? [...touchTipCommands, ...blowoutCommand]
        : [...blowoutCommand, ...touchTipCommands]

      const returnTipCommands: CurriedCommandCreator[] =
        isReturnTip &&
        (wellIndex === wells.length - 1 || changeTip === 'always')
          ? [
              curryCommandCreator(dropTip, {
                pipette,
                dropTipLocation: tipRack,
                isReturnTip,
              }),
            ]
          : []

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
            origin: POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN[positionReference],
            offset: {
              x: xOffset,
              y: yOffset,
              z: zOffset,
            },
          },
        },
        generatePython: true,
      })
      return [
        ...tipCommands,
        ...configureForVolumeCommand,
        ...prepareToAspirateCommand,
        ...mixCommands,
        ...advancedDispenseCommands,
        ...returnTipCommands,
      ]
    }
  )

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
