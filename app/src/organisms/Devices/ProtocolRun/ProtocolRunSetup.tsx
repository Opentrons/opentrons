import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { parseAllRequiredModuleModels } from '@opentrons/api-client'
import {
  Flex,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
  Icon,
  SIZE_1,
  DIRECTION_ROW,
  TYPOGRAPHY,
  Link,
} from '@opentrons/components'

import { Line } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { InfoMessage } from '../../../molecules/InfoMessage'
import { getSimplestDeckConfigForProtocolCommands } from '../../../resources/deck_configuration/utils'
import {
  useIsFlex,
  useRobot,
  useRunCalibrationStatus,
  useRunHasStarted,
  useProtocolAnalysisErrors,
  useStoredProtocolAnalysis,
  useModuleCalibrationStatus,
  ProtocolCalibrationStatus,
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

interface ProtocolRunSetupProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
}

export function ProtocolRunSetup({
  protocolRunHeaderRef,
  robotName,
  runId,
}: ProtocolRunSetupProps): JSX.Element | null {
  const { t, i18n } = useTranslation('protocol_setup')
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const modules = parseAllRequiredModuleModels(protocolAnalysis?.commands ?? [])

  const robot = useRobot(robotName)
  const calibrationStatusRobot = useRunCalibrationStatus(robotName, runId)
  const calibrationStatusModules = useModuleCalibrationStatus(robotName, runId)
  const isFlex = useIsFlex(robotName)
  const runHasStarted = useRunHasStarted(runId)
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    null
  )

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

  if (robot == null) return null
  const hasLiquids =
    protocolAnalysis != null && protocolAnalysis.liquids?.length > 0
  const hasModules = protocolAnalysis != null && modules.length > 0

  const protocolDeckConfig = getSimplestDeckConfigForProtocolCommands(
    protocolAnalysis?.commands ?? []
  )

  const hasFixtures = protocolDeckConfig.length > 0

  let moduleDescription: string = t(`${MODULE_SETUP_KEY}_description`, {
    count: modules.length,
  })
  if (!hasModules && !isFlex) {
    moduleDescription = i18n.format(t('no_modules_specified'), 'capitalize')
  } else if (isFlex && (hasModules || hasFixtures)) {
    moduleDescription = t('install_modules_and_fixtures')
  } else if (isFlex && !hasModules && !hasFixtures) {
    moduleDescription = t('no_modules_or_fixtures')
  }

  const StepDetailMap: Record<
    StepKey,
    { stepInternals: JSX.Element; description: string }
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
      // change description for OT-3
      description: isFlex
        ? t(`${ROBOT_CALIBRATION_STEP_KEY}_description_pipettes_only`)
        : t(`${ROBOT_CALIBRATION_STEP_KEY}_description`),
    },
    [MODULE_SETUP_KEY]: {
      stepInternals: (
        <SetupModuleAndDeck
          expandLabwarePositionCheckStep={() => setExpandedStepKey(LPC_KEY)}
          robotName={robotName}
          runId={runId}
          hasModules={hasModules}
          commands={protocolAnalysis?.commands ?? []}
        />
      ),
      description: moduleDescription,
    },
    [LPC_KEY]: {
      stepInternals: (
        <SetupLabwarePositionCheck
          {...{ runId, robotName }}
          expandLabwareStep={() => setExpandedStepKey(LABWARE_SETUP_KEY)}
        />
      ),
      description: t('labware_position_check_step_description'),
    },
    [LABWARE_SETUP_KEY]: {
      stepInternals: (
        <SetupLabware
          protocolRunHeaderRef={protocolRunHeaderRef}
          robotName={robotName}
          runId={runId}
          nextStep={
            targetStepKeyInOrder.findIndex(v => v === LABWARE_SETUP_KEY) ===
            targetStepKeyInOrder.length - 1
              ? null
              : LIQUID_SETUP_KEY
          }
          expandStep={setExpandedStepKey}
        />
      ),
      description: t(`${LABWARE_SETUP_KEY}_description`),
    },
    [LIQUID_SETUP_KEY]: {
      stepInternals: (
        <SetupLiquids
          protocolRunHeaderRef={protocolRunHeaderRef}
          robotName={robotName}
          runId={runId}
          protocolAnalysis={protocolAnalysis}
        />
      ),
      description: hasLiquids
        ? t(`${LIQUID_SETUP_KEY}_description`)
        : i18n.format(t('liquids_not_in_the_protocol'), 'capitalize'),
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
            <StyledText alignSelf={ALIGN_CENTER} color={COLORS.darkGreyEnabled}>
              {t('protocol_analysis_failed')}
            </StyledText>
          ) : (
            stepsKeysInOrder.map((stepKey, index) => {
              const setupStepTitle = t(
                isFlex && stepKey === MODULE_SETUP_KEY
                  ? `module_and_deck_setup`
                  : `${stepKey}_title`
              )
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
                      label={t('step', { index: index + 1 })}
                    />
                  ) : (
                    <SetupStep
                      expanded={stepKey === expandedStepKey}
                      label={t('step', { index: index + 1 })}
                      title={setupStepTitle}
                      description={StepDetailMap[stepKey].description}
                      toggleExpanded={() =>
                        stepKey === expandedStepKey
                          ? setExpandedStepKey(null)
                          : setExpandedStepKey(stepKey)
                      }
                      rightElement={
                        <StepRightElement
                          {...{
                            stepKey,
                            runHasStarted,

                            calibrationStatusRobot,
                            calibrationStatusModules,
                            isFlex,
                          }}
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
        <StyledText alignSelf={ALIGN_CENTER} color={COLORS.darkGreyEnabled}>
          {t('loading_data')}
        </StyledText>
      )}
    </Flex>
  )
}

