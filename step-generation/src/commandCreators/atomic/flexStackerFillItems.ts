import { formatPyList, uuid } from '../../utils'

import type { FlexStackerFillItemsCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerFillItems: CommandCreator<
  FlexStackerFillItemsCreateCommand['params']
> = (args, invariantContext) => {
  const { moduleId, labware } = args
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName
  const labwarePythonNames = labware.map(
    lw => invariantContext.labwareEntities[lw].pythonName
  )
  // TODO: add error creators

  const pythonArgs = [
    ...(labware.length > 0
      ? [`labware=${formatPyList(labwarePythonNames)}`]
      : []),
  ]

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
    python: `${pythonName}.fill_items(${pythonArgs.join(', ')})`,
  }
}
