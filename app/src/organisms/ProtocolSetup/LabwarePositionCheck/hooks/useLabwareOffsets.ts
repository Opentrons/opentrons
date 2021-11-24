import reduce from 'lodash/reduce'
import { useTranslation, TFunction } from 'react-i18next'
import {
  getModuleDisplayName,
  getModuleType,
  ProtocolFile,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import { getModuleLocation } from '../../utils/getModuleLocation'
import { getLabwareDefinitionUri } from '../../utils/getLabwareDefinitionUri'
import { useOffsetDataByLabwareId } from '../../../ProtocolUpload/hooks/useOffsetData'
import type { VectorOffset } from '@opentrons/api-client'
import type { SavePositionCommandData } from '../types'
import type { LabwareLocation } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

const getDisplayLocation = (
  labwareId: string,
  protocolData: ProtocolFile<{}>,
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
        slot: getModuleLocation(
          labwareLocation.moduleId,
          protocolData.commands
        ),
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
  labwareLocation: LabwareLocation
  labwareDefinitionUri: string
  displayLocation: string
  displayName: string
  offsetData: VectorOffset
}>

export const useLabwareOffsets = (
  savePositionCommandData: SavePositionCommandData,
  protocolData: ProtocolFile<{}>
): Promise<LabwareOffsets> => {
  const offsetDataByLabwareId = useOffsetDataByLabwareId(
    savePositionCommandData
  )
  const { t } = useTranslation('labware_position_check')
  return reduce<SavePositionCommandData, Promise<LabwareOffsets>>(
    savePositionCommandData,
    (labwareOffsets, _commandIds, labwareId) => {
      const displayLocation = getDisplayLocation(labwareId, protocolData, t)
      const labwareLocation = getLabwareLocation(
        labwareId,
        protocolData.commands
      )
      const labwareDefinitionUri = getLabwareDefinitionUri(
        labwareId,
        protocolData.labware
      )
      const displayName = protocolData.labware[labwareId].displayName ?? ''
      const offsetData = offsetDataByLabwareId.then(result => ({
        ...result[labwareId],
      }))
      return labwareOffsets.then(labwareOffsets =>
        offsetData.then(offsetData => [
          ...labwareOffsets,
          {
            labwareId,
            labwareLocation,
            labwareDefinitionUri,
            displayLocation,
            displayName,
            offsetData,
          },
        ])
      )
    },
    Promise.resolve([])
  )
}
