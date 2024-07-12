import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { pick } from 'lodash'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  StyledText,
  RESPONSIVENESS,
  styleProps,
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

interface LegacySTProps {
  as?: React.ComponentProps<typeof LegacyStyledText>['as']
  modernStyledTextDefaults?: false
}

interface ModernSTProps {
  desktopStyle?: React.ComponentProps<typeof StyledText>['desktopStyle']
  oddStyle?: React.ComponentProps<typeof StyledText>['oddStyle']
  modernStyledTextDefaults: true
}

type STProps = LegacySTProps | ModernSTProps

interface Props extends StyleProps {
  command: RunTimeCommand
  commandTextData: CommandTextData
  robotType: RobotType
  isOnDevice?: boolean
  propagateCenter?: boolean
  propagateTextLimit?: boolean
}
export function CommandText(props: Props & STProps): JSX.Element | null {
  const {
    command,
    commandTextData,
    robotType,
    propagateCenter = false,
    propagateTextLimit = false,
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
        <CommandStyledText {...props}>
          <PipettingCommandText {...{ command, commandTextData, robotType }} />
        </CommandStyledText>
      )
    }
    case 'loadLabware':
    case 'loadPipette':
    case 'loadModule':
    case 'loadLiquid': {
      return (
        <CommandStyledText {...props}>
          <LoadCommandText {...{ command, commandTextData, robotType }} />
        </CommandStyledText>
      )
    }
    case 'temperatureModule/setTargetTemperature':
    case 'temperatureModule/waitForTemperature':
    case 'thermocycler/setTargetBlockTemperature':
    case 'thermocycler/setTargetLidTemperature':
    case 'heaterShaker/setTargetTemperature': {
      return (
        <CommandStyledText {...props}>
          <TemperatureCommandText command={command} />
        </CommandStyledText>
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
          <CommandStyledText
            {...forwardSTProps(props)}
            marginBottom={SPACING.spacing4}
            {...styleProps}
          >
            {t('tc_starting_profile', {
              repetitions: Object.keys(steps).length,
            })}
          </CommandStyledText>
          <CommandStyledText
            {...forwardSTProps(props)}
            marginLeft={SPACING.spacing16}
          >
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
          </CommandStyledText>
        </Flex>
      )
    }
    case 'heaterShaker/setAndWaitForShakeSpeed': {
      const { rpm } = command.params
      return (
        <CommandStyledText {...props}>
          {t('set_and_await_hs_shake', { rpm })}
        </CommandStyledText>
      )
    }
    case 'moveToSlot': {
      const { slotName } = command.params
      return (
        <CommandStyledText {...props}>
          {t('move_to_slot', { slot_name: slotName })}
        </CommandStyledText>
      )
    }
    case 'moveRelative': {
      const { axis, distance } = command.params
      return (
        <CommandStyledText {...props}>
          {t('move_relative', { axis, distance })}
        </CommandStyledText>
      )
    }
    case 'moveToCoordinates': {
      const { coordinates } = command.params
      return (
        <CommandStyledText {...props}>
          {t('move_to_coordinates', coordinates)}
        </CommandStyledText>
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
        <CommandStyledText {...props}>
          {t('move_to_well', {
            well_name: wellName,
            labware: getLabwareName(commandTextData, labwareId),
            labware_location: displayLocation,
          })}
        </CommandStyledText>
      )
    }
    case 'moveLabware': {
      return (
        <CommandStyledText {...props}>
          <MoveLabwareCommandText
            {...{ command, commandTextData, robotType }}
          />
        </CommandStyledText>
      )
    }
    case 'configureForVolume': {
      const { volume, pipetteId } = command.params
      const pipetteName = commandTextData.pipettes.find(
        pip => pip.id === pipetteId
      )?.pipetteName

      return (
        <CommandStyledText {...props}>
          {t('configure_for_volume', {
            volume,
            pipette:
              pipetteName != null
                ? getPipetteNameSpecs(pipetteName)?.displayName
                : '',
          })}
        </CommandStyledText>
      )
    }
    case 'configureNozzleLayout': {
      const { configurationParams, pipetteId } = command.params
      const pipetteName = commandTextData.pipettes.find(
        pip => pip.id === pipetteId
      )?.pipetteName

      // TODO (sb, 11/9/23): Add support for other configurations when needed
      return (
        <CommandStyledText {...props}>
          {t('configure_nozzle_layout', {
            amount: configurationParams.style === 'COLUMN' ? '8' : 'all',
            pipette:
              pipetteName != null
                ? getPipetteNameSpecs(pipetteName)?.displayName
                : '',
          })}
        </CommandStyledText>
      )
    }
    case 'prepareToAspirate': {
      const { pipetteId } = command.params
      const pipetteName = commandTextData.pipettes.find(
        pip => pip.id === pipetteId
      )?.pipetteName

      return (
        <CommandStyledText {...props}>
          {t('prepare_to_aspirate', {
            pipette:
              pipetteName != null
                ? getPipetteNameSpecs(pipetteName)?.displayName
                : '',
          })}
        </CommandStyledText>
      )
    }
    case 'moveToAddressableArea': {
      const addressableAreaDisplayName = getAddressableAreaDisplayName(
        commandTextData,
        command.id,
        t as TFunction
      )

      return (
        <CommandStyledText {...props}>
          {t('move_to_addressable_area', {
            addressable_area: addressableAreaDisplayName,
          })}
        </CommandStyledText>
      )
    }
    case 'moveToAddressableAreaForDropTip': {
      const addressableAreaDisplayName = getAddressableAreaDisplayName(
        commandTextData,
        command.id,
        t as TFunction
      )
      return (
        <CommandStyledText {...props}>
          {t('move_to_addressable_area_drop_tip', {
            addressable_area: addressableAreaDisplayName,
          })}
        </CommandStyledText>
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
        <CommandStyledText {...props}>
          {simpleTKey != null ? t(simpleTKey) : null}
        </CommandStyledText>
      )
    }
    case 'waitForDuration': {
      const { seconds, message } = command.params
      return (
        <CommandStyledText {...props}>
          {t('wait_for_duration', { seconds, message: message ?? '' })}
        </CommandStyledText>
      )
    }
    case 'pause': // legacy pause command
    case 'waitForResume': {
      return (
        <CommandStyledText {...props}>
          {command.params?.message != null && command.params.message !== ''
            ? command.params.message
            : t('wait_for_resume')}
        </CommandStyledText>
      )
    }
    case 'delay': {
      // legacy delay command
      const { message = '' } = command.params
      if ('waitForResume' in command.params) {
        return (
          <CommandStyledText {...props}>
            {command.params?.message != null && command.params.message !== ''
              ? command.params.message
              : t('wait_for_resume')}
          </CommandStyledText>
        )
      } else {
        return (
          <CommandStyledText {...props}>
            {t('wait_for_duration', {
              seconds: command.params.seconds,
              message,
            })}
          </CommandStyledText>
        )
      }
    }
    case 'comment': {
      const { message } = command.params
      return <CommandStyledText {...props}>{message}</CommandStyledText>
    }
    case 'custom': {
      const { legacyCommandText } = command.params ?? {}
      const sanitizedCommandText =
        typeof legacyCommandText === 'object'
          ? JSON.stringify(legacyCommandText)
          : String(legacyCommandText)
      return (
        <CommandStyledText {...props}>
          {legacyCommandText != null
            ? sanitizedCommandText
            : `${command.commandType}: ${JSON.stringify(command.params)}`}
        </CommandStyledText>
      )
    }
    default: {
      console.warn(
        'CommandText encountered a command with an unrecognized commandType: ',
        command
      )
      return (
        <CommandStyledText {...props}>
          {JSON.stringify(command)}
        </CommandStyledText>
      )
    }
  }
}

const forwardSTProps = (props: STProps): STProps =>
  pick(props, ['as', 'oddStyle', 'desktopStyle', 'modernStyledTextDefaults'])

const isModernSTProps = (props: STProps): props is ModernSTProps =>
  props.hasOwnProperty('desktopStyle') ||
  props.hasOwnProperty('oddStyle') ||
  !!props.modernStyledTextDefaults

function CommandStyledText(
  props: STProps & {
    children: JSX.Element[] | JSX.Element | string
  } & StyleProps
): JSX.Element {
  if (isModernSTProps(props)) {
    return (
      <StyledText
        desktopStyle={props.desktopStyle ?? 'bodyDefaultRegular'}
        oddStyle={props.oddStyle ?? 'bodyTextRegular'}
        {...styleProps(props)}
      >
        {props.children}
      </StyledText>
    )
  } else {
    return (
      <LegacyStyledText as={props.as ?? 'p'} {...styleProps(props)}>
        {props.children}
      </LegacyStyledText>
    )
  }
}
