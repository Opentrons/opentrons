// @ts-nocheck
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '../../atoms/text'

import type { RunTimeCommand, CompletedProtocolAnalysis } from '@opentrons/shared-data'
import { getLabwareDisplayLocation, getLabwareName } from './utils'

interface PipettingCommandText {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
}

export const PipettingCommandText = ({
  command,
  robotSideAnalysis,
}: PipettingCommandText): JSX.Element | null => {
  const { t } = useTranslation('protocol_command_text')

  let commandText

  switch (command.commandType) {
    case 'aspirate': {
      const { wellName, labwareId, volume, flowRate } = command.params
      commandText = t('aspirate', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: getLabwareDisplayLocation(robotSideAnalysis, labwareId, t),
        volume: volume,
        flow_rate: flowRate,
      })
      break
    }
    case 'dispense': {
      const { wellName, labwareId, volume, flowRate } = command.params
      commandText = t('dispense', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: getLabwareDisplayLocation(robotSideAnalysis, labwareId, t),
        volume: volume,
        flow_rate: flowRate,
      })

      break
    }
    case 'blowout': {
      const { wellName, labwareId, flowRate } = command.params
      commandText = t('blowout', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: getLabwareDisplayLocation(robotSideAnalysis, labwareId, t),
        flow_rate: flowRate,
      })
      break
    }
    case 'moveToWell': {
      const { wellName, labwareId } = command.params
      const labwareEntity = labware.find(l => l.id === labwareId)
      const definitionUri = labwareEntity?.definitionUri ?? ''
      const location = labwareEntity?.location

      commandText = t('move_to_well', {
        well_name: wellName,
        labware: definitionUri,
        labware_location: JSON.stringify(location),
      })
      break
    }
    case 'dropTip': {
      const { wellName, labwareId } = command.params

      console.log('drop_tip', {
        command: command,
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: getLabwareDisplayLocation(robotSideAnalysis, labwareId, t),
      })
      commandText = t('drop_tip', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: getLabwareDisplayLocation(robotSideAnalysis, labwareId, t),
      })
      break
    }
    case 'pickUpTip': {
      const { wellName, labwareId } = command.params
      commandText = t('pickup_tip', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: getLabwareDisplayLocation(robotSideAnalysis, labwareId, t),
      })
      break
    }
  }

  return (
    <StyledText as="p">{commandText}</StyledText>
  )
}
