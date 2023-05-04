import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { LoadCommandText } from './LoadCommandText'
import { PipettingCommandText } from './PipettingCommandText'
import { TemperatureCommandText } from './TemperatureCommandText'
import { MoveLabwareCommandText } from './MoveLabwareCommandText'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data/js'
import type { StyleProps } from '@opentrons/components'

const SIMPLE_TRANSLATION_KEY_BY_COMMAND_TYPE: {
  [commandType in RunTimeCommand['commandType']]?: string
} = {
  home: 'home_gantry',
  savePosition: 'save_position',
  touchTip: 'touch_tip',
  'magneticModule/engage': 'engaging_magnetic_module',
  'magneticModule/disengage': 'disengaging_magnetic_module',
  'temperatureModule/deactivate': 'deactivate_temperature_module',
  'thermocycler/waitForBlockTemperature': 'waiting_for_tc_block_to_reach',
  'thermocycler/waitForLidTemperature': 'waiting_for_tc_lid_to_reach',
  'thermocycler/openLid': 'opening_tc_lid',
  'thermocycler/closeLid': 'closing_tc_lid',
  'thermocycler/deactivateBlock': 'deactivating_tc_block',
  'thermocycler/deactivateLid': 'deactivating_tc_lid',
  'thermocycler/awaitProfileComplete': 'tc_awaiting_for_duration',
  'heaterShaker/deactivateHeater': 'deactivating_hs_heater',
  'heaterShaker/openLabwareLatch': 'unlatching_hs_latch',
  'heaterShaker/closeLabwareLatch': 'latching_hs_latch',
  'heaterShaker/deactivateShaker': 'deactivate_hs_shake',
  'heaterShaker/waitForTemperature': 'waiting_for_hs_to_reach',
}

interface Props extends StyleProps {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
}
export function CommandText(props: Props): JSX.Element | null {
  const { command, robotSideAnalysis, ...styleProps } = props
  const { t } = useTranslation('protocol_command_text')

  switch (command.commandType) {
    case 'aspirate':
    case 'dispense':
    case 'blowout':
    case 'moveToWell':
    case 'dropTip':
    case 'pickUpTip': {
      return (
        <StyledText as="p" {...styleProps}>
          <PipettingCommandText {...{ command, robotSideAnalysis }} />
        </StyledText>
      )
    }
    case 'loadLabware':
    case 'loadPipette':
    case 'loadModule':
    case 'loadLiquid': {
      return (
        <StyledText as="p" {...styleProps}>
          <LoadCommandText {...{ command, robotSideAnalysis }} />
        </StyledText>
      )
    }
    case 'temperatureModule/setTargetTemperature':
    case 'temperatureModule/waitForTemperature':
    case 'thermocycler/setTargetBlockTemperature':
    case 'thermocycler/setTargetLidTemperature':
    case 'heaterShaker/setTargetTemperature': {
      return (
        <StyledText as="p" {...styleProps}>
          <TemperatureCommandText command={command} />
        </StyledText>
      )
    }
    case 'thermocycler/runProfile': {
      const { profile } = command.params
      const steps = profile.map(
        ({ holdSeconds, celsius }: { holdSeconds: number; celsius: number }) =>
          t('tc_run_profile_steps', { celsius: celsius, seconds: holdSeconds })
      )
      return (
        <Flex flexDirection={DIRECTION_COLUMN} {...styleProps}>
          <StyledText marginBottom={SPACING.spacing4} {...styleProps}>
            {t('tc_starting_profile', {
              repetitions: Object.keys(steps).length,
            })}
          </StyledText>
          <Flex marginLeft={SPACING.spacing16}>
            <ul>
              {steps.map((step: string, index: number) => (
                <li key={index}> {step}</li>
              ))}
            </ul>
          </Flex>
        </Flex>
      )
    }
    case 'heaterShaker/setAndWaitForShakeSpeed': {
      const { rpm } = command.params
      return (
        <StyledText as="p" {...styleProps}>
          {t('set_and_await_hs_shake', { rpm })}
        </StyledText>
      )
    }
    case 'moveToSlot': {
      const { slotName } = command.params
      return (
        <StyledText as="p" {...styleProps}>
          {t('move_to_slot', { slot_name: slotName })}
        </StyledText>
      )
    }
    case 'moveRelative': {
      const { axis, distance } = command.params
      return (
        <StyledText as="p" {...styleProps}>
          {t('move_relative', { axis, distance })}
        </StyledText>
      )
    }
    case 'moveToCoordinates': {
      const { coordinates } = command.params
      return (
        <StyledText as="p" {...styleProps}>
          {t('move_to_coordinates', coordinates)}
        </StyledText>
      )
    }
    case 'moveLabware': {
      return (
        <StyledText as="p" {...styleProps}>
          <MoveLabwareCommandText {...{ command, robotSideAnalysis }} />
        </StyledText>
      )
    }
    case 'touchTip':
    case 'home':
    case 'savePosition':
    case 'magneticModule/engage':
    case 'magneticModule/disengage':
    case 'temperatureModule/deactivate':
    case 'thermocycler/waitForBlockTemperature':
    case 'thermocycler/waitForLidTemperature':
    case 'thermocycler/openLid':
    case 'thermocycler/closeLid':
    case 'thermocycler/deactivateBlock':
    case 'thermocycler/deactivateLid':
    case 'thermocycler/awaitProfileComplete':
    case 'heaterShaker/deactivateHeater':
    case 'heaterShaker/openLabwareLatch':
    case 'heaterShaker/closeLabwareLatch':
    case 'heaterShaker/deactivateShaker':
    case 'heaterShaker/waitForTemperature': {
      const simpleTKey =
        SIMPLE_TRANSLATION_KEY_BY_COMMAND_TYPE[command.commandType]
      return (
        <StyledText as="p" {...styleProps}>
          {simpleTKey != null ? t(simpleTKey) : null}
        </StyledText>
      )
    }
    case 'waitForDuration': {
      const { seconds, message } = command.params
      return (
        <StyledText as="p" {...styleProps}>
          {t('wait_for_duration', { seconds, message })}
        </StyledText>
      )
    }
    case 'pause': // legacy pause command
    case 'waitForResume': {
      return (
        <StyledText as="p" {...styleProps}>
          {command.params?.message && command.params.message !== ''
            ? command.params.message
            : t('wait_for_resume')}
        </StyledText>
      )
    }
    case 'delay': {
      // legacy delay command
      const { message = '' } = command.params
      if ('waitForResume' in command.params) {
        return (
          <StyledText as="p" {...styleProps}>
            {command.params?.message && command.params.message !== ''
              ? command.params.message
              : t('wait_for_resume')}
          </StyledText>
        )
      } else {
        return (
          <StyledText as="p" {...styleProps}>
            {t('wait_for_duration', {
              seconds: command.params.seconds,
              message,
            })}
          </StyledText>
        )
      }
    }
    case 'custom': {
      const { legacyCommandText } = command.params ?? {}
      const sanitizedCommandText =
        typeof legacyCommandText === 'object'
          ? JSON.stringify(legacyCommandText)
          : String(legacyCommandText)
      return (
        <StyledText as="p" {...styleProps}>
          {legacyCommandText != null
            ? sanitizedCommandText
            : `${command.commandType}: ${JSON.stringify(command.params)}`}
        </StyledText>
      )
    }
    default: {
      console.warn(
        'CommandText encountered a command with an unrecognized commandType: ',
        command
      )
      return (
        <StyledText as="p" {...styleProps}>
          {JSON.stringify(command)}
        </StyledText>
      )
    }
  }
}
