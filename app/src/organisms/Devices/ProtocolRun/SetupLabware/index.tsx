import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import some from 'lodash/some'
import {
  JUSTIFY_CENTER,
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  COLORS,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  ALIGN_FLEX_END,
  Link,
  Icon,
  TOOLTIP_LEFT,
  useHoverTooltip,
} from '@opentrons/components'
import {
  getIsLabwareOffsetCodeSnippetsOn,
  useFeatureFlag,
} from '../../../../redux/config'
import { useLPCSuccessToast } from '../../../ProtocolSetup/hooks'
import { useToggleGroup } from '../../../../molecules/ToggleGroup/useToggleGroup'
import { PrimaryButton, SecondaryButton } from '../../../../atoms/buttons'
import { Tooltip } from '../../../../atoms/Tooltip'
import { StyledText } from '../../../../atoms/text'
import { getModuleTypesThatRequireExtraAttention } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
import { LabwarePositionCheck } from '../../../LabwarePositionCheck'
import { DownloadOffsetDataModal } from '../../../ProtocolUpload/DownloadOffsetDataModal'
import { ReapplyOffsetsModal } from '../../../ReapplyOffsetsModal'
import { useCurrentRun } from '../../../ProtocolUpload/hooks'
import { LabwareOffsetModal } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/LabwareOffsetModal'
import {
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
  useRunCalibrationStatus,
  useRunHasStarted,
  useStoredProtocolAnalysis,
  useUnmatchedModulesForProtocol,
} from '../../hooks'
import { ProceedToRunButton } from '../ProceedToRunButton'
import { SetupLabwareMap } from './SetupLabwareMap'
import { SetupLabwareList } from './SetupLabwareList'
import type { StepKey } from '../ProtocolRunSetup'

interface SetupLabwareProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
  nextStep: StepKey | null
  expandStep: (step: StepKey) => void
}

