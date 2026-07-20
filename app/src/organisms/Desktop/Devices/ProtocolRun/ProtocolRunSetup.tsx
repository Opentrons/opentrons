import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Divider,
  Flex,
  FLEX_MAX_CONTENT,
  Icon,
  LegacyStyledText,
  NO_WRAP,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useInstrumentsQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  parseAllRequiredModuleModels,
} from '@opentrons/shared-data'

import { getIncompleteInstrumentCount } from '/app/local-resources/instruments'
import { InfoMessage } from '/app/molecules/InfoMessage'
import { SetupCamera } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera'
import { useLPCFlows } from '/app/organisms/LabwarePositionCheck'
import { useCameraAnalytics } from '/app/redux-resources/analytics/'
import { useIsFlex, useRobot } from '/app/redux-resources/robots'
import { useRequiredSetupStepsInOrder } from '/app/redux-resources/runs'
import {
  appliedOffsetsToRun,
  CAMERA_SETUP_STEP_KEY,
  getCameraUsageState,
  getMissingSetupSteps,
  LABWARE_SETUP_STEP_KEY,
  LPC_STEP_KEY,
  MODULE_SETUP_STEP_KEY,
  ROBOT_CALIBRATION_STEP_KEY,
  selectAreOffsetsApplied,
  selectIsAnyNecessaryDefaultOffsetMissing,
  selectTotalCountLocationSpecificOffsets,
  updateRunSetupStepsComplete,
} from '/app/redux/protocol-runs'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useUpdateClientLPC } from '/app/resources/client_data'
import { useDeckConfigurationCompatibility } from '/app/resources/deck_configuration/hooks'
import {
  getIsFixtureMismatch,
  getRequiredDeckConfig,
} from '/app/resources/deck_configuration/utils'
import { useRobotStorageInfo } from '/app/resources/health/useIsImageStorageLow'
import {
  useModuleCalibrationStatus,
  useMostRecentCompletedAnalysis,
  useNotifyRunQuery,
  useProtocolAnalysisErrors,
  useRunCalibrationStatus,
  useRunHasStarted,
  useRunPipetteInfoByMount,
  useUnmatchedModulesForProtocol,
} from '/app/resources/runs'
import { INCOMPATIBLE, INEXACT_MATCH } from '/app/resources/runs/constants'

import { EmptySetupStep } from './EmptySetupStep'
import { LearnAboutOffsetsLink } from './LearnAboutOffsetsLink'
import { SetupLabware } from './SetupLabware'
import { SetupLabwarePositionCheck } from './SetupLabwarePositionCheck'
import { SetupModuleAndDeck } from './SetupModuleAndDeck'
import { SetupRobotCalibration } from './SetupRobotCalibration'
import { SetupStep } from './SetupStep'

import type { RefObject } from 'react'
import type { StepKey } from '/app/redux/protocol-runs'
import type { Dispatch, State } from '/app/redux/types'

const RUN_RECORD_REFETCH_MS = 5000

interface ProtocolRunSetupProps {
  protocolRunHeaderRef: RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
}

