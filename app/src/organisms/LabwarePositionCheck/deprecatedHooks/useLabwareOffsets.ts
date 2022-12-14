import reduce from 'lodash/reduce'
import { useTranslation, TFunction } from 'react-i18next'
import {
  getModuleDisplayName,
  getLabwareDisplayName,
  getModuleType,
  LegacySchemaAdapterOutput,
  THERMOCYCLER_MODULE_TYPE,
  getVectorSum,
} from '@opentrons/shared-data'
import { getLabwareOffsetLocation } from '../../Devices/ProtocolRun/utils/getLabwareOffsetLocation'
import { getModuleInitialLoadInfo } from '../../Devices/ProtocolRun/utils/getModuleInitialLoadInfo'
import { getLabwareLocation } from '../../Devices/ProtocolRun/utils/getLabwareLocation'
import { getLabwareDefinitionUri } from '../../Devices/ProtocolRun/utils/getLabwareDefinitionUri'
import { useOffsetDataByLabwareId } from '../../ProtocolUpload/hooks/useOffsetData'
import type { LabwareOffsetLocation, VectorOffset } from '@opentrons/api-client'
import type { SavePositionCommandData } from '../types'
import { getCurrentOffsetForLabwareInLocation } from '../../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { useCurrentRun } from '../../ProtocolUpload/hooks'

const getDisplayLocation = (
  labwareId: string,
  protocolData: LegacySchemaAdapterOutput,
  t: TFunction<'labware_position_check'>
): string => {
  let location = ''
  const labwareLocation = getLabwareLocation(labwareId, protocolData.commands)
  if (labwareLocation === 'offDeck') return 'Off Deck'
  if ('moduleId' in labwareLocation) {
    if (
      getModuleType(protocolData.modules[labwareLocation.moduleId].model) ===
      THERMOCYCLER_MODULE_TYPE
    ) {
      location = getModuleDisplayName(
        protocolData.modules[labwareLocation.moduleId].model
      )
    } else {
      location = t('module_display_location_text', {
        moduleName: getModuleDisplayName(
          protocolData.modules[labwareLocation.moduleId].model
        ),
        slot: getModuleInitialLoadInfo(
          labwareLocation.moduleId,
          protocolData.commands
        ).location.slotName,
      })
    }
  } else {
    location = t('labware_display_location_text', {
      slot: labwareLocation.slotName,
    })
  }
  return location
}

export type LabwareOffsets = Array<{
  labwareId: string
  labwareOffsetLocation: LabwareOffsetLocation
  labwareDefinitionUri: string
  displayLocation: string
  displayName: string
  vector: VectorOffset
}>

export const useLabwareOffsets = (
  savePositionCommandData: SavePositionCommandData,
  protocolData: LegacySchemaAdapterOutput
): Promise<LabwareOffsets> => {
  const { t } = useTranslation('labware_position_check')
  const offsetDataByLabwareId = useOffsetDataByLabwareId(
    savePositionCommandData
  )
  const existingLabwareOffsets = useCurrentRun()?.data?.labwareOffsets ?? []
  return reduce<SavePositionCommandData, Promise<LabwareOffsets>>(
    savePositionCommandData,
    (labwareOffsets, _commandIds, labwareId) => {
      const displayLocation = getDisplayLocation(labwareId, protocolData, t)
      const labwareOffsetLocation = getLabwareOffsetLocation(
        labwareId,
        protocolData.commands,
        protocolData.modules
      )
      // skip if location is offDeck
      if (labwareOffsetLocation == null) return labwareOffsets
      const labwareDefinitionUri = getLabwareDefinitionUri(
        labwareId,
        protocolData.labware,
        protocolData.labwareDefinitions
      )
      //   @ts-expect-error: when we remove schemav6Adapter, this logic will be correct
      const definitionUri = protocolData.labware.find(
        item => item.id === labwareId
      ).definitionUri
      const displayName = getLabwareDisplayName(
        protocolData.labwareDefinitions[definitionUri]
      )
      const vectorPromise = offsetDataByLabwareId.then(result => ({
        ...result[labwareId],
      }))
      return labwareOffsets.then(labwareOffsets =>
        vectorPromise.then(vector => {
          const existingOffsetVector = getCurrentOffsetForLabwareInLocation(
            existingLabwareOffsets,
            labwareDefinitionUri,
            labwareOffsetLocation
          )

          return [
            ...labwareOffsets,
            {
              labwareId,
              labwareOffsetLocation,
              labwareDefinitionUri,
              displayLocation,
              displayName,
              vector:
                existingOffsetVector != null
                  ? getVectorSum(existingOffsetVector.vector, vector)
                  : vector,
            },
          ]
        })
      )
    },
    Promise.resolve([])
  )
}
