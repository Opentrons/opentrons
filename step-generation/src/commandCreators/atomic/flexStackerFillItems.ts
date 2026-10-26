import { getIsLid } from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  getChunkForIndentingLists,
  getIsSpaceInHopper,
  INDENT,
  indentPyLines,
  labwareMatchesLabwareInHopper,
  pythonRuntimeString,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  FlexStackerFillItemsArgs,
} from '../../types'

export const flexStackerFillItems: CommandCreator<FlexStackerFillItemsArgs> = (
  args,
  invariantContext,
  robotState
) => {
  const { interventionMessage, fillLabwareIds } = args
  const { labwareEntities, moduleEntities, runtimeParameters } =
    invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const resolvedFillLabwareIds = fillLabwareIds.map(id =>
    resolveStringRuntimeValue(id, runtimeParameters)
  )
  const resolvedMessage =
    interventionMessage == null
      ? null
      : resolveStringRuntimeValue(interventionMessage, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (moduleId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId })
    )
  }
  fillLabwareIds.forEach((id, i) => {
    if (resolvedFillLabwareIds[i] == null) {
      errors.push(errorCreators.invalidRuntimeParameter({ parameterName: id }))
    }
  })
  if (interventionMessage != null && resolvedMessage == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: interventionMessage,
      })
    )
  }
  if (errors.length > 0 || moduleId == null) {
    return { errors }
  }
  const resolvedLabwareIds = resolvedFillLabwareIds.filter(
    (id): id is string => id != null
  )
  if (moduleEntities[moduleId] == null) {
    return { errors: [errorCreators.missingModuleError()] }
  }
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const isSpace = getIsSpaceInHopper(
    flexStackerState,
    invariantContext.labwareEntities
  )
  const modulePythonName = moduleEntities[moduleId].pythonName
  const labwarePythonNames = resolvedLabwareIds
    .filter(id => !getIsLid(labwareEntities[id].def))
    .map(lwId => labwareEntities[lwId]?.pythonName)
  const labwareChunks = getChunkForIndentingLists(labwarePythonNames, 4)
  const indentedLabwarePythonNames = labwareChunks
    .map(chunk => INDENT + chunk.join(', '))
    .join(',\n')
  const formattedPythonLabwareNames =
    labwarePythonNames.length < 4
      ? labwarePythonNames.join(', ')
      : `\n${indentedLabwarePythonNames}\n`

  if (
    flexStackerState != null &&
    flexStackerState.storedLabwareDetails === null &&
    flexStackerState.labwareInHopper == null
  ) {
    return {
      errors: [errorCreators.flexStackerLabwareTypeMissing()],
    }
  }
  if (!isSpace) {
    return {
      errors: [errorCreators.flexStackerHopperFull()],
    }
  } else if (resolvedLabwareIds.length > 0) {
    const allMatch = resolvedLabwareIds.every(labware =>
      labwareMatchesLabwareInHopper(labware, invariantContext, flexStackerState)
    )
    if (!allMatch) {
      return {
        errors: [errorCreators.flexStackerLabwareTypeMismatch()],
      }
    }
  }

  const filteredFillLabwareIds = resolvedLabwareIds.filter(
    id => !getIsLid(labwareEntities[id].def)
  )
  const pythonArgs = [
    ...(filteredFillLabwareIds.length > 0
      ? `labware=[${formattedPythonLabwareNames}],\n`
      : []),
    ...(interventionMessage != null && resolvedMessage != null
      ? [
          `message=${pythonRuntimeString(interventionMessage, resolvedMessage, runtimeParameters)},\n`,
        ]
      : []),
  ].join('')

  return {
    commands: [
      {
        commandType: 'flexStacker/fillItems',
        key: uuid(),
        params: {
          moduleId,
          labware: resolvedLabwareIds,
          message: resolvedMessage ?? undefined,
        },
      },
    ],
    python:
      `${modulePythonName}.fill_items(\n` +
      `${indentPyLines(pythonArgs)}` +
      `)`,
  }
}
