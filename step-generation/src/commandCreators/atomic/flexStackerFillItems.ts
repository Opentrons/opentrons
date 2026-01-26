import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  formatPyStr,
  getChunkForIndentingLists,
  getIsSpaceInHopper,
  INDENT,
  indentPyLines,
  labwareMatchesLabwareInHopper,
  uuid,
} from '../../utils'

import type { CommandCreator, FlexStackerFillItemsArgs } from '../../types'

export const flexStackerFillItems: CommandCreator<FlexStackerFillItemsArgs> = (
  args,
  invariantContext,
  robotState
) => {
  const { moduleId, interventionMessage, fillLabwareIds } = args
  const { labwareEntities, moduleEntities } = invariantContext
  if (moduleId == null || moduleEntities[moduleId] == null) {
    return { errors: [errorCreators.missingModuleError()] }
  }
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const isSpace = getIsSpaceInHopper(
    flexStackerState,
    invariantContext.labwareEntities
  )
  const modulePythonName = moduleEntities[moduleId].pythonName
  const labwarePythonNames = fillLabwareIds
    .filter(id => !labwareEntities[id].def.allowedRoles?.includes('lid'))
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
  } else if (fillLabwareIds.length > 0) {
    const allMatch = fillLabwareIds.every(labware =>
      labwareMatchesLabwareInHopper(labware, invariantContext, flexStackerState)
    )
    if (!allMatch) {
      return {
        errors: [errorCreators.flexStackerLabwareTypeMismatch()],
      }
    }
  }

  const filteredFillLabwareIds = fillLabwareIds.filter(
    id => !labwareEntities[id].def.allowedRoles?.includes('lid')
  )
  const pythonArgs = [
    ...(filteredFillLabwareIds.length > 0
      ? `labware=[${formattedPythonLabwareNames}],\n`
      : []),
    ...(interventionMessage != null
      ? [`message=${formatPyStr(interventionMessage)},\n`]
      : []),
  ].join('')

  return {
    commands: [
      {
        commandType: 'flexStacker/fillItems',
        key: uuid(),
        params: {
          moduleId,
          labware: fillLabwareIds,
          message: interventionMessage ?? undefined,
        },
      },
    ],
    python:
      `${modulePythonName}.fill_items(\n` +
      `${indentPyLines(pythonArgs)}` +
      `)`,
  }
}
