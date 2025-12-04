import {
  getChunkForIndentingLists,
  INDENT,
  indentPyLines,
  uuid,
} from '../../utils'

import type { FlexStackerFillItemsCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerFillItems: CommandCreator<
  FlexStackerFillItemsCreateCommand['params']
> = (args, invariantContext) => {
  const { moduleId, labware } = args
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

  // TODO: add error creators
  const pythonArgs =
    labware.length > 0 ? `labware=[${pythonLabwareNames}],\n` : ''
  return {
    commands: [
      {
        commandType: 'flexStacker/fillItems',
        key: uuid(),
        params: {
          moduleId,
          labware,
        },
      },
    ],
    python:
      `${modulePythonName}.fill_items(\n` +
      `${indentPyLines(pythonArgs)}` +
      `)`,
  }
}
