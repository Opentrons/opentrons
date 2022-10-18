import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useFeatureFlag } from '../../../../redux/config'
import { useRunHasStarted, useUnmatchedModulesForProtocol } from '../../hooks'
import { useToggleGroup } from '../../../../molecules/ToggleGroup/useToggleGroup'
import { PrimaryButton } from '../../../../atoms/buttons'
import { Tooltip } from '../../../../atoms/Tooltip'
import { SetupModulesMap } from './SetupModulesMap'
import { SetupModulesList } from './SetupModulesList'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  useHoverTooltip,
} from '@opentrons/components'

interface SetupModulesProps {
  expandLabwareSetupStep: () => void
  robotName: string
  runId: string
}

export const SetupModules = ({
  expandLabwareSetupStep,
  robotName,
  runId,
}: SetupModulesProps): JSX.Element => {
  const { t } = useTranslation('protocol_setup')
  const enableLiquidSetup = useFeatureFlag('enableLiquidSetup')
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view'),
    t('map_view')
  )
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const runHasStarted = useRunHasStarted(runId)
  const [targetProps, tooltipProps] = useHoverTooltip()
  return (
    <>
      {enableLiquidSetup ? (
        <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing6}>
          {toggleGroup}
          {selectedValue === t('list_view') ? (
            <SetupModulesList robotName={robotName} runId={runId} />
          ) : (
            <SetupModulesMap robotName={robotName} runId={runId} />
          )}
        </Flex>
      ) : (
        <SetupModulesMap robotName={robotName} runId={runId} />
      )}
      <Flex justifyContent={JUSTIFY_CENTER}>
        <PrimaryButton
          disabled={missingModuleIds.length > 0 || runHasStarted}
          onClick={expandLabwareSetupStep}
          id="ModuleSetup_proceedToLabwareSetup"
          padding={`${SPACING.spacing3} ${SPACING.spacing4}`}
          {...targetProps}
        >
          {enableLiquidSetup
            ? t('proceed_to_labware_setup_prep')
            : t('proceed_to_labware_setup_step')}
        </PrimaryButton>
      </Flex>
      {missingModuleIds.length > 0 || runHasStarted ? (
        <Tooltip tooltipProps={tooltipProps}>
          {runHasStarted
            ? t('protocol_run_started')
            : t('plug_in_required_module', { count: missingModuleIds.length })}
        </Tooltip>
      ) : null}
    </>
  )
}
