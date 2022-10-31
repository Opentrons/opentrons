import * as React from 'react'
import { useSelector } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'
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
  JUSTIFY_SPACE_BETWEEN,
  Link,
  Icon,
  TOOLTIP_LEFT,
  useHoverTooltip,
  JUSTIFY_FLEX_END,
  BORDERS,
  SIZE_1,
} from '@opentrons/components'
import {
  getIsLabwareOffsetCodeSnippetsOn,
  useFeatureFlag,
} from '../../../../redux/config'
import { useLPCSuccessToast } from '../../../ProtocolSetup/hooks'
import { useToggleGroup } from '../../../../molecules/ToggleGroup/useToggleGroup'
import { PrimaryButton, SecondaryButton, TertiaryButton } from '../../../../atoms/buttons'
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

  const handleClickViewCurrentOffsets: React.MouseEventHandler<HTMLAnchorElement> = () => {
    console.log('TODO launch view offsets modal')
  }

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
                commands={protocolData?.commands ?? []}
                extraAttentionModules={moduleTypesThatRequireExtraAttention}
              />
            ) : (
              <SetupLabwareMap
                runId={runId}
                commands={protocolData?.commands ?? []}
                robotName={robotName}
                extraAttentionModules={moduleTypesThatRequireExtraAttention}
              />
            )}
          </>
        ) : (
          <SetupLabwareMap
            runId={runId}
            commands={protocolData?.commands ?? []}
            robotName={robotName}
            extraAttentionModules={moduleTypesThatRequireExtraAttention}
          />
        )}
        <Flex gridGap={SPACING.spacing4} backgroundColor={COLORS.lightBlue} padding={SPACING.spacing4} borderRadius={BORDERS.radiusSoftCorners}>
          <Icon name="reticle" size="18px" />
          <Flex flex="5" gridGap={SPACING.spacing3} flexDirection={DIRECTION_COLUMN}>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold} textTransform={TYPOGRAPHY.textTransformCapitalize}>
                  {t('run_labware_position_check')}
                </StyledText>
                {isLabwareOffsetCodeSnippetsOn ? (
                  <Link
                    role="link"
                    css={TYPOGRAPHY.labelSemiBold}
                    color={COLORS.darkBlackEnabled}
                    onClick={() => showDownloadOffsetDataModal(true)}
                  >
                    {t('get_labware_offset_data')}
                  </Link>
                ) : null}
              </Flex>
              <StyledText as="p">
                <Trans
                  t={t}
                  i18nKey='recommended_workflow_for_labware_positioning'
                  components={{
                    anchor: (
                      <Link
                        textDecoration={TYPOGRAPHY.textDecorationUnderline}
                        onClick={() => setShowLabwareHelpModal(true)}
                      />
                    )
                  }}
                />
              </StyledText>
            </Flex>
          </Flex>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_FLEX_END}
            flex="1 0 auto"
            gridGap={SPACING.spacing4}
          >
            <Link
              color={COLORS.blueEnabled}
              fontSize={TYPOGRAPHY.fontSizeP}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              onClick={handleClickViewCurrentOffsets}
              role="button"
            >
              {t('view_current_offsets')}
            </Link>
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
      <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing4}>
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
    </>
  )
}
