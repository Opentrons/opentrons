import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  PrimaryButton,
  SPACING,
  Tooltip,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'

import { useToggleGroup } from '/app/molecules/ToggleGroup/useToggleGroup'
import { useDeckConfigurationCompatibility } from '/app/resources/deck_configuration/hooks'
import {
  getIsFixtureMismatch,
  getRequiredDeckConfig,
} from '/app/resources/deck_configuration/utils'
import { useRobotType } from '/app/redux-resources/robots'
import {
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
  useModuleCalibrationStatus,
} from '/app/resources/runs'
import { SetupModulesMap } from './SetupModulesMap'
import { SetupModulesList } from './SetupModulesList'
import { SetupFixtureList } from './SetupFixtureList'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

interface SetupModuleAndDeckProps {
  expandLabwarePositionCheckStep: () => void
  robotName: string
  runId: string
  hasModules: boolean
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export const SetupModuleAndDeck = ({
  expandLabwarePositionCheckStep,
  robotName,
  runId,
  hasModules,
  protocolAnalysis,
}: SetupModuleAndDeckProps): JSX.Element => {
  const { t, i18n } = useTranslation('protocol_setup')
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view') as string,
    t('map_view') as string
  )

  const robotType = useRobotType(robotName)
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const runHasStarted = useRunHasStarted(runId)
  const [targetProps, tooltipProps] = useHoverTooltip()

  const moduleCalibrationStatus = useModuleCalibrationStatus(robotName, runId)
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    protocolAnalysis
  )

  const isFixtureMismatch = getIsFixtureMismatch(deckConfigCompatibility)

  const requiredDeckConfigCompatibility = getRequiredDeckConfig(
    deckConfigCompatibility
  )

  return (
    <>
      <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing32}>
        {toggleGroup}
        {selectedValue === t('list_view') ? (
          <>
            <Flex
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              marginTop={SPACING.spacing16}
              marginLeft={SPACING.spacing20}
              marginBottom={SPACING.spacing12}
            >
              <LegacyStyledText css={TYPOGRAPHY.labelSemiBold} width="45%">
                {i18n.format(t('deck_hardware'), 'capitalize')}
              </LegacyStyledText>
              <LegacyStyledText
                css={TYPOGRAPHY.labelSemiBold}
                marginRight={SPACING.spacing16}
                width="15%"
              >
                {t('location')}
              </LegacyStyledText>
              <LegacyStyledText
                css={TYPOGRAPHY.labelSemiBold}
                marginRight={SPACING.spacing16}
                width="15%"
              >
                {t('status')}
              </LegacyStyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              width="100%"
              overflowY="auto"
              gridGap={SPACING.spacing4}
              marginBottom={SPACING.spacing24}
            >
              {hasModules ? (
                <SetupModulesList robotName={robotName} runId={runId} />
              ) : null}
              {requiredDeckConfigCompatibility.length > 0 ? (
                <SetupFixtureList
                  deckConfigCompatibility={requiredDeckConfigCompatibility}
                  robotName={robotName}
                />
              ) : null}
            </Flex>
          </>
        ) : (
          <SetupModulesMap runId={runId} />
        )}
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <PrimaryButton
          disabled={
            missingModuleIds.length > 0 ||
            isFixtureMismatch ||
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
