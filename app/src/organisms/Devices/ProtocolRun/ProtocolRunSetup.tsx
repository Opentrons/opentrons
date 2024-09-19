import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  FLEX_MAX_CONTENT,
  Flex,
  Icon,
  LegacyStyledText,
  Link,
  NO_WRAP,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  parseAllRequiredModuleModels,
} from '@opentrons/shared-data'

import { Line } from '/app/atoms/structure'
import { InfoMessage } from '/app/molecules/InfoMessage'
import { INCOMPATIBLE, INEXACT_MATCH } from '/app/redux/pipettes'
import {
  getIsFixtureMismatch,
  getRequiredDeckConfig,
} from '/app/resources/deck_configuration/utils'
import { useDeckConfigurationCompatibility } from '/app/resources/deck_configuration/hooks'
import { useRobot, useIsFlex } from '/app/redux-resources/robots'
import {
  useModuleCalibrationStatus,
  useProtocolAnalysisErrors,
  useRunCalibrationStatus,
  useRunHasStarted,
  useRunPipetteInfoByMount,
  useStoredProtocolAnalysis,
  useUnmatchedModulesForProtocol,
} from '../hooks'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { SetupLabware } from './SetupLabware'
import { SetupLabwarePositionCheck } from './SetupLabwarePositionCheck'
import { SetupRobotCalibration } from './SetupRobotCalibration'
import { SetupModuleAndDeck } from './SetupModuleAndDeck'
import { SetupStep } from './SetupStep'
import { SetupLiquids } from './SetupLiquids'
import { EmptySetupStep } from './EmptySetupStep'
import { HowLPCWorksModal } from './SetupLabwarePositionCheck/HowLPCWorksModal'

const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
const MODULE_SETUP_KEY = 'module_setup_step' as const
const LPC_KEY = 'labware_position_check_step' as const
const LABWARE_SETUP_KEY = 'labware_setup_step' as const
const LIQUID_SETUP_KEY = 'liquid_setup_step' as const

export type StepKey =
  | typeof ROBOT_CALIBRATION_STEP_KEY
  | typeof MODULE_SETUP_KEY
  | typeof LPC_KEY
  | typeof LABWARE_SETUP_KEY
  | typeof LIQUID_SETUP_KEY

export type MissingStep =
  | 'applied_labware_offsets'
  | 'labware_placement'
  | 'liquids'

export type MissingSteps = MissingStep[]

export const initialMissingSteps = (): MissingSteps => [
  'applied_labware_offsets',
  'labware_placement',
  'liquids',
]

interface ProtocolRunSetupProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
  setMissingSteps: (missingSteps: MissingSteps) => void
  missingSteps: MissingSteps
}