export function ProtocolRunSetup({
  protocolRunHeaderRef,
  robotName,
  runId,
}: ProtocolRunSetupProps): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')
  const dispatch = useDispatch<Dispatch>()
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const { orderedSteps, orderedApplicableSteps } = useRequiredSetupStepsInOrder(
    { runId, protocolAnalysis }
  )
  const modules = parseAllRequiredModuleModels(protocolAnalysis?.commands ?? [])
  const robot = useRobot(robotName)
  const calibrationStatusRobot = useRunCalibrationStatus(robotName, runId)
  const calibrationStatusModules = useModuleCalibrationStatus(robotName, runId)
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const isFlex = useIsFlex(robotName)
  const runHasStarted = useRunHasStarted(runId)
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const [expandedStepKey, setExpandedStepKey] = useState<StepKey | null>(null)
  const robotType = isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    protocolAnalysis
  )
  const runPipetteInfoByMount = useRunPipetteInfoByMount(runId)
  const { data: runRecord } = useNotifyRunQuery(runId, {
    staleTime: Infinity,
    refetchInterval: RUN_RECORD_REFETCH_MS,
  })
  const { data: protocolRecord } = useProtocolQuery(
    runRecord?.data.protocolId ?? null,
    {
      staleTime: Infinity,
    }
  )
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name ??
    ''

  const lpcUtils = useLPCFlows({
    runId,
    robotType,
    protocolName,
  })
  const { enabled: cameraEnabled } = useSelector((state: State) =>
    getCameraUsageState(state, runId)
  )

  const missingSteps = useSelector<State, StepKey[]>(
    (state: State): StepKey[] => getMissingSetupSteps(state, runId)
  )

  const flexOffsetsMissing = useSelector(
    selectIsAnyNecessaryDefaultOffsetMissing(runId)
  )
  const { updateWithRunId: updateLPCStatusWithRunId } = useUpdateClientLPC()
  const flexOffsetsApplied = useSelector(selectAreOffsetsApplied(runId))
  const noLwOffsetsInRun =
    useSelector(selectTotalCountLocationSpecificOffsets(runId)) === 0 && isFlex

  // A separate app can apply offsets. We need to update the missing steps as a side effect.
  useEffect(() => {
    if (flexOffsetsApplied) {
      dispatch(updateRunSetupStepsComplete(runId, { [LPC_STEP_KEY]: true }))
    }
  }, [dispatch, flexOffsetsApplied, runId])

  const offsetsConfirmed = isFlex
    ? runHasStarted ||
      (flexOffsetsApplied && !missingSteps.includes(LPC_STEP_KEY))
    : !missingSteps.includes(LPC_STEP_KEY)
  const buildLPCIncompleteText = (): string | null => {
    if (isFlex) {
      return flexOffsetsMissing
        ? t('offsets_missing')
        : t('offsets_not_applied')
    } else {
      return null
    }
  }

  const buildLPCCompleteText = (): string => {
    if (noLwOffsetsInRun) {
      return t('offsets_not_required')
    } else {
      return isFlex ? t('offsets_applied') : t('offsets_ready')
    }
  }

  const isMissingPipette =
    (runPipetteInfoByMount.left != null &&
      runPipetteInfoByMount.left.requestedPipetteMatch === INCOMPATIBLE) ||
    (runPipetteInfoByMount.right != null &&
      runPipetteInfoByMount.right.requestedPipetteMatch === INCOMPATIBLE) ||
    // for Flex, require exact match
    (isFlex &&
      runPipetteInfoByMount.left != null &&
      runPipetteInfoByMount.left.requestedPipetteMatch === INEXACT_MATCH) ||
    (isFlex &&
      runPipetteInfoByMount.right != null &&
      runPipetteInfoByMount.right.requestedPipetteMatch === INEXACT_MATCH)

  const isFixtureMismatch = getIsFixtureMismatch(deckConfigCompatibility)

  const isMissingModule = missingModuleIds.length > 0

  const { data: attachedInstruments } = useInstrumentsQuery()

  const incompleteInstrumentCount: number | null =
    protocolAnalysis != null && attachedInstruments != null
      ? getIncompleteInstrumentCount(protocolAnalysis, attachedInstruments)
      : null

  const hasModules = protocolAnalysis != null && modules.length > 0
  // need config compatibility (including check for single slot conflicts)
  const requiredDeckConfigCompatibility = getRequiredDeckConfig(
    deckConfigCompatibility
  )
  const hasFixtures = requiredDeckConfigCompatibility.length > 0
  const flexDeckHardwareDescription =
    hasModules || hasFixtures
      ? t('install_modules_and_fixtures')
      : t('no_deck_hardware_specified')
  const ot2DeckHardwareDescription = hasModules
    ? t('install_modules', { count: modules.length })
    : t('no_deck_hardware_specified')
  const modulesOrFixturesReady =
    calibrationStatusModules.complete && !isMissingModule && !isFixtureMismatch
  const isCameraRequired =
    protocolAnalysis?.commandPreconditions?.isCameraUsed ?? false
  const isCameraConfirmed =
    !missingSteps.includes(CAMERA_SETUP_STEP_KEY) || runHasStarted
  const cameraSettingsApplied = runRecord?.data.cameraSettings != null
  const storageInfo = useRobotStorageInfo()
  const baseProps = {
    source: 'runRecord' as const,
    robotType: robotType,
  }
  const { reportPhotoAccessUsage } = useCameraAnalytics(baseProps)
  useEffect(
    () => {
      if (storageInfo.isImageStorageLow) {
        reportPhotoAccessUsage({
          ...baseProps,
          transactionId: runId,
          action: 'storageWarning',
        })
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageInfo.isImageStorageLow !== null]
  )
  // A separate app can apply camera settings.
  // We need to update the missing steps as a side effect.
  useEffect(() => {
    if (cameraSettingsApplied && !isCameraConfirmed) {
      dispatch(
        updateRunSetupStepsComplete(runId, { [CAMERA_SETUP_STEP_KEY]: true })
      )
    }
  }, [cameraSettingsApplied, dispatch, isCameraConfirmed, runId])

  if (robot == null) {
    return null
  }
  const applicableSteps: StepKey[] = (() => {
    const [firstStep, ...restSteps] = orderedApplicableSteps

    return !modulesOrFixturesReady
      ? ([firstStep, MODULE_SETUP_STEP_KEY, ...restSteps] as StepKey[])
      : [...orderedApplicableSteps]
  })()

  const filteredNextStep =
    applicableSteps[
      applicableSteps.findIndex(step => step === ROBOT_CALIBRATION_STEP_KEY) + 1
    ]

  const StepDetailMap: Record<
    StepKey,
    {
      stepInternals: JSX.Element
      description: string
      descriptionElement: JSX.Element | null
      rightElProps: StepRightElementProps
    }
  > = {
    [ROBOT_CALIBRATION_STEP_KEY]: {
      stepInternals: (
        <SetupRobotCalibration
          robotName={robotName}
          runId={runId}
          nextStep={filteredNextStep}
          expandStep={setExpandedStepKey}
          calibrationStatus={calibrationStatusRobot}
        />
      ),
      // change description for Flex
      description: isFlex
        ? t(`${ROBOT_CALIBRATION_STEP_KEY}_description_pipettes_only`)
        : t(`${ROBOT_CALIBRATION_STEP_KEY}_description`),
      descriptionElement: null,
      rightElProps: {
        stepKey: ROBOT_CALIBRATION_STEP_KEY,
        complete: calibrationStatusRobot.complete,
        completeText: isFlex
          ? t('instruments_attached')
          : t('calibration_ready'),
        missingHardware: isMissingPipette,
        incompleteText: t('calibration_needed'),
        missingHardwareText: t('action_needed'),
        incompleteElement: null,
        disabledHardware: false,
      },
    },
    [MODULE_SETUP_STEP_KEY]: {
      stepInternals: (
        <SetupModuleAndDeck
          expandLabwarePositionCheckStep={() => {
            setExpandedStepKey(LPC_STEP_KEY)
          }}
          robotName={robotName}
          runId={runId}
          hasModules={hasModules}
          protocolAnalysis={protocolAnalysis}
        />
      ),
      description: isFlex
        ? flexDeckHardwareDescription
        : ot2DeckHardwareDescription,
      descriptionElement: null,
      rightElProps: {
        stepKey: MODULE_SETUP_STEP_KEY,
        complete: modulesOrFixturesReady,
        completeText: isFlex
          ? t('modules_and_fixtures_ready')
          : t('modules_ready'),
        incompleteText: t('action_needed'),
        disabledHardware: false,
        missingHardware: isMissingModule || isFixtureMismatch,
        missingHardwareText: t('action_needed'),
        incompleteElement: null,
      },
    },
    [LPC_STEP_KEY]: {
      stepInternals: (
        <SetupLabwarePositionCheck
          {...{ runId, robotName, robotType }}
          setOffsetsConfirmed={confirmed => {
            if (confirmed) {
              dispatch(appliedOffsetsToRun(runId))
              dispatch(
                updateRunSetupStepsComplete(runId, {
                  [LPC_STEP_KEY]: confirmed,
                })
              )
              updateLPCStatusWithRunId(runId)

              setExpandedStepKey(LABWARE_SETUP_STEP_KEY)
            }
          }}
          offsetsConfirmed={offsetsConfirmed}
          hasMissingModulesForFlex={isMissingModule}
          hasMissingCalForFlex={
            incompleteInstrumentCount != null && incompleteInstrumentCount > 0
          }
          lpcUtils={lpcUtils}
        />
      ),
      description: noLwOffsetsInRun
        ? t('no_offsets_in_run')
        : t('labware_position_check_step_description'),
      descriptionElement: <LearnAboutOffsetsLink />,
      rightElProps: {
        stepKey: LPC_STEP_KEY,
        complete: offsetsConfirmed,
        completeText: buildLPCCompleteText(),
        incompleteText: buildLPCIncompleteText(),
        incompleteElement: null,
      },
    },
    [LABWARE_SETUP_STEP_KEY]: {
      stepInternals: (
        <SetupLabware
          robotName={robotName}
          runId={runId}
          labwareConfirmed={!missingSteps.includes(LABWARE_SETUP_STEP_KEY)}
          setLabwareConfirmed={(confirmed: boolean) => {
            dispatch(
              updateRunSetupStepsComplete(runId, {
                [LABWARE_SETUP_STEP_KEY]: confirmed,
              })
            )
            if (confirmed) {
              setExpandedStepKey(CAMERA_SETUP_STEP_KEY)
            }
          }}
        />
      ),
      description: t(`${LABWARE_SETUP_STEP_KEY}_description`),
      descriptionElement: null,
      rightElProps: {
        stepKey: LABWARE_SETUP_STEP_KEY,
        complete: !missingSteps.includes(LABWARE_SETUP_STEP_KEY),
        completeText: t('placements_ready'),
        incompleteText: null,
        incompleteElement: (
          <StyledText
            color={COLORS.black90}
            css={TYPOGRAPHY.pSemiBold}
            marginRight={SPACING.spacing16}
            whiteSpace={NO_WRAP}
          >
            {t('check_locations_and_volumes')}
          </StyledText>
        ),
      },
    },
    [CAMERA_SETUP_STEP_KEY]: {
      stepInternals: (
        <SetupCamera
          runId={runId}
          robotName={robotName}
          isCameraRequired={isCameraRequired}
          cameraConfirmed={isCameraConfirmed}
          confirmCameraSettings={() => {
            dispatch(
              updateRunSetupStepsComplete(runId, {
                [CAMERA_SETUP_STEP_KEY]: true,
              })
            )
            setExpandedStepKey(null)
          }}
        />
      ),
      description: t(`${CAMERA_SETUP_STEP_KEY}_description`),
      descriptionElement: null,
      rightElProps: {
        stepKey: CAMERA_SETUP_STEP_KEY,
        complete: !missingSteps.includes(CAMERA_SETUP_STEP_KEY),
        completeText: cameraEnabled
          ? t('camera_enabled')
          : t('camera_disabled'),
        incompleteText: t('check_preferences'),
        incompleteElement: null,
        disabledHardware: !cameraEnabled && isCameraRequired,
        missingHardware: !!storageInfo?.isImageStorageLow,
        missingHardwareText: t('check_preferences'),
      },
    },
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing16}
      margin={SPACING.spacing16}
    >
      {protocolAnalysis != null ? (
        <>
          {runHasStarted ? (
            <InfoMessage title={t('setup_is_view_only')} />
          ) : null}
          {analysisErrors != null && analysisErrors?.length > 0 ? (
            <LegacyStyledText alignSelf={ALIGN_CENTER} color={COLORS.grey50}>
              {t('protocol_analysis_failed')}
            </LegacyStyledText>
          ) : (
            orderedSteps.map((stepKey, index) => {
              const setupStepTitle = t(`${stepKey}_title`)
              const showEmptySetupStep =
                (stepKey === 'module_setup_step' &&
                  ((!isFlex && !hasModules) ||
                    (isFlex && !hasModules && !hasFixtures))) ||
                (stepKey === 'labware_position_check_step' && noLwOffsetsInRun)
              return (
                <Flex flexDirection={DIRECTION_COLUMN} key={stepKey}>
                  {showEmptySetupStep ? (
                    <EmptySetupStep
                      title={t(`${stepKey}_title`)}
                      description={StepDetailMap[stepKey].description}
                      rightElement={
                        <StepRightElement
                          {...StepDetailMap[stepKey].rightElProps}
                        />
                      }
                    />
                  ) : (
                    <SetupStep
                      expanded={stepKey === expandedStepKey}
                      title={setupStepTitle}
                      description={StepDetailMap[stepKey].description}
                      descriptionElement={
                        StepDetailMap[stepKey].descriptionElement
                      }
                      toggleExpanded={() => {
                        stepKey === expandedStepKey
                          ? setExpandedStepKey(null)
                          : setExpandedStepKey(stepKey)
                      }}
                      rightElement={
                        <StepRightElement
                          {...StepDetailMap[stepKey].rightElProps}
                        />
                      }
                    >
                      {StepDetailMap[stepKey].stepInternals}
                    </SetupStep>
                  )}
                  {index !== orderedSteps.length - 1 ? (
                    <Divider marginTop={SPACING.spacing24} marginBottom={0} />
                  ) : null}
                </Flex>
              )
            })
          )}
        </>
      ) : (
        <LegacyStyledText alignSelf={ALIGN_CENTER} color={COLORS.grey50}>
          {t('loading_data')}
        </LegacyStyledText>
      )}
    </Flex>
  )
}

