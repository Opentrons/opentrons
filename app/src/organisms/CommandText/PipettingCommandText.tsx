import { useTranslation } from 'react-i18next'
import { getLoadedLabware } from './utils/accessors'
import { getLabwareName, getLabwareDisplayLocation } from './utils'
import type {
  CompletedProtocolAnalysis,
  AspirateRunTimeCommand,
  DispenseRunTimeCommand,
  BlowoutRunTimeCommand,
  MoveToWellRunTimeCommand,
  DropTipRunTimeCommand,
  PickUpTipRunTimeCommand,
} from '@opentrons/shared-data'

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
}

export const PipettingCommandText = ({
  command,
  robotSideAnalysis,
}: PipettingCommandTextProps): JSX.Element | null => {
  const { t } = useTranslation('protocol_command_text')

  const { labwareId, wellName } = command.params
  const labwareLocation = getLoadedLabware(robotSideAnalysis, labwareId)
    ?.location

  const displayLocation =
    labwareLocation != null
      ? getLabwareDisplayLocation(robotSideAnalysis, labwareLocation, t)
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
      const { volume, flowRate } = command.params
      return t('dispense', {
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
      const labwareDisplayName = getLabwareName(robotSideAnalysis, labwareId)

      return labwareDisplayName === 'Fixed Trash'
        ? t('drop_tip', {
            well_name: wellName,
            labware: getLabwareName(robotSideAnalysis, labwareId),
          })
        : t('return_tip', {
            well_name: wellName,
            labware: getLabwareName(robotSideAnalysis, labwareId),
            labware_location: displayLocation,
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
