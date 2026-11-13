import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { COLUMN_4_SLOTS } from '../../constants'
import * as errorCreators from '../../errorCreators'
import {
  absorbanceReaderCollision,
  formatPyStr,
  formatPyWellLocation,
  getIsHeaterShakerEastWestMultiChannelPipette,
  getIsHeaterShakerEastWestWithLatchOpen,
  getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette,
  getLabwareSlot,
  getSlotInLocationStack,
  modulePipetteCollision,
  pipetteAdjacentHeaterShakerWhileShaking,
  pipetteIntoHeaterShakerLatchOpen,
  pipetteIntoHeaterShakerWhileShaking,
  resolveNumericRuntimeValue,
  resolveRuntimeWellLocation,
  resolveStringRuntimeValue,
  thermocyclerPipetteCollision,
  uuid,
} from '../../utils'

import type { BlowoutParams, CreateCommand } from '@opentrons/shared-data'
import type {
  BlowOutInWellStepGenArgs,
  CommandCreator,
  CommandCreatorError,
} from '../../types'

export const blowOutInWell: CommandCreator<BlowOutInWellStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /** Blowout with given args. Requires tip. */
  const { pipetteEntities, labwareEntities, runtimeParameters } =
    invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const labwareId = resolveStringRuntimeValue(args.labwareId, runtimeParameters)
  const wellName = resolveStringRuntimeValue(args.wellName, runtimeParameters)
  const flowRate = resolveNumericRuntimeValue(args.flowRate, runtimeParameters)
  const resolvedWellLocation = resolveRuntimeWellLocation(
    args.wellLocation,
    runtimeParameters
  )
  const rawValues = [
    args.pipetteId,
    args.labwareId,
    args.wellName,
    args.flowRate,
  ]
  const resolvedValues = [pipetteId, labwareId, wellName, flowRate]
  const rtpErrors: CommandCreatorError[] = [
    ...rawValues.flatMap((value, i) =>
      typeof value === 'string' && resolvedValues[i] == null
        ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
        : []
    ),
    ...resolvedWellLocation.invalidParameterNames.map(parameterName =>
      errorCreators.invalidRuntimeParameter({ parameterName })
    ),
  ]
  if (
    rtpErrors.length > 0 ||
    pipetteId == null ||
    labwareId == null ||
    wellName == null ||
    flowRate == null
  ) {
    return { errors: rtpErrors }
  }
  const wellLocation =
    resolvedWellLocation.location as BlowoutParams['wellLocation']
  const pipette = pipetteEntities[pipetteId]
  const actionName = 'blowout'
  const errors: CommandCreatorError[] = []
  const pipetteSpec = pipette?.spec
  const isFlexPipette =
    (pipetteSpec?.displayCategory === 'FLEX' || pipetteSpec?.channels === 96) ??
    false
  const pipetteData = prevRobotState.pipettes[pipetteId]
  const labwareState = prevRobotState.labware
  const slotName = getLabwareSlot(labwareId, prevRobotState.labware)
  // TODO Ian 2018-04-30 this logic using command creator args + robotstate to push errors
  // is duplicated across several command creators (eg aspirate & blowout overlap).
  // You can probably make higher-level error creator util fns to be more DRY
  if (!pipetteData) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        pipette: pipetteId,
      })
    )
  }

  if (pipetteSpec == null) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        pipette: pipetteId,
      })
    )
  }

  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName,
        pipette: pipetteId,
        labware: labwareId,
        well: wellName,
      })
    )
  }

  if (!labwareId || !prevRobotState.labware[labwareId]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware: labwareId,
      })
    )
  } else if (
    getSlotInLocationStack(prevRobotState.labware[labwareId].stack) ===
    'offDeck'
  ) {
    errors.push(errorCreators.labwareOffDeck())
  }

  if (COLUMN_4_SLOTS.includes(slotName)) {
    errors.push(errorCreators.pipettingIntoColumn4({ typeOfStep: actionName }))
  } else if (labwareState[slotName] != null) {
    const adapterSlot = getSlotInLocationStack(labwareState[slotName].stack)
    if (COLUMN_4_SLOTS.includes(adapterSlot)) {
      errors.push(
        errorCreators.pipettingIntoColumn4({ typeOfStep: actionName })
      )
    }
  }
  if (
    modulePipetteCollision({
      pipette: pipetteId,
      labware: labwareId,
      invariantContext,
      prevRobotState,
    })
  ) {
    errors.push(errorCreators.modulePipetteCollisionDanger())
  }

  if (
    thermocyclerPipetteCollision(
      prevRobotState.modules,
      prevRobotState.labware,
      labwareId
    )
  ) {
    errors.push(errorCreators.thermocyclerLidClosed())
  }

  if (
    absorbanceReaderCollision(
      prevRobotState.modules,
      prevRobotState.labware,
      labwareId
    )
  ) {
    errors.push(errorCreators.absorbanceReaderLidClosed())
  }

  if (
    pipetteIntoHeaterShakerLatchOpen(
      prevRobotState.modules,
      prevRobotState.labware,
      labwareId
    )
  ) {
    errors.push(errorCreators.heaterShakerLatchOpen())
  }

  if (
    pipetteIntoHeaterShakerWhileShaking(
      prevRobotState.modules,
      prevRobotState.labware,
      labwareId
    )
  ) {
    errors.push(errorCreators.heaterShakerIsShaking())
  }
  if (
    pipetteAdjacentHeaterShakerWhileShaking(
      prevRobotState.modules,
      slotName,
      isFlexPipette ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
    )
  ) {
    errors.push(errorCreators.heaterShakerNorthSouthEastWestShaking())
  }
  if (!isFlexPipette && pipetteSpec != null) {
    if (
      getIsHeaterShakerEastWestWithLatchOpen(prevRobotState.modules, slotName)
    ) {
      errors.push(errorCreators.heaterShakerEastWestWithLatchOpen())
    }

    if (
      getIsHeaterShakerEastWestMultiChannelPipette(
        prevRobotState.modules,
        slotName,
        pipetteSpec
      )
    ) {
      errors.push(errorCreators.heaterShakerEastWestOfMultiChannelPipette())
    }
    if (
      getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette(
        prevRobotState.modules,
        slotName,
        pipetteSpec,
        invariantContext.labwareEntities[labwareId]
      )
    ) {
      errors.push(
        errorCreators.heaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette()
      )
    }
  }

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  const pipettePythonName = pipette.pythonName
  const labwarePythonName = labwareEntities[labwareId].pythonName
  const pythonWellName =
    runtimeParameters[args.wellName] != null
      ? args.wellName
      : formatPyStr(wellName)
  const pythonWellLocation = formatPyWellLocation(
    args.wellLocation == null
      ? undefined
      : {
          origin: wellLocation?.origin,
          offset: args.wellLocation.offset,
        }
  )

  const commands: CreateCommand[] = [
    {
      commandType: 'blowout',
      key: uuid(),
      params: {
        pipetteId,
        labwareId,
        wellName,
        flowRate,
        wellLocation,
      },
    },
  ]
  return {
    commands,
    python:
      // The Python blow_out() does not take a flow rate argument, so we have to
      // reconfigure the pipette's default blow out rate instead:
      `${pipettePythonName}.flow_rate.blow_out = ${args.flowRate}\n` +
      `${pipettePythonName}.blow_out(${labwarePythonName}[${pythonWellName}]${pythonWellLocation})`,
  }
}
