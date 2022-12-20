import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
  COLORS,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { LoadCommandItem } from './LoadCommandItem'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data/js'

interface RunLogProps {
  runId: string
}

export function AnalyzedSteps({ runId }: RunLogProps): JSX.Element | null {
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)

  if (robotSideAnalysis == null) return null

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="30rem"
      width="100%"
      overflowY="scroll"
      gridGap={SPACING.spacing3}
      padding={SPACING.spacing4}
    >
      {robotSideAnalysis.commands.map((command, index) => (
        <StepItem
          key={command.id}
          command={command}
          robotSideAnalysis={robotSideAnalysis}
          stepNumber={index + 1}
        />
      ))}
    </Flex>
  )
}

interface Props {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
}
export function StepText(props: Props): JSX.Element | null {
  const { command, robotSideAnalysis } = props
  const { t } = useTranslation('commands_run_log')

  let messageNode = null

  const { labware } = robotSideAnalysis

  switch (command.commandType) {
    case 'delay': {
      messageNode = (
        <>
          <Flex
            textTransform={TYPOGRAPHY.textTransformUppercase}
            padding={SPACING.spacing2}
            id="RunDetails_CommandList"
          >
            {t('comment')}
          </Flex>
          {command != null ? command.result : null}
        </>
      )
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
    case 'pause':
    case 'waitForResume': {
      messageNode = command.params?.message ?? t('wait_for_resume')
      break
    }
    case 'loadLabware':
    case 'loadPipette':
    case 'loadModule':
    case 'loadLiquid': {
      messageNode = <LoadCommandItem command={command} robotSideAnalysis={robotSideAnalysis} />
      break
    }
    case 'magneticModule/engage': {
      messageNode = t('engaging_magnetic_module')
      break
    }
    case 'magneticModule/disengage': {
      messageNode = t('disengaging_magnetic_module')
      break
    }
    case 'temperatureModule/setTargetTemperature': {
      const { celsius } = command.params
      messageNode = t('setting_temperature_module_temp', { temp: celsius })
      break
    }
    case 'temperatureModule/deactivate': {
      messageNode = t('deactivate_temperature_module')
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
    case 'thermocycler/waitForBlockTemperature': {
      messageNode = t('waiting_for_tc_block_to_reach')
      break
    }
    case 'thermocycler/waitForLidTemperature': {
      messageNode = t('waiting_for_tc_lid_to_reach')
      break
    }
    case 'thermocycler/openLid': {
      messageNode = t('opening_tc_lid')
      break
    }
    case 'thermocycler/closeLid': {
      messageNode = t('closing_tc_lid')
      break
    }
    case 'thermocycler/deactivateBlock': {
      messageNode = t('deactivating_tc_block')
      break
    }
    case 'thermocycler/deactivateLid': {
      messageNode = t('deactivating_tc_lid')
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
    case 'thermocycler/awaitProfileComplete': {
      messageNode = t('tc_awaiting_for_duration')
      break
    }
    case 'heaterShaker/setTargetTemperature': {
      const { celsius } = command.params
      messageNode = t('setting_hs_temp', { temp: celsius })
      break
    }
    case 'heaterShaker/waitForTemperature': {
      messageNode = t('waiting_for_hs_to_reach')
      break
    }
    case 'heaterShaker/setAndWaitForShakeSpeed': {
      const { rpm } = command.params
      messageNode = t('set_and_await_hs_shake', { rpm: rpm })
      break
    }
    case 'heaterShaker/deactivateHeater': {
      messageNode = t('deactivating_hs_heater')
      break
    }
    case 'heaterShaker/openLabwareLatch': {
      messageNode = t('unlatching_hs_latch')
      break
    }
    case 'heaterShaker/closeLabwareLatch': {
      messageNode = t('latching_hs_latch')
      break
    }
    case 'heaterShaker/deactivateShaker': {
      messageNode = t('deactivate_hs_shake')
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
    case 'touchTip': {
      messageNode = t('touch_tip')
      break
    }
    case 'moveToSlot': {
      const { slotName } = command.params
      messageNode = t('move_to_slot', {
        slot_name: slotName,
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
    case 'home': {
      messageNode = t('home_gantry')
      break
    }
    case 'savePosition': {
      messageNode = t('save_position')
      break
    }
    case 'custom': {
      const { legacyCommandText } = command.params ?? {}
      const sanitizedCommandText =
        typeof legacyCommandText === 'object'
          ? JSON.stringify(legacyCommandText)
          : String(legacyCommandText)
      messageNode =
        legacyCommandText != null
          ? sanitizedCommandText
          : command.commandType
      break
    }
    default: {
      messageNode = JSON.stringify(command)
      break
    }
  }

  return <Flex alignItems={ALIGN_CENTER}>{messageNode}</Flex>
}

export interface StepItemProps {
  command: RunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
  stepNumber: number
}

export function StepItem(props: StepItemProps): JSX.Element | null {
  const { command, stepNumber, robotSideAnalysis } = props

  return (
    <Flex alignItems={ALIGN_CENTER} minHeight="3rem" gridGap={SPACING.spacing3}>
      <StyledText fontSize={TYPOGRAPHY.fontSizeCaption}>
        {stepNumber}
      </StyledText>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing2}
        width="100%"
        border='none'
        backgroundColor={COLORS.fundamentalsBackground}
        color={COLORS.darkBlackEnabled}
        borderRadius={BORDERS.radiusSoftCorners}
        padding={SPACING.spacing3}
      >
        <StepText command={command} robotSideAnalysis={robotSideAnalysis} />
      </Flex>
    </Flex>
  )
}
