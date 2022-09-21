import isEqual from 'lodash/isEqual'
import { getLabwareDefURI, getLabwareDisplayName, LabwareDefinition2, ProtocolAnalysisOutput } from '@opentrons/shared-data'
import { useProtocolDetailsForRun } from '../../Devices/hooks'
import { getLabwareOffsetLocation } from '../../Devices/ProtocolRun/utils/getLabwareOffsetLocation'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useHistoricRunDetails } from './useHistoricRunDetails'

import type { LabwareOffset } from '@opentrons/api-client'
import type { ProtocolFile } from '@opentrons/shared-data'
import { LoadLabwareRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
interface OffsetCandidate extends LabwareOffset {
  labwareDisplayName: string
  runCreatedAt: string
}
export function useOffsetCandidatesForAnalysisFile(analysisFile: ProtocolAnalysisOutput): OffsetCandidate[] {
  const { commands, labware, modules } = analysisFile
  const historicRunDetails = useHistoricRunDetails()
  const allHistoricOffsets = historicRunDetails
    .map(
      run =>
        run.labwareOffsets
          ?.map(offset => ({
            offset,
            runCreatedAt: run.createdAt,
          }))
          ?.sort(
            (a, b) =>
              new Date(a.offset.createdAt).getTime() -
              new Date(b.offset.createdAt).getTime()
          ) ?? []
    )
    .flat()

  if (
    allHistoricOffsets == null ||
    allHistoricOffsets.length === 0
  )
    return []

  const labwareDefinitions = commands.filter(
    (command): command is LoadLabwareRunTimeCommand =>
      command.commandType === 'loadLabware'
  ).reduce((acc, command: LoadLabwareRunTimeCommand) => {
    const labwareDef: LabwareDefinition2 = command.result?.definition
    const labwareId = command.result?.labwareId ?? ''
    const definitionUri = labware.find(l => l.id === labwareId)?.definitionUri
    const definitionId = `${definitionUri}_id`

    return { ...acc, [definitionId]: labwareDef }
  }, {})


  return Object.keys(labware).reduce<OffsetCandidate[]>(
    (acc: OffsetCandidate[], labwareId: string) => {
      const location = getLabwareOffsetLocation(labwareId, commands, modules)
      const definition = getLabwareDefinition(labwareId, labware, labwareDefinitions)
      const defUri = getLabwareDefURI(definition)
      const labwareDisplayName = getLabwareDisplayName(definition)

      const offsetMatch = allHistoricOffsets.find(
        ({ offset }) =>
          !isEqual(offset.vector, { x: 0, y: 0, z: 0 }) &&
          isEqual(offset.location, location) &&
          offset.definitionUri === defUri
      )

      return offsetMatch == null
        ? acc
        : [
          ...acc,
          {
            ...offsetMatch.offset,
            runCreatedAt: offsetMatch.runCreatedAt,
            labwareDisplayName,
          },
        ]
    },
    []
  )
}

function getLabwareDefinition(
  labwareId: string,
  labware: ProtocolAnalysisOutput['labware'],
  labwareDefinitions: LoadLabwareRunTimeCommand[],
): ProtocolFile<{}>['labwareDefinitions'][string] {
  const labwareDefinitionId = labware[labwareId].definitionId
  if (labwareDefinitionId == null) {
    throw new Error(
      'expected to be able to find labware definition id for labware, but could not'
    )
  }
  const labwareDefinition = labwareDefinitions[labwareDefinitionId]
  if (labwareDefinition == null) {
    throw new Error(
      'expected to be able to find labware definitions for protocol, but could not'
    )
  }
  return labwareDefinition
}
