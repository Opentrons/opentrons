import { useTranslation } from 'react-i18next'
import type {
  TemperatureModuleAwaitTemperatureCreateCommand,
  TemperatureModuleSetTargetTemperatureCreateCommand,
  TCSetTargetBlockTemperatureCreateCommand,
  TCSetTargetLidTemperatureCreateCommand,
  HeaterShakerSetTargetTemperatureCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

type TemperatureCreateCommand =
  | TemperatureModuleSetTargetTemperatureCreateCommand
  | TemperatureModuleAwaitTemperatureCreateCommand
  | TCSetTargetBlockTemperatureCreateCommand
  | TCSetTargetLidTemperatureCreateCommand
  | HeaterShakerSetTargetTemperatureCreateCommand

interface TemperatureCommandTextProps {
  command: TemperatureCreateCommand
}

const T_KEYS_BY_COMMAND_TYPE: {
  [commandType in TemperatureCreateCommand['commandType']]: string
} = {
  'temperatureModule/setTargetTemperature': 'setting_temperature_module_temp',
  'temperatureModule/waitForTemperature': 'waiting_to_reach_temp_module',
  'thermocycler/setTargetBlockTemperature': 'setting_thermocycler_block_temp',
  'thermocycler/setTargetLidTemperature': 'setting_thermocycler_lid_temp',
  'heaterShaker/setTargetTemperature': 'setting_hs_temp',
}

export const TemperatureCommandText = ({
  command,
}: TemperatureCommandTextProps): JSX.Element | null => {
  const { t } = useTranslation('protocol_command_text')

  return t(T_KEYS_BY_COMMAND_TYPE[command.commandType], {
    temp: command.params.celsius,
    hold_time_seconds:
      'holdTimeSeconds' in command.params
        ? command.params.holdTimeSeconds ?? '0'
        : '0',
  })
}
