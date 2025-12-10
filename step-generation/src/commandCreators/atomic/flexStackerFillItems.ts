import { HOPPER_STACKER_LOCATION } from '../../constants'
import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  formatPyStr,
  getChunkForIndentingLists,
  getSlotInLocationStack,
  INDENT,
  indentPyLines,
  labwareMatchesLabwareInHopper,
  spaceInHopper,
  uuid,
} from '../../utils'

import type { CommandCreator, FlexStackerFillItemsArgs } from '../../types'

export const flexStackerFillItems: CommandCreator<FlexStackerFillItemsArgs> = (
  args,
  invariantContext,
  robotState
) => {
  // NOTE: fillLabwareUri, fillQuantity will be wired up when we emit setStoredLabware
  // midway through the protocol
  const { moduleId, interventionMessage } = args
  const { labwareEntities, moduleEntities } = invariantContext
  const moduleSlot = robotState.modules[moduleId].slot
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const labwareOnHopper = Object.entries(robotState.labware)
    .filter(
      ([id, { stack }]) =>
        stack.includes(HOPPER_STACKER_LOCATION) &&
        getSlotInLocationStack(stack) === moduleSlot
    )
    .map(labwareState => labwareState[0])
  const isSpace = spaceInHopper(flexStackerState)
  const modulePythonName = moduleEntities[moduleId].pythonName
  const labwarePythonNames = labwareOnHopper.map(
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
  } else if (labwareOnHopper.length > 0) {
    const allMatch = labwareOnHopper.every(labware =>
      labwareMatchesLabwareInHopper(labware, invariantContext, flexStackerState)
    )
    if (!allMatch) {
      return {
        errors: [errorCreators.flexStackerLabwareTypeMismatch()],
      }
    }
  }

  const pythonArgs = [
    ...(labwareOnHopper.length > 0
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
          labware: labwareOnHopper,
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
