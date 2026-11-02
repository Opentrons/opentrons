import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  StyledText,
  Tooltip,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'

import { useToggleGroup } from '/app/molecules/ToggleGroup/useToggleGroup'
import { useRobotType } from '/app/redux-resources/robots'
import { useDeckConfigurationCompatibility } from '/app/resources/deck_configuration/hooks'
import {
  getIsFixtureMismatch,
  getRequiredDeckConfig,
} from '/app/resources/deck_configuration/utils'
import {
  useModuleCalibrationStatus,
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
} from '/app/resources/runs'

import { SetupFixtureList } from './SetupFixtureList'
import { SetupModulesList } from './SetupModulesList'
import { SetupModulesMap } from './SetupModulesMap'

import type { ReactNode } from 'react'
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
}: SetupModuleAndDeckProps): ReactNode => {
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
              <StyledText
                forwardedAs="label"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                width="45%"
              >
                {i18n.format(t('deck_hardware'), 'capitalize')}
              </StyledText>
              <StyledText
                forwardedAs="label"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                marginRight={SPACING.spacing16}
                width="15%"
              >
                {t('location')}
              </StyledText>
              <StyledText
                forwardedAs="label"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                marginRight={SPACING.spacing16}
                width="15%"
              >
                {t('status')}
              </StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              width="100%"
              overflowY="auto"
              gridGap={SPACING.spacing4}
              marginBottom={SPACING.spacing24}
            >
              {hasModules ? (
                <SetupModulesList
                  robotName={robotName}
                  runId={runId}
                  deckConfigCompatibility={requiredDeckConfigCompatibility}
                />
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
          padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
          {...targetProps}
        >
          {t('proceed_to_labware_offsets_setup_step')}
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