export function ProtocolRunSetup({
  protocolRunHeaderRef,
  robotName,
  runId,
  setMissingSteps,
  missingSteps,
}: ProtocolRunSetupProps): JSX.Element | null {
  const { t, i18n } = useTranslation('protocol_setup')
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const modules = parseAllRequiredModuleModels(protocolAnalysis?.commands ?? [])

  const robot = useRobot(robotName)
  const calibrationStatusRobot = useRunCalibrationStatus(robotName, runId)
  const calibrationStatusModules = useModuleCalibrationStatus(robotName, runId)
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const isFlex = useIsFlex(robotName)
  const runHasStarted = useRunHasStarted(runId)
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    null
  )
  const robotType = isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    protocolAnalysis
  )
  const runPipetteInfoByMount = useRunPipetteInfoByMount(runId)

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

  const stepsKeysInOrder =
    protocolAnalysis != null
      ? [
          ROBOT_CALIBRATION_STEP_KEY,
          MODULE_SETUP_KEY,
          LPC_KEY,
          LABWARE_SETUP_KEY,
          LIQUID_SETUP_KEY,
        ]
      : [ROBOT_CALIBRATION_STEP_KEY, LPC_KEY, LABWARE_SETUP_KEY]

  const targetStepKeyInOrder = stepsKeysInOrder.filter((stepKey: StepKey) => {
    if (protocolAnalysis == null) {
      return stepKey !== MODULE_SETUP_KEY && stepKey !== LIQUID_SETUP_KEY
    }

    if (
      protocolAnalysis.modules.length === 0 &&
      protocolAnalysis.liquids.length === 0
    ) {
      return stepKey !== MODULE_SETUP_KEY && stepKey !== LIQUID_SETUP_KEY
    }

    if (protocolAnalysis.modules.length === 0) {
      return stepKey !== MODULE_SETUP_KEY
    }

    if (protocolAnalysis.liquids.length === 0) {
      return stepKey !== LIQUID_SETUP_KEY
    }
    return true
  })

  const liquids = protocolAnalysis?.liquids ?? []
  const hasLiquids = liquids.length > 0
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

  const [
    labwareSetupComplete,
    setLabwareSetupComplete,
  ] = React.useState<boolean>(false)
  const [liquidSetupComplete, setLiquidSetupComplete] = React.useState<boolean>(
    !hasLiquids
  )
  if (
    !hasLiquids &&
    protocolAnalysis != null &&
    missingSteps.includes('liquids')
  ) {
    setMissingSteps(missingSteps.filter(step => step !== 'liquids'))
  }
  const [lpcComplete, setLpcComplete] = React.useState<boolean>(false)
  if (robot == null) {
    return null
  }
  const StepDetailMap: Record<
    StepKey,
    {
      stepInternals: JSX.Element
      description: string
      rightElProps: StepRightElementProps
    }
  > = {
    [ROBOT_CALIBRATION_STEP_KEY]: {
      stepInternals: (
        <SetupRobotCalibration
          robotName={robotName}
          runId={runId}
          nextStep={
            targetStepKeyInOrder[
              targetStepKeyInOrder.findIndex(
                v => v === ROBOT_CALIBRATION_STEP_KEY
              ) + 1
            ]
          }
          expandStep={setExpandedStepKey}
          calibrationStatus={calibrationStatusRobot}
        />
      ),
      // change description for Flex
      description: isFlex
        ? t(`${ROBOT_CALIBRATION_STEP_KEY}_description_pipettes_only`)
        : t(`${ROBOT_CALIBRATION_STEP_KEY}_description`),
      rightElProps: {
        stepKey: ROBOT_CALIBRATION_STEP_KEY,
        complete: calibrationStatusRobot.complete,
        completeText: t('calibration_ready'),
        missingHardware: isMissingPipette,
        incompleteText: t('calibration_needed'),
        missingHardwareText: t('action_needed'),
        incompleteElement: null,
      },
    },
    [MODULE_SETUP_KEY]: {
      stepInternals: (
        <SetupModuleAndDeck
          expandLabwarePositionCheckStep={() => {
            setExpandedStepKey(LPC_KEY)
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
      rightElProps: {
        stepKey: MODULE_SETUP_KEY,
        complete:
          calibrationStatusModules.complete &&
          !isMissingModule &&
          !isFixtureMismatch,
        completeText:
          isFlex && hasModules
            ? t('calibration_ready')
            : t('deck_hardware_ready'),
        incompleteText:
          isFlex && hasModules ? t('calibration_needed') : t('action_needed'),
        missingHardware: isMissingModule || isFixtureMismatch,
        missingHardwareText: t('action_needed'),
        incompleteElement: null,
      },
    },
    [LPC_KEY]: {
      stepInternals: (
        <SetupLabwarePositionCheck
          {...{ runId, robotName }}
          setOffsetsConfirmed={confirmed => {
            setLpcComplete(confirmed)
            if (confirmed) {
              setExpandedStepKey(LABWARE_SETUP_KEY)
              setMissingSteps(
                missingSteps.filter(step => step !== 'applied_labware_offsets')
              )
            }
          }}
          offsetsConfirmed={lpcComplete}
        />
      ),
      description: t('labware_position_check_step_description'),
      rightElProps: {
        stepKey: LPC_KEY,
        complete: lpcComplete,
        completeText: t('offsets_ready'),
        incompleteText: null,
        incompleteElement: <LearnAboutLPC />,
      },
    },
    [LABWARE_SETUP_KEY]: {
      stepInternals: (
        <SetupLabware
          robotName={robotName}
          runId={runId}
          labwareConfirmed={labwareSetupComplete}
          setLabwareConfirmed={(confirmed: boolean) => {
            setLabwareSetupComplete(confirmed)
            if (confirmed) {
              setMissingSteps(
                missingSteps.filter(step => step !== 'labware_placement')
              )
              const nextStep =
                targetStepKeyInOrder.findIndex(v => v === LABWARE_SETUP_KEY) ===
                targetStepKeyInOrder.length - 1
                  ? null
                  : LIQUID_SETUP_KEY
              setExpandedStepKey(nextStep)
            }
          }}
        />
      ),
      description: t(`${LABWARE_SETUP_KEY}_description`),
      rightElProps: {
        stepKey: LABWARE_SETUP_KEY,
        complete: labwareSetupComplete,
        completeText: t('placements_ready'),
        incompleteText: null,
        incompleteElement: null,
      },
    },
    [LIQUID_SETUP_KEY]: {
      stepInternals: (
        <SetupLiquids
          robotName={robotName}
          runId={runId}
          protocolAnalysis={protocolAnalysis}
          isLiquidSetupConfirmed={liquidSetupComplete}
          setLiquidSetupConfirmed={(confirmed: boolean) => {
            setLiquidSetupComplete(confirmed)
            if (confirmed) {
              setMissingSteps(missingSteps.filter(step => step !== 'liquids'))
              setExpandedStepKey(null)
            }
          }}
        />
      ),
      description: hasLiquids
        ? t(`${LIQUID_SETUP_KEY}_description`)
        : i18n.format(t('liquids_not_in_the_protocol'), 'capitalize'),
      rightElProps: {
        stepKey: LIQUID_SETUP_KEY,
        complete: liquidSetupComplete,
        completeText: t('liquids_ready'),
        incompleteText: null,
        incompleteElement: null,
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
            stepsKeysInOrder.map((stepKey, index) => {
              const setupStepTitle = t(`${stepKey}_title`)
              const showEmptySetupStep =
                (stepKey === 'liquid_setup_step' && !hasLiquids) ||
                (stepKey === 'module_setup_step' &&
                  ((!isFlex && !hasModules) ||
                    (isFlex && !hasModules && !hasFixtures)))
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
                  {index !== stepsKeysInOrder.length - 1 ? (
                    <Line marginTop={SPACING.spacing24} />
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
    typeof ROBOT_CALIBRATION_STEP_KEY | typeof MODULE_SETUP_KEY
  >
  complete: boolean
  incompleteText: string | null
  incompleteElement: JSX.Element | null
  completeText: string
}

interface HardwareRequiredStepCompletion {
  stepKey: typeof ROBOT_CALIBRATION_STEP_KEY | typeof MODULE_SETUP_KEY
  complete: boolean
  missingHardware: boolean
  incompleteText: string | null
  incompleteElement: JSX.Element | null
  completeText: string
  missingHardwareText: string
}

type StepRightElementProps =
  | NoHardwareRequiredStepCompletion
  | HardwareRequiredStepCompletion

const stepRequiresHW = (
  props: StepRightElementProps
): props is HardwareRequiredStepCompletion =>
  props.stepKey === ROBOT_CALIBRATION_STEP_KEY ||
  props.stepKey === MODULE_SETUP_KEY

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
          color={COLORS.green50}
          marginRight={SPACING.spacing8}
          name="ot-check"
          id={`RunSetupCard_${props.stepKey}_completeIcon`}
        />
        <LegacyStyledText
          color={COLORS.black90}
          css={TYPOGRAPHY.pSemiBold}
          marginRight={SPACING.spacing16}
          id={`RunSetupCard_${props.stepKey}_completeText`}
          whitespace={NO_WRAP}
        >
          {props.completeText}
        </LegacyStyledText>
      </Flex>
    )
  } else if (stepRequiresHW(props) && props.missingHardware) {
    return (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Icon
          size="1rem"
          color={COLORS.yellow50}
          marginRight={SPACING.spacing8}
          name="alert-circle"
          id={`RunSetupCard_${props.stepKey}_missingHardwareIcon`}
        />
        <LegacyStyledText
          color={COLORS.black90}
          css={TYPOGRAPHY.pSemiBold}
          marginRight={SPACING.spacing16}
          id={`RunSetupCard_${props.stepKey}_missingHardwareText`}
          whitespace={NO_WRAP}
        >
          {props.missingHardwareText}
        </LegacyStyledText>
      </Flex>
    )
  } else if (props.incompleteText != null) {
    return (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Icon
          size="1rem"
          color={COLORS.yellow50}
          marginRight={SPACING.spacing8}
          name="alert-circle"
          id={`RunSetupCard_${props.stepKey}_incompleteIcon`}
        />
        <LegacyStyledText
          color={COLORS.black90}
          css={TYPOGRAPHY.pSemiBold}
          marginRight={SPACING.spacing16}
          id={`RunSetupCard_${props.stepKey}_incompleteText`}
          whitespace={NO_WRAP}
        >
          {props.incompleteText}
        </LegacyStyledText>
      </Flex>
    )
  } else if (props.incompleteElement != null) {
    return props.incompleteElement
  } else {
    return null
  }
}

function LearnAboutLPC(): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const [showLPCHelpModal, setShowLPCHelpModal] = React.useState(false)
  return (
    <>
      <Link
        css={TYPOGRAPHY.linkPSemiBold}
        marginRight={SPACING.spacing16}
        whiteSpace={NO_WRAP}
        onClick={(e: React.MouseEvent) => {
          // clicking link shouldn't toggle step expanded state
          e.preventDefault()
          e.stopPropagation()
          setShowLPCHelpModal(true)
        }}
      >
        {t('learn_how_it_works')}
      </Link>
      {showLPCHelpModal ? (
        <HowLPCWorksModal
          onCloseClick={() => {
            setShowLPCHelpModal(false)
          }}
        />
      ) : null}
    </>
  )
}
