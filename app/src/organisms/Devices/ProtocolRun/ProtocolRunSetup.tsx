import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'
import { protocolHasModules } from '@opentrons/shared-data'

import { Line } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import {
  useProtocolDetailsForRun,
  useRobot,
  useRunCalibrationStatus,
} from '../hooks'
import { SetupRobotCalibration } from './SetupRobotCalibration'
import { SetupStep } from './SetupStep'

const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
const MODULE_SETUP_KEY = 'module_setup_step' as const
const LABWARE_SETUP_KEY = 'labware_setup_step' as const

const INITIAL_EXPAND_DELAY_MS = 700

export type StepKey =
  | typeof ROBOT_CALIBRATION_STEP_KEY
  | typeof MODULE_SETUP_KEY
  | typeof LABWARE_SETUP_KEY

interface ProtocolRunSetupProps {
  robotName: string
  runId: string
}

export function ProtocolRunSetup({
  robotName,
  runId,
}: ProtocolRunSetupProps): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')
  const { protocolData } = useProtocolDetailsForRun(runId)
  const robot = useRobot(robotName)
  const calibrationStatus = useRunCalibrationStatus(robotName, runId)

  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    null
  )
  const [stepsKeysInOrder, setStepKeysInOrder] = React.useState<StepKey[]>([
    ROBOT_CALIBRATION_STEP_KEY,
    LABWARE_SETUP_KEY,
  ])

  React.useEffect(() => {
    let nextStepKeysInOrder = stepsKeysInOrder
    if (protocolData != null && protocolHasModules(protocolData)) {
      nextStepKeysInOrder = [
        ROBOT_CALIBRATION_STEP_KEY,
        MODULE_SETUP_KEY,
        LABWARE_SETUP_KEY,
      ]
    }
    let initialExpandedStepKey: StepKey = ROBOT_CALIBRATION_STEP_KEY
    if (calibrationStatus.complete) {
      initialExpandedStepKey =
        nextStepKeysInOrder[
          nextStepKeysInOrder.findIndex(v => v === ROBOT_CALIBRATION_STEP_KEY) +
            1
        ]
    }
    setStepKeysInOrder(nextStepKeysInOrder)
    const initialExpandTimer = setTimeout(
      () => setExpandedStepKey(initialExpandedStepKey),
      INITIAL_EXPAND_DELAY_MS
    )
    return () => clearTimeout(initialExpandTimer)
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
          expandStep={nextStep => setExpandedStepKey(nextStep)}
          calibrationStatus={calibrationStatus}
        />
      ),
      description: t(`${ROBOT_CALIBRATION_STEP_KEY}_description`),
    },
    [MODULE_SETUP_KEY]: {
      stepInternals: (
        <StyledText as="p" marginTop={SPACING.spacing4}>
          TODO: module setup
        </StyledText>
      ),
      description: t(`${MODULE_SETUP_KEY}_description`, {
        count:
          protocolData != null && 'modules' in protocolData
            ? Object.keys(protocolData.modules).length
            : 0,
      }),
    },
    [LABWARE_SETUP_KEY]: {
      stepInternals: (
        <StyledText as="p" marginTop={SPACING.spacing4}>
          TODO: labware setup
        </StyledText>
      ),
      description: t(`${LABWARE_SETUP_KEY}_description`),
    },
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      margin={SPACING.spacing4}
    >
      {stepsKeysInOrder.map((stepKey, index) => (
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
              stepKey === ROBOT_CALIBRATION_STEP_KEY
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
      ))}
    </Flex>
  )
}
