import { WELL_ORIGIN_TOP } from '@opentrons/shared-data'

import {
  invalidRuntimeParameter,
  noTipOnPipette,
  pipetteDoesNotExist,
} from '../../errorCreators'
import {
  formatPyStr,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { CreateCommand } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  TouchTipStepGenArgs,
} from '../../types'

export const touchTip: CommandCreator<TouchTipStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /** touchTip with given args. Requires tip. */
  const actionName = 'touchTip'
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const labwareId = resolveStringRuntimeValue(args.labwareId, runtimeParameters)
  const wellName = resolveStringRuntimeValue(args.wellName, runtimeParameters)
  const zOffsetFromTop = resolveNumericRuntimeValue(
    args.zOffsetFromTop,
    runtimeParameters
  )
  const speed =
    args.speed == null
      ? undefined
      : resolveNumericRuntimeValue(args.speed, runtimeParameters)
  const mmFromEdge =
    args.mmFromEdge == null
      ? undefined
      : resolveNumericRuntimeValue(args.mmFromEdge, runtimeParameters)
  const rawValues = [
    args.pipetteId,
    args.labwareId,
    args.wellName,
    args.zOffsetFromTop,
    args.speed,
    args.mmFromEdge,
  ]
  const resolvedValues = [
    pipetteId,
    labwareId,
    wellName,
    zOffsetFromTop,
    speed,
    mmFromEdge,
  ]
  const errors: CommandCreatorError[] = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] == null
      ? [invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (
    errors.length > 0 ||
    pipetteId == null ||
    labwareId == null ||
    wellName == null ||
    zOffsetFromTop == null
  ) {
    return { errors }
  }
  const pipetteData = prevRobotState.pipettes[pipetteId]

  if (!pipetteData) {
    errors.push(
      pipetteDoesNotExist({
        pipette: pipetteId,
      })
    )
  }

  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    errors.push(
      noTipOnPipette({
        actionName,
        pipette: pipetteId,
        labware: labwareId,
        well: wellName,
      })
    )
  }

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const labwarePythonName =
    invariantContext.labwareEntities[labwareId].pythonName
  const pythonWellName =
    runtimeParameters[args.wellName] != null
      ? args.wellName
      : formatPyStr(wellName)
  const pythonArgs = [
    `${labwarePythonName}[${pythonWellName}]`,
    `v_offset=${args.zOffsetFromTop}`,
    ...(args.speed != null ? [`speed=${args.speed}`] : []),
    ...(args.mmFromEdge != null ? [`mm_from_edge=${args.mmFromEdge}`] : []),
  ]

  const python = `${pipettePythonName}.touch_tip(${pythonArgs.join(', ')})`

  if (args.speed != null && speed == null) {
    console.error(
      `touchTip: expected speed to resolve but got undefined (raw: ${String(
        args.speed
      )})`
    )
  }
  if (args.mmFromEdge != null && mmFromEdge == null) {
    console.error(
      `touchTip: expected mmFromEdge to resolve but got undefined (raw: ${String(
        args.mmFromEdge
      )})`
    )
  }

  const commands: CreateCommand[] = [
    {
      commandType: 'touchTip',
      key: uuid(),
      params: {
        pipetteId,
        labwareId,
        wellName,
        wellLocation: {
          origin: WELL_ORIGIN_TOP,
          offset: {
            z: zOffsetFromTop,
          },
        },
        speed: speed ?? undefined,
        mmFromEdge: mmFromEdge ?? undefined,
      },
    },
  ]
  return {
    commands,
    python,
  }
}
