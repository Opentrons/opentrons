import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  useHoverTooltip,
  PrimaryButton,
} from '@opentrons/components'
import { FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS } from '@opentrons/shared-data'

import { useToggleGroup } from '../../../../molecules/ToggleGroup/useToggleGroup'
import { useDeckConfigurationCompatibility } from '../../../../resources/deck_configuration/hooks'
import { Tooltip } from '../../../../atoms/Tooltip'
import {
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
  useModuleCalibrationStatus,
  useRobotType,
} from '../../hooks'
import { SetupModulesMap } from './SetupModulesMap'
import { SetupModulesList } from './SetupModulesList'
import { SetupFixtureList } from './SetupFixtureList'

import type { RunTimeCommand } from '@opentrons/shared-data'

interface SetupModuleAndDeckProps {
  expandLabwarePositionCheckStep: () => void
  robotName: string
  runId: string
  hasModules: boolean
  commands: RunTimeCommand[]
}

export const SetupModuleAndDeck = ({
  expandLabwarePositionCheckStep,
  robotName,
  runId,
  hasModules,
  commands,
}: SetupModuleAndDeckProps): JSX.Element => {
  const { t } = useTranslation('protocol_setup')
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view'),
    t('map_view')
  )

  const robotType = useRobotType(robotName)
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const runHasStarted = useRunHasStarted(runId)
  const [targetProps, tooltipProps] = useHoverTooltip()

  const moduleCalibrationStatus = useModuleCalibrationStatus(robotName, runId)
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    commands
  )

  const nonSingleSlotDeckConfigCompatibility = deckConfigCompatibility.filter(
    ({ requiredAddressableAreas }) =>
      // required AA list includes a non-single-slot AA
      !requiredAddressableAreas.every(aa =>
        FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(aa)
      )
  )
  // fixture includes at least 1 required AA
  const requiredDeckConfigCompatibility = nonSingleSlotDeckConfigCompatibility.filter(
    fixture => fixture.requiredAddressableAreas.length > 0
  )

  return (
    <>
      <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing32}>
        {toggleGroup}
        {selectedValue === t('list_view') ? (
          <>
            {hasModules ? (
              <SetupModulesList robotName={robotName} runId={runId} />
            ) : null}
            <SetupFixtureList
              deckConfigCompatibility={requiredDeckConfigCompatibility}
            />
          </>
        ) : (
          <SetupModulesMap runId={runId} />
        )}
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <PrimaryButton
          disabled={
            missingModuleIds.length > 0 ||
            runHasStarted ||
            !moduleCalibrationStatus.complete
          }
          onClick={expandLabwarePositionCheckStep}
          id="ModuleSetup_proceedToLabwarePositionCheck"
          padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
          {...targetProps}
        >
          {t('proceed_to_labware_position_check')}
        </PrimaryButton>
      </Flex>
      {missingModuleIds.length > 0 ||
      runHasStarted ||
      !moduleCalibrationStatus.complete ? (
        <Tooltip tooltipProps={tooltipProps}>
          {runHasStarted
            ? t('protocol_run_started')
            : missingModuleIds.length > 0
            ? t('plug_in_required_module', { count: missingModuleIds.length })
            : t('calibrate_module_failure_reason')}
        </Tooltip>
      ) : null}
    </>
  )
}
