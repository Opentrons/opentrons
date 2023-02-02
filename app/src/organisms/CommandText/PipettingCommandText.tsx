import { useTranslation } from 'react-i18next'
import { getLabwareName } from './utils'
import { LabwareDisplayLocation } from './LabwareDisplayLocation'

import type {
  RunTimeCommand,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'

interface PipettingCommandTextProps {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
}

export const PipettingCommandText = ({
  command,
  robotSideAnalysis,
}: PipettingCommandTextProps): JSX.Element | null => {
  const { t } = useTranslation('protocol_command_text')

  switch (command.commandType) {
    case 'aspirate': {
      const { wellName, labwareId, volume, flowRate } = command.params
      return t('aspirate', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: (
          <LabwareDisplayLocation
            {...{ robotSideAnalysis, labwareId }}
          />
        ),
        volume: volume,
        flow_rate: flowRate,
      })
    }
    case 'dispense': {
      const { wellName, labwareId, volume, flowRate } = command.params
      return t('dispense', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: (
          <LabwareDisplayLocation
            {...{ robotSideAnalysis, labwareId }}
          />
        ),
        volume: volume,
        flow_rate: flowRate,
      })
    }
    case 'blowout': {
      const { wellName, labwareId, flowRate } = command.params
      return t('blowout', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: (
          <LabwareDisplayLocation
            {...{ robotSideAnalysis, labwareId }}
          />
        ),
        flow_rate: flowRate,
      })
    }
    case 'moveToWell': {
      const { wellName, labwareId } = command.params

      return t('move_to_well', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: (
          <LabwareDisplayLocation
            {...{ robotSideAnalysis, labwareId }}
          />
        ),
      })
    }
    case 'dropTip': {
      const { wellName, labwareId } = command.params

      return t('drop_tip', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: (
          <LabwareDisplayLocation
            {...{ robotSideAnalysis, labwareId }}
          />
        ),
      })
    }
    case 'pickUpTip': {
      const { wellName, labwareId } = command.params
      return t('pickup_tip', {
        well_name: wellName,
        labware: getLabwareName(robotSideAnalysis, labwareId),
        labware_location: (
          <LabwareDisplayLocation
            {...{ robotSideAnalysis, labwareId }}
          />
        ),
      })
    }
    default: {
      console.warn(
        'PipettingCommandText encountered a command with an unrecognized commandType: ',
        command
      )
      return <span>{command.commandType}</span>
    }
  }
}
