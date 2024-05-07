import { useTranslation } from 'react-i18next'

import { getLabwareDefURI, RobotType } from '@opentrons/shared-data'

import { getLabwareDefinitionsFromCommands } from '../LabwarePositionCheck/utils/labware'
import { getLoadedLabware } from './utils/accessors'
import {
  getLabwareName,
  getLabwareDisplayLocation,
  getFinalLabwareLocation,
  getWellRange,
} from './utils'
import type {
  PipetteName,
  PipettingRunTimeCommand,
} from '@opentrons/shared-data'
import type { CommandTextData } from './types'

interface PipettingCommandTextProps {
  command: PipettingRunTimeCommand
  protocolData: CommandTextData
  robotType: RobotType
}

export const PipettingCommandText = ({
  command,
  protocolData,
  robotType,
}: PipettingCommandTextProps): JSX.Element | null => {
  const { t } = useTranslation('protocol_command_text')

  const labwareId =
    'labwareId' in command.params ? command.params.labwareId : ''
  const wellName = 'wellName' in command.params ? command.params.wellName : ''

  const allPreviousCommands = protocolData.commands.slice(
    0,
    protocolData.commands.findIndex(c => c.id === command.id)
  )
  const labwareLocation = getFinalLabwareLocation(
    labwareId,
    allPreviousCommands
  )
  const displayLocation =
    labwareLocation != null
      ? getLabwareDisplayLocation(protocolData, labwareLocation, t, robotType)
      : ''
  switch (command.commandType) {
    case 'aspirate': {
      const { volume, flowRate } = command.params
      return t('aspirate', {
        well_name: wellName,
        labware: getLabwareName(protocolData, labwareId),
        labware_location: displayLocation,
        volume: volume,
        flow_rate: flowRate,
      })
    }
    case 'dispense': {
      const { volume, flowRate, pushOut } = command.params
      return pushOut
        ? t('dispense_push_out', {
            well_name: wellName,
            labware: getLabwareName(protocolData, labwareId),
            labware_location: displayLocation,
            volume: volume,
            flow_rate: flowRate,
            push_out_volume: pushOut,
          })
        : t('dispense', {
            well_name: wellName,
            labware: getLabwareName(protocolData, labwareId),
            labware_location: displayLocation,
            volume: volume,
            flow_rate: flowRate,
          })
    }
    case 'blowout': {
      const { flowRate } = command.params
      return t('blowout', {
        well_name: wellName,
        labware: getLabwareName(protocolData, labwareId),
        labware_location: displayLocation,
        flow_rate: flowRate,
      })
    }
    case 'dropTip': {
      const loadedLabware = getLoadedLabware(protocolData, labwareId)
      const labwareDefinitions = getLabwareDefinitionsFromCommands(
        protocolData.commands
      )
      const labwareDef = labwareDefinitions.find(
        lw => getLabwareDefURI(lw) === loadedLabware?.definitionUri
      )
      return labwareDef?.parameters.isTiprack
        ? t('return_tip', {
            well_name: wellName,
            labware: getLabwareName(protocolData, labwareId),
            labware_location: displayLocation,
          })
        : t('drop_tip', {
            well_name: wellName,
            labware: getLabwareName(protocolData, labwareId),
          })
    }
    case 'pickUpTip': {
      const pipetteId = command.params.pipetteId
      const pipetteName: PipetteName | undefined = protocolData.pipettes.find(
        pip => pip.id === pipetteId
      )?.pipetteName

      return t('pickup_tip', {
        well_range: getWellRange(
          pipetteId,
          allPreviousCommands,
          wellName,
          pipetteName
        ),
        labware: getLabwareName(protocolData, labwareId),
        labware_location: displayLocation,
      })
    }
    case 'dropTipInPlace': {
      return t('drop_tip_in_place')
    }
    case 'dispenseInPlace': {
      const { volume, flowRate } = command.params
      return t('dispense_in_place', { volume: volume, flow_rate: flowRate })
    }
    case 'blowOutInPlace': {
      const { flowRate } = command.params
      return t('blowout_in_place', { flow_rate: flowRate })
    }
    case 'aspirateInPlace': {
      const { flowRate, volume } = command.params
      return t('aspirate_in_place', { volume, flow_rate: flowRate })
    }
    default: {
      console.warn(
        'PipettingCommandText encountered a command with an unrecognized commandType: ',
        command
      )
      return null
    }
  }
}