interface StepRightElementProps {
  stepKey: StepKey
  calibrationStatusRobot: ProtocolCalibrationStatus
  calibrationStatusModules?: ProtocolCalibrationStatus
  runHasStarted: boolean
  isFlex: boolean
}
function StepRightElement(props: StepRightElementProps): JSX.Element | null {
  const {
    stepKey,
    runHasStarted,
    calibrationStatusRobot,
    calibrationStatusModules,
    isFlex,
  } = props
  const { t } = useTranslation('protocol_setup')

  if (
    !runHasStarted &&
    (stepKey === ROBOT_CALIBRATION_STEP_KEY ||
      (stepKey === MODULE_SETUP_KEY && isFlex))
  ) {
    const calibrationStatus =
      stepKey === ROBOT_CALIBRATION_STEP_KEY
        ? calibrationStatusRobot
        : calibrationStatusModules

    return (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Icon
          size={SIZE_1}
          color={
            calibrationStatus?.complete
              ? COLORS.successEnabled
              : COLORS.warningEnabled
          }
          marginRight={SPACING.spacing8}
          name={calibrationStatus?.complete ? 'ot-check' : 'alert-circle'}
          id="RunSetupCard_calibrationIcon"
        />
        <StyledText
          color={COLORS.black}
          css={TYPOGRAPHY.pSemiBold}
          marginRight={SPACING.spacing16}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          id="RunSetupCard_calibrationText"
        >
          {calibrationStatus?.complete
            ? t('calibration_ready')
            : t('calibration_needed')}
        </StyledText>
      </Flex>
    )
  } else if (stepKey === LPC_KEY) {
    return <LearnAboutLPC />
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
        onClick={e => {
          // clicking link shouldn't toggle step expanded state
          e.preventDefault()
          e.stopPropagation()
          setShowLPCHelpModal(true)
        }}
      >
        {t('learn_how_it_works')}
      </Link>
      {showLPCHelpModal ? (
        <HowLPCWorksModal onCloseClick={() => setShowLPCHelpModal(false)} />
      ) : null}
    </>
  )
}
