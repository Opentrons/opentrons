import * as React from 'react'
import { useTranslation } from 'react-i18next'
import size from 'lodash/size'

import { parseAllRequiredModuleModels } from '@opentrons/api-client'
import {
  Flex,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'

import { useFeatureFlag } from '../../../redux/config'
import { Line } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { InfoMessage } from '../../../molecules/InfoMessage'
import {
  useIsOT3,
  useProtocolDetailsForRun,
  useRobot,
  useRunCalibrationStatus,
  useRunHasStarted,
  useProtocolAnalysisErrors,
  useStoredProtocolAnalysis,
} from '../hooks'

import { SetupLabware } from './SetupLabware'
import { SetupRobotCalibration } from './SetupRobotCalibration'
import { SetupModules } from './SetupModules'
import { SetupStep } from './SetupStep'
import { SetupLiquids } from './SetupLiquids'
const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
const MODULE_SETUP_KEY = 'module_setup_step' as const
const LABWARE_SETUP_KEY = 'labware_setup_step' as const
const LIQUID_SETUP_KEY = 'liquid_setup_step' as const

export type StepKey =
  | typeof ROBOT_CALIBRATION_STEP_KEY
  | typeof MODULE_SETUP_KEY
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
  const { t } = useTranslation('protocol_setup')
  const { protocolData: robotProtocolAnalysis } = useProtocolDetailsForRun(
    runId
  )
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const modules = parseAllRequiredModuleModels(protocolData?.commands ?? [])
  const robot = useRobot(robotName)
  const calibrationStatus = useRunCalibrationStatus(robotName, runId)
  const isOT3 = useIsOT3(robotName)
  const runHasStarted = useRunHasStarted(runId)
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const liquidSetupEnabled = useFeatureFlag('enableLiquidSetup')
  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    null
  )
  const [stepsKeysInOrder, setStepKeysInOrder] = React.useState<StepKey[]>([
    ROBOT_CALIBRATION_STEP_KEY,
    LABWARE_SETUP_KEY,
  ])

  React.useEffect(() => {
    let nextStepKeysInOrder = stepsKeysInOrder
    const showModuleSetup = protocolData != null && modules.length > 0
    const showLiquidSetup =
      liquidSetupEnabled &&
      protocolData != null &&
      'liquids' in protocolData &&
      size(protocolData.liquids) > 0

    if (showModuleSetup && showLiquidSetup) {
      nextStepKeysInOrder = [
        ROBOT_CALIBRATION_STEP_KEY,
        MODULE_SETUP_KEY,
        LABWARE_SETUP_KEY,
        LIQUID_SETUP_KEY,
      ]
    } else if (showModuleSetup) {
      nextStepKeysInOrder = [
        ROBOT_CALIBRATION_STEP_KEY,
        MODULE_SETUP_KEY,
        LABWARE_SETUP_KEY,
      ]
    } else if (showLiquidSetup) {
      nextStepKeysInOrder = [
        ROBOT_CALIBRATION_STEP_KEY,
        LABWARE_SETUP_KEY,
        LIQUID_SETUP_KEY,
      ]
    }
    setStepKeysInOrder(nextStepKeysInOrder)
  }, [Boolean(protocolData), protocolData?.commands])

  if (robot == null) return null

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
            stepsKeysInOrder[
              stepsKeysInOrder.findIndex(
                v => v === ROBOT_CALIBRATION_STEP_KEY
              ) + 1
            ]
          }
          expandStep={setExpandedStepKey}
          calibrationStatus={calibrationStatus}
        />
      ),
      // change description for OT-3
      description: isOT3
        ? t(`${ROBOT_CALIBRATION_STEP_KEY}_description_pipettes_only`)
        : t(`${ROBOT_CALIBRATION_STEP_KEY}_description`),
    },
    [MODULE_SETUP_KEY]: {
      stepInternals: (
        <SetupModules
          expandLabwareSetupStep={() => setExpandedStepKey(LABWARE_SETUP_KEY)}
          robotName={robotName}
          runId={runId}
        />
      ),
      description: t(`${MODULE_SETUP_KEY}_description`, {
        count: modules.length,
      }),
    },
    [LABWARE_SETUP_KEY]: {
      stepInternals: (
        <SetupLabware
          protocolRunHeaderRef={protocolRunHeaderRef}
          robotName={robotName}
          runId={runId}
          nextStep={
            stepsKeysInOrder.findIndex(v => v === LABWARE_SETUP_KEY) ===
            stepsKeysInOrder.length - 1
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
        />
      ),
      description: t(`${LIQUID_SETUP_KEY}_description`),
    },
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      margin={SPACING.spacing4}
    >
      {protocolData != null ? (
        <>
          {runHasStarted ? (
            <InfoMessage title={t('setup_is_view_only')} />
          ) : null}
          {analysisErrors != null && analysisErrors?.length > 0 ? (
            <StyledText alignSelf={ALIGN_CENTER} color={COLORS.darkGreyEnabled}>
              {t('protocol_analysis_failed')}
            </StyledText>
          ) : (
            stepsKeysInOrder.map((stepKey, index) => (
              <Flex flexDirection={DIRECTION_COLUMN} key={stepKey}>
                <SetupStep
                  expanded={stepKey === expandedStepKey}
                  label={t('step', { index: index + 1 })}
                  title={t(`${stepKey}_title`)}
                  description={StepDetailMap[stepKey].description}
                  toggleExpanded={() =>
                    stepKey === expandedStepKey
                      ? setExpandedStepKey(null)
                      : setExpandedStepKey(stepKey)
                  }
                  calibrationStatusComplete={
                    stepKey === ROBOT_CALIBRATION_STEP_KEY && !runHasStarted
                      ? calibrationStatus.complete
                      : null
                  }
                >
                  {StepDetailMap[stepKey].stepInternals}
                </SetupStep>
                {index !== stepsKeysInOrder.length - 1 ? (
                  <Line marginTop={SPACING.spacing5} />
                ) : null}
              </Flex>
            ))
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
