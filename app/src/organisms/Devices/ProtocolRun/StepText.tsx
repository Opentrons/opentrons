import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, ALIGN_CENTER, SPACING, TYPOGRAPHY } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import { StyledText } from '../../../atoms/text'
import { getLabwareLocation } from '../ProtocolRun/utils/getLabwareLocation'
import {
  useLabwareRenderInfoForRunById,
  useProtocolDetailsForRun,
} from '../hooks'
import { RunLogProtocolSetupInfo } from './RunLogProtocolSetupInfo'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { RunCommandSummary } from '@opentrons/api-client'

const TRASH_ID = 'fixedTrash'

interface Props {
  analysisCommand: RunTimeCommand | null
  robotName: string
  runCommand: RunCommandSummary | null
  runId: string
}
export function StepText(props: Props): JSX.Element | null {
  const { analysisCommand, robotName, runCommand, runId } = props
  const { t } = useTranslation('run_details')
  const { protocolData } = useProtocolDetailsForRun(runId)
  const labwareRenderInfoById = useLabwareRenderInfoForRunById(runId)

  let messageNode = null

  const displayCommand = runCommand !== null ? runCommand : analysisCommand

  if (displayCommand === null) {
    console.warn(
      'display command should never be null, command text could find no source'
    )
    return null
  }
  // protocolData should never be null as we don't render the `RunDetails` unless we have an analysis
  // but we're experiencing a zombie children issue, see https://github.com/Opentrons/opentrons/pull/9091
  if (protocolData == null) {
    console.warn(
      'protocolData never be null, command text could find no protocolData'
    )
    return null
  }
  // params will not exist on command summaries
  switch (displayCommand.commandType) {
    case 'delay': {
      messageNode = (
        <>
          <Flex
            textTransform={TYPOGRAPHY.textTransformUppercase}
            padding={SPACING.spacing2}
            id={`RunDetails_CommandList`}
          >
            {t('comment')}
          </Flex>
          {displayCommand != null ? displayCommand.result : null}
        </>
      )
      break
    }
    case 'dropTip': {
      const { wellName, labwareId } = displayCommand.params
      const labwareLocation = getLabwareLocation(
        labwareId,
        protocolData.commands
      )
      if (!('slotName' in labwareLocation)) {
        throw new Error('expected tip rack to be in a slot')
      }
      messageNode = (
        <Trans
          t={t}
          i18nKey={'drop_tip'}
          values={{
            well_name: wellName,
            labware:
              labwareId === TRASH_ID
                ? 'Opentrons Fixed Trash'
                : getLabwareDisplayName(
                    protocolData.labwareDefinitions[
                      protocolData.labware[labwareId].definitionId
                    ]
                  ),
            labware_location: labwareLocation.slotName,
          }}
        />
      )
      break
    }
    case 'pickUpTip': {
      const { wellName, labwareId } = displayCommand.params
      const labwareLocation = getLabwareLocation(
        labwareId,
        protocolData.commands
      )
      if (!('slotName' in labwareLocation)) {
        throw new Error('expected tip rack to be in a slot')
      }
      messageNode = (
        <Trans
          t={t}
          i18nKey={'pickup_tip'}
          values={{
            well_name: wellName,
            labware: getLabwareDisplayName(
              labwareRenderInfoById[labwareId].labwareDef
            ),
            labware_location: labwareLocation.slotName,
          }}
        />
      )
      break
    }
    case 'pause':
    case 'waitForResume': {
      messageNode = displayCommand.params?.message ?? t('wait_for_resume')
      break
    }
    case 'loadLabware':
    case 'loadPipette':
    case 'loadModule': {
      messageNode = (
        <RunLogProtocolSetupInfo
          robotName={robotName}
          runId={runId}
          setupCommand={displayCommand}
        />
      )
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
      const { celsius } = displayCommand.params
      messageNode = t('setting_temperature_module_temp', { temp: celsius })
      break
    }
    case 'temperatureModule/deactivate': {
      messageNode = t('deactivate_temperature_module')
      break
    }
    case 'temperatureModule/waitForTemperature': {
      const { celsius } = displayCommand.params
      messageNode = t('waiting_to_reach_temp_module', { temp: celsius })
      break
    }
    case 'thermocycler/setTargetBlockTemperature': {
      const { celsius } = displayCommand.params
      messageNode = t('setting_thermocycler_block_temp', { temp: celsius })
      break
    }
    case 'thermocycler/setTargetLidTemperature': {
      const { celsius } = displayCommand.params
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
      const { profile } = displayCommand.params
      const steps = profile.map(
        ({ holdSeconds, celsius }: { holdSeconds: number; celsius: number }) =>
          t('tc_run_profile_steps', { celsius: celsius, seconds: holdSeconds })
      )
      messageNode = (
        <Flex>
          <StyledText>
            {t('tc_starting_profile', {
              repetitions: Object.keys(steps).length,
            })}
          </StyledText>
          <ul>
            {steps.map((step: string, index: number) => (
              <li key={index}> {step}</li>
            ))}
          </ul>
        </Flex>
      )
      break
    }
    case 'thermocycler/awaitProfileComplete': {
      messageNode = t('tc_awaiting_for_duration')
      break
    }
    case 'heaterShaker/setTargetTemperature': {
      const { celsius } = displayCommand.params
      messageNode = t('setting_hs_temp', { temp: celsius })
      break
    }
    case 'heaterShaker/waitForTemperature': {
      messageNode = t('waiting_for_hs_to_reach')
      break
    }
    case 'heaterShaker/setAndWaitForShakeSpeed': {
      const { rpm } = displayCommand.params
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
      const { seconds } = displayCommand.params
      messageNode = t('wait_for_duration', { seconds: seconds })
      break
    }
    case 'custom': {
      const { legacyCommandText } = displayCommand.params ?? {}
      const sanitizedCommandText =
        typeof legacyCommandText === 'object'
          ? JSON.stringify(legacyCommandText)
          : String(legacyCommandText)
      messageNode =
        legacyCommandText != null
          ? sanitizedCommandText
          : displayCommand.commandType
      break
    }
    default: {
      messageNode = displayCommand.commandType
      break
    }
  }

  return <Flex alignItems={ALIGN_CENTER}>{messageNode}</Flex>
}
