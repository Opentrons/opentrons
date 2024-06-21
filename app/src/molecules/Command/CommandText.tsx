import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  RESPONSIVENESS,
} from '@opentrons/components'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import {
  getAddressableAreaDisplayName,
  getLabwareName,
  getLabwareDisplayLocation,
  getFinalLabwareLocation,
} from './utils'
import { LoadCommandText } from './LoadCommandText'
import { PipettingCommandText } from './PipettingCommandText'
import { TemperatureCommandText } from './TemperatureCommandText'
import { MoveLabwareCommandText } from './MoveLabwareCommandText'

import type { RobotType, RunTimeCommand } from '@opentrons/shared-data'
import type { StyleProps } from '@opentrons/components'
import type { CommandTextData } from './types'
import type { TFunction } from 'i18next'

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
  commandTextData: CommandTextData
  robotType: RobotType
  as?: React.ComponentProps<typeof LegacyStyledText>['as']
  isOnDevice?: boolean
  propagateCenter?: boolean
  propagateTextLimit?: boolean
}
export function CommandText(props: Props): JSX.Element | null {
  const {
    command,
    commandTextData,
    robotType,
    propagateCenter = false,
    propagateTextLimit = false,
    as = 'p',
    ...styleProps
  } = props
  const { t } = useTranslation('protocol_command_text')
  const shouldPropagateCenter = props.isOnDevice === true || propagateCenter
  const shouldPropagateTextLimit =
    props.isOnDevice === true || propagateTextLimit

  switch (command.commandType) {
    case 'aspirate':
    case 'aspirateInPlace':
    case 'dispense':
    case 'dispenseInPlace':
    case 'blowout':
    case 'blowOutInPlace':
    case 'dropTip':
    case 'dropTipInPlace':
    case 'pickUpTip': {
      return (
        <LegacyStyledText as={as} {...styleProps}>
          <PipettingCommandText {...{ command, commandTextData, robotType }} />
        </LegacyStyledText>
      )
    }
    case 'loadLabware':
    case 'loadPipette':
    case 'loadModule':
    case 'loadLiquid': {
      return (
        <LegacyStyledText as={as} {...styleProps}>
          <LoadCommandText {...{ command, commandTextData, robotType }} />
        </LegacyStyledText>
      )
    }
    case 'temperatureModule/setTargetTemperature':
    case 'temperatureModule/waitForTemperature':
    case 'thermocycler/setTargetBlockTemperature':
    case 'thermocycler/setTargetLidTemperature':
    case 'heaterShaker/setTargetTemperature': {
      return (
        <LegacyStyledText as={as} {...styleProps}>
          <TemperatureCommandText command={command} />
        </LegacyStyledText>
      )
    }
    case 'thermocycler/runProfile': {
      const { profile } = command.params
      const steps = profile.map(
        ({ holdSeconds, celsius }: { holdSeconds: number; celsius: number }) =>
          t('tc_run_profile_steps', {
            celsius,
            seconds: holdSeconds,
          }).trim()
      )
      return (
        // TODO(sfoster): Command sometimes wraps this in a cascaded display: -webkit-box
        // to achieve multiline text clipping with an automatically inserted ellipsis, which works
        // everywhere except for here where it overrides this property in the flex since this is
        // the only place where CommandText uses a flex.
        // The right way to handle this is probably to take the css that's in Command and make it
        // live here instead, but that should be done in a followup since it would touch everything.
        // See also the margin-left on the <li>s, which is needed to prevent their bullets from
        // clipping if a container set overflow: hidden.
        <Flex
          flexDirection={DIRECTION_COLUMN}
          {...styleProps}
          alignItems={shouldPropagateCenter ? ALIGN_CENTER : undefined}
          css={`
            @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
              display: flex !important;
            } ;
          `}
        >
          <LegacyStyledText
            as={as}
            marginBottom={SPACING.spacing4}
            {...styleProps}
          >
            {t('tc_starting_profile', {
              repetitions: Object.keys(steps).length,
            })}
          </LegacyStyledText>
          <LegacyStyledText as={as} marginLeft={SPACING.spacing16}>
            <ul>
              {shouldPropagateTextLimit ? (
                <li
                  css={`
                    margin-left: ${SPACING.spacing4};
                  `}
                >
                  {steps[0]}
                </li>
              ) : (
                steps.map((step: string, index: number) => (
                  <li
                    css={`
                      margin-left: ${SPACING.spacing4};
                    `}
                    key={index}
                  >
                    {' '}
                    {step}
                  </li>
                ))
              )}
            </ul>
          </LegacyStyledText>
        </Flex>
      )
    }
    case 'heaterShaker/setAndWaitForShakeSpeed': {
      const { rpm } = command.params
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('set_and_await_hs_shake', { rpm })}
        </LegacyStyledText>
      )
    }
    case 'moveToSlot': {
      const { slotName } = command.params
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('move_to_slot', { slot_name: slotName })}
        </LegacyStyledText>
      )
    }
    case 'moveRelative': {
      const { axis, distance } = command.params
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('move_relative', { axis, distance })}
        </LegacyStyledText>
      )
    }
    case 'moveToCoordinates': {
      const { coordinates } = command.params
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('move_to_coordinates', coordinates)}
        </LegacyStyledText>
      )
    }
    case 'moveToWell': {
      const { wellName, labwareId } = command.params
      const allPreviousCommands = commandTextData.commands.slice(
        0,
        commandTextData.commands.findIndex(c => c.id === command.id)
      )
      const labwareLocation = getFinalLabwareLocation(
        labwareId,
        allPreviousCommands
      )
      const displayLocation =
        labwareLocation != null
          ? getLabwareDisplayLocation(
              commandTextData,
              labwareLocation,
              t as TFunction,
              robotType
            )
          : ''
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('move_to_well', {
            well_name: wellName,
            labware: getLabwareName(commandTextData, labwareId),
            labware_location: displayLocation,
          })}
        </LegacyStyledText>
      )
    }
    case 'moveLabware': {
      return (
        <LegacyStyledText as={as} {...styleProps}>
          <MoveLabwareCommandText
            {...{ command, commandTextData, robotType }}
          />
        </LegacyStyledText>
      )
    }
    case 'configureForVolume': {
      const { volume, pipetteId } = command.params
      const pipetteName = commandTextData.pipettes.find(
        pip => pip.id === pipetteId
      )?.pipetteName

      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('configure_for_volume', {
            volume,
            pipette:
              pipetteName != null
                ? getPipetteNameSpecs(pipetteName)?.displayName
                : '',
          })}
        </LegacyStyledText>
      )
    }
    case 'configureNozzleLayout': {
      const { configurationParams, pipetteId } = command.params
      const pipetteName = commandTextData.pipettes.find(
        pip => pip.id === pipetteId
      )?.pipetteName

      // TODO (sb, 11/9/23): Add support for other configurations when needed
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('configure_nozzle_layout', {
            amount: configurationParams.style === 'COLUMN' ? '8' : 'all',
            pipette:
              pipetteName != null
                ? getPipetteNameSpecs(pipetteName)?.displayName
                : '',
          })}
        </LegacyStyledText>
      )
    }
    case 'prepareToAspirate': {
      const { pipetteId } = command.params
      const pipetteName = commandTextData.pipettes.find(
        pip => pip.id === pipetteId
      )?.pipetteName

      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('prepare_to_aspirate', {
            pipette:
              pipetteName != null
                ? getPipetteNameSpecs(pipetteName)?.displayName
                : '',
          })}
        </LegacyStyledText>
      )
    }
    case 'moveToAddressableArea': {
      const addressableAreaDisplayName = getAddressableAreaDisplayName(
        commandTextData,
        command.id,
        t as TFunction
      )

      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('move_to_addressable_area', {
            addressable_area: addressableAreaDisplayName,
          })}
        </LegacyStyledText>
      )
    }
    case 'moveToAddressableAreaForDropTip': {
      const addressableAreaDisplayName = getAddressableAreaDisplayName(
        commandTextData,
        command.id,
        t as TFunction
      )
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('move_to_addressable_area_drop_tip', {
            addressable_area: addressableAreaDisplayName,
          })}
        </LegacyStyledText>
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
        <LegacyStyledText as={as} {...styleProps}>
          {simpleTKey != null ? t(simpleTKey) : null}
        </LegacyStyledText>
      )
    }
    case 'waitForDuration': {
      const { seconds, message } = command.params
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {t('wait_for_duration', { seconds, message })}
        </LegacyStyledText>
      )
    }
    case 'pause': // legacy pause command
    case 'waitForResume': {
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {command.params?.message != null && command.params.message !== ''
            ? command.params.message
            : t('wait_for_resume')}
        </LegacyStyledText>
      )
    }
    case 'delay': {
      // legacy delay command
      const { message = '' } = command.params
      if ('waitForResume' in command.params) {
        return (
          <LegacyStyledText as={as} {...styleProps}>
            {command.params?.message != null && command.params.message !== ''
              ? command.params.message
              : t('wait_for_resume')}
          </LegacyStyledText>
        )
      } else {
        return (
          <LegacyStyledText as={as} {...styleProps}>
            {t('wait_for_duration', {
              seconds: command.params.seconds,
              message,
            })}
          </LegacyStyledText>
        )
      }
    }
    case 'comment': {
      const { message } = command.params
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {message}
        </LegacyStyledText>
      )
    }
    case 'custom': {
      const { legacyCommandText } = command.params ?? {}
      const sanitizedCommandText =
        typeof legacyCommandText === 'object'
          ? JSON.stringify(legacyCommandText)
          : String(legacyCommandText)
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {legacyCommandText != null
            ? sanitizedCommandText
            : `${command.commandType}: ${JSON.stringify(command.params)}`}
        </LegacyStyledText>
      )
    }
    default: {
      console.warn(
        'CommandText encountered a command with an unrecognized commandType: ',
        command
      )
      return (
        <LegacyStyledText as={as} {...styleProps}>
          {JSON.stringify(command)}
        </LegacyStyledText>
      )
    }
  }
}