interface NoHardwareRequiredStepCompletion {
  stepKey: Exclude<
    StepKey,
    typeof ROBOT_CALIBRATION_STEP_KEY | typeof MODULE_SETUP_STEP_KEY
  >
  complete: boolean
  incompleteText: string | null
  incompleteElement: JSX.Element | null
  completeText: string
}

interface HardwareRequiredStepCompletion {
  stepKey:
    | typeof ROBOT_CALIBRATION_STEP_KEY
    | typeof MODULE_SETUP_STEP_KEY
    | typeof CAMERA_SETUP_STEP_KEY
  complete: boolean
  missingHardware: boolean
  disabledHardware: boolean
  incompleteText: string | null
  incompleteElement: JSX.Element | null
  completeText: string
  missingHardwareText: string
}

type StepRightElementProps =
  NoHardwareRequiredStepCompletion | HardwareRequiredStepCompletion

const stepRequiresHW = (
  props: StepRightElementProps
): props is HardwareRequiredStepCompletion =>
  props.stepKey === ROBOT_CALIBRATION_STEP_KEY ||
  props.stepKey === MODULE_SETUP_STEP_KEY ||
  props.stepKey === CAMERA_SETUP_STEP_KEY

function StepRightElement(props: StepRightElementProps): JSX.Element | null {
  if (props.complete) {
    return (
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        width={FLEX_MAX_CONTENT}
      >
        <Icon
          size="1rem"
          color={COLORS.green60}
          marginRight={SPACING.spacing8}
          name="ot-check"
        />
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          color={COLORS.green60}
          marginRight={SPACING.spacing16}
        >
          {props.completeText}
        </StyledText>
      </Flex>
    )
  } else if (stepRequiresHW(props)) {
    return (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Icon
          size="1rem"
          color={
            props.disabledHardware
              ? COLORS.red60
              : props.missingHardware
                ? COLORS.yellow60
                : COLORS.grey60
          }
          marginRight={SPACING.spacing8}
          name="ot-alert"
        />
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          color={
            props.disabledHardware
              ? COLORS.red60
              : props.missingHardware
                ? COLORS.yellow60
                : COLORS.grey60
          }
          marginRight={SPACING.spacing16}
        >
          {props.missingHardware
            ? props.missingHardwareText
            : props.incompleteText}
        </StyledText>
      </Flex>
    )
  } else if (props.incompleteText != null) {
    return (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Icon
          size="1rem"
          color={COLORS.grey60}
          marginRight={SPACING.spacing8}
          name="ot-alert"
        />
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          color={COLORS.grey60}
          marginRight={SPACING.spacing16}
        >
          {props.incompleteText}
        </StyledText>
      </Flex>
    )
  } else if (props.incompleteElement != null) {
    return props.incompleteElement
  } else {
    return null
  }
}
