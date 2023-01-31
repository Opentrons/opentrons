// @ts-nocheck
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'

import type {
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  TemperatureModuleAwaitTemperatureCreateCommand,
  TemperatureModuleSetTargetTemperatureCreateCommand,
  ThermocyclerSetTargetBlockTemperatureCreateCommand,
  ThermocyclerSetTargetLidTemperatureCreateCommand,
  HeaterShakerSetTargetTemperatureCreateCommand
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface TemperatureCommandTextProps { command: RunTimeCommand }

type TemperatureCreateCommand =
  | TemperatureModuleSetTargetTemperatureCreateCommand
  | TemperatureModuleAwaitTemperatureCreateCommand
  | ThermocyclerSetTargetBlockTemperatureCreateCommand
  | ThermocyclerSetTargetLidTemperatureCreateCommand
  | HeaterShakerSetTargetTemperatureCreateCommand

const T_KEYS_BY_COMMAND_TYPE: { [commandType: TemperatureCreateCommand]: string } = {
  'temperatureModule/setTargetTemperature': 'setting_temperature_module_temp',
  'temperatureModule/waitForTemperature': 'waiting_to_reach_temp_module',
  'thermocycler/setTargetBlockTemperature': 'setting_thermocycler_block_temp',
  'thermocycler/setTargetLidTemperature': 'setting_thermocycler_lid_temp',
  'heaterShaker/setTargetTemperature': 'setting_hs_temp',
}

export const TemperatureCommandText = ({ command }: TemperatureCommandTextProps): JSX.Element | null => {
  const { t } = useTranslation('run_details')

  return (
    <StyledText as="p">
      {t(T_KEYS_BY_COMMAND_TYPE[commandType], { temp: command.params.celsius })}
    </StyledText>
  )
}
