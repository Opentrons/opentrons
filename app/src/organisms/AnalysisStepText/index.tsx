import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { LoadCommandText } from './LoadCommandText'
import { PipettingCommandText } from './PipettingCommandText'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data/js'

const SIMPLE_T_KEY_BY_COMMAND_TYPE: {
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

interface Props {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
}
export function AnalysisStepText(props: Props): JSX.Element | null {
  const { command, robotSideAnalysis } = props
  const { t } = useTranslation('protocol_command_text')

  let messageNode = null

  switch (command.commandType) {
    case 'delay': {
      messageNode = (
        <>
          <Flex
            textTransform={TYPOGRAPHY.textTransformUppercase}
            padding={SPACING.spacing2}
          >
            {t('comment')}
          </Flex>
          {command != null ? command.result : null}
        </>
      )
      break
    }
    case 'pause':
    case 'waitForResume': {
      messageNode =
        command.params?.message && command.params.message !== ''
          ? command.params.message
          : t('wait_for_resume')
      break
    }
    case 'aspirate':
    case 'dispense':
    case 'blowout':
    case 'moveToWell':
    case 'dropTip':
    case 'pickUpTip': {
      messageNode = (
        <PipettingCommandText
          command={command}
          robotSideAnalysis={robotSideAnalysis}
        />
      )
      break
    }
    case 'loadLabware':
    case 'loadPipette':
    case 'loadModule':
    case 'loadLiquid': {
      messageNode = (
        <LoadCommandText
          command={command}
          robotSideAnalysis={robotSideAnalysis}
        />
      )
      break
    }
    case 'temperatureModule/setTargetTemperature': {
      const { celsius } = command.params
      messageNode = t('setting_temperature_module_temp', { temp: celsius })
      break
    }
    case 'temperatureModule/waitForTemperature': {
      const { celsius } = command.params
      messageNode = t('waiting_to_reach_temp_module', { temp: celsius })
      break
    }
    case 'thermocycler/setTargetBlockTemperature': {
      const { celsius } = command.params
      messageNode = t('setting_thermocycler_block_temp', { temp: celsius })
      break
    }
    case 'thermocycler/setTargetLidTemperature': {
      const { celsius } = command.params
      messageNode = t('setting_thermocycler_lid_temp', { temp: celsius })
      break
    }
    case 'thermocycler/runProfile': {
      const { profile } = command.params
      const steps = profile.map(
        ({ holdSeconds, celsius }: { holdSeconds: number; celsius: number }) =>
          t('tc_run_profile_steps', { celsius: celsius, seconds: holdSeconds })
      )
      messageNode = (
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText marginBottom={SPACING.spacing2}>
            {t('tc_starting_profile', {
              repetitions: Object.keys(steps).length,
            })}
          </StyledText>
          <Flex marginLeft={SPACING.spacing4}>
            <ul>
              {steps.map((step: string, index: number) => (
                <li key={index}> {step}</li>
              ))}
            </ul>
          </Flex>
        </Flex>
      )
      break
    }
    case 'heaterShaker/setTargetTemperature': {
      const { celsius } = command.params
      messageNode = t('setting_hs_temp', { temp: celsius })
      break
    }
    case 'heaterShaker/setAndWaitForShakeSpeed': {
      const { rpm } = command.params
      messageNode = t('set_and_await_hs_shake', { rpm: rpm })
      break
    }
    case 'waitForDuration': {
      const { seconds, message } = command.params
      messageNode = t('wait_for_duration', {
        seconds: seconds,
        message: message,
      })
      break
    }
    case 'moveToSlot': {
      const { slotName } = command.params
      messageNode = t('move_to_slot', {
        slot_name: slotName,
      })
      break
    }
    case 'moveRelative': {
      const { axis, distance } = command.params
      messageNode = t('move_relative', {
        axis: axis,
        distance: distance,
      })
      break
    }
    case 'moveToCoordinates': {
      const { coordinates } = command.params
      messageNode = t('move_to_coordinates', {
        x: coordinates.x,
        y: coordinates.y,
        z: coordinates.z,
      })
      break
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
      const simpleTKey = SIMPLE_T_KEY_BY_COMMAND_TYPE[command.commandType]
      messageNode = simpleTKey != null ? t(simpleTKey) : null
      break
    }
    case 'custom': {
      const { legacyCommandText } = command.params ?? {}
      const sanitizedCommandText =
        typeof legacyCommandText === 'object'
          ? JSON.stringify(legacyCommandText)
          : String(legacyCommandText)
      messageNode =
        legacyCommandText != null ? sanitizedCommandText : command.commandType
      break
    }
    default: {
      console.warn(
        'Step Text encountered a command with an unrecognized commandType: ',
        command
      )
      messageNode = JSON.stringify(command)
      break
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER}>
      <StyledText as="p">{messageNode}</StyledText>
    </Flex>
  )
}
