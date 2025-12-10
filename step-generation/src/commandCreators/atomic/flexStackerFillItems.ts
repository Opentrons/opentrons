import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  formatPyStr,
  getChunkForIndentingLists,
  INDENT,
  indentPyLines,
  labwareMatchesLabwareInHopper,
  spaceInHopper,
  uuid,
} from '../../utils'

import type { FlexStackerFillItemsCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerFillItems: CommandCreator<
  FlexStackerFillItemsCreateCommand['params']
> = (args, invariantContext, robotState) => {
  const { moduleId, labware, message } = args
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const isSpace = spaceInHopper(flexStackerState)
  const modulePythonName = invariantContext.moduleEntities[moduleId].pythonName
  const labwarePythonNames = labware.map(
    lw => invariantContext.labwareEntities[lw].pythonName
  )
  const labwareChunks = getChunkForIndentingLists(labwarePythonNames, 4)

  const indentedLabwarePythonNames = labwareChunks
    .map(chunk => INDENT + chunk.join(', '))
    .join(',\n')

  const pythonLabwareNames =
    labwarePythonNames.length < 4
      ? labwarePythonNames.join(', ')
      : `\n${indentedLabwarePythonNames}\n`

  if (!isSpace) {
    return {
      errors: [errorCreators.flexStackerHopperFull()],
    }
  }
  if (labware.length > 0) {
    const allMatch = labware.every(lw =>
      labwareMatchesLabwareInHopper(lw, invariantContext, flexStackerState)
    )
    if (!allMatch) {
      return {
        errors: [errorCreators.flexStackerLabwareTypeMismatch()],
      }
    }
  }

  const pythonArgs = [
    ...(labware.length > 0 ? `labware=[${pythonLabwareNames}],\n` : []),
    ...(message != null ? [`message=${formatPyStr(message)},\n`] : []),
  ].join('')

  return {
    commands: [
      {
        commandType: 'flexStacker/fillItems',
        key: uuid(),
        params: {
          moduleId,
          labware,
          message,
        },
      },
    ],
    python:
      `${modulePythonName}.fill_items(\n` +
      `${indentPyLines(pythonArgs)}` +
      `)`,
  }
}