export function SetupLabware(props: SetupLabwareProps): JSX.Element {
  const { robotName, runId, nextStep, expandStep, protocolRunHeaderRef } = props
  const { t } = useTranslation('protocol_setup')
  const enableLiquidSetup = useFeatureFlag('enableLiquidSetup')
  const { protocolData: robotProtocolAnalysis } = useProtocolDetailsForRun(
    runId
  )
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const runHasStarted = useRunHasStarted(runId)
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view'),
    t('map_view')
  )
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  /**
   * This component's usage of the reapply offsets modal can be removed
   * along with the enableManualDeckStateMod feature flag.
   */
  const enableManualDeckStateMod = useFeatureFlag(
    'enableManualDeckStateModification'
  )
  const [
    showLabwareHelpModal,
    setShowLabwareHelpModal,
  ] = React.useState<boolean>(false)
  const [
    showLabwarePositionCheckModal,
    setShowLabwarePositionCheckModal,
  ] = React.useState<boolean>(false)
  const unmatchedModuleResults = useUnmatchedModulesForProtocol(
    robotName,
    runId
  )
  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const moduleModels = map(
    moduleRenderInfoById,
    ({ moduleDef }) => moduleDef.model
  )
  const moduleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention(
    moduleModels
  )
  const { missingModuleIds } = unmatchedModuleResults
  const calibrationIncomplete =
    missingModuleIds.length === 0 && !isCalibrationComplete
  const moduleSetupIncomplete =
    missingModuleIds.length > 0 && isCalibrationComplete
  const moduleAndCalibrationIncomplete =
    missingModuleIds.length > 0 && !isCalibrationComplete

  const [
    downloadOffsetDataModal,
    showDownloadOffsetDataModal,
  ] = React.useState<boolean>(false)

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })
  const currentRun = useCurrentRun()
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
  )
  const tipRackLoadedInProtocol: boolean = some(
    protocolData?.labwareDefinitions,
    def => def.parameters?.isTiprack
  )
  const tipsArePickedUp: boolean = some(
    protocolData?.commands,
    command => command.commandType === 'pickUpTip'
  )
  const { setIsShowingLPCSuccessToast } = useLPCSuccessToast()
  let lpcDisabledReason: string | null = null

  if (moduleAndCalibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_and_calibration_not_complete')
  } else if (calibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_calibration_not_complete')
  } else if (moduleSetupIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_not_connected')
  } else if (runHasStarted) {
    lpcDisabledReason = t('labware_position_check_not_available')
  } else if (robotProtocolAnalysis == null) {
    lpcDisabledReason = t(
      'labware_position_check_not_available_analyzing_on_robot'
    )
  } else if (
    isEmpty(protocolData?.pipettes) ||
    isEmpty(protocolData?.labware)
  ) {
    lpcDisabledReason = t('labware_position_check_not_available_empty_protocol')
  } else if (!tipRackLoadedInProtocol) {
    lpcDisabledReason = t('lpc_disabled_no_tipracks_loaded')
  } else if (!tipsArePickedUp) {
    lpcDisabledReason = t('lpc_disabled_no_tipracks_used')
  }
  const showReapplyOffsetsModal =
    !enableManualDeckStateMod &&
    currentRun?.data.id === runId &&
    (currentRun?.data?.labwareOffsets == null ||
      currentRun?.data?.labwareOffsets.length === 0)

  return (
    <>
      {showReapplyOffsetsModal ? <ReapplyOffsetsModal runId={runId} /> : null}
      {showLabwareHelpModal && (
        <LabwareOffsetModal
          onCloseClick={() => setShowLabwareHelpModal(false)}
        />
      )}
      {showLabwarePositionCheckModal && (
        <LabwarePositionCheck
          onCloseClick={() => setShowLabwarePositionCheckModal(false)}
          runId={runId}
        />
      )}
      {downloadOffsetDataModal && (
        <DownloadOffsetDataModal
          onCloseClick={() => showDownloadOffsetDataModal(false)}
          runId={runId}
        />
      )}

      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING.spacing6}
        gridGap={SPACING.spacing4}
      >
        {enableLiquidSetup ? (
          <>
            {toggleGroup}
            {selectedValue === t('list_view') ? (
              <SetupLabwareList
                attachedModuleInfo={moduleRenderInfoById}
                runId={runId}
                extraAttentionModules={moduleTypesThatRequireExtraAttention}
              />
            ) : (
              <SetupLabwareMap
                runId={runId}
                robotName={robotName}
                extraAttentionModules={moduleTypesThatRequireExtraAttention}
              />
            )}
          </>
        ) : (
          <SetupLabwareMap
            runId={runId}
            robotName={robotName}
            extraAttentionModules={moduleTypesThatRequireExtraAttention}
          />
        )}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
          <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_FLEX_END}>
            <Flex color={COLORS.darkGreyEnabled} alignItems={ALIGN_CENTER}>
              <Icon
                name="information"
                size={SIZE_1}
                marginRight={SPACING.spacing2}
              />
              <StyledText css={TYPOGRAPHY.labelRegular}>
                {t('recommended')}
              </StyledText>
            </Flex>
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing4}
            backgroundColor={COLORS.fundamentalsBackground}
            padding={SPACING.spacing5}
          >
            <Flex
              alignItems={ALIGN_CENTER}
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <StyledText
                css={TYPOGRAPHY.h3SemiBold}
                color={COLORS.darkBlackEnabled}
              >
                {t('lpc_and_offset_data_title')}
              </StyledText>
              {isLabwareOffsetCodeSnippetsOn ? (
                <Link
                  role="link"
                  css={TYPOGRAPHY.labelSemiBold}
                  color={COLORS.darkBlackEnabled}
                  onClick={() => showDownloadOffsetDataModal(true)}
                  id="DownloadOffsetData"
                >
                  {t('get_labware_offset_data')}
                </Link>
              ) : null}
            </Flex>
            <StyledText
              color={COLORS.darkBlackEnabled}
              css={TYPOGRAPHY.pRegular}
            >
              {t('labware_position_check_text')}
            </StyledText>
            <Flex
              alignItems={ALIGN_CENTER}
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <Link
                role="link"
                css={TYPOGRAPHY.darkLinkLabelSemiBold}
                onClick={() => setShowLabwareHelpModal(true)}
                data-test="LabwareSetup_helpLink"
              >
                {t('labware_help_link_title')}
              </Link>
              <Flex justifyContent={JUSTIFY_CENTER}>
                <SecondaryButton
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                  title={t('run_labware_position_check')}
                  onClick={() => {
                    setShowLabwarePositionCheckModal(true)
                    setIsShowingLPCSuccessToast(false)
                  }}
                  id="LabwareSetup_checkLabwarePositionsButton"
                  {...targetProps}
                  disabled={lpcDisabledReason !== null}
                >
                  {t('run_labware_position_check')}
                </SecondaryButton>
                {lpcDisabledReason !== null ? (
                  <Tooltip tooltipProps={tooltipProps}>
                    {lpcDisabledReason}
                  </Tooltip>
                ) : null}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Flex justifyContent={JUSTIFY_CENTER}>
          {nextStep == null ? (
            <ProceedToRunButton
              protocolRunHeaderRef={protocolRunHeaderRef}
              robotName={robotName}
              runId={runId}
            />
          ) : (
            <PrimaryButton onClick={() => expandStep(nextStep)}>
              {t('proceed_to_liquid_setup_step')}
            </PrimaryButton>
          )}
        </Flex>
      </Flex>
    </>
  )
}
