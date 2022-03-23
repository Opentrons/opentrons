import reduce from 'lodash/reduce'
import { useTranslation, TFunction } from 'react-i18next'
import {
  getModuleDisplayName,
  getLabwareDisplayName,
  getModuleType,
  ProtocolAnalysisFile,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import { getLabwareOffsetLocation } from '../../utils/getLabwareOffsetLocation'
import { getModuleInitialLoadInfo } from '../../utils/getModuleInitialLoadInfo'
import { getLabwareDefinitionUri } from '../../utils/getLabwareDefinitionUri'
import { useOffsetDataByLabwareId } from '../../../ProtocolUpload/hooks/useOffsetData'
import type { LabwareOffsetLocation, VectorOffset } from '@opentrons/api-client'
import type { SavePositionCommandData } from '../types'

const getDisplayLocation = (
  labwareId: string,
  protocolData: ProtocolAnalysisFile,
  t: TFunction<'labware_position_check'>
): string => {
  let location = ''
  const labwareLocation = getLabwareLocation(labwareId, protocolData.commands)
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
  protocolData: ProtocolAnalysisFile
): Promise<LabwareOffsets> => {
  const offsetDataByLabwareId = useOffsetDataByLabwareId(
    savePositionCommandData
  )
  const { t } = useTranslation('labware_position_check')
  return reduce<SavePositionCommandData, Promise<LabwareOffsets>>(
    savePositionCommandData,
    (labwareOffsets, _commandIds, labwareId) => {
      const displayLocation = getDisplayLocation(labwareId, protocolData, t)
      const labwareOffsetLocation = getLabwareOffsetLocation(
        labwareId,
        protocolData.commands,
        protocolData.modules
      )
      const labwareDefinitionUri = getLabwareDefinitionUri(
        labwareId,
        protocolData.labware,
        protocolData.labwareDefinitions
      )
      const { definitionId } = protocolData.labware[labwareId]
      const displayName = getLabwareDisplayName(
        protocolData.labwareDefinitions[definitionId]
      )
      const vectorPromise = offsetDataByLabwareId.then(result => ({
        ...result[labwareId],
      }))
      return labwareOffsets.then(labwareOffsets =>
        vectorPromise.then(vector => [
          ...labwareOffsets,
          {
            labwareId,
            labwareOffsetLocation,
            labwareDefinitionUri,
            displayLocation,
            displayName,
            vector,
          },
        ])
      )
    },
    Promise.resolve([])
  )
}
