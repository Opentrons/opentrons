import {
  AUTOMATIC,
  COLUMN_4_SLOTS,
  MANUAL,
  NOZZLE_STYLES,
  PRIMARY_NOZZLES,
} from '../../constants'
import {
  incompletePickup,
  invalidRuntimeParameter,
  pipettingIntoColumn4,
  possiblePipetteCollision,
  tooManyTips,
} from '../../errorCreators'
import {
  formatPyStr,
  getIsSafePickupWithinTiprack,
  getPipetteMovementSafetyStatus,
  getSlotInLocationStack,
  resolveAllowedRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  PickUpTipStepGenArgs,
} from '../../types'

export const pickUpTip: CommandCreator<PickUpTipStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { tipTrackingOption = AUTOMATIC, nozzles, primaryNozzle } = args
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const labwareId = resolveStringRuntimeValue(args.labwareId, runtimeParameters)
  const wellName = resolveStringRuntimeValue(args.wellName, runtimeParameters)
  const resolvedNozzles = resolveAllowedRuntimeValue(
    nozzles,
    NOZZLE_STYLES,
    runtimeParameters
  )
  const resolvedPrimaryNozzle = resolveAllowedRuntimeValue(
    primaryNozzle,
    PRIMARY_NOZZLES,
    runtimeParameters
  )
  const resolvedTipTracking = resolveAllowedRuntimeValue(
    tipTrackingOption,
    [AUTOMATIC, MANUAL],
    runtimeParameters
  )
  const rawValues = [args.pipetteId, args.labwareId, args.wellName]
  const resolvedValues = [pipetteId, labwareId, wellName]
  const rtpErrors: CommandCreatorError[] = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] == null
      ? [invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (resolvedNozzles == null) {
    rtpErrors.push(invalidRuntimeParameter({ parameterName: nozzles }))
  }
  if (resolvedPrimaryNozzle == null) {
    rtpErrors.push(invalidRuntimeParameter({ parameterName: primaryNozzle }))
  }
  if (resolvedTipTracking == null) {
    rtpErrors.push(
      invalidRuntimeParameter({ parameterName: tipTrackingOption })
    )
  }
  if (
    rtpErrors.length > 0 ||
    pipetteId == null ||
    labwareId == null ||
    wellName == null ||
    resolvedNozzles == null ||
    resolvedPrimaryNozzle == null ||
    resolvedTipTracking == null
  ) {
    return { errors: rtpErrors }
  }
  const nozzleConfiguration = resolvedNozzles as NozzleConfigurationStyle
  const resolvedPrimary =
    resolvedPrimaryNozzle as PrimaryNozzleConfigurationStyle
  const errors: CommandCreatorError[] = []
  const channels = invariantContext.pipetteEntities[pipetteId].spec.channels
  const pipetteMovementSafetyStatus = getPipetteMovementSafetyStatus({
    robotState: prevRobotState,
    invariantContext,
    pipetteId,
    labwareId,
    //  we don't adjust the offset when moving to the tiprack
    wellLocationOffset: { x: 0, y: 0 },
    wellTargetName: wellName,
    nozzleConfiguration,
    primaryNozzle: resolvedPrimary,
  })

  const isSafeWithinTiprack = getIsSafePickupWithinTiprack({
    tipState: prevRobotState.tipState.tipracks[labwareId],
    primaryNozzle: resolvedPrimary,
    channels,
    nozzleConfiguration,
    wellName,
    tiprackDef: invariantContext.labwareEntities[labwareId].def,
  })

  if (!pipetteMovementSafetyStatus.isSafe) {
    errors.push(
      possiblePipetteCollision({
        unsafePipetteMovementReason: pipetteMovementSafetyStatus.reason,
      })
    )
  }

  if (!isSafeWithinTiprack.isSafe) {
    errors.push(tooManyTips())
  }

  if (isSafeWithinTiprack.isComplete !== true) {
    errors.push(incompletePickup())
  }

  const tiprackSlot = getSlotInLocationStack(
    prevRobotState.labware[labwareId].stack
  )
  if (COLUMN_4_SLOTS.includes(tiprackSlot)) {
    errors.push(pipettingIntoColumn4({ typeOfStep: 'pick up tip' }))
  } else if (prevRobotState.labware[tiprackSlot] != null) {
    const adapterSlot = getSlotInLocationStack(
      prevRobotState.labware[tiprackSlot].stack
    )
    if (COLUMN_4_SLOTS.includes(adapterSlot)) {
      errors.push(pipettingIntoColumn4({ typeOfStep: 'pick up tip' }))
    }
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const tiprackPythonName =
    invariantContext.labwareEntities[labwareId].pythonName
  // We don't specify the tip well because it would make it hard for users to modify
  // the Python protocol. We do specify the tip rack because multiple tip racks could be
  // assigned to the pipette, and the UI makes the user choose which tip rack to use.
  const pythonWellName =
    runtimeParameters[args.wellName] != null
      ? args.wellName
      : formatPyStr(wellName)
  const manualWell = resolvedTipTracking === MANUAL ? `[${pythonWellName}]` : ''
  const python = `${pipettePythonName}.pick_up_tip(location=${tiprackPythonName}${manualWell})`

  if (errors.length > 0) {
    return { errors }
  }
  return {
    commands: [
      {
        commandType: 'pickUpTip',
        key: uuid(),
        params: {
          pipetteId,
          labwareId,
          wellName,
        },
      },
    ],
    python,
  }
}
