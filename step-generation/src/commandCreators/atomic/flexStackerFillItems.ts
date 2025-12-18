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
  const { moduleId, interventionMessage, fillQuantity } = args
  const { labwareEntities, moduleEntities } = invariantContext
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const labwareOffdeckForHopperFill =
  flexStackerState?.labwareFillQueue ?? []
  fillQuantity != null
    ? labwareOffdeckForHopperFill.slice(0, fillQuantity)
    : labwareOffdeckForHopperFill
  const isSpace = getIsSpaceInHopper(
    flexStackerState,
    invariantContext.labwareEntities
  )
  const modulePythonName = moduleEntities[moduleId].pythonName
  const labwarePythonNames = labwareOffdeckForHopperFill.map(
    lwId => labwareEntities[lwId].pythonName
  )
  const labwareChunks = getChunkForIndentingLists(labwarePythonNames, 4)

  const indentedLabwarePythonNames = labwareChunks
    .map(chunk => INDENT + chunk.join(', '))
    .join(',\n')

  const formattedPythonLabwareNames =
    labwarePythonNames.length < 4
      ? labwarePythonNames.join(', ')
      : `\n${indentedLabwarePythonNames}\n`

  if (!isSpace) {
    return {
      errors: [errorCreators.flexStackerHopperFull()],
    }
  } else if (labwareOffdeckForHopperFill.length > 0) {
    const allMatch = labwareOffdeckForHopperFill.every(labware =>
      labwareMatchesLabwareInHopper(labware, invariantContext, flexStackerState)
    )
    if (!allMatch) {
      return {
        errors: [errorCreators.flexStackerLabwareTypeMismatch()],
      }
    }
  }

  const pythonArgs = [
    ...(labwareOffdeckForHopperFill.length > 0
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
          labware: labwareOffdeckForHopperFill,
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
