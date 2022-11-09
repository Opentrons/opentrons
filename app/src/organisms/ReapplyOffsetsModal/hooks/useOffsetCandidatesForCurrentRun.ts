import isEqual from 'lodash/isEqual'
import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'
import { useProtocolDetailsForRun } from '../../Devices/hooks'
import { getLabwareOffsetLocation } from '../../Devices/ProtocolRun/utils/getLabwareOffsetLocation'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useHistoricRunDetails } from './useHistoricRunDetails'

import type { LabwareOffset } from '@opentrons/api-client'
import type { ProtocolFile, LoadedLabware } from '@opentrons/shared-data'

export interface OffsetCandidate extends LabwareOffset {
  labwareDisplayName: string
  runCreatedAt: string
}
export function useOffsetCandidatesForCurrentRun(): OffsetCandidate[] {
  const currentRunId = useCurrentRunId()
  const { protocolData } = useProtocolDetailsForRun(currentRunId)
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
              new Date(b.offset.createdAt).getTime() -
              new Date(a.offset.createdAt).getTime()
          ) ?? []
    )
    .flat()

  if (
    protocolData == null ||
    allHistoricOffsets == null ||
    allHistoricOffsets.length === 0
  )
    return []

  return protocolData.labware
    .filter(labware => labware.id !== 'fixedTrash')
    .reduce<OffsetCandidate[]>((acc: OffsetCandidate[], item) => {
      const location = getLabwareOffsetLocation(
        item.id,
        protocolData.commands,
        protocolData.modules
      )
      const definition = getLabwareDefinition(
        item.id,
        protocolData.labware,
        protocolData.labwareDefinitions
      )
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
    }, [])
}

function getLabwareDefinition(
  labwareId: string,
  labware: LoadedLabware[],
  labwareDefinitions: ProtocolFile<{}>['labwareDefinitions']
): ProtocolFile<{}>['labwareDefinitions'][string] {
  const labwareDefinitionId = labware.find(item => item.id === labwareId)
    ?.definitionUri
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
