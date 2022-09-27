import * as React from 'react'
import { useSelector } from 'react-redux'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import some from 'lodash/some'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Box,
  Icon,
  LabwareRender,
  Link,
  Module,
  RobotWorkSpace,
  useHoverTooltip,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  TOOLTIP_LEFT,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'

import { PrimaryButton, SecondaryButton } from '../../../atoms/buttons'
import { Tooltip } from '../../../atoms/Tooltip'
import { StyledText } from '../../../atoms/text'
import { useLPCSuccessToast } from '../../../organisms/ProtocolSetup/hooks'
import { LabwarePositionCheck } from '../../../organisms/LabwarePositionCheck'
import { ModuleExtraAttention } from './ModuleExtraAttention'
import { LabwareInfoOverlay } from './LabwareInfoOverlay'
import { LabwareOffsetModal } from '../../../organisms/ProtocolSetup/RunSetupCard/LabwareSetup/LabwareOffsetModal'
import { getModuleTypesThatRequireExtraAttention } from '../../../organisms/ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
import { DownloadOffsetDataModal } from '../../../organisms/ProtocolUpload/DownloadOffsetDataModal'
import {
  getIsLabwareOffsetCodeSnippetsOn,
  useFeatureFlag,
} from '../../../redux/config'
import { ReapplyOffsetsModal } from '../../ReapplyOffsetsModal'
import { useCurrentRun } from '../../ProtocolUpload/hooks'
import {
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
  useRunCalibrationStatus,
  useRunHasStarted,
  useStoredProtocolAnalysis,
  useUnmatchedModulesForProtocol,
} from '../hooks'
import { ProceedToRunButton } from './ProceedToRunButton'
import type { StepKey } from './ProtocolRunSetup'
import type { DeckDefinition } from '@opentrons/shared-data'
const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

const DECK_MAP_VIEWBOX = '-80 -40 550 500'

interface SetupLabwareProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
  nextStep: StepKey | null
  expandStep: (step: StepKey) => void
}

export function SetupLabware({
  protocolRunHeaderRef,
  robotName,
  runId,
  nextStep,
  expandStep,
}: SetupLabwareProps): JSX.Element {
  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const labwareRenderInfoById = useLabwareRenderInfoForRunById(runId)
  const unmatchedModuleResults = useUnmatchedModulesForProtocol(
    robotName,
    runId
  )
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })
  const runHasStarted = useRunHasStarted(runId)
  const currentRun = useCurrentRun()
  const { protocolData: robotProtocolAnalysis } = useProtocolDetailsForRun(
    runId
  )
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis

  const { t } = useTranslation('protocol_setup')
  const [
    showLabwareHelpModal,
    setShowLabwareHelpModal,
  ] = React.useState<boolean>(false)

  const moduleModels = map(
    moduleRenderInfoById,
    ({ moduleDef }) => moduleDef.model
  )
  const moduleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention(
    moduleModels
  )
  const [
    showLabwarePositionCheckModal,
    setShowLabwarePositionCheckModal,
  ] = React.useState<boolean>(false)
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
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
  )
  const { setIsShowingLPCSuccessToast } = useLPCSuccessToast()

  /**
   * This component's usage of the reapply offsets modal can be removed
   * along with the enableManualDeckStateMod feature flag.
   */
  const enableManualDeckStateMod = useFeatureFlag(
    'enableManualDeckStateModification'
  )

  const tipRackLoadedInProtocol: boolean = some(
    protocolData?.labwareDefinitions,
    def => def.parameters?.isTiprack
  )

  const tipsArePickedUp: boolean = some(
    protocolData?.commands,
    command => command.commandType === 'pickUpTip'
  )

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
      <Flex flex="1" maxHeight="180vh" flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing4}>
          {!runHasStarted &&
          moduleTypesThatRequireExtraAttention.length > 0 &&
          moduleRenderInfoById ? (
            <ModuleExtraAttention
              moduleTypes={moduleTypesThatRequireExtraAttention}
              modulesInfo={moduleRenderInfoById}
            />
          ) : null}
          <Box margin="0 auto" maxWidth="46.25rem" width="100%">
            <RobotWorkSpace
              deckDef={(standardDeckDef as unknown) as DeckDefinition}
              viewBox={DECK_MAP_VIEWBOX}
              deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
              id="LabwareSetup_deckMap"
            >
              {() => (
                <>
                  {map(
                    moduleRenderInfoById,
                    ({
                      x,
                      y,
                      moduleDef,
                      nestedLabwareDef,
                      nestedLabwareId,
                      nestedLabwareDisplayName,
                    }) => (
                      <Module
                        key={`LabwareSetup_Module_${moduleDef.model}_${x}${y}`}
                        x={x}
                        y={y}
                        orientation={inferModuleOrientationFromXCoordinate(x)}
                        def={moduleDef}
                        innerProps={
                          moduleDef.model === THERMOCYCLER_MODULE_V1
                            ? { lidMotorState: 'open' }
                            : {}
                        }
                      >
                        {nestedLabwareDef != null && nestedLabwareId != null ? (
                          <React.Fragment
                            key={`LabwareSetup_Labware_${nestedLabwareDef.metadata.displayName}_${x}${y}`}
                          >
                            <LabwareRender definition={nestedLabwareDef} />
                            <LabwareInfoOverlay
                              definition={nestedLabwareDef}
                              labwareId={nestedLabwareId}
                              displayName={nestedLabwareDisplayName}
                              runId={runId}
                            />
                          </React.Fragment>
                        ) : null}
                      </Module>
                    )
                  )}
                  {map(
                    labwareRenderInfoById,
                    ({ x, y, labwareDef, displayName }, labwareId) => {
                      return (
                        <React.Fragment
                          key={`LabwareSetup_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
                        >
                          <g transform={`translate(${x},${y})`}>
                            <LabwareRender definition={labwareDef} />
                            <LabwareInfoOverlay
                              definition={labwareDef}
                              labwareId={labwareId}
                              displayName={displayName}
                              runId={runId}
                            />
                          </g>
                        </React.Fragment>
                      )
                    }
                  )}
                </>
              )}
            </RobotWorkSpace>
          </Box>
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
