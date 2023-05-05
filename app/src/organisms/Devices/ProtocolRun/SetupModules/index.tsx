import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  useHoverTooltip,
  PrimaryButton,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'

import { Tooltip } from '../../../../atoms/Tooltip'
import { useToggleGroup } from '../../../../molecules/ToggleGroup/useToggleGroup'
import { useRunHasStarted, useUnmatchedModulesForProtocol } from '../../hooks'
import { SetupModulesList } from './SetupModulesList'
import { SetupModulesMap } from './SetupModulesMap'

interface SetupModulesProps {
  expandLabwarePositionCheckStep: () => void
  robotName: string
  runId: string
}

export const SetupModules = ({
  expandLabwarePositionCheckStep,
  robotName,
  runId,
}: SetupModulesProps): JSX.Element => {
  const { t } = useTranslation('protocol_setup')
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view'),
    t('map_view')
  )
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const runHasStarted = useRunHasStarted(runId)
  const [targetProps, tooltipProps] = useHoverTooltip()
  return (
    <>
      <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing6}>
        {toggleGroup}
        {selectedValue === t('list_view') ? (
          <SetupModulesList robotName={robotName} runId={runId} />
        ) : (
          <SetupModulesMap robotName={robotName} runId={runId} />
        )}
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <PrimaryButton
          disabled={missingModuleIds.length > 0 || runHasStarted}
          onClick={expandLabwarePositionCheckStep}
          id="ModuleSetup_proceedToLabwarePositionCheck"
          padding={`${String(SPACING.spacing3)} ${String(SPACING.spacing4)}`}
          {...targetProps}
        >
          {t('proceed_to_labware_position_check')}
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
