import { useTranslation } from 'react-i18next'
import {
  CompletedProtocolAnalysis,
  AspirateRunTimeCommand,
  DispenseRunTimeCommand,
  BlowoutRunTimeCommand,
  MoveToWellRunTimeCommand,
  DropTipRunTimeCommand,
  PickUpTipRunTimeCommand,
  getLabwareDefURI,
  RobotType,
} from '@opentrons/shared-data'
import { getLabwareDefinitionsFromCommands } from '../LabwarePositionCheck/utils/labware'
import { getLoadedLabware } from './utils/accessors'
import {
  getLabwareName,
  getLabwareDisplayLocation,
  getFinalLabwareLocation,
} from './utils'

type PipettingRunTimeCommmand =
  | AspirateRunTimeCommand
  | DispenseRunTimeCommand
  | BlowoutRunTimeCommand
  | MoveToWellRunTimeCommand
  | DropTipRunTimeCommand
  | PickUpTipRunTimeCommand
interface PipettingCommandTextProps {
  command: PipettingRunTimeCommmand
  robotSideAnalysis: CompletedProtocolAnalysis
  robotType: RobotType
}

export const PipettingCommandText = ({
  command,
  robotSideAnalysis,
  robotType
}: PipettingCommandTextProps): JSX.Element | null => {
  const { t } = useTranslation('protocol_command_text')

  const { labwareId, wellName } = command.params
  const allPreviousCommands = robotSideAnalysis.commands.slice(
    0,
    robotSideAnalysis.commands.findIndex(c => c.id === command.id)
  )
  const labwareLocation = getFinalLabwareLocation(
    labwareId,
    allPreviousCommands
  )
  const displayLocation =
    labwareLocation != null
      ? getLabwareDisplayLocation(robotSideAnalysis, labwareLocation, t, robotType)
      : ''
  switch (command.commandType) {
    case 'aspirate': {
      const { volume, flowRate } = command.params
      return t('aspirate', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
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
            labware: getLabwareName(robotSideAnalysis, labwareId),
            labware_location: displayLocation,
            volume: volume,
            flow_rate: flowRate,
            push_out_volume: pushOut,
          })
        : t('dispense', {
            well_name: wellName,
            labware: getLabwareName(robotSideAnalysis, labwareId),
            labware_location: displayLocation,
            volume: volume,
            flow_rate: flowRate,
          })
    }
    case 'blowout': {
      const { flowRate } = command.params
      return t('blowout', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: displayLocation,
        flow_rate: flowRate,
      })
    }
    case 'moveToWell': {
      return t('move_to_well', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: displayLocation,
      })
    }
    case 'dropTip': {
      const loadedLabware = getLoadedLabware(robotSideAnalysis, labwareId)
      const labwareDefinitions = getLabwareDefinitionsFromCommands(
        robotSideAnalysis.commands
      )
      const labwareDef = labwareDefinitions.find(
        lw => getLabwareDefURI(lw) === loadedLabware?.definitionUri
      )
      return labwareDef?.parameters.isTiprack
        ? t('return_tip', {
            well_name: wellName,
            labware: getLabwareName(robotSideAnalysis, labwareId),
            labware_location: displayLocation,
          })
        : t('drop_tip', {
            well_name: wellName,
            labware: getLabwareName(robotSideAnalysis, labwareId),
          })
    }
    case 'pickUpTip': {
      return t('pickup_tip', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: displayLocation,
      })
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
