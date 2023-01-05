// @ts-nocheck
import * as React from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { getModuleDisplayName, getModuleType, getOccludedSlotCountForModule, } from '@opentrons/shared-data'
import { getPipetteNameSpecs, OT2_STANDARD_MODEL } from '@opentrons/shared-data/js'

import { StyledText } from '../../../atoms/text'

import type { RunTimeCommand, CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { PipetteModel, LoadedLabware, LoadedModule, ModuleModel } from '@opentrons/shared-data'
import type { LabwareLocation } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

interface PipettingCommandText {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
}

function getLoadedLabware(analysis: CompletedProtocolAnalysis, labwareId: string): LoadedLabware | undefined {
  // NOTE: old analysis contains a object dictionary of labware entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(analysis.labware) ? analysis.labware.find(l => l.id === labwareId) : analysis.labware[labwareId]
}
function getLoadedPipette(analysis: CompletedProtocolAnalysis, mount: string): LoadedPipette | undefined {
  // NOTE: old analysis contains a object dictionary of pipette entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(analysis.pipettes) ? analysis.pipettes.find(l => l.mount === mount) : analysis.pipettes[mount]
}
function getLoadedModule(analysis: CompletedProtocolAnalysis, moduleId: string): LoadedModule | undefined {
  // NOTE: old analysis contains a object dictionary of module entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(analysis.modules) ? analysis.modules.find(l => l.moduleId === moduleId) : analysis.modules[moduleId]
}

function getDisplayLocation(analysis: CompletedProtocolAnalysis, location: LabwareLocation, t: TFunction){
  if (location === 'offDeck') {
    t('off_deck')
  }
}

export const PipettingCommandText = ({
  command,
  robotSideAnalysis,
}: PipettingCommandText): JSX.Element | null => {
  const { t } = useTranslation('run_details')

  let commandText

  switch (command.commandType) {
    case 'aspirate': {
      const { wellName, labwareId, volume, flowRate } = command.params
      const labwareEntity = labware.find(l => l.id === labwareId)
      const definitionUri = labwareEntity?.definitionUri ?? ''
      const location = labwareEntity?.location
      messageNode = t('aspirate', {
        well_name: wellName,
        labware: definitionUri,
        labware_location: JSON.stringify(location),
        volume: volume,
        flow_rate: flowRate,
      })
      break
    }
    case 'dispense': {
      const { wellName, labwareId, volume, flowRate } = command.params
      const labwareEntity = labware.find(l => l.id === labwareId)
      const definitionUri = labwareEntity?.definitionUri ?? ''
      const location = labwareEntity?.location

      messageNode = t('dispense', {
        well_name: wellName,
        labware: definitionUri,
        labware_location: JSON.stringify(location),
        volume: volume,
        flow_rate: flowRate,
      })

      break
    }
    case 'blowout': {
      const { wellName, labwareId, flowRate } = command.params
      const labwareEntity = labware.find(l => l.id === labwareId)
      const definitionUri = labwareEntity?.definitionUri ?? ''
      const location = labwareEntity?.location

      messageNode = t('blowout', {
        well_name: wellName,
        labware: definitionUri,
        labware_location: JSON.stringify(location),
        flow_rate: flowRate,
      })
      break
    }
    case 'moveToWell': {
      const { wellName, labwareId } = command.params
      const labwareEntity = labware.find(l => l.id === labwareId)
      const definitionUri = labwareEntity?.definitionUri ?? ''
      const location = labwareEntity?.location

      messageNode = t('move_to_well', {
        well_name: wellName,
        labware: definitionUri,
        labware_location: JSON.stringify(location),
      })
      break
    }
    case 'dropTip': {
      const { wellName, labwareId } = command.params
      const labwareEntity = labware.find(l => l.id === labwareId)
      const definitionUri = labwareEntity?.definitionUri ?? ''
      const location = labwareEntity?.location
      messageNode = t('drop_tip', {
        well_name: wellName,
        labware: definitionUri,
        labware_location: JSON.stringify(location),
      })
      break
    }
    case 'pickUpTip': {
      const { wellName, labwareId } = command.params
      const labwareEntity = labware.find(l => l.id === labwareId)
      const definitionUri = labwareEntity?.definitionUri ?? ''
      const location = labwareEntity?.location
      messageNode = t('pickup_tip', {
        well_name: wellName,
        labware: definitionUri,
        labware_location: JSON.stringify(location),
      })
      break
    }
  }

  return (
    <StyledText as="p">{commandText}</StyledText>
  )
}
