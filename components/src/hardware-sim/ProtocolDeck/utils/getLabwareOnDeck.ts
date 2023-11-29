import type {
  CompletedProtocolAnalysis,
  LoadLabwareRunTimeCommand,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import { getWellFillFromLabwareId } from './getWellFillFromLabwareId'
import type { LabwareOnDeck } from '../../BaseDeck'
import { getLabwareInfoByLiquidId } from './getLabwareInfoByLiquidId'
import { getInitialLoadedLabwareByAdapter } from './getInitiallyLoadedLabwareByAdapter'

export const getLabwareOnDeck = (
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
): LabwareOnDeck[] => {
  const { commands, liquids } = protocolAnalysis
  const initialLoadedLabwareByAdapter = getInitialLoadedLabwareByAdapter(
    commands
  )
  const labwareByLiquidId = getLabwareInfoByLiquidId(commands)
  return commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reduce<LabwareOnDeck[]>((acc, command) => {
      const labwareId = command.result?.labwareId
      const location = command.params.location
      const displayName = command.params.displayName ?? null
      const labwareDef = command.result?.definition
      if (
        location === 'offDeck' ||
        'moduleId' in location ||
        'labwareId' in location
      )
        return acc
      if (labwareId == null) {
        console.warn('expected to find labware id but could not')
        return acc
      }
      if (labwareDef == null) {
        console.warn(
          `expected to find labware def for labware id ${String(
            labwareId
          )} but could not`
        )
        return acc
      }

      const slotName =
        'addressableAreaName' in location
          ? location.addressableAreaName
          : location.slotName

      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]

      //  NOTE: only rendering the labware on top most layer so
      //  either the adapter or the labware are rendered but not both
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId

      const wellFill = getWellFillFromLabwareId(
        topLabwareId ?? '',
        liquids,
        labwareByLiquidId
      )
      return [
        ...acc,
        {
          labwareLocation: { slotName },
          definition: topLabwareDefinition,
          wellFill: wellFill,
          displayName: displayName,
        },
      ]
    }, [])
}
